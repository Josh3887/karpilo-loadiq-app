# Feature Boundaries

This file defines what major LoadIQ features may and may not do. It is not an implementation spec and must not be used to invent unavailable capabilities.

## Calculator

May estimate load profitability, true RPM, margin pressure, fuel cost, mileage inputs, and operating assumptions.

Must not guarantee profit, replace accounting, certify route legality, file taxes, dispatch freight, broker loads, or override user responsibility.

## Fit Check

May collect operator context, business profile signals, operating assumptions, goals, and recommendation snapshots.

Must remain a LoadIQ app workflow. Website Fit Check surfaces should stay teaser or preview scope unless Joshua explicitly approves a full public workflow.

Fit Check must not become a substitute for onboarding, billing, entitlement checks, legal consent, or compliance qualification.

## Expense Intelligence

May organize operating expenses and help users reason about cost pressure.

Must not become accounting, tax preparation, bookkeeping, financial advisory, or guaranteed deduction guidance.

## Vehicle Intelligence

May organize vehicle assumptions, fuel behavior, operating context, and maintenance-related profitability signals.

Must not certify route legality, bridge clearance, permit compliance, hazmat routing, safety compliance, insurance coverage, or mechanical fitness.

## Atlas/AI

May provide educational, informational, and analytical context inside authenticated LoadIQ workflows.

Must not make autonomous decisions, guarantee outcomes, bypass deterministic calculator outputs, expose OpenAI keys, accept user-provided system prompts, or become a compliance, tax, legal, broker, dispatch, safety, or routing authority.

## Maps/Fuel/Weather Intelligence

May provide planning context, public data references, fuel estimates, weather risk context, and future route intelligence when implemented through server-side adapters.

Must not certify routing, guarantee ETA, guarantee pump price, guarantee road conditions, or expose provider response shapes directly to UI.

## Billing

May manage checkout, portal links, subscription state, entitlements, launch phase pricing, and internal test harnesses.

Must keep governance state, rollout phase, commercial subscription tier, and product entitlement separate.

Must not silently activate reserved tiers or invent public Platinum/Pro capabilities.

## Admin/Developer Tools

May support diagnostics, audit events, elevated access, Sentry, PostHog, and internal operational review.

Must not be presented as customer-facing product features and must not leak to normal users.
