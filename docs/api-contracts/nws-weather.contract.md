# Provider Contract: NWS / weather.gov API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://www.weather.gov/documentation/services-web-api
- API reference: https://www.weather.gov/documentation/services-web-api
- SDK docs: none used by LoadIQ; the app calls REST directly.
- Pricing/quota/rate-limit docs, if available: https://weather-gov.github.io/api/general-faqs
- Error-handling docs, if available: NWS API status/problem responses apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses NWS/weather.gov as official U.S. government validation and alert
evidence for coordinates, grid forecasts, hourly forecasts, and active alerts.
It is not dispatch authority, navigation, ELD, legal/compliance authority,
guaranteed-delay evidence, tax/accounting advice, insurance advice,
broker/load-board behavior, or truck-legal route certification.
## Authentication
- Auth method required by provider docs: no API key for this integration;
  requests must include a descriptive User-Agent.
- Env var names used in app: `NWS_BASE_URL`, `NWS_USER_AGENT`.
- Server-only or client-safe: server-only route usage; `NWS_USER_AGENT` is not
  a secret but should stay controlled.
- Secret exposure risk: no NWS API key is used.
- Required headers: `User-Agent`, `Accept: application/geo+json, application/json`.
- Key restrictions recommended: not applicable.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `https://api.weather.gov`
- Endpoint path or SDK method: `/points/{latitude},{longitude}`,
  `/gridpoints/{gridId}/{gridX},{gridY}/forecast`,
  `/gridpoints/{gridId}/{gridX},{gridY}/forecast/hourly`,
  `/alerts/active?area={area}`, `/alerts/active?point={latitude},{longitude}`
- HTTP method: `GET`
- Required headers: `User-Agent`, `Accept`
- Content type: GeoJSON/JSON response.
- API version if applicable: weather.gov public API.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `latitude` / `longitude` | yes for point/point-alert routes | number | Coordinate lookup. | `src/lib/weather/providers/nws.ts` | API routes require -90 to 90 and -180 to 180. | Sensitive route location. |
| `gridId`, `gridX`, `gridY` | yes for grid forecast routes | string/number | Grid office and coordinates from point lookup. | `getNwsForecastByGrid`, `getNwsHourlyForecastByGrid` | Must come from NWS point response. | Do not hardcode. |
| `area` | yes for area alerts | string | State/territory area code. | `getNwsActiveAlertsByArea` | API route validates 2-letter uppercase-looking code. | U.S. alerts only. |
| `User-Agent` | yes | string | Required request identification. | `fetchNwsJson` | Missing env returns config error before provider call. | Do not call anonymously. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `properties.gridId/gridX/gridY` | string/number | Forecast grid mapping. | yes | `normalizeNwsPoint` | Forecast unavailable when missing. |
| `properties.forecast`, `properties.forecastHourly` | string | Forecast URLs. | yes | `normalizeNwsPoint` | Metadata only. |
| `properties.relativeLocation.properties.city/state` | string | Relative location. | yes | `normalizeNwsPoint` | Null when absent. |
| `properties.periods[].startTime/endTime/temperature/temperatureUnit/windSpeed/windDirection/shortForecast/detailedForecast/probabilityOfPrecipitation` | mixed | Forecast period details. | yes | `normalizeNwsForecastPeriods` | Invalid periods are dropped. |
| `features[].properties.event/headline/severity/urgency/certainty/effective/expires/areaDesc/description/instruction` | mixed | Alert details. | yes | `normalizeNwsAlerts` | Unknown fields become null or `UNKNOWN_ALERT`. |
## Error contract
Include:
- documented provider error shape: app currently uses HTTP status and payload
  usability, not raw provider problem bodies.
- HTTP status codes used by provider: non-2xx returns a safe provider error.
- auth failures: missing User-Agent env returns `missing_nws_user_agent`.
- validation failures: API routes validate coordinates and area before calls.
- quota/rate-limit failures: provider non-2xx returns safe error.
- timeout/network failure behavior: caught as retryable network failure.
- app fallback behavior: provider unavailable state; Google/OpenWeather may
  still serve non-official weather context where applicable.
- user-safe error message: no raw provider body or stack trace.
- internal logging behavior: no sensitive route/load logging.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: NWS requires responsible use
  and User-Agent identification.
- cache strategy: point lookup 86400 seconds, forecasts 900 seconds, alerts 300
  seconds.
- retry/backoff strategy: none.
- abuse prevention: API routes validate inputs and use cached fetch.
- client-side vs server-side call protection: provider calls are server-side.
- tier impact if relevant: this foundation does not change entitlement gates.
## Data privacy / security
Include:
- data sent to provider: coordinates, grid identifiers, area codes.
- PII risk: coordinates may reveal pickup, delivery, and route points.
- location data risk: high.
- payment data risk: none.
- logging restrictions: do not log full route/load/customer context.
- what must never be logged: auth/session data, sensitive route/load data.
- whether requests must be server-side only: yes in LoadIQ.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/lib/weather/providers/nws.ts` | `getNwsPoint` | `/points/{lat},{lon}` lookup. | `NWS_BASE_URL`, `NWS_USER_AGENT` | Coordinate-to-grid validation. |
| `src/lib/weather/providers/nws.ts` | `getNwsForecastByGrid` | Grid forecast. | NWS env vars | Uses grid returned by NWS. |
| `src/lib/weather/providers/nws.ts` | `getNwsHourlyForecastByGrid` | Hourly grid forecast. | NWS env vars | Uses grid returned by NWS. |
| `src/lib/weather/providers/nws.ts` | `getNwsActiveAlertsByArea`, `getNwsActiveAlertsByPoint` | Active alerts. | NWS env vars | Official alert evidence. |
| `src/app/api/weather/nws/points/route.ts` | `GET` | NWS point smoke/validation route. | NWS env vars | Does not hardcode grid output. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for NWS point/forecast/alert normalization.
- mock response tests: needed for grid, forecast, alerts, and missing User-Agent.
- schema validation tests: needed for consumed response fields.
- error fallback tests: needed for 4xx/5xx/malformed payload.
- env var missing tests: needed for `NWS_USER_AGENT`.
- provider contract drift tests: needed for gridpoint and alert field changes.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in official docs.
- legacy API: none confirmed.
- SDK major version risk: none; REST direct.
- pricing/quota changes: no billing key, but use policies and rate limits can
  change.
- response field dependency: point grid mapping and forecast/alert properties.
- undocumented assumptions: grid office and X/Y can change for a coordinate and
  must not be hardcoded.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed

