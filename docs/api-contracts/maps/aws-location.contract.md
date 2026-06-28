# Provider Contract: AWS Location Service

## Provider Name
AWS Location Service.

## Karpilo Module Owner
Future map/geospatial fallback only.

## Purpose
Planned-only map/geospatial provider placeholder. No LoadIQ runtime integration
is active.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://docs.aws.amazon.com/location/ | verified 2026-06-28 |
| Endpoint documentation URL | https://docs.aws.amazon.com/location/latest/APIReference/welcome.html | planned-only |
| Authentication documentation URL | https://docs.aws.amazon.com/location/latest/developerguide/security-iam.html | planned-only |
| Rate limit/quota documentation URL | https://docs.aws.amazon.com/general/latest/gr/location.html | planned-only; confirm before implementation |

## Required Environment Variables
- None active.
- Future AWS credentials or role bindings must be server-side only.

## Forbidden Environment Usage
- Client-exposed AWS secrets.
- Committed AWS access keys or session tokens.

## Endpoints Used
- None active.

## Normalized Internal Output
No normalized output is active. Future output must be LoadIQ-owned and must not
leak AWS response shapes to UI.

## Required Mock Files
- `test-fixtures/api/maps/aws-location/location.success.json`
- `test-fixtures/api/maps/aws-location/errors/unauthorized-401.json`
- `test-fixtures/api/maps/aws-location/errors/forbidden-403.json`
- `test-fixtures/api/maps/aws-location/errors/not-found-404.json`
- `test-fixtures/api/maps/aws-location/errors/rate-limited-429.json`
- `test-fixtures/api/maps/aws-location/errors/server-error-500.json`
- `test-fixtures/api/maps/aws-location/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint drift,
408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON, empty
response, and network failure before any live integration.

## Drift Rules
- AWS Location must remain planned-only until source code and contracts are
  wired intentionally.
- Do not introduce AWS credentials through public environment variables.

## Last Verified Date
2026-06-28.

