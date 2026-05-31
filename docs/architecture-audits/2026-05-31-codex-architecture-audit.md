# Codex Architecture Audit - 2026-05-31

This document preserves the read-only architecture guidance produced during the
May 31, 2026 LoadIQ architecture audit.

This document is read-only architecture guidance and does not approve
implementation. It does not authorize changes to billing, entitlement, rollout,
Atlas, FleetOS, Supabase, Stripe, or application logic.

## Architecture Vocabulary

The repository architecture must keep the following concepts independent.

### Product

A product is something users interact with, license, purchase, or operate.
Products define domains and do not automatically inherit permissions from one
another.

Current and referenced products:

- LoadIQ
- Atlas Intelligence Systems
- FleetOS
- Zahara's World

### Governance State

Governance controls authority, validation, testing, rollout safety, operational
oversight, support demand, infrastructure protection, and AI governance.

Governance states:

- Internal
- Pilot
- Legacy Launch
- Public

Governance is not a subscription tier, feature bundle, or product.

### Rollout Phase

Rollout controls adoption pacing for infrastructure scaling, cost control, AI
cost management, staffing readiness, support demand, and operational stability.

Rollout phases may include:

- Pilot
- Legacy Launch
- General Availability

Rollout phases are not subscription tiers or entitlement bundles.

### Commercial Subscription Tier

Commercial tiers define monetization.

Currently relevant:

- Silver
- Gold

Reserved and undefined:

- Platinum
- Pro

Undefined tiers must remain undefined until explicitly designed. Platinum and
Pro capabilities should not be inferred without explicit business requirements.

### Product Entitlement

An entitlement is a permission. Entitlements define capability, not pricing or
governance.

Example entitlements:

- Calculator
- Saved Loads
- Templates
- Reporting
- Atlas
- Atlas AI
- Exports
- Fleet Features
- Future capabilities

## Product Boundaries

### LoadIQ

LoadIQ is a transportation profitability intelligence platform.

LoadIQ supports profitability visibility, operational awareness, cost
transparency, and freight decision support.

LoadIQ is not a freight broker, dispatcher, ELD, tax advisor, legal advisor,
compliance authority, or guaranteed-profit system.

### Atlas Intelligence Systems

Atlas is a cross-product intelligence architecture. Atlas supports LoadIQ,
FleetOS, and future Karpilo products.

Atlas is not a subscription tier and is not a product replacement. Atlas
capabilities may be product-scoped and entitlement-scoped.

Atlas capabilities must remain explainable, auditable, and governable.

Atlas modules:

- K-ATLS CORE
- K-ATLS FI
- K-ATLS RTE
- K-ATLS EDU

### FleetOS

FleetOS is a future transportation operating system platform.

FleetOS is not a LoadIQ feature. LoadIQ may integrate with FleetOS, and FleetOS
may leverage Atlas. Neither product automatically grants access to the other.

FleetOS maintains independent authority, governance, entitlement, and
operational models.

FleetOS hierarchy:

- Platform Domain
- Carrier Domain
- Mobile Domain
- External Domain
- Authority Domain

### Zahara's World

Zahara's World is a child-safe educational gaming ecosystem.

Its architecture should remain separate from LoadIQ, Atlas, and FleetOS unless a
future approved architecture explicitly defines integration points.

## Three Highest Architectural Risks

1. Core architecture axes are coupled through shared tier names.
   Product, governance, rollout, commercial tier, and entitlement concepts are
   currently represented in overlapping tier-like identifiers. This creates a
   risk that future work will treat business states as permissions or pricing.

2. Undefined future tiers have concrete capability assumptions.
   Platinum and Pro are reserved and undefined, but current architecture
   references can imply concrete features, pricing, or capability levels. This
   risks creating accidental product commitments before business requirements
   are approved.

3. FleetOS boundaries are partially represented inside LoadIQ access language.
   Fleet-related and Pro-related concepts appear near LoadIQ billing and
   entitlement structures. This risks implying that FleetOS is a LoadIQ feature
   or that LoadIQ access automatically grants future FleetOS access.

## Three Highest Scaling Risks

1. Rollout scaling is seat-count and phase driven.
   Static rollout structures are useful for early control, but they may become
   brittle as infrastructure load, AI cost, support demand, and staffing needs
   diverge from simple seat counts.

2. Entitlement resolution carries too many concerns.
   Billing status, protected cohort access, feature access, lifetime access,
   FleetOS flags, and user capability decisions are concentrated in shared
   access-resolution paths. This increases regression risk as capabilities grow.

3. AI cost governance is tied to plan labels.
   Atlas AI usage controls currently align with plan-like identifiers. As Atlas
   becomes cross-product, cost and safety controls will need product scope,
   governance state, feature scope, and entitlement scope rather than direct
   billing-tier dependence.

## Three Highest Governance Risks

1. Pilot and Legacy Launch can be mistaken for commercial tiers.
   Pilot and Legacy Launch are governance and rollout concepts. If they remain
   coupled to checkout and entitlement semantics, future audits may confuse
   controlled access with monetization strategy.

2. Atlas governance can be mistaken for billing access.
   Atlas AI availability should be governed by AI safety, cost controls,
   explainability, auditability, product scope, and entitlement scope. Billing
   status alone should not become the full governance model.

3. Current vocabulary conflicts with emerging business clarification.
   Silver is planned but not fully implemented, while Platinum and Pro are
   reserved and undefined. Architecture should avoid inferring capabilities for
   any of these without explicit requirements.

## Migration Roadmap

### Phase 1: Vocabulary Alignment

- Affected areas: architecture documentation, pricing vocabulary, billing
  vocabulary, feature-access vocabulary, rollout vocabulary, Stripe naming
- Estimated complexity: Medium
- Risk level: Medium
- Dependencies: None
- Recommended order: 1
- Roadmap: Establish canonical names for Product, Governance State, Rollout
  Phase, Commercial Tier, and Entitlement. Stop using tier-like names as
  umbrella identifiers for unrelated concepts.

### Phase 2: Governance Separation

- Affected areas: rollout configuration, operator program status, operator
  program types, rollout assignment schema, founder/launch readiness records
- Estimated complexity: High
- Risk level: High
- Dependencies: Phase 1
- Recommended order: 2
- Roadmap: Isolate Internal, Pilot, Legacy Launch, and Public governance state
  from rollout cohorts, pricing, checkout access, and entitlement resolution.

### Phase 3: Commercial Tier Separation

- Affected areas: pricing configuration, Stripe checkout configuration,
  checkout route, webhook processing, billing page, subscription terms
- Estimated complexity: High
- Risk level: High
- Dependencies: Phases 1-2
- Recommended order: 3
- Roadmap: Make the commercial billing model explicitly Silver and Gold current,
  with Platinum and Pro reserved and undefined. Keep Pilot and Legacy Launch out
  of commercial-tier modeling.

### Phase 4: Entitlement Separation

- Affected areas: feature access, plan limits, entitlement service, server and
  client entitlement surfaces, entitlement API, subscription entitlement schema
- Estimated complexity: High
- Risk level: High
- Dependencies: Phases 1-3
- Recommended order: 4
- Roadmap: Model entitlements as capability permissions independent of
  governance and commercial tier. Resolve capabilities such as Calculator, Saved
  Loads, Templates, Reporting, Atlas, Atlas AI, Exports, and Fleet Features
  through entitlement grants rather than inferred tier names.

### Phase 5: Atlas Governance Separation

- Affected areas: Atlas registry, AI governance, AI routes, AI status UI, AI
  output reporting, AI governance schema, AI documentation
- Estimated complexity: High
- Risk level: High
- Dependencies: Phases 1 and 4
- Recommended order: 5
- Roadmap: Treat Atlas governance as cross-product intelligence governance. Keep
  Atlas capability access product-scoped and entitlement-scoped without deriving
  AI authority directly from billing tier labels.

### Phase 6: FleetOS Boundary Separation

- Affected areas: pricing references, feature access, plan limits, entitlement
  service, subscription entitlement schema, Future Pro reservation records, AI
  documentation
- Estimated complexity: High
- Risk level: High
- Dependencies: Phases 1, 4, and 5
- Recommended order: 6
- Roadmap: Remove FleetOS assumptions from LoadIQ tier and plan semantics.
  Preserve FleetOS as a future independent platform that may integrate with
  LoadIQ and leverage Atlas without inheriting LoadIQ access or commercial
  status.

## Immediate Action Items

1. Freeze vocabulary drift.
   - Blocking current development: Yes, for billing, access control, Atlas,
     FleetOS, rollout, and AI work.
   - Recommendation: Treat Product, Governance, Rollout, Commercial Tier, and
     Entitlement as separate review gates before adding new logic.

2. Stop expanding Platinum and Pro assumptions.
   - Blocking current development: Yes, for pricing pages, billing UI, checkout,
     entitlement logic, and FleetOS-related work.
   - Recommendation: Do not add new Platinum, Pro, or FleetOS capabilities until
     business requirements define them.

3. Clarify Silver before implementing tier behavior.
   - Blocking current development: Yes, for any Silver billing, onboarding,
     entitlement, or pricing work.
   - Recommendation: Silver needs explicit business requirements before code
     treats it as a real tier.

4. Treat Pilot and Legacy Launch as governance and rollout, not tiers.
   - Blocking current development: Yes, for checkout, operator access, public
     billing language, and entitlement expansion.
   - Recommendation: New work should not use pilot or launch identifiers as
     commercial-tier equivalents.

5. Protect the FleetOS boundary.
   - Blocking current development: Yes, for any FleetOS, Pro, fleet, multi-truck,
     or per-truck billing work.
   - Recommendation: Do not let LoadIQ access imply FleetOS access.

## Deferred Action Items

1. Separate governance storage from billing storage.
   - Blocking current development: No, unless rollout or governance rules are
     changing immediately.
   - Recommendation: Defer until LoadIQ has enough live operational volume to
     justify schema separation.

2. Refactor entitlement resolution into independent capability grants.
   - Blocking current development: No, for Gold-only LoadIQ operation.
   - Recommendation: Defer until Silver, Atlas AI, exports, or reporting require
     distinct entitlement combinations.

3. Separate rollout capacity controls from checkout pricing.
   - Blocking current development: No, if the current controlled rollout remains
     operationally acceptable.
   - Recommendation: Defer unless support demand, AI cost, or infrastructure
     growth requires more precise controls.

4. Clean up legacy Stripe pro identifiers.
   - Blocking current development: No, if they continue mapping to Gold and no
     Pro offer is public.
   - Recommendation: Defer because payment identifier changes are high-risk and
     low-value until commercial tiers are stabilized.

5. Move Atlas AI budgets away from billing-tier labels.
   - Blocking current development: No, for limited LoadIQ AI testing.
   - Recommendation: Defer until Atlas becomes cross-product or materially
     cost-sensitive.

## Future-State Architecture Goals

1. Canonical access model.
   Product grants access to product domains. Governance controls authority and
   validation. Rollout controls scale and operational pacing. Commercial tier
   controls monetization. Entitlement controls capability.

2. LoadIQ maturity model.
   LoadIQ should support Silver and Gold through explicit commercial tiers and
   explicit LoadIQ entitlements. Pilot and Legacy Launch should remain
   governance and rollout states, not monetization primitives.

3. Atlas architecture model.
   Atlas should remain a cross-product intelligence architecture with
   product-scoped and entitlement-scoped capabilities. Atlas governance should
   manage AI authority, safety, cost, explainability, and auditability
   independently from billing labels.

4. FleetOS boundary model.
   FleetOS should have independent product, governance, entitlement, and
   operating models. LoadIQ may integrate with FleetOS, but should not own
   FleetOS permissions or imply FleetOS access.

5. Recommended priority.
   First, enforce vocabulary discipline and prevent new undefined tier
   assumptions. Second, separate governance and commercial concepts for new
   billing work. Third, separate entitlements when Silver or Atlas capabilities
   become real. Last, harden the FleetOS boundary before FleetOS-facing
   implementation.
