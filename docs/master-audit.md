# Karpilo LoadIQ Cross-Project Master Audit

Date: 2026-05-15

Scope: local documentation-only audit across the Karpilo LoadIQ APP and WEBSITE repositories. No database schema, RLS, billing, auth, pricing, UI, route, or deployment code was changed by this audit.

## Project Identity

APP project:

- Local path: `/Users/karpilo/karpilo-loadiq`
- Repository role: authenticated product app, dashboard, calculator, user data, billing, Stripe checkout, Stripe webhook, Supabase Auth session handling
- Git remote: `https://github.com/JOSH3887/karpilo-loadiq-app.git`
- Current branch observed locally: `dev`
- Next.js version: `16.2.6`
- Primary runtime dependencies: Next.js, React, `@supabase/ssr`, `@supabase/supabase-js`, Stripe

WEBSITE project:

- Local path: `/Users/karpilo/karpilo-loadiq-website`
- Repository role: public marketing site, public contact/newsletter/waitlist/reservation intake, rollout/status endpoints, Resend email notifications
- Git remote: `https://github.com/Josh3887/karpilo-loadiq-website.git`
- Current branch observed locally: `main`
- Next.js version: `16.2.6`
- Primary runtime dependencies: Next.js, React, `@supabase/supabase-js`, Resend

Important boundary: these are separate Git repositories and separate Vercel deployments. They may share Supabase infrastructure, but they should not be merged or deployed into the wrong Vercel project.

## Vercel Mapping

Observed from local code and supplied Vercel logs:

- APP deployment should point at the app repository and should deploy the app branch intended for product releases.
- WEBSITE production custom domain `www.karpiloloadiq.com` was observed on Vercel project `karpilo-loadiq-website` with project id `prj_XNJG4uOo0nzHSb8yBVNhYdv9vRJf`.
- A second website-like Vercel project, `karpilo-loadiq-website-wrl3` with project id `prj_dWel3DogvlQhk1mRjX0yTFdvclz1`, appeared in supplied logs and should be treated as a wrong-project/deployment-drift risk until intentionally archived or documented.
- WEBSITE production logs showed branch `main`; preview logs showed branch `codex-launch-rollout-reservations`.

Vercel env values must be managed per Vercel project and per environment. Preview and Production can differ; this has already caused confusing symptoms.

## Local File Inventory

Shared project structure:

- Both repos have `package.json`, `next.config.ts`, `tsconfig.json`, `README.md`, `AGENTS.md`, `.gitignore`, `src/app`.
- Both `README.md` files are still stock create-next-app text and do not document production ownership boundaries.
- Both `.gitignore` files include `.env*`.
- `git ls-files` showed `.env.local` is not tracked in either repo.

APP key files:

- Supabase clients: `src/lib/supabase-env.ts`, `src/lib/supabase-client.ts`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`
- Auth/session boundary: `proxy.ts`, `src/app/auth/*`, dashboard layout and server routes
- Stripe/billing: `src/lib/stripe-server.ts`, `src/config/stripe.ts`, `src/domains/billing/*`, `src/app/api/billing/checkout/route.ts`, `src/app/api/billing/portal/route.ts`, `src/app/api/stripe/webhook/route.ts`
- Schema/migrations: `src/database/*`, `supabase/schema-loadiq-current.sql`, `supabase/schema/loadiq_schema.sql`, `supabase/migrations/*`, `supabase/sql-editor-updates/*`

WEBSITE key files:

- Supabase clients: `src/lib/supabase.ts`, `src/lib/supabase-server.ts`
- Resend/email audit: `src/lib/email-audit.ts`
- Public APIs: `src/app/api/contact/route.ts`, `src/app/api/newsletter/route.ts`, `src/app/api/waitlist/route.ts`, `src/app/api/rollout-state/route.ts`, `src/app/api/system-health/route.ts`
- Website SQL drafts/docs: `docs/rollout-architecture-schema.sql`, `docs/website-reservation-health-schema.sql`, `docs/pilot-payment-gating-supabase.sql`, `docs/package-c-rollout-countdown-update.sql`, `docs/pilot-launch-pricing-architecture.md`

## Route Ownership

APP API routes:

- `/api/billing/checkout`
- `/api/billing/portal`
- `/api/fuel/diesel`
- `/api/fuel/eia`
- `/api/stripe/webhook`

WEBSITE API routes:

- `/api/contact`
- `/api/newsletter`
- `/api/rollout-state`
- `/api/system-health`
- `/api/waitlist`

Route collision risk is low while deployments/domains remain separated. Risk becomes high if one Vercel project is pointed at the wrong repository or if rewrites/proxies blend app and website APIs without a deliberate routing map.

## Environment Variables

Only variable names are listed. No secret values were printed or copied.

APP code references:

- `EIA_API_KEY`
- `EIA_BASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SHOW_APP_COUNTDOWN`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `STRIPE_PRICE_ANNUAL`
- `STRIPE_PRICE_LAUNCH500_ANNUAL`
- `STRIPE_PRICE_LAUNCH500_MONTHLY`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_PILOT`
- `STRIPE_PRICE_PILOT_ANNUAL`
- `STRIPE_PRICE_PILOT_MONTHLY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

APP local `.env.local` contains:

- `EIA_BASE_URL`
- `EIA_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `LOADIQ_NOTIFY_EMAIL`
- `EMAIL_FROM`
- `EMAIL_UPDATES`
- `EMAIL_NEWSLETTER`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_ANNUAL`
- `STRIPE_PRICE_PILOT`
- `NEXT_PUBLIC_APP_URL`

APP env gaps or drift:

- Code references `NEXT_PUBLIC_SHOW_APP_COUNTDOWN`, `STRIPE_PRICE_PILOT_MONTHLY`, `STRIPE_PRICE_PILOT_ANNUAL`, `STRIPE_PRICE_LAUNCH500_MONTHLY`, and `STRIPE_PRICE_LAUNCH500_ANNUAL`; they were not present in the local `.env.local` variable-name audit.
- Local APP `.env.local` includes Resend/email keys, but APP code does not currently use Resend.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists locally but was not observed in APP code references.

WEBSITE code references:

- `EMAIL_FROM`
- `EMAIL_NEWSLETTER`
- `EMAIL_UPDATES`
- `LOADIQ_NOTIFY_EMAIL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

WEBSITE local `.env.local` contains:

- `EIA_BASE_URL`
- `EIA_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `LOADIQ_NOTIFY_EMAIL`
- `EMAIL_FROM`
- `EMAIL_UPDATES`
- `EMAIL_NEWSLETTER`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_ANNUAL`
- `STRIPE_PRICE_PILOT`

WEBSITE env gaps or drift:

- WEBSITE local env includes EIA and Stripe keys that WEBSITE code does not currently reference. Do not copy these into WEBSITE Vercel unless a future, reviewed change needs them.
- WEBSITE Vercel `NEXT_PUBLIC_SUPABASE_URL` must be the Supabase project origin, shaped like `https://<project-ref>.supabase.co`. It must not include `/rest/v1/`, quotes, or a `KEY=` prefix.
- WEBSITE needs `SUPABASE_SERVICE_ROLE_KEY` only in server-side Vercel environment variables. It must never be exposed as `NEXT_PUBLIC_`.

## Supabase Mapping

APP Supabase ownership:

- Owns Supabase Auth assumptions, user session handling, dashboard user data, app tables, billing/subscription tables, legal acknowledgments, saved loads, truck/profile/settings records, fuel cache, and Stripe reconciliation records.
- Uses browser client, server cookie client, and service-role admin/server clients.

WEBSITE Supabase ownership:

- Owns public intake and operational-status data: contact, newsletter, website reservations, rollout waitlist, rollout phases, system health/status, email audit outbox/events.
- Uses a lazy server service-role client for API routes and a public client utility that is not currently a primary runtime import.

Supabase table references observed in APP code:

- `account_deletion_requests`
- `active_system_health_notices`
- `app_policy_acceptances`
- `disclaimer_acceptance_events`
- `disclaimer_acceptances`
- `driver_safety_acknowledgments`
- `entity_notes`
- `feedback`
- `founder_pricing_access`
- `fuel_price_cache`
- `lane_templates`
- `legal_documents`
- `onboarding_events`
- `onboarding_feedback_events`
- `onboarding_states`
- `operator_pricing_locks`
- `operator_program_status`
- `pay_structure_templates`
- `pilot_access`
- `post_trip_actuals`
- `pricing_lock_status`
- `reservation_codes`
- `review_prompt_tracking`
- `rollout_phase_assignments`
- `saved_loads`
- `subscriptions`
- `support_tickets`
- `truck_profiles`
- `usage_events`
- `user_experience_state`
- `user_legal_acknowledgments`
- `user_overhead_items`
- `user_settings`
- `users`
- `welcome_message_views`
- RPC: `get_operator_program_counts`

Supabase table references observed in WEBSITE code:

- `active_system_health_notices`
- `contact_inquiries`
- `email_delivery_events`
- `email_outbox`
- `newsletter_subscribers`
- `pricing_entitlements`
- `reservation_events`
- `rollout_access_events`
- `rollout_phases`
- `rollout_waitlist`
- `support_intake`
- `system_health_events`
- `system_health_notices`
- `waitlist`
- `website_reservations`
- RPCs: `submit_rollout_waitlist`, `submit_website_reservation`

Shared exact table reference:

- `active_system_health_notices`

Potential same-name or semantic conflicts:

- `system_health_notices` and `active_system_health_notices`: app and website health/status logic do not clearly share one documented canonical schema.
- Reservation and pricing-lock systems: APP uses `reservation_codes`, `operator_pricing_locks`, `pricing_lock_status`, `pilot_access`, and `founder_pricing_access`; WEBSITE uses `website_reservations`, `reservation_events`, `pricing_entitlements`, `rollout_waitlist`, and legacy `waitlist`.
- Launch/rollout concepts: WEBSITE docs include multiple SQL designs for rollout and pilot payment gating. These should not be applied together without reconciliation.
- User identity: APP owns authenticated `users`/profile/session behavior. WEBSITE is email-first public intake and must not create or mutate APP user profile rows without an explicit conversion workflow.

## Stripe Mapping

APP:

- Has the Stripe runtime dependency.
- Owns checkout session creation.
- Owns Stripe billing portal route.
- Owns Stripe webhook route.
- Owns subscription reconciliation into Supabase tables.
- Reads Stripe price env vars from server-side environment.

WEBSITE:

- Does not have a Stripe dependency or Stripe API routes.
- Contains marketing/legal/pricing copy and SQL drafts that mention Stripe as an eventual provider or billing channel.
- Should not create checkout sessions, handle webhooks, or write subscription records.

Billing duplication risk: high if WEBSITE SQL drafts or future routes start creating paid entitlements that overlap APP `subscriptions`, `operator_pricing_locks`, or Stripe webhook state.

## Resend Mapping

APP:

- No active Resend runtime dependency observed in `package.json`.
- Local env contains some Resend/email variables, but APP code does not currently reference Resend.

WEBSITE:

- Owns Resend email notifications and audit logging.
- Uses `RESEND_API_KEY`, `LOADIQ_NOTIFY_EMAIL`, `EMAIL_FROM`, `EMAIL_UPDATES`, and `EMAIL_NEWSLETTER`.
- Logs to `email_outbox` and `email_delivery_events`.

Recommended boundary: keep public contact/newsletter/reservation email notifications in WEBSITE unless APP intentionally introduces its own audited email subsystem.

## Conflict And Risk Register

Shared systems:

- Supabase project and public/server keys
- Public legal/pricing language
- Pilot/reservation concepts
- Operator pricing-lock concepts
- Production brand/domain assumptions

Duplicate or overlapping systems:

- Public legal pages exist in both repos.
- Pricing copy exists in both repos.
- Status/system-health concepts exist in both repos.
- Reservation/pricing-lock concepts exist in both repos, but with different table names and authority assumptions.

Supabase risks:

- Public schemas must have RLS enabled and policies matched to the actual access model.
- WEBSITE public forms use server-side service-role writes; this is acceptable only with strict validation, spam/rate controls, and limited write surfaces.
- SQL files in WEBSITE `docs/` are drafts and include overlapping concepts. Do not run them blindly.
- New public tables may need both RLS policies and explicit grants for the roles that use the Data API.

Auth ownership risks:

- APP owns Supabase Auth, authenticated dashboard sessions, profiles, and subscriptions.
- WEBSITE owns unauthenticated lead/reservation intake by email.
- Email address alone must not be treated as proof of APP user identity.
- Converting a WEBSITE reservation to an APP account needs a reviewed linking flow.

Pricing and billing risks:

- APP Stripe state should remain authoritative for paid subscription access.
- WEBSITE `pricing_entitlements` may be useful as pre-billing reservation intent, but it must not become a second billing system.
- Pricing lock records need one canonical bridge between website reservation intent and app subscription enforcement.

Vercel risks:

- Duplicate website Vercel projects can make the wrong deployment look current.
- Production and Preview env vars can diverge.
- `NEXT_PUBLIC_SUPABASE_URL` malformed values cause runtime failures even when the key name exists.
- Branch mismatch risk exists because APP was observed on `dev` and WEBSITE on `main`.

Security risks:

- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only.
- No secret values should be committed or pasted into docs.
- `.env.local` is ignored and untracked in both repos, which is correct.
- Logs can expose implementation details; avoid logging secret values or raw payloads with tokens.

## Recommended Architecture Boundaries

APP should own:

- Supabase Auth and user identity
- User profiles/settings/truck data
- Dashboard and calculation data
- Saved loads and usage limits
- Stripe checkout, billing portal, webhook handling
- Subscription state and paid entitlements
- Authenticated support/account deletion records

WEBSITE should own:

- Public marketing pages
- Contact forms
- Newsletter signup
- Waitlist and reservation intake
- Public rollout/status display
- Resend notification/audit for public intake

Shared Supabase project rules:

- WEBSITE may write public intake/reservation tables.
- APP may read reservation/entitlement intent only through a documented conversion or reconciliation flow.
- APP subscription tables should not be written by WEBSITE.
- WEBSITE should not depend on APP-only Stripe or auth env vars.

## Deployment Readiness

APP readiness:

- Stronger schema/migration history than WEBSITE.
- Billing and auth ownership are clearly in APP code.
- Local env needs cleanup or documentation for missing optional/new Stripe price keys before full launch testing.

WEBSITE readiness:

- Public routes and API routes are clearly separated from APP.
- Supabase server client was previously stabilized to avoid import-time Vercel crashes.
- Current production failures from supplied logs point to malformed Vercel Supabase URL configuration, not missing code.
- Reservation/newsletter/contact flows rely on Supabase tables/RPCs being present and compatible.

## Recommended Next Actions

1. Confirm the canonical Vercel project for WEBSITE is `karpilo-loadiq-website` with the production domain.
2. Remove or archive the duplicate website Vercel project only after confirming it has no active domains or needed preview workflows.
3. Tighten Vercel envs per project:
   - APP gets Supabase, Stripe, EIA, and app URL vars.
   - WEBSITE gets Supabase and Resend/email vars only.
4. Keep `NEXT_PUBLIC_SUPABASE_URL` as the Supabase project origin only.
5. Create a separate reconciliation design for WEBSITE reservations to APP user/subscription records before any SQL merge.
6. Do not run WEBSITE SQL drafts until same-name and semantic conflicts are reconciled.
7. Add repo-specific production notes to replace the stock create-next-app README text.

## Safe Validation Commands

Run from each repo:

```bash
git status --short --branch
npm run lint
npm run build
```

There is no `typecheck` script in either `package.json` at the time of this audit.

## Git Safety

Commit documentation separately per repository only after validation:

APP:

```bash
git add docs/master-audit.md
git commit -m "docs: add cross-project audit"
git push origin HEAD
```

WEBSITE:

```bash
git add docs/master-audit.md
git commit -m "docs: add cross-project audit"
git push origin HEAD
```

Do not use broad `git add .` for this audit.

