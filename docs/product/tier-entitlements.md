# Tier And Entitlement Governance

This is a careful draft. It does not define final pricing, final tier capabilities, checkout availability, or entitlement implementation.

This document merges the original governance-spine terminology with the billing entitlement reconciliation findings. It is documentation only. No billing code, Stripe code, Supabase migration, API route, pricing value, entitlement resolver, `.env.local`, package file, native file, or app behavior changed as part of this conflict resolution.

## Required Vocabulary

These concepts are independent and must not be treated as interchangeable.

| Concept | Meaning | Must not be treated as |
| --- | --- | --- |
| Governance state | Authority, validation, safety, testing, operational oversight, support demand, infrastructure protection, and AI governance. | A paid plan, feature bundle, rollout phase, or entitlement bundle. |
| Rollout phase | Adoption pacing, slot availability, operational readiness, infrastructure load, AI cost exposure, and support load. | A commercial subscription tier or product entitlement. |
| Commercial subscription tier | Monetization and commercial packaging approved for sale. | Governance state, rollout phase, payment-provider ID, or capability permission by itself. |
| Product entitlement | Permission to use a capability such as calculator access, saved loads, templates, reporting, Atlas/AI, exports, billing access, or future fleet-related permissions. | Pricing approval, rollout status, governance state, or product identity. |
| Stripe price/product | Payment-provider configuration used to collect payment. | The source of product authority, legal availability, or entitlement policy. |
| App feature gate | Runtime check that allows or blocks a capability. | Final public pricing, approved tier definition, or legal product claim. |
| Admin/internal test harness | Developer-only simulation and validation surface. | Production subscription truth or customer-facing tier approval. |

## Current Governance Baseline

Governance currently says:

- Silver and Gold are current commercial subscription tiers.
- Platinum and Pro are reserved or undefined.
- Undefined tiers must remain undefined until separately designed and approved.
- Platinum and Pro capabilities must not be invented in public claims.
- Atlas is intelligence architecture, not a subscription tier.
- FleetOS is not a LoadIQ feature and does not automatically inherit LoadIQ entitlements.

This document does not resolve the business model. It records repository evidence and identifies unresolved conflicts that require later product, billing, legal, and engineering decisions.

## Owner/Admin Build Access

The app may grant the Karpilo LoadIQ owner/admin account build-phase unlimited
feature access through server-side entitlement resolution when the account email
matches `LOADIQ_OWNER_EMAILS`. This override is intentionally not a commercial
tier, not a Stripe entitlement, not a public plan benefit, and not a global gate
removal. Regular users continue to resolve access through the normal
subscription, usage, and entitlement paths.

## Current Repository Evidence

The repository code and documentation are not fully reconciled.

Evidence from billing and entitlement code:

- `src/config/pricing.ts` defines display-only commercial tier objects for Silver, Gold, Platinum, and Pro.
- `src/config/pricing.ts` defines `PLATINUM_ACCESS` as reserved and checkout-disabled.
- `src/config/pricing.ts` defines `FUTURE_PRO_ACCESS` as planned, checkout-disabled, and tied to future FleetOS-capable architecture.
- `src/config/stripe.ts` exposes Stripe checkout plans for Standard Public Access, Pilot, and Launch 500.
- `src/config/stripe.ts` maps legacy `pro-monthly` and `pro-annual` checkout IDs to Gold.
- `src/domains/billing/plan-limits.ts` includes limit records for `silver`, `gold`, `platinum`, `pilot`, `launch500`, `beta_test`, and `pro`.
- `src/domains/billing/feature-access.ts` normalizes `silver`, `gold`, `platinum`, `pro`, `pilot`, `launch`, `launch500`, and `beta_test` into entitlement and feature-access classes.
- `src/domains/billing/entitlement-service.ts` derives feature permissions from tier-like values, including Platinum, Pro, FleetOS, weather, and fleet-related gates.
- A prior manual developer override in `src/domains/billing/server-entitlements.ts` granted Pro/fleet access to one developer account; it was removed on `fix/loadiq-developer-entitlement-override`.
- `src/domains/billing/internal-test-harness.ts` and `src/domains/billing/internal-test-harness-types.ts` include Silver, Gold, Platinum, and Pro simulated states, including launch-phase aliases.
- The billing test harness notes say those states do not write Stripe subscriptions or production entitlement records.

Evidence from adjacent app gates and docs:

- `src/lib/ai/ai-governance.ts` maps payment-tier values into AI plan tiers.
- `src/lib/atlas/atlas-intelligence-system.ts` includes Platinum and Pro intelligence tier descriptions.
- `src/lib/fuel-gauge.ts` and `src/lib/atlas/atlas-intelligence-system.ts` recognize Platinum, Pro, Pilot, Launch 500, and founder-like values in feature gates.
- `src/content/legal/subscription-terms.ts` states Pilot and Legacy Launch are protected rollout or promotional access programs, not commercial tier names.
- `src/content/legal/subscription-terms.ts` treats Platinum, Pro, FleetOS, team, API, usage-based, enterprise, and separately licensed offerings as reserved future or separate product structures unless checkout or a signed agreement says otherwise.
- `docs/sentry-monitoring.md`, `docs/posthog-analytics.md`, and `src/app/admin/posthog/page.tsx` describe Sentry and PostHog as internal tools, not customer-facing plan benefits.

## Current Conflict

The current governance language and repository code are not fully reconciled.

Unresolved conflicts:

1. Silver is current in governance and modeled in code, but no active Silver Stripe checkout plan was found in the inspected Stripe configuration.
2. Gold is the clearest active Stripe-backed standard paid access path.
3. Platinum and Pro are reserved or undefined in governance, but code contains concrete scaffolding in pricing displays, plan limits, feature access, entitlement resolution, AI/Atlas/fuel gates, and internal harness states. A prior hardcoded developer override was removed and should not be reintroduced as a substitute for approved entitlement policy.
4. Pilot, Legacy Launch, Launch 500, beta, founding access, and general availability are rollout, promotional, or access-control concepts, but some of their values flow through plan-tier and entitlement paths.
5. Atlas is intelligence architecture, not a subscription tier, even though runtime gates currently derive some Atlas/AI access from tier-like labels.
6. Stripe price and environment variable documentation is incomplete. Code references Stripe secret, webhook, and price variables, while `.env.example` does not currently list the Stripe variable set.

Do not change code, public pricing, checkout behavior, entitlement behavior, or customer-facing tier copy until a separate billing/tier/entitlement implementation branch resolves the intended model.

## Silver

Status from repository evidence: current in governance, modeled in code, not observed as an active Stripe checkout plan.

Evidence:

- Current commercial tier in `AGENTS.md`.
- Present in `src/config/pricing.ts`, `src/domains/billing/plan-limits.ts`, `src/domains/billing/feature-access.ts`, and internal harness states.
- Not present as a Stripe checkout tier in `src/config/stripe.ts`.
- Not listed as a selectable plan in `src/domains/billing/subscription-launch-phases.ts`; launch and open-market phases select Gold.

Unresolved: whether Silver should be an active checkout plan, reserved/lower-access tier, app-store-only tier, or code vocabulary that should be removed from checkout-facing language.

## Gold

Status from repository evidence: current and the clearest active standard paid access path.

Evidence:

- Current commercial tier in `AGENTS.md`.
- `src/config/pricing.ts` maps Standard Public Access pricing to `GOLD_ACCESS`.
- `src/config/stripe.ts` maps legacy `pro-monthly` and `pro-annual` checkout IDs to tier `gold`.
- `src/domains/billing/subscription-launch-phases.ts` lists `gold` as selectable during launch and open-market phases.
- Dashboard billing copy describes Standard Public Access and existing provider-controlled checkout as the active payment path.

Unresolved: legacy `pro-*` provider IDs can confuse audits unless future docs and env contracts continue to identify them as Gold mappings.

## Platinum

Status from repository evidence: reserved or undefined in governance, but partially scaffolded in code.

Evidence:

- Reserved or undefined in `AGENTS.md`.
- `src/config/pricing.ts` defines a display-only Platinum tier and `PLATINUM_ACCESS` marked reserved and checkout-disabled.
- `src/domains/billing/plan-limits.ts`, `src/domains/billing/feature-access.ts`, `src/domains/billing/entitlement-service.ts`, `src/lib/fuel-gauge.ts`, and `src/lib/atlas/atlas-intelligence-system.ts` include Platinum-related feature gates or capability assumptions.
- The internal billing harness includes Platinum alias states for pilot, launch, and open-market simulation.
- No inspected Stripe checkout plan exists for Platinum.
- Legal subscription terms classify Platinum as reserved future or separate product structure unless checkout or a signed agreement says otherwise.

Unresolved: whether Platinum remains display-only, becomes a future approved entitlement class, or should be removed from runtime gates until separately approved.

Do not invent Platinum capabilities from the scaffolded code.

## Pro

Status from repository evidence: reserved or undefined in governance, FleetOS-adjacent planned scaffold in code.

Evidence:

- Reserved or undefined in `AGENTS.md`.
- `src/config/pricing.ts` defines a display-only Pro tier and `FUTURE_PRO_ACCESS` as planned, checkout-disabled, and tied to future FleetOS-capable architecture.
- `src/config/pricing.ts` states legacy Stripe checkout IDs use the `pro` slug but map to Gold.
- `src/config/stripe.ts` uses `pro-monthly` and `pro-annual` only as legacy checkout IDs for Gold.
- `src/domains/billing/plan-limits.ts`, `src/domains/billing/feature-access.ts`, `src/domains/billing/entitlement-service.ts`, `src/lib/ai/ai-governance.ts`, `src/lib/fuel-gauge.ts`, and `src/lib/atlas/atlas-intelligence-system.ts` include Pro-related feature gates or AI/fleet assumptions.
- A prior `src/domains/billing/server-entitlements.ts` developer override granted Pro/fleet access outside normal subscription state; that override has been removed and should not be treated as approved Pro availability.
- The internal billing harness includes Pro alias states for pilot, launch, and open-market simulation.
- No inspected Stripe checkout plan exists for a real Pro customer tier.
- Legal subscription terms say Pro, FleetOS, API, team, and separately licensed structures are reserved future or separate offerings unless checkout or a signed agreement says otherwise.

Unresolved: whether Pro remains FleetOS-adjacent only, becomes a separate product path, or should be removed from LoadIQ gates until separately approved.

Do not invent Pro capabilities from the scaffolded code.

## Rollout and Promotional Access

The following are rollout, promotional, or access-control concepts. They are not commercial tier names:

- `beta_test`
- Founding 50 Pilot
- Pilot
- Legacy Launch
- Launch 500
- Founding Operator
- Open Market
- General Availability

Evidence:

- `src/config/rollout.ts` defines rollout phases and cohorts for adoption pacing.
- `src/config/launch-phases.ts` derives rollout/launch status snapshots from time and claimed operator counts.
- `src/domains/billing/subscription-launch-phases.ts` models beta, pilot, launch, and open-market phases separately from commercial plan selection.
- `src/domains/billing/operator-program.ts` controls assigned pilot and launch eligibility.
- `src/content/legal/subscription-terms.ts` states Pilot and Legacy Launch are protected rollout or promotional access programs, not commercial tier names.

Current interpretation: rollout and promotional access may affect eligibility, waitlist mode, support load, slot caps, price locks, and activation timing. They do not define final commercial packaging or product capability by themselves.

## Product Entitlement Boundary

Product entitlement is permission to use a capability. Entitlements do not define rollout phase, governance state, product identity, or public pricing.

Observed entitlement-sensitive capabilities include:

- core calculator
- saved loads
- pay templates
- lane templates
- exports
- comparisons
- advanced analytics
- weather profitability risk
- fuel gauge snapshots
- Atlas AI and Atlas operational intelligence
- future fleet/FleetOS-adjacent access

Current risk:

- Several runtime gates derive capability from tier-like names.
- Atlas and AI budgets can be tied to payment-tier labels.
- Fuel gauge and route intelligence gates recognize Platinum, Pro, Pilot, Launch 500, and founder-like values.
- This can blur product entitlement, AI governance, rollout cohort, and commercial tier.

Required direction:

- New work should prefer explicit capability grants and product-scoped entitlement records.
- Billing status alone should not become the full Atlas, AI, FleetOS, or operational authority model.
- Stripe plan IDs should map into entitlement records, but not replace entitlement policy.

## Sentry and PostHog Boundary

Sentry and PostHog are internal developer/operator tools.

They are not:

- customer-facing paid plan benefits
- entitlement systems
- support systems
- billing systems
- calculator systems
- AI governance systems

Do not include Sentry or PostHog as public subscription benefits unless a later approved product/legal decision explicitly creates a customer-facing analytics feature separate from these internal tools.

## Public Claim Boundary

Do not claim the following publicly as available subscription benefits unless approved and wired through an approved billing and entitlement path:

- Platinum access
- Pro access
- FleetOS access
- team accounts
- API products
- usage-based AI add-ons
- fleet dispatch/admin layers
- advanced truck-specific routing authority
- tax, legal, compliance, broker, dispatcher, carrier, ELD, or guaranteed-profit functions

## Stripe And Env Documentation Follow-Up

Stripe is a payment rail. It is not the entitlement source of truth.

Current follow-up:

- Code references Stripe secret, webhook, and price environment variables.
- `.env.example` does not currently document the full Stripe variable set.
- Future env/API integration contract work should document non-secret variable names and intended sandbox/live use without printing or committing secrets.

This documentation gap does not approve checkout changes or price changes.

## Safe Working Rule

When touching billing or access:

1. Identify whether the change affects governance state, rollout phase, commercial tier, product entitlement, Stripe provider configuration, app feature gates, or internal test harnesses.
2. Verify the existing code path and data source.
3. Avoid adding another parallel tier/access model.
4. Do not expose reserved tier behavior publicly.
5. Do not weaken entitlement checks to make UI navigation work.
6. Do not treat runtime scaffolding as approved business intent.
7. Keep Sentry, PostHog, diagnostics, and billing harnesses out of customer-facing plan benefits.

## Approval Required Before Billing Logic Changes

Any implementation branch that changes billing behavior must have explicit approval for:

- approved commercial tier list
- public pricing and launch-pricing treatment
- Silver checkout status
- Platinum and Pro capability definitions, if any
- Stripe product and price IDs for each approved plan
- entitlement grants for each approved capability
- Atlas AI budget and safety governance model
- FleetOS separation from LoadIQ
- legal copy and public claims
- Supabase schema and RLS impact
- app-store billing implications for future iOS/Android surfaces

Implementation changes require a later billing branch, such as `fix/loadiq-billing-tier-entitlement-reconciliation`, after the unresolved decisions above are approved.
