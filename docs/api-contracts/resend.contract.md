# Provider Contract: Resend Email API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://resend.com/docs/api-reference/introduction
- API reference: https://resend.com/docs/api-reference/emails/send-email
- SDK docs: none used by LoadIQ; the app calls REST directly.
- Pricing/quota/rate-limit docs, if available: Resend account/domain limits apply.
- Error-handling docs, if available: Resend API reference error responses apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses Resend for elevated admin challenge/token email delivery. Resend is
not customer-facing product intelligence, dispatch authority, guaranteed
profitability source, billing processor, route/fuel/weather provider, AI
provider, or broker/load-board behavior.
## Authentication
- Auth method required by provider docs: Bearer API key.
- Env var names used in app: `RESEND_API_KEY`, `NO_REPLY_EMAIL`.
- Server-only or client-safe: server-only.
- Secret exposure risk: never expose `RESEND_API_KEY` client-side.
- Required headers: `Authorization: Bearer ...`, `Content-Type: application/json`.
- Key restrictions recommended: restrict to required sending domain/environment.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `https://api.resend.com`
- Endpoint path or SDK method: `/emails`
- HTTP method: `POST`
- Required headers: `Authorization`, `Content-Type`
- Content type: JSON
- API version if applicable: current Resend Email API.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `from` | yes | string | Sender address/name. | `src/lib/admin/admin-email.ts` | Derived from no-reply identity. | No secrets. |
| `to` | yes | string[] | Recipients. | `sendAdminEmail` | Elevated admin email only. | Sensitive admin flow. |
| `reply_to` | no | string | Reply-to address. | `sendAdminEmail` | Configured email identity. | Provider field name should be rechecked before SDK adoption. |
| `subject` | yes | string | Email subject. | `sendAdminEmail` | Provided by caller. | Avoid secrets in subject. |
| `text` | no | string | Plain text body. | `sendAdminEmail` | Generated email content. | May include short-lived admin challenge/token. |
| `html` | no | string | HTML body. | `sendAdminEmail` | Generated email content. | May include short-lived admin challenge/token. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| HTTP `ok` status | boolean | Successful request indicator. | yes | `sendAdminEmail` | Returns safe delivery failure. |
| response body | object | Provider email response. | no | `sendAdminEmail` | Not parsed. |
## Error contract
Include:
- documented provider error shape: app does not parse body; uses HTTP status.
- HTTP status codes used by provider: non-2xx is delivery failure.
- auth failures: missing API key blocks send before provider call.
- validation failures: provider non-2xx.
- quota/rate-limit failures: provider non-2xx; no retry/backoff.
- timeout/network failure behavior: caught and safe delivery failure returned.
- app fallback behavior: elevated admin flow receives unavailable/failed email.
- user-safe error message: "Email delivery failed/unavailable."
- internal logging behavior: logs status only; no tokens or API key.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: Resend account/domain limits.
- cache strategy: none.
- retry/backoff strategy: none.
- abuse prevention: admin/elevated auth flow controls request path.
- client-side vs server-side call protection: provider call is server-side.
- tier impact if relevant: none.
## Data privacy / security
Include:
- data sent to provider: admin email recipient, subject, challenge/token email
  body, no-reply/reply-to identities.
- PII risk: admin email address and security challenge/token.
- location data risk: none intended.
- payment data risk: none.
- logging restrictions: never log API key, token, or full challenge email body.
- what must never be logged: API key, bearer header, admin token/challenge.
- whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/lib/admin/admin-email.ts` | `sendAdminEmail` | POST `/emails`. | `RESEND_API_KEY`, `NO_REPLY_EMAIL` | Server-only admin email delivery. |
| `src/lib/admin/admin-email.ts` | `buildChallengeEmail`, `buildTokenEmail` | Email content generation. | none | Do not log token content. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for email content without leaking secrets in logs.
- mock response tests: needed for success/non-2xx/network failure.
- schema validation tests: needed for request payload shape.
- error fallback tests: needed for missing key.
- env var missing tests: needed for unavailable state.
- provider contract drift tests: needed for field names and auth header.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in docs read for this task.
- legacy API: none confirmed.
- SDK major version risk: none; REST direct.
- pricing/quota changes: Resend send limits.
- response field dependency: none; app only checks `response.ok`.
- undocumented assumptions: `reply_to` field should be rechecked if Resend API
  field naming changes.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
