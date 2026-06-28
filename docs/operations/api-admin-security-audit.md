# LoadIQ API, Admin, Security, and Exposure Audit

Audit date: June 25, 2026

Branch: `docs/loadiq-api-admin-security-audit`

Baseline: consolidated LoadIQ documentation and validated app-platform branch
history.

This is a static repository audit. It does not approve deployment, provider
activation, pricing changes, Supabase migration application, billing behavior,
admin access, public claims, or remote service mutation. No application code,
API route, billing logic, Stripe code, Supabase migration, `.env.local`,
`.env.example`, package file, iOS/Android file, Capacitor config, or generated
file was changed for this audit.

## Scope

The audit inspected API routes, admin control-plane code, Supabase client and
service-role usage, Stripe billing routes, diagnostics, analytics, Sentry,
PostHog, Resend email, Redis scaffolding, OpenAI/Atlas routes, EIA fuel,
weather, preview/debug surfaces, public/support intake surfaces, environment
contracts, product governance, and prior Supabase/billing reconciliation docs.

Confidence level: medium-high for static repository exposure findings. This
audit did not run the app, query production data, inspect `.env.local`, call
external APIs, run Stripe or Supabase commands, or verify live provider
dashboards.

## API Route Inventory

The repository currently contains 29 `src/app/api` route files:

- `src/app/api/account/deletion-request/route.ts`
- `src/app/api/admin/audit-events/route.ts`
- `src/app/api/admin/diagnostic-events/route.ts`
- `src/app/api/admin/elevated/challenge/route.ts`
- `src/app/api/admin/elevated/revoke/route.ts`
- `src/app/api/admin/elevated/status/route.ts`
- `src/app/api/admin/elevated/verify-challenge/route.ts`
- `src/app/api/admin/elevated/verify-token/route.ts`
- `src/app/api/admin/identity/route.ts`
- `src/app/api/admin/notification-publications/route.ts`
- `src/app/api/admin/notification-templates/route.ts`
- `src/app/api/admin/passwordless/start/route.ts`
- `src/app/api/admin/publication-audiences/route.ts`
- `src/app/api/ai/load-analysis/route.ts`
- `src/app/api/ai/report-output/route.ts`
- `src/app/api/ai/status/route.ts`
- `src/app/api/analytics/events/route.ts`
- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/entitlements/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/app/api/diagnostics/events/route.ts`
- `src/app/api/fuel/diesel/route.ts`
- `src/app/api/fuel/eia/route.ts`
- `src/app/api/fuel/national-diesel-average/route.ts`
- `src/app/api/internal/billing-test-harness/route.ts`
- `src/app/api/preview/exit/route.ts`
- `src/app/api/preview/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/weather/profitability/route.ts`

Adjacent protected or sensitive page surfaces inspected:

- Admin pages under `src/app/admin/`
- Auth pages and callback route under `src/app/auth/`
- Protected dashboard routes under `src/app/(dashboard)/dashboard/`
- Primitive portal routes under `src/app/portal/`
- Preview and demo surfaces under `src/app/preview/` and
  `src/app/demo/walkthrough/`
- `proxy.ts` route protection for `/dashboard` and `/portal`

## Admin and Elevated Access Findings

Repository evidence:

- `src/lib/admin/api.ts` centralizes admin API authorization through
  `withAdminApi()`.
- `src/lib/admin/roles.ts` requires an authenticated Supabase user and an active
  `user_roles` row with scoped role authority.
- Sensitive admin APIs and pages require elevated admin state through
  `src/lib/admin/elevated-auth.ts`.
- Elevated admin uses short-lived challenge/token/session flows, hashed
  challenge/token/session values, HTTP-only cookies, IP/user-agent fingerprint
  metadata, and audit events.
- Admin audit, diagnostic, identity, notification publication/template, and
  audience routes are role-gated and elevated.
- `src/app/admin/posthog/page.tsx` requires admin/developer/owner access plus
  elevated status.
- `src/app/admin/sentry-test/page.tsx` is development-only by `NODE_ENV` and
  still requires admin/developer/owner plus elevated status.

Static audit result:

- No unauthenticated admin data endpoint was found.
- The most sensitive admin pages and APIs require both role authorization and
  elevated verification.
- Admin diagnostic output is reduced to severity/source/route/message/digest
  style fields and does not return raw user payloads in the inspected route.

Residual risks:

- `ELEVATED_ADMIN_EMAIL` is hardcoded in `src/lib/admin/elevated-auth.ts`.
  That is not a secret, but it couples privileged identity to source code.
- `src/app/api/admin/passwordless/start/route.ts` is intentionally public at
  the HTTP route boundary, returns generic responses, and eligibility-gates OTP
  delivery to the canonical elevated admin identity. It has no explicit
  durable IP/email rate limiter in route code.
- Elevated challenge requests have active-challenge throttling, but no shared
  infrastructure-backed rate limit.

## Supabase Service-Role Findings

Repository evidence:

- `src/lib/supabase-admin.ts` creates the server-only Supabase service-role
  client from `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Service-role paths are used by admin role checks, admin audit events,
  diagnostics writes, account deletion request writes, billing subscription
  writes, fuel cache writes, AI governance/cache/usage writes, and internal
  billing harness writes.
- Browser Supabase clients use anon/publishable keys through
  `src/lib/supabase-client.ts` and `src/lib/supabase-env.ts`.
- `proxy.ts` uses Supabase SSR auth and protects `/dashboard` and `/portal`
  from unauthenticated access.

Static audit result:

- No client-side service-role key exposure was found in inspected code.
- Service-role access appears server-only.
- The service-role blast radius is broad because several operational domains
  depend on it.

Residual risks:

- Live Supabase reconciliation remains a deployment blocker from the prior
  reconciliation plan. Portal tables, fuel gauge fields, Atlas/vehicle fields,
  AI token add-on structures, and some AI budget fields were documented as
  absent remotely.
- Service-role grants for later-created portal tables must be verified after
  schema reconciliation.
- `supabase db push` remains blocked until the forward-only reconciliation path
  is reviewed and applied intentionally.

## Stripe and Billing Exposure Findings

Repository evidence:

- `src/app/api/billing/checkout/route.ts` requires an authenticated user,
  validates a known checkout plan, checks operator-program eligibility for
  program-gated plans, rejects placeholder price IDs, creates/reuses a Stripe
  customer, and creates a subscription checkout session.
- `src/app/api/billing/portal/route.ts` requires an authenticated user and an
  existing Stripe customer before creating a billing portal session.
- `src/app/api/stripe/webhook/route.ts` requires `STRIPE_WEBHOOK_SECRET` and a
  Stripe signature before processing webhook events.
- `src/app/api/billing/entitlements/route.ts` returns no-access state for
  unauthenticated callers and full entitlement state for authenticated users.
- `src/app/api/internal/billing-test-harness/route.ts` requires an authenticated
  user and delegates eligibility to the internal billing harness.

Static audit result:

- Checkout and portal routes are not public unauthenticated purchase/admin
  endpoints.
- Stripe webhook signature verification is present.
- Placeholder Stripe price IDs are blocked before checkout starts.

Residual risks:

- Checkout and portal routes have no explicit per-user/IP rate limiter in route
  code.
- Webhook processing returns raw processing error messages for some internal
  failures. The errors are not secrets by design, but the response should be
  reviewed before production.
- Billing vocabulary remains unresolved. Gold is the clearest active
  Stripe-backed standard paid path; Silver is current in governance and modeled
  in code, but no active Silver Stripe checkout plan was found. Platinum and
  Pro remain reserved/undefined in governance while code contains concrete
  scaffolding in pricing displays, plan limits, feature access, entitlement
  resolution, AI/Atlas/fuel gates, and internal harness states.
- Follow-up fix branch `fix/loadiq-developer-entitlement-override` removed the
  hardcoded developer Pro/fleet/full-access override from
  `src/domains/billing/server-entitlements.ts`.
- The internal billing test harness remains capable of simulated entitlement
  states, but `fix/loadiq-developer-entitlement-override` restricts it to
  non-production environments with explicit harness enablement.

## Sentry Findings

Repository evidence:

- `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, and
  `src/instrumentation-client.ts` configure Sentry with `sendDefaultPii: false`.
- Client replay uses `maskAllText`, `maskAllInputs`, and `blockAllMedia`.
- `src/lib/sentry-config.ts` scrubs sensitive keys, emails, auth headers,
  cookies, operational address/cost/load/billing/payment fields, and URL query
  strings.
- `src/app/admin/sentry-test/page.tsx` is development-only and elevated-admin
  gated.

Static audit result:

- Sentry is treated as internal observability, not a customer-facing plan
  benefit.
- Sensitive-data scrubbing is present in code.

Residual risks:

- Sentry replay and trace sample rates still require explicit privacy and
  release review before production enablement.
- Source-map upload credentials such as `SENTRY_AUTH_TOKEN` must remain
  server/deployment-only and must not be exposed in public variables.

## PostHog Findings

Repository evidence:

- `src/lib/analytics.ts` allowlists analytics event names and property keys.
- Protected analytics data types are explicitly listed and excluded from normal
  analytics properties.
- `src/app/api/analytics/events/route.ts` accepts approved event names, resolves
  an authenticated user ID when available, falls back to a bounded anonymous ID,
  sanitizes properties, and captures through server analytics.
- `src/lib/analytics-server.ts` only captures when PostHog is enabled and a
  project token is configured.
- `src/app/admin/posthog/page.tsx` states PostHog is internal and not a
  customer-facing LoadIQ feature.

Static audit result:

- PostHog is not modeled as a paid plan benefit in inspected code/docs.
- Event and property allowlists reduce protected-data exposure.

Residual risks:

- `/api/analytics/events` has no explicit route-level rate limit or trusted
  origin check.
- Public `NEXT_PUBLIC_POSTHOG_*` enablement/token variables should remain
  limited to browser-safe PostHog project tokens and must not be confused with
  private provider credentials.
- Autocapture or session replay should remain off unless separately approved by
  privacy/product review.

## Resend and Email Findings

Repository evidence:

- `src/lib/admin/admin-email.ts` is server-only and sends elevated admin
  challenge/token emails through Resend using `RESEND_API_KEY`.
- Resend challenge/token emails are sent only to `ELEVATED_ADMIN_EMAIL`.
- Admin passwordless start uses Supabase OTP and generic responses, not a
  general public Resend email endpoint.

Static audit result:

- No broad public Resend send endpoint was found.
- Email provider secrets remain server-only in inspected code.

Residual risks:

- Admin passwordless and elevated challenge flows should use durable
  infrastructure-backed rate limiting before production exposure.
- Challenge/token values are intentionally emailed. TTLs are short, but this
  remains a sensitive control-plane channel.

## Redis / Upstash Findings

Repository evidence:

- `src/lib/redis.ts` provides a server-only Upstash Redis wrapper using
  `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- Search evidence only found references to that wrapper; it is not currently
  used by API rate limiting, provider caching, diagnostics, billing, AI, or
  admin flows.

Static audit result:

- Redis credentials are server-only in code.
- Redis is scaffolded/limited, not an active shared control plane.

Residual risks:

- Several routes need durable rate limiting or cache policy. Redis is the
  likely implementation point, but no such policy is currently wired.

## Public Intake and Support Surface Findings

Repository evidence:

- Prior live Supabase reconciliation docs record anonymous insert access on
  public intake tables: `contact_inquiries`, `newsletter_subscribers`,
  `rollout_waitlist`, `support_intake`, and `website_reservations`.
- Current app support ticket and feedback services use the browser Supabase
  client and require an authenticated user before inserting.
- Account deletion requests use a server route, require authentication, require
  explicit acknowledgement and `DELETE` confirmation, and write via
  service-role.
- `src/app/api/diagnostics/events/route.ts` is public in route shape but has
  trusted-origin checks, body-size limits, in-memory IP/session rate windows,
  digest dedupe, sanitization, and redaction.
- `src/app/api/analytics/events/route.ts` is public in route shape and lacks
  explicit route-level rate limiting.

Static audit result:

- App support, feedback, and account deletion flows are authenticated in
  inspected code.
- Diagnostic ingestion has meaningful abuse controls for a static route-level
  implementation.

Residual risks:

- Public intake tables documented in Supabase remain spam/abuse surfaces unless
  server-side validation, duplicate handling, rate limiting, and monitoring are
  verified for the active public website/app entry points.
- In-memory diagnostics limits may not be sufficient across serverless
  instances or deploys.
- Analytics ingestion should get a durable rate limit or origin policy before
  broader public use.

## AI / Atlas Findings

Repository evidence:

- AI routes require `ENABLE_LOADIQ_AI_DEV === "true"`, authenticated users, and
  server-side OpenAI/Supabase governance.
- `src/app/api/ai/load-analysis/route.ts` validates payload shape, enforces AI
  system flags, budget guards, throttle gates, cache identity, model allowlists,
  strict JSON schema output, and safe error messages.
- AI prompts include explicit boundaries against guarantees, dispatch authority,
  routing authority, compliance authority, legal/tax/financial advice, safety
  certification, permit approval, hazmat routing approval, and securement
  sufficiency.
- AI request cache metadata states raw user notes are not stored; cache hashing
  excludes notes.
- `src/app/api/ai/report-output/route.ts` writes output reports through
  service-role and stores the authenticated user email in metadata.

Static audit result:

- AI/Atlas is correctly treated as intelligence architecture, not a subscription
  tier.
- The route has stronger validation and safety boundaries than most provider
  routes.

Residual risks:

- Live Supabase is missing AI add-on structures and budget columns documented
  in the reconciliation plan, so AI deployment remains blocked until schema is
  reconciled.
- OpenAI calls send operational calculator/equipment context to an external
  provider when enabled. Privacy, retention, customer notice, and provider
  terms must be approved before production use.
- AI output reports include user email in metadata; retention and access rules
  should be reviewed.
- AI budgets still map from billing-like tier labels. That should be
  disentangled from final commercial tier authority in a later entitlement
  branch.

## Fuel / EIA Findings

Repository evidence:

- `/api/fuel/diesel`, `/api/fuel/eia`, and
  `/api/fuel/national-diesel-average` are public GET endpoints.
- EIA API key usage is server-side in `src/services/fuel/eia-client.ts`.
- Fuel cache reads/writes use a server-side Supabase service-role client when
  configured.
- Fuel responses include cache headers and normalized informational diesel
  pricing.

Static audit result:

- No client-side EIA key exposure was found.
- Fuel remains informational and falls back to manual entry when unavailable.

Residual risks:

- Public fuel endpoints can drive provider/cache work when cache is cold or
  unavailable. There is no explicit durable route-level rate limit.
- Fuel cache writes depend on service-role access and the live Supabase schema.
- Public/legal copy must continue to avoid treating EIA fuel as guaranteed or
  authoritative for individual operations.

## Weather and Maps Findings

Repository evidence:

- `/api/weather/profitability` requires authentication and entitlement access.
- OpenWeather API key usage is server-side.
- Weather provider calls are made with latitude/longitude points and no-store
  fetches.
- The route reports `cacheStatus: "not_implemented"`.
- Base Google-backed Route Intelligence exists through server-side app routes
  for authenticated planning estimates; truck-specific routing, legal-routing,
  live navigation, and broader mapping expansion remain separate future work.

Static audit result:

- Weather profitability is not public unauthenticated access.
- Google planning estimates may be described only as base Route Intelligence,
  not truck-legal routing, live navigation, compliance authority, or advanced
  route intelligence.

Residual risks:

- Weather has no durable provider call cache or route-level rate limit.
- Latitude/longitude points are operationally sensitive. Customer notice,
  provider privacy treatment, and retention boundaries need approval before
  production enablement.
- Do not use Google Maps, weather, EIA, or future route intelligence as route
  legality, compliance, safety, permit, hazmat, bridge, clearance, or
  guaranteed-profit authority.

## Preview and Debug Surface Findings

Repository evidence:

- `/api/preview` sets an HTTP-only `loadiq_preview_mode` cookie for one hour and
  redirects to `/dashboard`.
- `/api/preview/exit` deletes the preview cookie and redirects to auth login.
- Preview mode is not secret-gated in the route code inspected.
- Demo walkthrough copy states Stripe, Apple, Google, and billing routes are not
  called.
- Development-only Sentry test tooling is hidden outside development and still
  admin/elevated gated.

Static audit result:

- Preview mode is short-lived and HTTP-only but public.
- Debug/provider test surfaces are mostly internal or development gated.

Residual risks:

- Preview should stay non-authoritative and must not grant real billing,
  entitlement, write, or provider-call authority.
- If preview mode is not intended for production, gate it explicitly before
  deploy.

## Environment Risk Findings

Repository evidence:

- `.env.example` contains placeholder-only provider variables and warns against
  real secrets.
- `docs/operations/env-contracts.md` records server-only versus public variable
  boundaries.
- `.env.local` was not inspected, printed, or copied.

Static audit result:

- No real secret values were added or inspected in this audit.
- Server-only provider variables are documented as server-only.

Residual risks:

- Hardcoded privileged emails in admin and billing code are configuration and
  governance risks even though they are not secrets.
- `NEXT_PUBLIC_ENABLE_BILLING_TEST_HARNESS` is public and should never be
  treated as authoritative access by itself.
- Runtime env verification must confirm presence/absence without printing
  values.

## Severity Table

| Severity | Finding | Evidence | Impact | Recommended next action |
| --- | --- | --- | --- | --- |
| Critical | No confirmed critical unauthenticated admin, service-role, Stripe secret, or provider-key exposure found in static audit. | Inspected admin routes, Supabase clients, Stripe routes, provider clients. | No immediate critical code disclosure identified from repository evidence alone. | Continue dynamic/security review before production. |
| High | Live Supabase schema divergence blocks safe deployment. | Prior reconciliation docs plus app references to missing portal, fuel, Atlas, and AI schema. | Routes can fail or fall back unpredictably; `supabase db push` is unsafe. | Apply reviewed forward-only reconciliation path before deployment. |
| High | Hardcoded developer entitlement override granted Pro/fleet/full access. | `src/domains/billing/server-entitlements.ts`. | Production-isolation and product-claim risk if the account exists in live auth. | Resolved on `fix/loadiq-developer-entitlement-override` by removing the override path. |
| High | Billing harness can synthesize tier/rollout/pro/fleet states through service-role. | `src/domains/billing/internal-test-harness.ts`, internal API route, explicit non-production harness flag. | Misconfiguration could blur subscription records and internal simulation if future gates are weakened. | Keep production blocked, add audit logs, and consider a non-public server-only control. |
| High | Platinum/Pro/Atlas/billing vocabulary conflict remains unresolved. | Billing reconciliation docs and entitlement code. | Runtime gates can imply unapproved paid capabilities or public claims. | Keep billing/tier entitlement reconciliation as a prerequisite to billing expansion. |
| Medium | Admin passwordless start lacks durable route-level rate limiting. | `src/app/api/admin/passwordless/start/route.ts`. | OTP/audit/log abuse risk against canonical admin flow. | Add Redis or provider-backed rate limiting and abuse monitoring. |
| Medium | Checkout and billing portal lack explicit rate limiting. | Billing API routes. | Stripe/session creation abuse risk for authenticated accounts. | Add per-user/IP rate limits before production launch. |
| Medium | Analytics ingestion lacks route-level rate limiting/origin checks. | `src/app/api/analytics/events/route.ts`. | Event volume/noise/abuse risk despite event/property allowlists. | Add durable rate limits and origin policy. |
| Medium | Public fuel routes lack durable rate limiting. | Fuel API routes and EIA service. | Provider quota/cost/cache churn risk. | Add cache/rate-limit policy and monitor provider failures. |
| Medium | Weather/AI provider routes send operational data to external providers when enabled. | Weather and AI routes. | Privacy, retention, provider-contract, and customer-notice risk. | Complete provider privacy and legal review before production enablement. |
| Medium | Public intake tables remain anonymous insert surfaces at database level. | Supabase reconciliation docs. | Spam, bot, duplicate, and operational-noise risk. | Verify server-side validation/rate limits for active public entry points. |
| Low | Preview cookie route is public. | Preview API routes. | Could expose non-authoritative dashboard preview state if deployed. | Gate or document preview mode before production. |
| Low | Webhook processing can return internal error messages. | Stripe webhook route. | Minor information disclosure/noise risk. | Return generic errors and log details server-side. |
| Follow-up | Redis wrapper exists but is not wired to rate limits. | `src/lib/redis.ts` search evidence. | Current abuse controls are inconsistent by route. | Build shared rate-limit helpers before provider expansion. |
| Follow-up | Base Google Route Intelligence exists; expanded mapping remains future. | Route Intelligence API docs, route-intelligence API routes, provider services, `.env.example` gap. | Public claims could outrun the implemented planning-estimate scope if not controlled. | Keep truck-specific routing, live navigation, toll/traffic expansion, and broader maps provider work in separate reviewed branches. |

## Recommended Next Branches

1. `fix/loadiq-admin-billing-rate-limits`
   Add durable Redis-backed rate limits for admin passwordless, elevated
   challenge, analytics ingestion, billing checkout/portal, fuel endpoints, and
   public intake routes that remain active.

2. `fix/loadiq-developer-entitlement-override`
   Remove or server-configure the hardcoded developer Pro/fleet override and
   make any internal access auditable, revocable, and non-public. This branch
   removes the unconditional override from server entitlement resolution.

3. `fix/loadiq-billing-tier-entitlement-reconciliation`
   Resolve Silver/Gold/Platinum/Pro, rollout, Stripe, entitlement, Atlas, and
   harness conflicts before billing behavior or public pricing changes.

4. `fix/loadiq-supabase-forward-reconciliation-apply`
   Apply the reviewed forward-only Supabase reconciliation path through the
   approved runbook, not blind `supabase db push`.

5. `docs/loadiq-provider-privacy-review`
   Document OpenAI, OpenWeather, EIA, Sentry, PostHog, and future Maps data
   flows, retention, customer notices, and public/legal claim boundaries.

6. `fix/loadiq-preview-production-gate`
   Decide whether preview mode is production-allowed; if not, gate it by
   server-only env or remove public production access.

## Deployment Gate

Before main merge/deployment, do not treat the app baseline as production-ready
until these gates are closed:

- Supabase live schema reconciliation is reviewed, applied, and verified.
- Stripe billing/tier/entitlement conflicts are resolved or explicitly gated.
- Internal developer/harness entitlement paths are production-isolated.
- Durable rate limits exist for public, provider-backed, billing, analytics,
  and admin-auth endpoints.
- Provider privacy boundaries are approved for OpenAI, OpenWeather, EIA,
  Sentry, PostHog, and future Maps.
- Preview/debug surfaces are either production-gated or documented as
  non-authoritative and safe.
- Legal/public claims continue to avoid broker, carrier, dispatcher, ELD, tax,
  legal, compliance, route-authority, safety-certification, and
  guaranteed-profit assertions.
