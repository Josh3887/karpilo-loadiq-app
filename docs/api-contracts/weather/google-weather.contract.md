# Provider Contract: Google Weather API

## Provider Name
Google Weather API.

## Karpilo Module Owner
Karpilo Weather Intelligence.

## Purpose
Primary app-facing weather provider for current conditions, hourly forecasts,
daily forecasts, and public alerts used by server-side LoadIQ weather
intelligence.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://developers.google.com/maps/documentation/weather | verified 2026-06-28 |
| Endpoint documentation URL | https://developers.google.com/maps/documentation/weather/current-conditions, https://developers.google.com/maps/documentation/weather/hourly-forecast, https://developers.google.com/maps/documentation/weather/daily-forecast, https://developers.google.com/maps/documentation/weather/reference/rest/v1/publicAlerts/lookup | verified 2026-06-28 |
| Authentication documentation URL | https://developers.google.com/maps/documentation/weather/get-api-key | requires live-project review before production enablement |
| Rate limit/quota documentation URL | https://developers.google.com/maps/documentation/weather/usage-and-billing | requires project quota review before production enablement |

## Required Environment Variables
- `GOOGLE_WEATHER_API_KEY`
- `GOOGLE_WEATHER_BASE_URL` optional override; default is `https://weather.googleapis.com`

## Forbidden Environment Usage
- `NEXT_PUBLIC_GOOGLE_WEATHER_API_KEY`
- Any client-visible Google Weather secret or full provider request URL.

## Endpoints Used
- `GET /v1/currentConditions:lookup`
- `GET /v1/forecast/hours:lookup`
- `GET /v1/forecast/days:lookup`
- `GET /v1/publicAlerts:lookup`

## Normalized Internal Output
Normalized through `src/lib/weather/weatherNormalize.ts` into
`NormalizedCurrentWeather`, `NormalizedForecastPeriod`, and
`NormalizedWeatherAlert`.

## Required Mock Files
- `test-fixtures/api/weather/google-weather/currentConditions.success.json`
- `test-fixtures/api/weather/google-weather/hourlyForecast.success.json`
- `test-fixtures/api/weather/google-weather/dailyForecast.success.json`
- `test-fixtures/api/weather/google-weather/publicAlerts.success.json`
- `test-fixtures/api/weather/google-weather/routeForecast.future.success.json`
- `test-fixtures/api/weather/google-weather/errors/unauthorized-401.json`
- `test-fixtures/api/weather/google-weather/errors/forbidden-403.json`
- `test-fixtures/api/weather/google-weather/errors/not-found-404.json`
- `test-fixtures/api/weather/google-weather/errors/rate-limited-429.json`
- `test-fixtures/api/weather/google-weather/errors/server-error-500.json`
- `test-fixtures/api/weather/google-weather/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint drift,
408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON, empty
response, and network failure. Generic Google Weather errors are not acceptable
as the long-term final state.

## Drift Rules
- Endpoint constants must keep `:lookup` unencoded in the path.
- `GOOGLE_WEATHER_BASE_URL` must not create `/v1/v1/...` request paths.
- Consumed response fields must stay mapped in the normalizer before UI use.
- Live provider checks must be opt-in and must never be required in normal CI.

## Last Verified Date
2026-06-28.

