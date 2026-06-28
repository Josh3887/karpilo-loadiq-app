# Provider Contract: OpenWeather Current Weather and Forecast APIs
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://openweathermap.org/api
- API reference: https://openweathermap.org/current and https://openweathermap.org/api/forecast5
- SDK docs: none used by LoadIQ; the app calls REST directly.
- Pricing/quota/rate-limit docs, if available: OpenWeather plan limits apply.
- Error-handling docs, if available: OpenWeather HTTP status and error payloads apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses OpenWeather current and 5 day / 3 hour forecast data as provider
context for deterministic Weather Profitability Risk. It is not legal compliance
authority, dispatch authority, ELD, guaranteed profitability source,
tax/accounting advice, broker/load-board/rate-board behavior, or official
weather alert authority.
## Authentication
- Auth method required by provider docs: API key in `appid` query parameter.
- Env var names used in app: `OPENWEATHER_API_KEY`.
- Server-only or client-safe: server-only.
- Secret exposure risk: do not expose through `NEXT_PUBLIC_`.
- Required headers: none beyond standard HTTP.
- Key restrictions recommended: restrict use to server runtime and provider
  account controls.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `https://api.openweathermap.org/data/2.5`
- Endpoint path or SDK method: `/weather`, `/forecast`
- HTTP method: `GET`
- Required headers: none.
- Content type: JSON response.
- API version if applicable: 2.5
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `lat` | yes | number | Latitude. | `src/services/weather/openweather-free-provider.ts` | Must normalize to finite coordinate. | Sensitive route point. |
| `lon` | yes | number | Longitude. | `src/services/weather/openweather-free-provider.ts` | Must normalize to finite coordinate. | Sensitive route point. |
| `appid` | yes | string | OpenWeather API key. | `fetchJson` | Must be configured server-side. | Never log or print. |
| `units` | no | string | Unit system. | `fetchJson` | App accepts `standard`, `metric`, or `imperial`. | Controls temperature/wind units. |
| `lang` | no | string | Language code. | `fetchJson` | Optional app input. | Only sent when provided. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `coord.lat` / `coord.lon` | number | Location coordinates. | yes | `normalizeCurrentWeatherPayload` | Current payload unusable when missing. |
| `name`, `sys.country`, `timezone`, `dt` | string/number | Location metadata and observation time. | yes | `normalizeCurrentWeatherPayload` | Null when absent. |
| `weather[0].id/main/description/icon` | mixed | Weather condition. | yes | `weatherCondition` | Null fields when absent. |
| `main.temp/feels_like/temp_min/temp_max/humidity/pressure` | number | Temperature, humidity, pressure. | yes | `normalizeTemperature` | Null fields when absent. |
| `visibility`, `clouds.all` | number | Visibility and cloud cover. | yes | `normalizeCurrentWeatherPayload` | Null fields when absent. |
| `wind.speed/gust/deg` | number | Wind conditions. | yes | `normalizeWind` | Null fields when absent. |
| `rain.1h`, `rain.3h`, `snow.1h`, `snow.3h` | number | Precipitation volumes. | yes | `normalizeCurrentWeatherPayload` | Null fields when absent. |
| `city.coord/name/country/timezone` | mixed | Forecast city metadata. | yes | `normalizeForecastPayload` | Forecast payload unusable when coordinates missing. |
| `list[].dt`, `list[].main`, `list[].weather`, `list[].visibility`, `list[].clouds`, `list[].wind`, `list[].rain.3h`, `list[].snow.3h`, `list[].pop` | mixed | 3 hour forecast point fields. | yes | `normalizeForecastPoint` | Invalid points are dropped. |
## Error contract
Include:
- documented provider error shape: app currently keys off HTTP status, not a
  typed OpenWeather error body.
- HTTP status codes used by provider: `401` maps to invalid key, `429` maps to
  rate limit, other non-2xx maps to HTTP error.
- auth failures: `invalid_openweather_api_key`.
- validation failures: invalid local coordinates return no provider call.
- quota/rate-limit failures: `openweather_rate_limited`.
- timeout/network failure behavior: caught as retryable network failure.
- app fallback behavior: weather point/result unavailable; base calculator
  continues.
- user-safe error message: weather unavailable/locked messaging, not raw key.
- internal logging behavior: `logWeatherFailure` without secrets.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: OpenWeather plan limits apply.
- cache strategy: provider fetch uses `cache: "no-store"`; route response says
  `cacheStatus: "not_implemented"`.
- retry/backoff strategy: none.
- abuse prevention: weather profitability API requires auth and entitlement.
- client-side vs server-side call protection: provider calls are server-side.
- tier impact if relevant: weather risk is gated by entitlement.
## Data privacy / security
Include:
- data sent to provider: coordinates, units, optional language.
- PII risk: coordinates may reveal pickup, delivery, or stop locations.
- location data risk: high.
- payment data risk: none sent.
- logging restrictions: do not log API key or full operational route context.
- what must never be logged: API key, auth headers, user/load identifiers.
- whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/services/weather/openweather-free-provider.ts` | `getCurrentWeather` | `/weather` lookup. | `OPENWEATHER_API_KEY` | Normalizes current snapshot. |
| `src/services/weather/openweather-free-provider.ts` | `getFiveDayForecast` | `/forecast` lookup. | `OPENWEATHER_API_KEY` | Normalizes 3 hour forecast points. |
| `src/services/weather/weather-profitability.ts` | `calculateWeatherProfitability` | Deterministic risk scoring from provider data. | `OPENWEATHER_API_KEY` | Provider data is not AI. |
| `src/app/api/weather/profitability/route.ts` | `POST` | Entitlement-gated weather risk route. | `OPENWEATHER_API_KEY` | Returns locked state before provider call when not entitled. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for risk scoring and normalization.
- mock response tests: needed for current and forecast payloads.
- schema validation tests: needed for consumed weather fields.
- error fallback tests: needed for 401, 429, 5xx, malformed payloads.
- env var missing tests: needed for unavailable state.
- provider contract drift tests: needed.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in official docs.
- legacy API: 2.5 endpoints are current in OpenWeather docs read for this task.
- SDK major version risk: none; REST direct.
- pricing/quota changes: OpenWeather plan limits.
- response field dependency: weather, main, wind, rain/snow field shapes.
- undocumented assumptions: LoadIQ risk scoring and profitability impact are
  deterministic app calculations, not provider output.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
