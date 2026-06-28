# Provider Contract: Sentry Next.js SDK
## Status
- App status: implemented
- Contract status: needs implementation audit
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- API reference: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- SDK docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Pricing/quota/rate-limit docs, if available: Sentry project event quotas apply.
- Error-handling docs, if available: Sentry SDK docs apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses Sentry capture helpers for route/global error visibility and an
admin development test surface. Sentry is not customer-facing product behavior,
not dispatch authority, not guaranteed profitability, not billing authority,
not analytics product output, and not a route/fuel/weather/AI provider.
## Authentication
- Auth method required by provider docs: SDK project configuration/DSN.
- Env var names used in app: `SENTRY_RELEASE`,
  `NEXT_PUBLIC_SENTRY_RELEASE`, `SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_APP_ENV`.
- Server-only or client-safe: release/environment values may be public; DSN
  configuration was not found in audited source files.
- Secret exposure risk: no Sentry auth token should be committed or exposed.
- Required headers: SDK-managed.
- Key restrictions recommended: keep auth tokens out of runtime/client code.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `@sentry/nextjs`.
- Endpoint path or SDK method: `Sentry.captureException`, `Sentry.withScope`.
- HTTP method: SDK-managed.
- Required headers: SDK-managed.
- Content type: SDK-managed.
- API version if applicable: SDK version from package lock.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| captured exception | yes | Error | Error/event captured by SDK. | `src/app/global-error.tsx`, `src/components/observability/sentry-route-error.tsx` | Captured from error boundaries. | Scrub sensitive data. |
| scope tags `feature`, `boundary` | no | string | Event tags/context. | Sentry route error helpers | Derived from route/boundary. | No sensitive values. |
| release/environment | no | string | Release/environment metadata. | `src/lib/sentry-config.ts` | Derived from env vars. | Values only, no secrets. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| none | none | App does not consume Sentry provider responses. | no | capture helpers | User error UI continues. |
## Error contract
Include:
- documented provider error shape: app does not consume provider error bodies.
- HTTP status codes used by provider: SDK-managed and not consumed.
- auth failures: SDK/project configuration issue; app should not crash user flow.
- validation failures: scrubber handles sensitive fields before send.
- quota/rate-limit failures: Sentry quota limits may drop events; app does not
  depend on delivery.
- timeout/network failure behavior: SDK-managed.
- app fallback behavior: route/global error UI continues.
- user-safe error message: UI is independent of provider delivery.
- internal logging behavior: scrub before sending.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: Sentry event quotas apply.
- cache strategy: none.
- retry/backoff strategy: SDK-managed.
- abuse prevention: sample rates in `src/lib/sentry-config.ts`.
- client-side vs server-side call protection: SDK may run in both depending on
  future configuration; secrets must stay server-side.
- tier impact if relevant: none; observability is internal/admin.
## Data privacy / security
Include:
- data sent to provider: error events, stack/context, scrubbed tags.
- PII risk: high if scrubber is bypassed.
- location data risk: possible if errors include route context; scrub required.
- payment data risk: possible if errors include billing context; scrub required.
- logging restrictions: filter email, cookies, auth, pickup/delivery, revenue,
  fuel, customer/load, billing/payment-sensitive fields.
- what must never be logged: auth tokens, cookies, secrets, payment data,
  sensitive operational route/load context.
- whether requests must be server-side only: not strictly, but secrets and
  protected data must not be exposed.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/app/global-error.tsx` | global error boundary | `captureException`. | Sentry release/env vars | Captures route feature tag. |
| `src/components/observability/sentry-route-error.tsx` | route error helper | `captureException`. | Sentry release/env vars | Used by dashboard/admin error pages. |
| `src/components/observability/sentry-test-button.tsx` | admin test button | `captureException`. | Sentry release/env vars | Admin/dev test only. |
| `src/lib/sentry-config.ts` | scrub/sample helpers | Event scrubbing and metadata. | Sentry release/env vars | Root SDK init file was not found. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for scrubber patterns.
- mock response tests: not applicable unless SDK wrapper is added.
- schema validation tests: needed for event scrub expectations.
- error fallback tests: needed for error boundaries.
- env var missing tests: needed for release/environment helpers.
- provider contract drift tests: needed for SDK init/capture changes.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in docs read for this task.
- legacy API: none confirmed.
- SDK major version risk: Sentry Next.js SDK major updates.
- pricing/quota changes: event quota changes.
- response field dependency: none.
- undocumented assumptions: root Sentry init files were not found; implementation
  should be audited before claiming full Sentry runtime initialization.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
