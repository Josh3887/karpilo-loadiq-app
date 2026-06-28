# Provider Contract: Google Weather API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://developers.google.com/maps/documentation/weather
- API reference: https://developers.google.com/maps/documentation/weather/current-conditions, https://developers.google.com/maps/documentation/weather/hourly-forecast, https://developers.google.com/maps/documentation/weather/daily-forecast, https://developers.google.com/maps/documentation/weather/reference/rest/v1/publicAlerts/lookup
- SDK docs: none used by LoadIQ; the app calls REST directly.
- Pricing/quota/rate-limit docs, if available: Google Maps Platform billing and quota controls apply by project.
- Error-handling docs, if available: Google Maps Platform HTTP/API errors apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses Google Weather as the primary app-facing provider for current
conditions, hourly forecast, daily forecast, and public alert context in the
server-side Karpilo Weather Intelligence foundation. It is not dispatch
authority, navigation, ELD, legal/compliance authority, guaranteed-delay
evidence, tax/accounting advice, insurance advice, broker/load-board behavior,
or truck-legal route certification.
## Authentication
- Auth method required by provider docs: Google Maps Platform API key.
- Env var names used in app: `GOOGLE_WEATHER_API_KEY`,
  `GOOGLE_WEATHER_BASE_URL`.
- Server-only or client-safe: server-only.
- Secret exposure risk: do not expose through `NEXT_PUBLIC_`.
- Required headers: none beyond standard HTTP for the current REST calls.
- Key restrictions recommended: restrict to Weather API and server deployment
  controls.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `https://weather.googleapis.com`
- Endpoint path or SDK method: `/v1/currentConditions:lookup`,
  `/v1/forecast/hours:lookup`, `/v1/forecast/days:lookup`,
  `/v1/publicAlerts:lookup`
- App URL construction: `GOOGLE_WEATHER_BASE_URL` is normalized by removing
  trailing slashes and a trailing `/v1` if present. Endpoint constants include
  `/v1/...` so the final request path does not become `/v1/v1/...`.
- HTTP method: `GET`
- Required headers: none.
- Content type: JSON response.
- API version if applicable: v1
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `key` | yes | string | Google Weather API key. | `src/lib/weather/providers/googleWeather.ts` | Must be configured server-side. | Never log or print. |
| `location.latitude` | yes | number | Lookup latitude. | `fetchGoogleWeatherJson` | API routes require -90 to 90. | Sensitive route location. |
| `location.longitude` | yes | number | Lookup longitude. | `fetchGoogleWeatherJson` | API routes require -180 to 180. | Sensitive route location. |
| `hours` | no | number | Hourly forecast period count. | `getGoogleHourlyForecast` | Clamped to 1-240. | Cost/range control. |
| `days` | no | number | Daily forecast period count. | `getGoogleDailyForecast` | Clamped to 1-10. | Cost/range control. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `currentTime` / `observedTime` | string | Current/observed time. | yes | `normalizeGoogleCurrent` | Falls back to fetch time. |
| `temperature.degrees`, `feelsLikeTemperature.degrees` | number | Current temperature values. | yes | `normalizeGoogleCurrent` | Null when absent. |
| `relativeHumidity` | number | Humidity percentage. | yes | `normalizeGoogleCurrent` | Null when absent. |
| `wind.speed.value`, `wind.gust.value`, `wind.direction` | number | Wind values. | yes | `normalizeGoogleCurrent`, `normalizeGoogleForecastPeriods` | Null when absent. |
| `visibility.value` | number | Visibility distance. | yes | normalizers | Null when absent. |
| `weatherCondition.type/description/displayName` | string | Condition label/detail. | yes | normalizers | Null when absent. |
| forecast period time/temperature/weather/wind fields | mixed | Forecast period context. | yes | `normalizeGoogleForecastPeriods` | Invalid periods are dropped. |
| public alert event/headline/severity/urgency/certainty/effective/expires/area/description/instruction fields | mixed | Alert context. | yes | `normalizeGoogleAlerts` | Unknown fields become null or `UNKNOWN_ALERT`. |
## Error contract
Include:
- documented provider error shape: app uses HTTP status and JSON parse
  usability, not raw provider error bodies.
- HTTP status codes used by provider: non-2xx returns a safe provider error
  with provider name, operation name, HTTP status, and endpoint path only.
- auth failures: missing key returns `missing_google_weather_api_key`; provider
  `401`/`403` returns `google_weather_access_error`.
- validation failures: API routes validate coordinates and range limits before
  provider calls.
- malformed endpoint or unavailable endpoint: `404` returns
  `google_weather_endpoint_not_found`.
- quota/rate-limit failures: `429` returns `google_weather_rate_limited`.
- provider failures: `5xx` returns `google_weather_provider_unavailable`.
- timeout/network failure behavior: caught as retryable network failure.
- app fallback behavior: auto provider falls back to OpenWeather where allowed.
- user-safe error message: provider configuration/access message without secret
  values.
- internal logging behavior: no raw provider body, full URL, query string,
  headers, or API key logging.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: Google Maps Platform project
  quota/billing applies.
- cache strategy: current 600 seconds, forecast 900 seconds, alerts 300 seconds.
- retry/backoff strategy: none.
- abuse prevention: server-side routes validate inputs and cap forecast ranges.
- client-side vs server-side call protection: provider calls are server-side.
- tier impact if relevant: this foundation does not change entitlement gates.
## Data privacy / security
Include:
- data sent to provider: coordinates and forecast count parameters.
- PII risk: coordinates may reveal pickup, delivery, and route points.
- location data risk: high.
- payment data risk: none.
- logging restrictions: never log API key, full route context, customer/load IDs.
- what must never be logged: API key, auth headers, sensitive route/load data.
- whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/lib/weather/providers/googleWeather.ts` | `getGoogleCurrentWeather` | Current conditions lookup. | `GOOGLE_WEATHER_API_KEY`, `GOOGLE_WEATHER_BASE_URL` | Server-only. |
| `src/lib/weather/providers/googleWeather.ts` | `getGoogleHourlyForecast` | Hourly forecast lookup. | Google Weather env vars | Clamps hours. |
| `src/lib/weather/providers/googleWeather.ts` | `getGoogleDailyForecast` | Daily forecast lookup. | Google Weather env vars | Clamps days. |
| `src/lib/weather/providers/googleWeather.ts` | `getGooglePublicAlerts` | Public alerts lookup. | Google Weather env vars | Normalized alert evidence. |
| `src/app/api/weather/*` | route handlers | Karpilo Weather Intelligence API. | Google Weather env vars | Returns normalized app-safe shapes. |
## Tests / validation
List existing or needed tests:
- manual endpoint validation on 2026-06-28: current, hourly forecast, daily
  forecast, and public alerts returned `ok: true` through app routes after
  endpoint base/path normalization.
- unit tests: needed for Google response normalization.
- mock response tests: needed for current/hourly/daily/alerts success and errors.
- schema validation tests: needed for consumed response fields.
- error fallback tests: needed for missing key, 429, 5xx, malformed payload.
- env var missing tests: needed for clean configuration error.
- provider contract drift tests: needed for endpoint and response field changes.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in official docs.
- legacy API: none confirmed.
- SDK major version risk: none; REST direct.
- pricing/quota changes: Google Weather billing/quota changes.
- response field dependency: Weather API field naming for conditions, wind,
  forecast periods, and alerts.
- undocumented assumptions: normalizers are tolerant because provider examples
  and fields may vary by endpoint.
- endpoint construction risk: `GOOGLE_WEATHER_BASE_URL` must remain the service
  base URL; the app strips a trailing `/v1` defensively because endpoint
  constants already include the version path.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
