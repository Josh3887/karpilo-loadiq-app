# LoadIQ Build Readiness Roadmap

Last updated: June 25, 2026

This roadmap consolidates current LoadIQ repository readiness evidence so future
work stays ordered. It is documentation only. It does not approve deployment,
Supabase mutation, Stripe mutation, pricing changes, mobile release, provider
activation, public claims, or additional app behavior.

Current roadmap branch: `docs/loadiq-build-readiness-roadmap`

Base context: this branch was created from
`fix/loadiq-developer-entitlement-override`, so its ancestry includes one
narrow billing-security code fix. The roadmap changes themselves are docs-only.

## Completed Governance And Documentation Work

- Governance spine:
  - `AGENTS.md`
  - `docs/README.md`
  - governance, architecture, product-boundary, API, mobile, regression, and
    rollback documentation
- Release/versioning governance:
  - `docs/operations/release-versioning.md`
  - `docs/operations/release-checklist.md`
  - changelog governance
- Supabase reconciliation documentation:
  - `docs/supabase-live-alignment.md`
  - `docs/operations/supabase-reconciliation-plan.md`
  - `docs/operations/supabase-forward-reconciliation-design.md`
  - Supabase forward application runbook exists on the Supabase reconciliation
    implementation branch
- Billing, tier, rollout, and entitlement reconciliation:
  - `docs/operations/billing-entitlement-reconciliation.md`
  - `docs/product/billing-rules.md`
  - `docs/product/tier-entitlements.md`
- Environment and provider integration contracts:
  - `docs/operations/env-contracts.md`
  - provider contracts under `docs/api/`
  - `.env.example` alignment branch committed placeholder-only variable names
- API, admin, security, and exposure audit:
  - `docs/operations/api-admin-security-audit.md`
- This roadmap set:
  - `docs/operations/build-readiness-roadmap.md`
  - `docs/operations/branch-integration-map.md`
  - `docs/operations/open-risk-register.md`
- Feature state classification:
  - `docs/operations/feature-state-classification.md`
  - `docs/operations/core-flow-circuit-map.md`

## Completed Validation Work

Recent validation evidence:

- `validate/loadiq-platform-baseline` exists as the validated app-platform
  baseline branch.
- The developer entitlement override hardening pass ran:
  - `git diff --check`
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- The lint run passed with existing marketing-script warnings and no errors.
- TypeScript and build completed successfully.
- No Supabase, Stripe, provider, mobile-store, or remote mutation commands were
  run during the validation.

Do not treat those checks as deployment approval. They prove local build health
for the audited branch state only.

## Completed Security Fix

The branch `fix/loadiq-developer-entitlement-override` committed:

`3d7228c fix: harden developer entitlement override`

The fix:

- removed the hardcoded developer Pro/fleet/full-access entitlement override
  from `src/domains/billing/server-entitlements.ts`
- preserved the internal billing test harness
- restricted the internal harness to non-production environments with explicit
  harness enablement
- did not change Stripe prices, Stripe webhook behavior, Supabase migrations,
  package files, env files, API routes, or native files

Remaining billing risk after this fix: the broader Silver/Gold/Platinum/Pro,
rollout, Atlas, and entitlement conflict remains unresolved.

## Current Blockers

### Supabase

Supabase remains the primary deployment blocker.

Known live state from prior read-only reconciliation:

- remote migration history is not a simple prefix of local migrations
- current local 2026 migrations are partially absent remotely
- portal tables are absent remotely
- fuel gauge fields are absent remotely
- Atlas/vehicle fields and AI add-on structures are absent remotely
- pricing mutation migration remains separate and requires product/legal
  approval

Blocked:

- blind `supabase db push`
- production deployment that assumes current app schema exists remotely
- pricing-state replay without approval
- provider or app features that depend on absent Supabase schema

### Billing And Tier Governance

Billing remains blocked for expansion.

Known state:

- Gold is the clearest active Stripe-backed standard paid access path.
- Silver is current in governance and modeled in code, but no active Silver
  Stripe checkout plan was found.
- Platinum and Pro remain reserved/undefined in governance while code still
  contains scaffolding in plan limits, feature access, entitlement resolution,
  Atlas/AI/fuel gates, and internal harness states.
- Pilot, Legacy Launch, Launch 500, beta, founding access, and general
  availability are rollout or promotional/access concepts, not commercial
  tiers.

Blocked:

- public Platinum/Pro claims
- new Stripe price mapping
- tier capability expansion
- treating Atlas or FleetOS as a subscription tier

### API And Security

Known gaps:

- durable rate limiting is incomplete across admin auth, billing, analytics,
  fuel, public intake, and provider-backed routes
- preview mode needs an explicit production decision
- public intake surfaces need abuse controls verified against active entry
  points
- provider privacy review is incomplete for OpenAI/Atlas, weather, EIA,
  Sentry, PostHog, and future maps
- protected route smoke tests are still required before merge/deploy confidence

### Mobile Platform

Known state:

- Capacitor bridge is present.
- iOS project evidence exists.
- Android is absent/planned and must not be claimed.
- Native app-store release readiness is not established.

Blocked:

- Android support claims
- App Store or Google Play release claims without mobile validation
- native billing claims without separate review

## Safe To Build Next

Safe next work, if kept scoped:

1. Documentation integration and review of this roadmap set.
2. Review the feature state classification and core flow circuit map before
   choosing the next implementation branch.
3. Durable rate-limit implementation on a narrow branch.
4. Preview production gate decision and implementation.
5. Provider privacy/data-flow documentation.
6. Protected route smoke-test harness or checklist.
7. Supabase forward reconciliation application planning and review.
8. Billing/tier/entitlement implementation decision record before any code
   changes.

## Not Safe To Build Yet

Do not build or merge these without explicit prerequisite closure:

- blind Supabase `db push`
- production deployment against the current live Supabase project
- launch pricing mutation replay
- Stripe price/product changes
- public Silver/Gold/Platinum/Pro pricing changes
- Platinum or Pro public capability claims
- Atlas as a tier
- FleetOS inherited from LoadIQ entitlements
- Google Maps mileage/routing implementation
- AI provider expansion without privacy/governance approval
- native Android scaffolding or mobile store release work

## Recommended Next Branches

Priority order:

1. `docs/loadiq-build-readiness-roadmap`
   Commit and review this roadmap, branch map, and risk register.
2. `fix/loadiq-admin-billing-rate-limits`
   Add durable rate limits for admin passwordless/elevated flows, checkout,
   portal, analytics ingestion, fuel endpoints, and active public intake paths.
3. `fix/loadiq-preview-production-gate`
   Decide and enforce whether preview mode is allowed in production.
4. `docs/loadiq-provider-privacy-review`
   Document provider data flows, privacy boundaries, retention, and public
   notices.
5. `test/loadiq-protected-route-smoke`
   Add or document smoke coverage for dashboard, portal, admin, billing, auth,
   and API protection.
6. `fix/loadiq-supabase-forward-reconciliation-apply`
   Apply the reviewed Supabase forward reconciliation only through the approved
   runbook. Do not use blind `supabase db push`.
7. `fix/loadiq-billing-tier-entitlement-reconciliation`
   Resolve Silver/Gold/Platinum/Pro, rollout, Stripe, Atlas, and entitlement
   conflicts after product/legal/billing decisions.

## Merge Readiness Gate

Before any merge toward `main`:

- confirm the intended base branch because current `main` has been stale
  compared to the validated app-platform baseline
- confirm branch status is clean
- confirm changed paths match the branch purpose
- run `git diff --check`
- run `npm run lint`, `npx tsc --noEmit`, and `npm run build` for code-bearing
  branches
- do not merge Supabase migration branches until remote application strategy is
  approved
- do not merge billing expansion branches until tier/entitlement policy is
  approved
