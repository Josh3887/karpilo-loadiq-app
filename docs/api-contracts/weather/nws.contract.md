# Provider Contract: NWS / weather.gov API

## Provider Name
National Weather Service / weather.gov API.

## Karpilo Module Owner
Karpilo Weather Intelligence.

## Purpose
Official U.S. government validation and alert evidence layer for weather
intelligence.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://www.weather.gov/documentation/services-web-api | verified 2026-06-28 |
| Endpoint documentation URL | https://www.weather.gov/documentation/services-web-api | verified 2026-06-28 |
| Authentication documentation URL | https://www.weather.gov/documentation/services-web-api | no API key; User-Agent identification required |
| Rate limit/quota documentation URL | https://weather-gov.github.io/api/general-faqs | verified 2026-06-28 |

## Required Environment Variables
- `NWS_USER_AGENT`
- `NWS_BASE_URL` optional override; default is `https://api.weather.gov`

## Forbidden Environment Usage
- Anonymous NWS calls without a controlled User-Agent.
- Any client-visible route/load context sent directly to NWS outside server
  adapters.

## Endpoints Used
- `GET /points/{latitude},{longitude}`
- `GET /gridpoints/{gridId}/{gridX},{gridY}/forecast`
- `GET /gridpoints/{gridId}/{gridX},{gridY}/forecast/hourly`
- `GET /alerts/active?area={area}`
- `GET /alerts/active?point={latitude},{longitude}`

## Normalized Internal Output
NWS responses normalize into point metadata, forecast periods, and weather
alerts with official alert context retained as evidence only.

## Required Mock Files
- `test-fixtures/api/weather/nws/points.success.json`
- `test-fixtures/api/weather/nws/forecast.success.json`
- `test-fixtures/api/weather/nws/hourlyForecast.success.json`
- `test-fixtures/api/weather/nws/alerts.success.json`
- `test-fixtures/api/weather/nws/errors/not-found-404.json`
- `test-fixtures/api/weather/nws/errors/rate-limited-429.json`
- `test-fixtures/api/weather/nws/errors/server-error-500.json`
- `test-fixtures/api/weather/nws/errors/timeout.json`

## Failure Classifications
Future tests must verify 404 point/grid drift, 408/timeout, 429 rate limited,
500+ provider unavailable, malformed JSON, empty response, and network failure.
NWS does not use a LoadIQ API key, but missing `NWS_USER_AGENT` must be treated
as configuration failure.

## Drift Rules
- Grid office and grid coordinates must come from `/points`; do not hardcode
  them.
- Official alert evidence must remain separate from Google/OpenWeather context.
- NWS output must not become legal, dispatch, ELD, or safety authority.

## Last Verified Date
2026-06-28.

