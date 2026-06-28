# LoadIQ Billing Rules

This document defines repo governance rules for future LoadIQ billing, tier, rollout, and entitlement work. It records current constraints only. It does not approve pricing changes, tier launches, Stripe changes, Supabase changes, or app behavior changes.

## Core Rules

1. Keep governance state, rollout phase, commercial subscription tier, product entitlement, and payment-provider configuration separate.
2. Do not treat Pilot, Legacy Launch, Launch 500, Founding Operator, beta, open-market status, or general availability as commercial tier names.
3. Do not treat Atlas as a subscription tier.
4. Do not treat FleetOS as a LoadIQ feature or automatic LoadIQ entitlement.
5. Do not treat Stripe product IDs, Stripe price IDs, or checkout plan IDs as the source of product authority.
6. Do not expose internal developer tools, Sentry, PostHog, diagnostics, or billing test harness states as customer-facing plan benefits.
7. Do not invent Platinum or Pro capabilities.
8. Do not use changelog, docs, dashboard copy, or legal copy to imply public availability that billing and entitlement code does not actually support.

## Current Commercial Tier Rule

The current governance baseline is:

- Current commercial tiers: Silver and Gold.
- Reserved or undefined tiers: Platinum and Pro.

Implementation evidence is not fully aligned:

- Gold is the active Stripe-backed standard access path.
- Silver exists in tier vocabulary and plan-limit code but does not have an inspected Stripe checkout plan.
- Platinum and Pro appear in pricing displays, plan limits, feature access, entitlement resolution, Atlas/AI/fuel gates, and internal harness states.
- A prior hardcoded developer Pro/fleet entitlement override was removed from server entitlement resolution on `fix/loadiq-developer-entitlement-override`.
- Platinum and Pro do not have inspected active Stripe checkout plans.

Until this is reconciled, future work must not assume the code vocabulary is approved business intent.

## Stripe Rules

Stripe is a payment rail. It is not the entitlement source of truth.

Current inspected evidence:

- `src/config/stripe.ts` defines checkout plans for Standard Public Access, Pilot, and Launch 500.
- Legacy `pro-monthly` and `pro-annual` checkout IDs map to Gold.
- Pilot and Launch 500 checkout plans require operator program eligibility.
- Checkout blocks when configured price IDs are missing or placeholder-like.
- Stripe webhooks reconcile subscription status into Supabase records.
- `.env.example` does not currently list the Stripe price and webhook environment variable names, while code and `docs/master-audit.md` reference them.

Required before Stripe changes:

- confirm plan IDs and product IDs in Stripe without printing secrets
- confirm sandbox versus live mode
- confirm public prices against legal copy
- confirm launch-price and lifetime-lock rules
- confirm webhook reconciliation fields
- confirm Supabase columns exist before enabling production checkout
- update environment documentation without exposing secrets

## Entitlement Rules

Entitlements should be explicit capability permissions.

Allowed entitlement examples:

- calculator access
- saved loads
- templates
- reporting
- exports
- Atlas AI support
- weather profitability risk
- fuel gauge snapshot
- fleet features

Rules:

- A user can have an entitlement without the entitlement becoming a tier.
- A tier can grant entitlements, but the tier name should not be the only expression of capability.
- Rollout access can allow checkout or pricing lock eligibility, but should not define capability by itself.
- Atlas and AI availability must respect AI safety, cost, explainability, product scope, and user entitlement.
- FleetOS capabilities require separate product approval and must not be inherited automatically from LoadIQ.

## Rollout and Launch Rules

Rollout phases control pacing and operational readiness.

Current rollout concepts include:

- beta testing
- Founding 50 Pilot
- Launch 500
- Controlled Public Launch
- Expansion Access
- General Availability

Rules:

- Launch phases may control eligibility, waitlist mode, slot availability, price locks, and support load.
- Launch phases must not be marketed or implemented as subscription tiers.
- Pilot and Legacy Launch can carry protected pricing only where server-authoritative records prove eligibility.
- Frontend countdowns, copied URLs, query strings, local browser state, or display labels must not grant paid access.

## Internal Test Harness Rules

The billing test harness is an internal validation surface.

Rules:

- Harness states must not be treated as real Stripe subscribers.
- Harness aliases for Silver, Platinum, and Pro must not become customer tier approval.
- Harness state may help validate entitlement resolution, but it must not create public product commitments.
- Harness runtime access must remain restricted to approved internal users,
  explicit harness enablement, and non-production environments.

## Public and Legal Claim Rules

Public copy must match implemented and approved product state.

Do not present as generally available unless approved:

- Platinum
- Pro
- FleetOS
- fleet dispatch/admin systems
- API products
- team accounts
- usage-based AI add-ons
- advanced truck-specific routing authority
- compliance, tax, legal, broker, dispatcher, ELD, or guaranteed-profit functions

Sentry and PostHog may be documented as internal operational tools only.

## Change Approval Matrix

| Change type | Required approval before implementation |
| --- | --- |
| New public tier | product, legal, billing, engineering |
| Stripe price or product mapping | billing, legal, engineering |
| Launch or lifetime pricing rule | product, legal, billing, engineering |
| Entitlement gate change | product, engineering, security |
| Atlas AI budget or access change | product, AI governance, engineering |
| FleetOS or Pro/FleetOS access | product architecture, legal, engineering |
| Supabase subscription schema change | database, security, engineering |
| Public pricing/legal copy | product, legal, billing |
| Internal billing harness behavior | engineering, security |

## Next Implementation Branch

If implementation is approved, use a dedicated branch such as:

`fix/loadiq-billing-tier-entitlement-reconciliation`

That branch should start with a narrower decision record that answers:

- Is Silver intended to be an active checkout plan?
- Should Platinum remain display-only, be removed from runtime gates, or become an approved future entitlement class?
- Should Pro remain FleetOS-adjacent only, be removed from LoadIQ gates, or become a separate product path?
- Which capabilities should be granted through explicit entitlement records instead of tier labels?
- Which Stripe environment variables belong in documented configuration?
