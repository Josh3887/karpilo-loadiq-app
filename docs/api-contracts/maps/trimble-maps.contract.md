# Provider Contract: Trimble Maps / PC*Miler

## Provider Name
Trimble Maps / PC*Miler.

## Karpilo Module Owner
Future truck-specific Route Intelligence.

## Purpose
Scaffolded truck-specific route provider placeholder. Current LoadIQ behavior
returns unavailable and makes no live Trimble calls.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://developer.trimblemaps.com/ | verified 2026-06-28 |
| Endpoint documentation URL | https://developer.trimblemaps.com/restful-apis/routing/introduction/ | endpoint details require confirmation before live use |
| Authentication documentation URL | UNVERIFIED -- add official Trimble authentication URL before live use | placeholder |
| Rate limit/quota documentation URL | UNVERIFIED -- add official Trimble quota/rate URL before live use | placeholder |

## Required Environment Variables
- None active.
- Future Trimble provider keys must be server-only.

## Forbidden Environment Usage
- `NEXT_PUBLIC_TRIMBLE_API_KEY`
- Any live Trimble key in client bundles, logs, Sentry, PostHog, or snapshots.

## Endpoints Used
- None active.

## Normalized Internal Output
Current output is an app-owned unavailable response from the Route Intelligence
Trimble scaffold.

## Required Mock Files
- `test-fixtures/api/maps/trimble-maps/truckRoute.success.json`
- `test-fixtures/api/maps/trimble-maps/errors/unauthorized-401.json`
- `test-fixtures/api/maps/trimble-maps/errors/forbidden-403.json`
- `test-fixtures/api/maps/trimble-maps/errors/not-found-404.json`
- `test-fixtures/api/maps/trimble-maps/errors/rate-limited-429.json`
- `test-fixtures/api/maps/trimble-maps/errors/server-error-500.json`
- `test-fixtures/api/maps/trimble-maps/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint drift,
408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON, empty
response, and network failure before any live Trimble integration.

## Drift Rules
- Trimble must remain scaffolded until provider request/response fields are
  verified against official documentation.
- Future truck routing must not become legal route, permit, safety, ELD, or
  dispatch authority.

## Last Verified Date
2026-06-28.

