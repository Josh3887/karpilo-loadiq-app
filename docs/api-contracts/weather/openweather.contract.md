# Provider Contract: OpenWeather Current, Forecast, and One Call APIs

## Provider Name
OpenWeather Current Weather, 5 day / 3 hour Forecast, and One Call APIs.

## Karpilo Module Owner
Karpilo Weather Intelligence and Weather Profitability Risk.

## Purpose
Secondary, fallback, and supplemental weather provider for weather intelligence;
existing OpenWeather 2.5 paths remain used by the entitlement-gated weather
profitability surface.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://openweathermap.org/api | verified 2026-06-28 |
| Endpoint documentation URL | https://openweathermap.org/current, https://openweathermap.org/api/forecast5, https://openweathermap.org/api/one-call-3 | verified 2026-06-28 |
| Authentication documentation URL | https://openweathermap.org/appid | verified 2026-06-28 |
| Rate limit/quota documentation URL | https://openweathermap.org/price | plan-specific; requires account review before production enablement |

## Required Environment Variables
- `OPENWEATHER_API_KEY`
- `OPENWEATHER_BASE_URL` optional override for the One Call foundation path.

## Forbidden Environment Usage
- Any `NEXT_PUBLIC_OPENWEATHER_API_KEY`
- Provider keys in snapshots, logs, Sentry, PostHog, or client bundles.

## Endpoints Used
- `GET /data/2.5/weather`
- `GET /data/2.5/forecast`
- `GET /data/3.0/onecall`

## Normalized Internal Output
OpenWeather responses normalize into weather current, forecast period, and alert
shapes. Existing 2.5 weather profitability normalization must remain separate
from the One Call weather intelligence foundation.

## Required Mock Files
- `test-fixtures/api/weather/openweather/current.success.json`
- `test-fixtures/api/weather/openweather/forecast.success.json`
- `test-fixtures/api/weather/openweather/oneCall.success.json`
- `test-fixtures/api/weather/openweather/errors/unauthorized-401.json`
- `test-fixtures/api/weather/openweather/errors/forbidden-403.json`
- `test-fixtures/api/weather/openweather/errors/not-found-404.json`
- `test-fixtures/api/weather/openweather/errors/rate-limited-429.json`
- `test-fixtures/api/weather/openweather/errors/server-error-500.json`
- `test-fixtures/api/weather/openweather/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint drift,
408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON, empty
response, and network failure.

## Drift Rules
- OpenWeather 2.5 profitability behavior must not drift when One Call 3.0
  weather intelligence code changes.
- OpenWeather alert severity must not be promoted to official U.S. alert
  authority.
- OpenWeather One Call version changes require provider-doc review.

## Last Verified Date
2026-06-28.

