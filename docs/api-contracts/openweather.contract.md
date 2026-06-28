# Provider Contract: OpenWeather Current, Forecast, and One Call APIs
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://openweathermap.org/api
- API reference: https://openweathermap.org/current, https://openweathermap.org/api/forecast5, https://openweathermap.org/api/one-call-3
- SDK docs: none used by LoadIQ; the app calls REST directly.
- Pricing/quota/rate-limit docs, if available: OpenWeather plan limits apply.
- Error-handling docs, if available: OpenWeather HTTP status and error payloads apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses OpenWeather as a secondary/fallback/supplemental weather provider.
The existing Weather Profitability Risk path uses OpenWeather 2.5 current and
5 day / 3 hour forecast endpoints. The new server-side Karpilo Weather
Intelligence foundation uses One Call 3.0 for current, hourly, daily, and alert
normalization. OpenWeather is not legal compliance authority, dispatch
authority, ELD, guaranteed profitability source, tax/accounting advice,
insurance advice, broker/load-board/rate-board behavior, or official U.S.
government weather alert authority.
## Authentication
- Auth method required by provider docs: API key in `appid` query parameter.
- Env var names used in app: `OPENWEATHER_API_KEY`, `OPENWEATHER_BASE_URL`.
- Server-only or client-safe: server-only.
- Secret exposure risk: do not expose through `NEXT_PUBLIC_`.
- Required headers: none beyond standard HTTP.
- Key restrictions recommended: restrict use to server runtime and provider
  account controls.
## Base URL / SDK entrypoint
- REST base URL or SDK package: existing 2.5 provider uses
  `https://api.openweathermap.org/data/2.5`; new Karpilo Weather Intelligence
  provider defaults to `https://api.openweathermap.org/data/3.0`
- Endpoint path or SDK method: `/weather`, `/forecast`, `/onecall`
- HTTP method: `GET`
- Required headers: none.
- Content type: JSON response.
- API version if applicable: OpenWeather 2.5 and One Call 3.0
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `lat` | yes | number | Latitude. | `src/services/weather/openweather-free-provider.ts`, `src/lib/weather/providers/openWeather.ts` | Must normalize to finite coordinate. | Sensitive route point. |
| `lon` | yes | number | Longitude. | OpenWeather provider files | Must normalize to finite coordinate. | Sensitive route point. |
| `appid` | yes | string | OpenWeather API key. | provider fetch functions | Must be configured server-side. | Never log or print. |
| `units` | no | string | Unit system. | provider fetch functions | Defaults to `imperial` for new foundation. | Controls temperature/wind units. |
| `lang` | no | string | Language code. | existing 2.5 provider | Optional existing input. | Only sent when provided. |
| `exclude` | no | string | One Call data exclusion list. | `getOpenWeatherOneCall` | Optional. | Not required by current routes. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| 2.5 `coord.lat` / `coord.lon` | number | Location coordinates. | yes | `normalizeCurrentWeatherPayload` | Current payload unusable when missing. |
| 2.5 `weather[0].id/main/description/icon` | mixed | Weather condition. | yes | `weatherCondition` | Null fields when absent. |
| 2.5 `main.*`, `visibility`, `clouds.all`, `wind.*`, `rain.*`, `snow.*` | mixed | Current weather details. | yes | existing OpenWeather normalizers | Null fields when absent. |
| 2.5 `list[].dt/main/weather/visibility/clouds/wind/rain/snow/pop` | mixed | 3 hour forecast point fields. | yes | `normalizeForecastPoint` | Invalid points are dropped. |
| One Call `current.dt/temp/feels_like/humidity/wind_speed/wind_gust/wind_deg/visibility/weather` | mixed | Current conditions. | yes | `normalizeOpenWeatherOneCallCurrent` | Current returns null if unusable. |
| One Call `hourly[]` / `daily[]` weather, temperature, wind, visibility, pop fields | mixed | Forecast periods. | yes | `normalizeOpenWeatherOneCallForecasts` | Invalid periods are dropped. |
| One Call `alerts[].sender_name/event/start/end/description/tags` | mixed | Provider alert context. | yes | `normalizeOpenWeatherAlerts` | Unknown severity; categories inferred from text. |
## Error contract
Include:
- documented provider error shape: app currently keys off HTTP status and JSON
  usability, not raw OpenWeather error bodies.
- HTTP status codes used by provider: `401`/`403` map to key/access error,
  `429` maps to rate limit, other non-2xx maps to HTTP error.
- auth failures: missing key returns `missing_openweather_api_key`; One Call
  subscription/key access issues return `openweather_access_error`.
- validation failures: invalid local coordinates return no provider call.
- quota/rate-limit failures: `openweather_rate_limited`.
- timeout/network failure behavior: caught as retryable network failure.
- app fallback behavior: weather point/result unavailable; auto provider may
  fall back from Google to OpenWeather or report clean errors.
- user-safe error message: weather unavailable/configuration messaging, not raw
  key values.
- internal logging behavior: no secrets or raw route/load context.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: OpenWeather plan limits apply.
- cache strategy: existing 2.5 provider uses `cache: "no-store"`; new One Call
  foundation caches current/onecall 600 seconds and alerts 300 seconds through
  Next fetch revalidation.
- retry/backoff strategy: none.
- abuse prevention: API routes validate coordinates and cap forecast ranges.
- client-side vs server-side call protection: provider calls are server-side.
- tier impact if relevant: this foundation does not change existing weather
  profitability entitlement gates.
## Data privacy / security
Include:
- data sent to provider: coordinates, units, optional language/exclude.
- PII risk: coordinates may reveal pickup, delivery, or stop locations.
- location data risk: high.
- payment data risk: none sent.
- logging restrictions: do not log API key or full operational route context.
- what must never be logged: API key, auth headers, user/load identifiers.
- whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/services/weather/openweather-free-provider.ts` | `getCurrentWeather` | `/weather` lookup. | `OPENWEATHER_API_KEY` | Existing weather profitability path. |
| `src/services/weather/openweather-free-provider.ts` | `getFiveDayForecast` | `/forecast` lookup. | `OPENWEATHER_API_KEY` | Existing 3 hour forecast path. |
| `src/lib/weather/providers/openWeather.ts` | `getOpenWeatherOneCall` | `/onecall` lookup. | `OPENWEATHER_API_KEY`, `OPENWEATHER_BASE_URL` | New Karpilo Weather Intelligence path. |
| `src/lib/weather/providers/openWeather.ts` | `getOpenWeatherCurrentAndForecast`, `getOpenWeatherAlerts` | One Call normalized current/forecast/alerts. | OpenWeather env vars | Server-only. |
| `src/app/api/weather/*` | route handlers | Karpilo Weather Intelligence API. | OpenWeather env vars | Safe provider errors. |
| `src/app/api/weather/profitability/route.ts` | `POST` | Existing entitlement-gated weather risk route. | `OPENWEATHER_API_KEY` | Behavior unchanged. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for 2.5 and One Call normalization.
- mock response tests: needed for current, forecast, alerts, access errors.
- schema validation tests: needed for consumed weather fields.
- error fallback tests: needed for 401, 403, 429, 5xx, malformed payloads.
- env var missing tests: needed for unavailable state.
- provider contract drift tests: needed.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed for current active code paths.
- legacy API: OpenWeather currently recommends One Call 4.0 for new
  integrations; this branch implements One Call 3.0 because the requested env
  contract targets `/data/3.0`.
- SDK major version risk: none; REST direct.
- pricing/quota changes: OpenWeather plan limits and One Call subscription
  access can change.
- response field dependency: weather, main/current/hourly/daily/alerts shapes.
- undocumented assumptions: OpenWeather alert severity is not normalized to NWS
  severity and is treated as unknown unless inferred from text.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
