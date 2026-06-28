# Provider Contract: Upstash Redis
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://upstash.com/docs/redis
- API reference: https://upstash.com/docs/redis/features/restapi
- SDK docs: https://upstash.com/docs/redis/howto/connect-with-upstash-redis
- Pricing/quota/rate-limit docs, if available: Upstash Redis plan limits apply.
- Error-handling docs, if available: Upstash Redis SDK/REST docs apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses Upstash Redis through a server-side helper for optional cache
storage. Redis is not source-of-truth billing, entitlement, route, weather,
fuel, AI, payment, or saved-load storage.
## Authentication
- Auth method required by provider docs: REST URL and REST token used by SDK.
- Env var names used in app: `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`.
- Server-only or client-safe: server-only.
- Secret exposure risk: never expose REST token client-side.
- Required headers: SDK-managed.
- Key restrictions recommended: server-only runtime and environment separation.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `@upstash/redis`.
- Endpoint path or SDK method: `new Redis({ url, token })`, `get`, `set`, `del`.
- HTTP method: SDK-managed REST.
- Required headers: SDK-managed.
- Content type: SDK-managed JSON/REST command payloads.
- API version if applicable: Upstash Redis REST API.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `url` | yes | string | Upstash REST URL. | `src/lib/redis.ts` | Client not created unless URL and token exist. | Server-only. |
| `token` | yes | string | Upstash REST token. | `src/lib/redis.ts` | Client not created unless URL and token exist. | Never log or print. |
| `key` | yes | string | Redis key. | `getRedisValue`, `setRedisValue`, `deleteRedisValue` | Caller-provided. | Avoid sensitive raw identifiers. |
| `value` | yes for set | unknown | Redis value. | `setRedisValue` | Caller-provided generic. | Do not cache secrets. |
| `ex` | no | number | Expiration seconds. | `setRedisValue` | Set when `exSeconds` exists. | Cache TTL. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `get<T>()` return value | generic/null | Stored Redis value. | yes | `getRedisValue` | Returns null when client unavailable. |
| `set()` result | provider-specific | Set command result. | no | `setRedisValue` | Helper returns true after awaited set. |
| `del()` result | provider-specific | Delete count/result. | no | `deleteRedisValue` | Helper returns true after awaited delete. |
## Error contract
Include:
- documented provider error shape: SDK errors are not wrapped by helper.
- HTTP status codes used by provider: SDK-managed.
- auth failures: missing env returns null client; invalid token may throw.
- validation failures: caller responsibility for key/value.
- quota/rate-limit failures: SDK may throw; no retry/backoff.
- timeout/network failure behavior: SDK may throw; caller must handle.
- app fallback behavior: helper returns null/false when unconfigured.
- user-safe error message: caller-specific.
- internal logging behavior: do not log token or sensitive cache contents.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: Upstash plan limits apply.
- cache strategy: optional Redis cache with optional expiration seconds.
- retry/backoff strategy: none in helper.
- abuse prevention: server-only helper.
- client-side vs server-side call protection: Redis token is server-only.
- tier impact if relevant: none.
## Data privacy / security
Include:
- data sent to provider: cache keys and values chosen by callers.
- PII risk: depends on caller; should avoid raw PII.
- location data risk: possible if callers cache route context.
- payment data risk: must not cache payment secrets or card data.
- logging restrictions: do not log REST token or sensitive cached values.
- what must never be logged: REST token, secrets, auth/session/payment data.
- whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/lib/redis.ts` | `getRedisClient` | SDK initialization. | Upstash env vars | Returns null when unconfigured. |
| `src/lib/redis.ts` | `getRedisValue` | Redis `get`. | Upstash env vars | Generic cache read. |
| `src/lib/redis.ts` | `setRedisValue` | Redis `set` with optional `ex`. | Upstash env vars | Generic cache write. |
| `src/lib/redis.ts` | `deleteRedisValue` | Redis `del`. | Upstash env vars | Generic cache delete. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for unconfigured helper behavior.
- mock response tests: needed for get/set/del wrapper calls.
- schema validation tests: caller-specific.
- error fallback tests: needed for SDK throw cases.
- env var missing tests: needed for null client path.
- provider contract drift tests: needed for SDK major updates.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in docs read for this task.
- legacy API: none confirmed.
- SDK major version risk: Upstash Redis SDK major updates.
- pricing/quota changes: Upstash plan limits.
- response field dependency: `get<T>()` value behavior.
- undocumented assumptions: helper does not currently wrap SDK-thrown errors.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
