# Environment Contracts

Last updated: June 24, 2026

This document records environment variable usage from repository evidence. It is
documentation only. It does not approve provider activation, pricing changes,
deployment, mobile release, Supabase migration application, or remote service
mutation.

Do not copy real values, tokens, service-role keys, database URLs, webhook
secrets, API keys, or private credentials into this file.

## Core Rules

- Server-only secrets must never be exposed through `NEXT_PUBLIC_` variables.
- Public variables may be readable in browser bundles and must contain only
  public display/configuration values.
- Provider integrations must use LoadIQ server routes or server-only adapters
  unless the provider is explicitly documented as browser-safe.
- Environment variables do not define product authority. Billing, rollout,
  governance state, commercial tier, entitlement, and provider configuration
  remain separate.
- `.env.local` is local-only and must not be inspected, printed, committed, or
  used as product evidence.
- `.env.example` should list variable names and safe placeholder/example values
  only.

## Public Client Variables

These variables are allowed to be public only because the current code treats
them as browser-visible configuration. Do not place secrets in them.

| Variable | Evidence | Status | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | `src/config/stripe.ts`, `.env.example` | Documented | Public app origin used for checkout return URL fallback. |
| `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/supabase-env.ts` | Missing from `.env.example` | Must be the Supabase project origin only. No `/rest/v1`, query string, quotes, or embedded key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase-env.ts` | Missing from `.env.example` | Browser-safe Supabase anon key only. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `src/lib/supabase-env.ts` | Missing from `.env.example` | Alternate/fallback publishable key. |
| `NEXT_PUBLIC_BILLING_EMAIL` | `src/config/billing.ts`, `.env.example` | Documented | Public contact email only. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `.env.example` | No current code reference found in env scan | Public display email only if used later. |
| `NEXT_PUBLIC_EXECUTIVE_EMAIL` | `.env.example` | No current code reference found in env scan | Public display email only if used later. |
| `NEXT_PUBLIC_SHOW_APP_COUNTDOWN` | `src/config/app.ts` | Missing from `.env.example` | Public UI flag; must not grant access or entitlement. |
| `NEXT_PUBLIC_ENABLE_BILLING_TEST_HARNESS` | `src/domains/billing/internal-test-harness.ts` | Missing from `.env.example` | Public flag; internal harness must remain restricted and non-authoritative. |
| `NEXT_PUBLIC_APP_ENV` | analytics and Sentry config | Missing from `.env.example` | Public environment label. Do not encode secrets or customer data. |
| `NEXT_PUBLIC_APP_VERSION` | analytics status | Missing from `.env.example` | Public version label. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry client/server/edge config, `.env.example` | Documented | DSN may be public; Sentry auth token must not be public. |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Sentry config, `.env.example` | Documented | Public numeric sampling value. |
| `NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE` | Sentry client config, `.env.example` | Documented | Public numeric sampling value. |
| `NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | Sentry client config, `.env.example` | Documented | Public numeric sampling value. |
| `NEXT_PUBLIC_SENTRY_RELEASE` | `src/lib/sentry-config.ts` | Missing from `.env.example` | Public release label fallback. |
| `NEXT_PUBLIC_POSTHOG_ENABLED` | analytics code, `.env.example` | Documented | Public analytics enablement flag; privacy/consent rules still apply. |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | analytics server fallback, `.env.example` | Documented | Public PostHog project token where client capture is intentionally enabled. |
| `NEXT_PUBLIC_POSTHOG_KEY` | analytics server fallback | Missing from `.env.example` | Alternate/fallback PostHog project token name. |
| `NEXT_PUBLIC_POSTHOG_HOST` | analytics server fallback, `.env.example` | Documented | Public PostHog host. |
| `NEXT_PUBLIC_POSTHOG_AUTOCAPTURE` | `.env.example` | No current code reference found in env scan | Must remain disabled unless privacy/consent review approves. |
| `NEXT_PUBLIC_POSTHOG_SESSION_REPLAY` | `.env.example` | No current code reference found in env scan | Must remain disabled unless privacy/consent review approves. |

## Server-Only Variables

These variables must remain server-side only. Do not add `NEXT_PUBLIC_` variants
unless a later provider-specific review explicitly proves they are safe.

| Variable | Evidence | Status | Notes |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin, fuel cache, elevated auth | Missing from `.env.example` | Server/admin only. Never client-side. |
| `STRIPE_SECRET_KEY` | `src/lib/stripe-server.ts` | Missing from `.env.example` | Server-only Stripe API key. |
| `STRIPE_WEBHOOK_SECRET` | `src/lib/stripe-server.ts`, webhook route | Missing from `.env.example` | Server-only webhook signature secret. |
| `STRIPE_PRICE_MONTHLY` | `src/config/stripe.ts` | Missing from `.env.example` | Server-side checkout price ID for Gold monthly path. |
| `STRIPE_PRICE_ANNUAL` | `src/config/stripe.ts` | Missing from `.env.example` | Server-side checkout price ID for Gold annual path. |
| `STRIPE_PRICE_PILOT` | `src/config/stripe.ts` | Missing from `.env.example` | Legacy/fallback Pilot monthly price ID. |
| `STRIPE_PRICE_PILOT_MONTHLY` | `src/config/stripe.ts` | Missing from `.env.example` | Server-side Pilot monthly price ID; program-gated. |
| `STRIPE_PRICE_PILOT_ANNUAL` | `src/config/stripe.ts` | Missing from `.env.example` | Server-side Pilot annual price ID; program-gated. |
| `STRIPE_PRICE_LAUNCH500_MONTHLY` | `src/config/stripe.ts` | Missing from `.env.example` | Server-side Launch 500 monthly price ID; program-gated. |
| `STRIPE_PRICE_LAUNCH500_ANNUAL` | `src/config/stripe.ts` | Missing from `.env.example` | Server-side Launch 500 annual price ID; program-gated. |
| `RESEND_API_KEY` | `src/lib/admin/admin-email.ts` | Missing from `.env.example` | Server-only email provider token. |
| `NO_REPLY_EMAIL` | admin email and `.env.example` | Documented | Sender address; not a secret, but should still be controlled. |
| `UPSTASH_REDIS_REST_URL` | Redis wrapper and `.env.example` | Documented | Server-side Redis endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Redis wrapper and `.env.example` | Documented | Server-only Redis token. |
| `OPENAI_API_KEY` | Atlas/OpenAI client | Missing from `.env.example` | Server-only OpenAI key. Do not create `NEXT_PUBLIC_OPENAI_API_KEY`. |
| `ENABLE_LOADIQ_AI_DEV` | Atlas route gate | Missing from `.env.example` | Server-side feature visibility gate. |
| `LOADIQ_AI_MODEL` | AI governance | Missing from `.env.example` | Server-side model override, allowlist-constrained by code. |
| `LOADIQ_AI_DISABLED` | AI governance | Missing from `.env.example` | Server-side AI kill switch. |
| `ATLAS_AI_DISABLED` | AI governance | Missing from `.env.example` | Server-side Atlas AI kill switch. |
| `EIA_API_KEY` | EIA client | Missing from `.env.example` | Server-only EIA key. |
| `EIA_BASE_URL` | EIA client | Missing from `.env.example` | Optional server-only EIA base URL override. |
| `LOADIQ_OWNER_EMAILS` | Server entitlement resolver | Missing from `.env.example` | Server-only comma/whitespace-separated owner/admin emails for build-phase unlimited app access. Do not expose values client-side. |
| `OPENWEATHER_API_KEY` | weather validation and `.env.example` | Documented | Server-only OpenWeather key. |
| `POSTHOG_ENABLED` | server analytics and `.env.example` | Documented | Server-side enablement flag. |
| `POSTHOG_PROJECT_TOKEN` | server analytics and `.env.example` | Documented | Server-side project token where server capture is enabled. |
| `POSTHOG_HOST` | server analytics and `.env.example` | Documented | Server-side PostHog host override. |
| `POSTHOG_DASHBOARD_URL` | analytics status/admin docs | Missing from `.env.example` | Optional admin status link; not required for capture. |
| `SENTRY_DSN` | Sentry server/edge config and `.env.example` | Documented | Server/edge DSN. |
| `SENTRY_ORG` | Sentry docs and `.env.example` | Documented | Deployment/source-map metadata. |
| `SENTRY_PROJECT` | Sentry docs and `.env.example` | Documented | Deployment/source-map metadata. |
| `SENTRY_AUTH_TOKEN` | Sentry docs and `.env.example` | Documented | Secret token for source-map upload; never public. |
| `SENTRY_ENVIRONMENT` | Sentry config and `.env.example` | Documented | Server environment label. |
| `SENTRY_RELEASE` | Sentry config and `.env.example` | Documented | Release label. |
| `SENTRY_TRACES_SAMPLE_RATE` | Sentry config and `.env.example` | Documented | Server numeric sampling value. |
| `APP_ENV` | analytics status | Missing from `.env.example` | Server fallback environment label. |
| `VERCEL_ENV` | diagnostics/Sentry config | Platform-provided | Do not set manually unless deployment requires it. |
| `VERCEL_GIT_COMMIT_SHA` | analytics/Sentry release fallback | Platform-provided | Do not set manually unless deployment requires it. |
| `NODE_ENV` | runtime guards | Platform/tooling-provided | Must not be used to grant product access by itself. |
| `NEXT_RUNTIME` | instrumentation loader | Platform/tooling-provided | Next.js runtime selector. |

## Contact Variables

The following are contact/display variables in `.env.example`. The current env
scan found only `NEXT_PUBLIC_BILLING_EMAIL` and `NO_REPLY_EMAIL` as direct
runtime references; other contact variables may remain placeholders for future
or adjacent surfaces.

- `SUPPORT_EMAIL`
- `BILLING_EMAIL`
- `EXECUTIVE_EMAIL`
- `NEWSLETTER_EMAIL`
- `SECURITY_EMAIL`
- `NOTIFICATIONS_EMAIL`

## Missing From `.env.example`

The following repo-referenced variables should be reviewed in a later
configuration hygiene branch before deployment documentation is treated as
complete:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_PILOT`,
  `STRIPE_PRICE_PILOT_MONTHLY`, `STRIPE_PRICE_PILOT_ANNUAL`,
  `STRIPE_PRICE_LAUNCH500_MONTHLY`, `STRIPE_PRICE_LAUNCH500_ANNUAL`
- Resend: `RESEND_API_KEY`
- OpenAI/Atlas: `OPENAI_API_KEY`, `ENABLE_LOADIQ_AI_DEV`,
  `LOADIQ_AI_MODEL`, `LOADIQ_AI_DISABLED`, `ATLAS_AI_DISABLED`
- EIA: `EIA_API_KEY`, `EIA_BASE_URL`
- Owner/admin build access: `LOADIQ_OWNER_EMAILS`
- App/runtime flags: `NEXT_PUBLIC_SHOW_APP_COUNTDOWN`,
  `NEXT_PUBLIC_ENABLE_BILLING_TEST_HARNESS`, `NEXT_PUBLIC_APP_ENV`,
  `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_SENTRY_RELEASE`, `APP_ENV`
- PostHog optional/fallbacks: `NEXT_PUBLIC_POSTHOG_KEY`,
  `POSTHOG_DASHBOARD_URL`

Do not add real values when this list is reconciled. Use variable names and safe
placeholder values only.

## Variables Present But Not Observed In Current Code Scan

These variables exist in `.env.example`, but the current env scan did not find a
direct runtime `process.env` reference:

- `SUPPORT_EMAIL`
- `BILLING_EMAIL`
- `EXECUTIVE_EMAIL`
- `NEWSLETTER_EMAIL`
- `SECURITY_EMAIL`
- `NOTIFICATIONS_EMAIL`
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_EXECUTIVE_EMAIL`
- `NEXT_PUBLIC_POSTHOG_AUTOCAPTURE`
- `NEXT_PUBLIC_POSTHOG_SESSION_REPLAY`

This does not prove they are unused in all contexts. It only records the current
scan result and should be rechecked before removing or repurposing them.

## Deployment Gate

Before production deployment:

1. Reconcile `.env.example` names with the provider docs in `docs/api/`.
2. Verify environment variable presence without printing values.
3. Confirm Supabase schema readiness and migration history before enabling
   routes that depend on missing tables or columns.
4. Confirm Stripe sandbox/live mode, webhook secrets, and price IDs without
   exposing values.
5. Confirm observability and analytics privacy settings before enabling Sentry
   replay or PostHog capture.
6. Keep `supabase db push`, Stripe mutation commands, provider console changes,
   and mobile store changes blocked until explicitly approved.
