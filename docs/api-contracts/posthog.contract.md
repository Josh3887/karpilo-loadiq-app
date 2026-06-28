# Provider Contract: PostHog Capture API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://posthog.com/docs/api/capture
- API reference: https://posthog.com/docs/api/capture
- SDK docs: https://posthog.com/docs/libraries/next-js
- Pricing/quota/rate-limit docs, if available: PostHog project/event limits apply.
- Error-handling docs, if available: PostHog capture API docs apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses PostHog for internal product analytics event capture. It is not a
customer-facing product feature, dispatch authority, guaranteed profitability
source, billing authority, AI provider, or route/fuel/weather provider.
## Authentication
- Auth method required by provider docs: project API key/token in capture
  payload.
- Env var names used in app: `POSTHOG_ENABLED`,
  `NEXT_PUBLIC_POSTHOG_ENABLED`, `POSTHOG_DASHBOARD_URL`,
  `NEXT_PUBLIC_APP_ENV`, `APP_ENV`, `NEXT_PUBLIC_APP_VERSION`,
  `POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`,
  `NEXT_PUBLIC_POSTHOG_KEY`, `POSTHOG_HOST`, `NEXT_PUBLIC_POSTHOG_HOST`.
- Server-only or client-safe: current server capture may use public project
  token; do not add private keys to client.
- Secret exposure risk: do not treat private admin keys as project tokens.
- Required headers: `Content-Type: application/json`.
- Key restrictions recommended: use project token only for capture.
## Base URL / SDK entrypoint
- REST base URL or SDK package: default `https://us.i.posthog.com`
- Endpoint path or SDK method: `/capture/`
- HTTP method: `POST`
- Required headers: `Content-Type: application/json`
- Content type: JSON
- API version if applicable: Capture API.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `api_key` | yes | string | PostHog project token. | `src/lib/analytics-server.ts` | Must be configured and analytics enabled. | Do not print. |
| `event` | yes | string | Event name. | `captureServerAnalyticsEvent` | Must pass `isAnalyticsEventName`. | Allowlisted. |
| `distinct_id` | yes | string | User/device identifier. | `captureServerAnalyticsEvent` | Passed by caller. | Treat as sensitive. |
| `properties` | no | object | Event properties. | `sanitizeAnalyticsProperties` | Sanitized/allowlisted. | Includes environment/app_version. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| none | none | App does not consume capture response fields. | no | `captureServerAnalyticsEvent` | Capture failure is swallowed. |
## Error contract
Include:
- documented provider error shape: app does not consume provider error body.
- HTTP status codes used by provider: app does not inspect response status.
- auth failures: capture fails silently.
- validation failures: invalid event names are not sent.
- quota/rate-limit failures: capture may fail; app workflow unaffected.
- timeout/network failure behavior: caught and swallowed.
- app fallback behavior: customer-facing workflow continues.
- user-safe error message: none shown.
- internal logging behavior: avoid sensitive analytics payload logging.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: PostHog project/event limits.
- cache strategy: none.
- retry/backoff strategy: none.
- abuse prevention: analytics enabled flag and event allowlist.
- client-side vs server-side call protection: current server helper calls capture
  endpoint directly; internal API sanitizes client events.
- tier impact if relevant: none; analytics is internal.
## Data privacy / security
Include:
- data sent to provider: event name, distinct ID, sanitized properties,
  environment/app version.
- PII risk: possible if properties are not sanitized.
- location data risk: possible if route context is added improperly.
- payment data risk: possible if billing context is added improperly.
- logging restrictions: do not send raw load, address, billing, payment, auth,
  or admin-sensitive data unless explicitly allowlisted.
- what must never be logged: secrets, auth tokens, payment data, raw route/load
  operational details.
- whether requests must be server-side only: preferred for sensitive events.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/lib/analytics-server.ts` | `captureServerAnalyticsEvent` | POST `/capture/`. | PostHog env vars | Swallows provider failures. |
| `src/lib/analytics.ts` | event/property helpers | Event allowlist/sanitization. | PostHog env vars | Client-safe event gateway. |
| `src/app/api/analytics/events/route.ts` | `POST` | Internal event endpoint. | PostHog env vars | Returns accepted without exposing provider failures. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for event/property sanitizer.
- mock response tests: needed if response handling is added.
- schema validation tests: needed for event allowlist.
- error fallback tests: needed for capture failure.
- env var missing tests: needed for disabled/unconfigured path.
- provider contract drift tests: needed for capture payload fields.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in docs read for this task.
- legacy API: none confirmed.
- SDK major version risk: none for REST helper; Next.js library may change if
  adopted.
- pricing/quota changes: event quota/pricing.
- response field dependency: none.
- undocumented assumptions: public token env naming should be reviewed before
  adding any private/admin PostHog API use.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
