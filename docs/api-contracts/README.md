# Karpilo LoadIQ API Contracts

API contracts are provider-alignment control documents. They are not feature
docs, product promises, implementation tickets, or runtime code. Their job is
to keep external provider usage aligned with official provider documentation
and mapped back to the LoadIQ source files that call, normalize, or display
provider data.

Feature behavior remains in `docs/features/`. Provider request/response,
authentication, error, quota, privacy, and drift controls belong here.

## Governance Rules

- Official provider documentation is required before a provider behavior is
  treated as contractually valid.
- No request or response fields may be invented from memory, wrapper-package
  examples, old app behavior, Stack Overflow, Reddit, or blog posts.
- If official documentation cannot confirm a field or behavior, mark it
  `UNVERIFIED -- requires provider-doc confirmation or removal`.
- Legacy or deprecated APIs must be marked in the contract before merge.
- App usage must be mapped to concrete source files.
- Every contract needs a drift-risk section.
- Every new external API integration must create or update a provider contract
  before merge.
- Secrets must never be printed or committed.
- Contracts are documentation and governance only; they do not implement runtime
  behavior.

## Governance Checks

Run these local checks before merging provider contract or fixture changes:

```bash
npm run api-contracts:check
npm run api-contracts:docs
npm run api-contracts:env
npm run api-contracts:fixtures
```

The checks are static repository checks. They do not call live providers and do
not require real provider credentials.

## Provider Index

| Provider | Category | Contract file | Karpilo module owner | Required env vars | Test file | Fixture directory | Last verified |
|---|---|---|---|---|---|---|---|
| Google Weather API | Weather | `weather/google-weather.contract.md` | Karpilo Weather Intelligence | `GOOGLE_WEATHER_API_KEY`, `GOOGLE_WEATHER_BASE_URL` | `tests/api-contracts/weather/google-weather.contract.test.ts` | `test-fixtures/api/weather/google-weather/` | 2026-06-28 |
| OpenWeather Current / Forecast / One Call | Weather | `weather/openweather.contract.md` | Karpilo Weather Intelligence; Weather Profitability Risk | `OPENWEATHER_API_KEY`, `OPENWEATHER_BASE_URL` | `tests/api-contracts/weather/openweather.contract.test.ts` | `test-fixtures/api/weather/openweather/` | 2026-06-28 |
| NWS / weather.gov API | Weather | `weather/nws.contract.md` | Karpilo Weather Intelligence | `NWS_USER_AGENT`, `NWS_BASE_URL` | `tests/api-contracts/weather/nws.contract.test.ts` | `test-fixtures/api/weather/nws/` | 2026-06-28 |
| Google Maps Platform | Maps | `maps/google-maps.contract.md` | Route Intelligence; future browser map surfaces | `GOOGLE_MAPS_API_KEY`; future `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` only if documented browser-safe | `tests/api-contracts/maps/google-maps.contract.test.ts` | `test-fixtures/api/maps/google-maps/` | 2026-06-28 |
| AWS Location Service | Maps | `maps/aws-location.contract.md` | Future map/geospatial fallback only | none active | `tests/api-contracts/maps/aws-location.contract.test.ts` | `test-fixtures/api/maps/aws-location/` | 2026-06-28 |
| Trimble Maps / PC*Miler | Maps | `maps/trimble-maps.contract.md` | Future truck-specific Route Intelligence | none active | `tests/api-contracts/maps/trimble-maps.contract.test.ts` | `test-fixtures/api/maps/trimble-maps/` | 2026-06-28 |
| OpenAI API | AI | `ai/openai.contract.md` | Karpilo Atlas AI | `OPENAI_API_KEY`, `LOADIQ_AI_MODEL`, `ENABLE_LOADIQ_AI_DEV`, `LOADIQ_AI_DISABLED`, `ATLAS_AI_DISABLED` | `tests/api-contracts/ai/openai.contract.test.ts` | `test-fixtures/api/ai/openai/` | 2026-06-28 |
| Stripe API | Payments | `payments/stripe.contract.md` | Billing and entitlements | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Stripe price ID vars | `tests/api-contracts/payments/stripe.contract.test.ts` | `test-fixtures/api/payments/stripe/` | 2026-06-28 |
| Resend API | Email | `email/resend.contract.md` | Admin/elevated email delivery | `RESEND_API_KEY`, `NO_REPLY_EMAIL` | `tests/api-contracts/email/resend.contract.test.ts` | `test-fixtures/api/email/resend/` | 2026-06-28 |
| PostHog API | Analytics | `analytics/posthog.contract.md` | Internal analytics | `POSTHOG_ENABLED`, `POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST` and documented public PostHog vars | `tests/api-contracts/analytics/posthog.contract.test.ts` | `test-fixtures/api/analytics/posthog/` | 2026-06-28 |
| Sentry SDK/API | Analytics | `analytics/sentry.contract.md` | Internal monitoring | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, Sentry release/env/sample vars and documented public Sentry vars | `tests/api-contracts/analytics/sentry.contract.test.ts` | `test-fixtures/api/analytics/sentry/` | 2026-06-28 |
| Supabase JavaScript clients | Database | `database/supabase.contract.md` | Auth, app data, admin data access | `NEXT_PUBLIC_SUPABASE_URL`, publishable/anon key vars, `SUPABASE_SERVICE_ROLE_KEY` | `tests/api-contracts/database/supabase.contract.test.ts` | `test-fixtures/api/database/supabase/` | 2026-06-28 |
| Upstash Redis | Database/cache | `database/redis.contract.md` | Server-side cache helpers | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | `tests/api-contracts/database/redis.contract.test.ts` | `test-fixtures/api/database/redis/` | 2026-06-28 |

Legacy flat contract files remain in this folder for continuity during the
transition to category-scoped contracts. New governance work should update the
category-scoped contract files first, then reconcile legacy flat files or remove
them in a separate cleanup branch after references are updated.

## Future Contract Requirements

Before wiring any future provider, create or update the category-scoped
provider contract, verify every request and consumed response field against
official provider documentation, add mock fixture coverage, and map the new
usage to source files. Do not treat planned provider names as active
capabilities.
