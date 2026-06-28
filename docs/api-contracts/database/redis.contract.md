# Provider Contract: Upstash Redis

## Provider Name
Upstash Redis SDK/REST endpoint.

## Karpilo Module Owner
Server-side cache helpers.

## Purpose
Server-side cache helper storage for provider/cacheable app data.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://upstash.com/docs/redis | verified 2026-06-28 |
| Endpoint documentation URL | https://upstash.com/docs/redis/features/restapi, https://upstash.com/docs/redis/howto/connect-with-upstash-redis | verified 2026-06-28 |
| Authentication documentation URL | https://upstash.com/docs/redis/features/restapi | verified 2026-06-28 |
| Rate limit/quota documentation URL | https://upstash.com/pricing/redis | requires account-plan review before production tuning |

## Required Environment Variables
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Forbidden Environment Usage
- Public Redis REST tokens.
- Cache tokens in client bundles, snapshots, Sentry, PostHog, or logs.

## Endpoints Used
- Upstash Redis SDK/REST operations through server-side helpers.

## Normalized Internal Output
Redis output must remain behind server-side cache helpers and must not leak
provider tokens or raw sensitive cache payloads.

## Required Mock Files
- `test-fixtures/api/database/redis/cacheHit.success.json`
- `test-fixtures/api/database/redis/cacheMiss.success.json`
- `test-fixtures/api/database/redis/errors/unauthorized-401.json`
- `test-fixtures/api/database/redis/errors/forbidden-403.json`
- `test-fixtures/api/database/redis/errors/not-found-404.json`
- `test-fixtures/api/database/redis/errors/rate-limited-429.json`
- `test-fixtures/api/database/redis/errors/server-error-500.json`
- `test-fixtures/api/database/redis/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint drift,
408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON, empty
response, and network failure.

## Drift Rules
- Redis cache failures must degrade without blocking core calculator behavior
  unless a future feature explicitly requires cache availability.
- Redis tokens must remain server-only.

## Last Verified Date
2026-06-28.

