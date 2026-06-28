# Billing, Tier, Rollout, and Entitlement Reconciliation Audit

This audit documents current LoadIQ billing and entitlement evidence. It is docs-only. No billing logic, Stripe code, Supabase migrations, app code, pricing values, `.env.local`, package files, native files, or remote services were changed.

Update note for the route/load-actuals recovery branch: server entitlement
resolution may now grant build-phase unlimited app access only to emails listed
in the server-only `LOADIQ_OWNER_EMAILS` variable. This is owner/admin build
access, not public tier policy, not a Stripe mapping, and not a global removal
of regular user gates.

## Branch and Scope

- Branch: `docs/loadiq-billing-entitlement-reconciliation`
- Baseline: `validate/loadiq-platform-baseline`
- Audit type: read-only repository audit plus documentation updates
- Remote services: not queried or mutated
- Changelog: no `CHANGELOG.md` exists on this branch, so no changelog update was made

## Files and Areas Inspected

Governance and architecture:

- `AGENTS.md`
- `docs/architecture-audits/2026-05-31-codex-architecture-audit.md`
- `docs/app-portal-access.md`
- `docs/master-audit.md`

Pricing, billing, and entitlement code:

- `src/config/pricing.ts`
- `src/config/stripe.ts`
- `src/config/billing.ts`
- `src/config/rollout.ts`
- `src/config/launch-phases.ts`
- `src/config/app-policies.ts`
- `src/domains/billing/plan-limits.ts`
- `src/domains/billing/feature-access.ts`
- `src/domains/billing/entitlement-service.ts`
- `src/domains/billing/server-entitlements.ts`
- `src/domains/billing/client-entitlements.ts`
- `src/domains/billing/subscription-launch-phases.ts`
- `src/domains/billing/operator-program.ts`
- `src/domains/billing/internal-test-harness-types.ts`
- `src/domains/billing/internal-test-harness.ts`
- `src/domains/billing/stripe-subscriptions.ts`

Routes and UI surfaces:

- `src/app/api/billing/checkout/route.ts`
- `src/app/api/billing/portal/route.ts`
- `src/app/api/billing/entitlements/route.ts`
- `src/app/api/internal/billing-test-harness/route.ts`
- `src/app/api/stripe/webhook/route.ts`
- `src/app/(dashboard)/dashboard/billing/page.tsx`
- `src/app/(dashboard)/dashboard/settings/billing/page.tsx`
- `src/app/portal/billing/page.tsx`
- `src/app/portal/page.tsx`

Legal, env, analytics, and adjacent feature gates:

- `.env.example`
- `src/content/legal/subscription-terms.ts`
- `src/content/legal/billing-disclosures.ts`
- `src/content/legal/refund-policy.ts`
- `docs/sentry-monitoring.md`
- `docs/posthog-analytics.md`
- `src/app/admin/posthog/page.tsx`
- `src/app/admin/sentry-test/page.tsx`
- `src/lib/ai/ai-governance.ts`
- `src/lib/atlas/atlas-intelligence-system.ts`
- `src/lib/fuel-gauge.ts`
- `src/services/overhead-items.ts`

Search coverage included billing, tier, plan, entitlement, rollout, launch, beta, founding, legacy, Stripe, Sentry, PostHog, Atlas, FleetOS, Silver, Gold, Platinum, and Pro terms across `src/`, `docs/`, `AGENTS.md`, `README.md`, and `.env.example`.

## Executive Findings

1. Governance language and code vocabulary are not fully aligned.
   `AGENTS.md` defines Silver and Gold as current commercial tiers and Platinum/Pro as reserved or undefined. Code contains concrete Platinum/Pro references in pricing displays, plan limits, entitlement resolution, AI/fuel/Atlas gates, and internal harness scenarios. A prior developer override was removed on `fix/loadiq-developer-entitlement-override` and should not be reintroduced as entitlement policy.

2. Active Stripe checkout evidence points to Gold, Pilot, and Launch 500, not Silver, Platinum, or Pro.
   `src/config/stripe.ts` maps legacy `pro-monthly` and `pro-annual` IDs to Gold. Pilot and Launch 500 are checkout plans gated by operator program eligibility. Platinum and Pro checkout plans were not found.

3. Pilot, Legacy Launch, Launch 500, beta, and founding access are rollout or promotional access concepts.
   Legal copy and dashboard copy state that Pilot and Legacy Launch are not commercial tier names. Code still carries some of these values inside plan-tier and entitlement paths, which is a vocabulary coupling risk.

4. Entitlement resolution is doing too much work.
   The current resolver combines billing status, subscription tier, feature access, lifetime locks, protected cohorts, FleetOS flags, usage limits, and capability gates. That increases the chance that a tier label becomes a product claim.

5. Atlas and AI access remain coupled to billing-like tier labels in places.
   `AGENTS.md` says Atlas is not a subscription tier. Code maps payment tiers into AI plan tiers and uses Platinum/Pro/Pilot/Launch values in Atlas and route/fuel feature gates. This should be treated as implementation scaffolding until an approved entitlement model separates AI governance from tier labels.

6. Sentry and PostHog are not exposed as customer plan benefits in inspected docs and app surfaces.
   Existing docs and admin pages classify them as internal monitoring and product analytics tools.

7. Stripe environment documentation is incomplete.
   `.env.example` documents Sentry, PostHog, Redis, weather, and public emails, but it does not list Stripe secret, webhook, or price environment variable names. `docs/master-audit.md` and code reference the Stripe variables.

## Concept Separation

| Concept | Current repo evidence | Reconciliation status |
| --- | --- | --- |
| Governance state | `AGENTS.md` and architecture audit define internal, pilot, legacy launch, and public governance concepts. | Must remain separate from tiers and entitlements. |
| Rollout phase | `src/config/rollout.ts`, `src/config/launch-phases.ts`, `operator-program.ts`, and legal copy model pilot/launch/general availability. | Valid rollout model, but some values also flow through entitlement paths. |
| Commercial subscription tier | `AGENTS.md` says Silver/Gold current, Platinum/Pro undefined. Code models all four in several places. | Unresolved conflict. |
| Product entitlement | `feature-access.ts`, `entitlement-service.ts`, and UI gates decide capabilities from subscription data. | Needs future capability-grant separation. |
| Stripe price/product | `src/config/stripe.ts` maps checkout IDs to Gold, Pilot, and Launch 500. | Payment rail only; not final product authority. |
| App feature gate | Atlas, fuel, weather, exports, saved loads, and fleet gates reference tier-like strings. | Works as current implementation, but needs governance cleanup before tier expansion. |
| Admin/internal harness | Harness simulates tier and rollout combinations for one authorized test account. | Useful internal scaffold, not public product state. |

## Silver, Gold, Platinum, and Pro Status

### Silver

Status from repo evidence: current in governance, modeled in code, not observed as active Stripe checkout.

Evidence:

- Current in `AGENTS.md`.
- Present in `pricing.ts`, `plan-limits.ts`, `feature-access.ts`, and internal harness states.
- Not present as a Stripe checkout tier in `src/config/stripe.ts`.
- Not selectable in `subscription-launch-phases.ts`; launch phases select Gold.

Risk: product/legal expectations may diverge from actual checkout behavior if Silver is described as current without a live payment path or explicit entitlement policy.

### Gold

Status from repo evidence: current and active standard paid access path.

Evidence:

- Current in `AGENTS.md`.
- `GOLD_ACCESS` backs Standard Public Access pricing.
- Stripe legacy `pro-*` checkout IDs map to Gold.
- Launch and open-market selectable plans are Gold.

Risk: legacy `pro-*` provider IDs can confuse audits unless documented clearly as Gold mappings.

### Platinum

Status from repo evidence: reserved/undefined from governance, but partially scaffolded in code.

Evidence:

- Reserved/undefined in `AGENTS.md`.
- `PLATINUM_ACCESS` is reserved and checkout-disabled.
- Feature and entitlement code includes Platinum gates.
- Atlas/fuel feature code recognizes Platinum.
- Harness includes Platinum alias states.
- No inspected Stripe checkout plan exists for Platinum.

Risk: concrete feature assumptions may be mistaken for approved commercial capabilities.

### Pro

Status from repo evidence: reserved/undefined from governance, FleetOS-adjacent planned scaffold in code.

Evidence:

- Reserved/undefined in `AGENTS.md`.
- `FUTURE_PRO_ACCESS` is planned, checkout-disabled, and described as a transition toward FleetOS capability.
- Legacy `pro-*` Stripe checkout IDs map to Gold.
- Feature and entitlement code includes Pro/fleet gates.
- AI governance maps payment tier `pro` into AI plan tier `pro`.
- A developer-only override grants Pro/fleet access internally.
- Harness includes Pro alias states.
- No inspected Stripe checkout plan exists for a real Pro customer tier.

Risk: Pro can imply FleetOS, multi-truck, AI, or scale capabilities before those products and entitlements are approved.

## Launch, Beta, Founding, and Legacy Access

Current classification:

- `beta_test`: non-commercial testing entitlement.
- Founding 50 Pilot: rollout and promotional access program.
- Pilot: rollout and promotional access program.
- Legacy Launch: rollout and promotional pricing/access program.
- Launch 500: rollout and promotional access program.
- Founding Operator: assigned access/cohort status.
- Open Market and General Availability: rollout state.

These may affect eligibility, price locks, slot caps, and support pacing. They must not become commercial tier names.

## Sentry and PostHog Finding

No inspected evidence showed Sentry or PostHog as customer-facing plan benefits.

Evidence:

- `docs/sentry-monitoring.md` describes Sentry as internal developer monitoring.
- `docs/posthog-analytics.md` describes PostHog as internal developer/operator analytics.
- `src/app/admin/posthog/page.tsx` says PostHog is not a client-facing LoadIQ feature and does not replace billing, entitlement, calculator, or support systems.

Risk: low, if future marketing and pricing docs preserve the internal-tool boundary.

## Atlas Finding

Atlas is correctly governed in `AGENTS.md` as a cross-product intelligence architecture, not a subscription tier. However, current implementation uses tier-like labels to gate Atlas and AI behavior in places.

Evidence:

- `src/lib/ai/ai-governance.ts` maps payment tiers to AI plan tiers.
- `src/lib/atlas/atlas-intelligence-system.ts` includes Platinum and Pro intelligence tier descriptions.
- `src/lib/fuel-gauge.ts` and `src/lib/atlas/atlas-intelligence-system.ts` recognize Platinum, Pro, Pilot, Launch 500, and founder values in feature gates.
- `src/content/legal/subscription-terms.ts` limits Pro/FleetOS/API/team access to future or separately licensed structures unless checkout or agreement says otherwise.

Risk: medium to high for future work. Atlas capability access should eventually be driven by product-scoped entitlement and AI governance records, not only commercial tier labels.

## Stripe and Environment Documentation Gaps

Code references these Stripe variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_ANNUAL`
- `STRIPE_PRICE_PILOT`
- `STRIPE_PRICE_PILOT_MONTHLY`
- `STRIPE_PRICE_PILOT_ANNUAL`
- `STRIPE_PRICE_LAUNCH500_MONTHLY`
- `STRIPE_PRICE_LAUNCH500_ANNUAL`

`docs/master-audit.md` references these variables, but `.env.example` does not currently document them. This audit did not modify `.env.example` because the task is documentation-only and forbids app/config changes beyond docs.

Recommended follow-up: add non-secret Stripe variable names to environment documentation in a dedicated config/docs task after billing owner approval.

## Public and Product Claim Risks

High-risk claims to avoid until approved:

- Platinum is available.
- Pro is available.
- Pro grants FleetOS.
- Pilot or Legacy Launch is a tier.
- Legacy pricing grants every future feature.
- Atlas is a tier.
- Atlas AI is available because a billing tier says so.
- Sentry or PostHog is a customer plan benefit.
- Stripe checkout IDs define entitlement policy.
- LoadIQ provides dispatch, brokerage, ELD, tax, legal, compliance, routing authority, safety certification, or guaranteed-profit outcomes.

## Required Approvals Before Code Changes

Before changing billing or entitlement implementation, obtain explicit approval for:

- final current commercial tier list
- Silver checkout status
- Platinum status and capabilities, if any
- Pro/FleetOS status and capabilities, if any
- launch pricing and lifetime-lock treatment
- Stripe product and price mapping
- Supabase subscription and entitlement schema impact
- Atlas AI budget and governance treatment
- legal/public pricing copy
- app-store billing implications
- test harness scope and production isolation

## Recommended Next Task

Do not change billing code directly from this audit.

Recommended next implementation branch, if approved:

`fix/loadiq-billing-tier-entitlement-reconciliation`

Recommended first implementation decision record:

- confirm whether Silver should be active, reserved, or removed from checkout-facing language
- confirm whether Platinum stays display-only, becomes a future entitlement class, or is removed from runtime gates
- confirm whether Pro is LoadIQ, FleetOS, or separately licensed only
- replace tier-derived capability assumptions with explicit capability grants where risk is highest
- add non-secret Stripe env documentation after confirming intended variable set

## Current Blockers

- Platinum and Pro remain undefined from business/governance perspective.
- Silver is not clearly aligned between governance and Stripe checkout.
- Atlas/AI budget governance remains partly tier-label based.
- Stripe env documentation is incomplete.
- Supabase remote reconciliation remains separately blocked until its migration plan is applied and verified.
