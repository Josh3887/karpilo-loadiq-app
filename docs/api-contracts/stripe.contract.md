# Provider Contract: Stripe API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://docs.stripe.com/api
- API reference: https://docs.stripe.com/api/checkout/sessions/create and https://docs.stripe.com/api/customer_portal/sessions/create
- SDK docs: https://docs.stripe.com/sdks
- Pricing/quota/rate-limit docs, if available: Stripe account/API limits and billing terms apply.
- Error-handling docs, if available: https://docs.stripe.com/api/errors
## Karpilo LoadIQ usage boundary
LoadIQ uses Stripe for subscription checkout, customer portal, customer
records, subscription synchronization, and webhook events. Stripe is not used
for dispatch authority, guaranteed profitability, tax/accounting advice,
settlement authority, broker/load-board behavior, or route/fuel/weather
intelligence.
## Authentication
- Auth method required by provider docs: Stripe secret key for server API calls;
  webhook endpoint secret for signature verification.
- Env var names used in app: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_PILOT`,
  `STRIPE_PRICE_PILOT_MONTHLY`, `STRIPE_PRICE_PILOT_ANNUAL`,
  `STRIPE_PRICE_LAUNCH500_MONTHLY`, `STRIPE_PRICE_LAUNCH500_ANNUAL`.
- Server-only or client-safe: server-only.
- Secret exposure risk: do not expose Stripe secret or webhook secret through
  `NEXT_PUBLIC_`.
- Required headers: Stripe SDK handles API authorization; webhook uses
  `stripe-signature`.
- Key restrictions recommended: use test/live keys in correct environment only.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `stripe` npm package.
- Endpoint path or SDK method: `checkout.sessions.create`,
  `billingPortal.sessions.create`, `customers.create`,
  `subscriptions.list`, `subscriptions.retrieve`,
  `webhooks.constructEvent`.
- HTTP method: SDK-managed.
- Required headers: SDK-managed; webhook signature header is required.
- Content type: SDK-managed JSON; webhook verifies raw text payload.
- API version if applicable: Stripe SDK/account API version.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `mode` | yes | string | Checkout mode. | `src/app/api/billing/checkout/route.ts` | Hardcoded to `subscription`. | Subscription checkout only. |
| `customer` | yes | string | Stripe customer ID. | checkout route | Existing or newly created customer. | User mapped in Supabase. |
| `client_reference_id` | no | string | Reference ID for reconciliation. | checkout route | User ID. | Sensitive identifier. |
| `line_items[].price` / `quantity` | yes | string/number | Price and quantity. | checkout route | Price ID must exist and not be placeholder. | Price env names only in docs. |
| `metadata` / `subscription_data.metadata` | no | object | Stripe metadata. | checkout route | App stores user/plan/tier/program/trial context. | Do not store secrets. |
| `allow_promotion_codes` | no | boolean | Enables promotion codes. | checkout route | Hardcoded `true`. | Billing behavior; do not change here. |
| `success_url` / `cancel_url` | yes | string | Redirect URLs. | checkout route | Derived from app URL. | No secrets. |
| `return_url` | yes | string | Portal return URL. | `src/app/api/billing/portal/route.ts` | Derived from app URL. | Portal route. |
| raw webhook payload + `stripe-signature` | yes | string | Signature verification input. | `src/app/api/stripe/webhook/route.ts` | Must verify with webhook secret before processing. | Never parse before verification. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `Checkout.Session.url` | string/null | Hosted Checkout URL. | yes | checkout route | Returns JSON `{ url }`; upstream errors fail route. |
| `Customer.id` | string | Stripe customer ID. | yes | checkout route | Stored via `rememberStripeCustomer`. |
| `Subscription.trial_start/trial_end/status` | mixed | Trial and subscription state. | yes | `resolveTrialEligibility`, webhook route | Trial blocked if history unavailable. |
| `Webhook Event.type` | string | Event name. | yes | webhook route | Unknown events ignored. |
| `checkout.session.completed` object fields | mixed | Completed checkout session. | yes | webhook route | Stores customer/subscription when IDs exist. |
| `customer.subscription.*` object | object | Subscription event object. | yes | webhook route | Upserts subscription. |
| `invoice.payment_failed` object | object | Payment failure event object. | yes | webhook route | Marks payment failed when IDs resolve. |
## Error contract
Include:
- documented provider error shape: Stripe SDK errors may be thrown by API calls.
- HTTP status codes used by provider: SDK-managed; route returns safe 4xx/5xx.
- auth failures: missing secret key throws server configuration error.
- validation failures: unknown plan or placeholder price ID blocks checkout.
- quota/rate-limit failures: SDK error; no custom retry/backoff.
- timeout/network failure behavior: SDK error; route fails safely.
- app fallback behavior: checkout/portal/webhook routes return error status.
- user-safe error message: route messages avoid secret values.
- internal logging behavior: no Stripe secrets or card/payment details logged.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: Stripe account/API limits apply.
- cache strategy: customer/subscription state synchronized into Supabase.
- retry/backoff strategy: none in route handlers.
- abuse prevention: checkout and portal require authenticated LoadIQ user.
- client-side vs server-side call protection: Stripe secret calls are server-side.
- tier impact if relevant: billing tiers are resolved by app entitlement logic,
  not by client-only Stripe state.
## Data privacy / security
Include:
- data sent to provider: email, customer ID, user ID metadata, plan/tier/program
  metadata, checkout/portal URLs.
- PII risk: user email and billing identifiers.
- location data risk: none intended.
- payment data risk: Stripe-hosted checkout/portal handles payment details.
- logging restrictions: do not log secrets, full event payloads, or payment data.
- what must never be logged: Stripe secret key, webhook secret, card/payment data.
- whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/lib/stripe-server.ts` | `getStripeServerClient` | Stripe SDK init. | `STRIPE_SECRET_KEY` | Server-only. |
| `src/app/api/billing/checkout/route.ts` | `POST` | Create Checkout Session and Customer. | Stripe price env vars | Auth required. |
| `src/app/api/billing/portal/route.ts` | `POST` | Create customer portal session. | `STRIPE_SECRET_KEY` | Auth required. |
| `src/app/api/stripe/webhook/route.ts` | `POST` | Verify webhook and process events. | `STRIPE_WEBHOOK_SECRET` | Raw request body required. |
| `src/domains/billing/stripe-subscriptions.ts` | subscription helpers | Sync Stripe state to Supabase. | `STRIPE_SECRET_KEY` | Billing behavior not changed by this doc. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for trial eligibility mapping.
- mock response tests: needed for checkout/session/webhook events.
- schema validation tests: needed for webhook event objects used.
- error fallback tests: needed for missing price/secret/signature.
- env var missing tests: needed for safe server errors.
- provider contract drift tests: needed for event and SDK fields.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in docs read for this task.
- legacy API: none confirmed.
- SDK major version risk: Stripe SDK major updates.
- pricing/quota changes: account/API limits or billing model changes.
- response field dependency: session URL, subscription/customer IDs, webhook
  event object fields.
- undocumented assumptions: local entitlement mapping depends on app billing
  domain code, not Stripe alone.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
