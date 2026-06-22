Karpilo Endeavor Technologies LLC

Master Architecture & Development Constitution

Founder

Joshua J. Karpilo

Mission

We build the paths we don’t yet understand.

Karpilo Endeavor Technologies exists to identify fragmented industries, disconnected workflows, operational inefficiencies, administrative burdens, compliance challenges, information silos, and operational blind spots, then build technology systems that modernize those ecosystems.

⸻

Architecture Vocabulary

These concepts are independent.

They must never be treated as interchangeable.

Product

A product is something users interact with, license, purchase, or operate.

Examples:

* LoadIQ
* Atlas Intelligence Systems
* FleetOS
* Zahara’s World

Products define domains.

Products do not automatically inherit permissions from one another.

⸻

Governance State

Governance controls authority, validation, testing, rollout safety, operational oversight, support demand, infrastructure protection, and AI governance.

Examples:

* Internal
* Pilot
* Legacy Launch
* Public

Governance is NOT:

* A subscription tier
* A feature bundle
* A product

⸻

Rollout Phase

Rollout controls adoption pacing.

Purpose:

* Infrastructure scaling
* Cost control
* AI cost management
* Staffing readiness
* Support demand
* Operational stability

Examples:

* Pilot
* Legacy Launch
* General Availability

Rollout phases are NOT:

* Subscription tiers
* Entitlement bundles

⸻

Commercial Subscription Tier

Commercial tiers define monetization.

Current:

* Silver
* Gold

Reserved / Undefined:

* Platinum
* Pro

Undefined tiers must remain undefined until explicitly designed.

Never invent Platinum or Pro capabilities.

⸻

Product Entitlement

An entitlement is a permission.

Examples:

* Calculator
* Saved Loads
* Templates
* Reporting
* Atlas
* Atlas AI
* Exports
* Fleet Features

Entitlements define capability.

Entitlements do not define pricing.

Entitlements do not define governance.

⸻

Product Boundaries

LoadIQ

Transportation profitability intelligence platform.

Purpose:

* Profitability visibility
* Operational awareness
* Cost transparency
* Freight decision support

LoadIQ is NOT:

* A freight broker
* A dispatcher
* An ELD
* A tax advisor
* A legal advisor
* A compliance authority
* A guaranteed-profit system

⸻

Atlas Intelligence Systems

Atlas is a cross-product intelligence architecture.

Atlas supports products.

Atlas is not a subscription tier.

Atlas is not a product replacement.

Atlas capabilities must remain:

* Explainable
* Auditable
* Governable

Modules:

* K-ATLS CORE
* K-ATLS FI
* K-ATLS RTE
* K-ATLS EDU

⸻

FleetOS

Future transportation operating system.

FleetOS is NOT a LoadIQ feature.

FleetOS may integrate with LoadIQ.

FleetOS may leverage Atlas.

FleetOS maintains independent:

* Authority models
* Governance models
* Entitlement models
* Operational models

Architecture Hierarchy:

Platform Domain
Carrier Domain
Mobile Domain
External Domain
Authority Domain

Never violate this hierarchy.

⸻

Zahara’s World

Educational gaming ecosystem.

Built by Dad for Daughter.

Target Age:

4-6 years old.

Requirements:

* Touchscreen first
* Mobile first
* Educational first
* Positive reinforcement
* Large touch targets
* Fast interaction loops
* Safe content

Never include:

* Ads
* Dark patterns
* Manipulative reward systems
* Social media mechanics

⸻

Architectural Rules

Always distinguish:

Product
≠ Governance
≠ Rollout
≠ Commercial Tier
≠ Entitlement

If repository code mixes these concepts:

1. Identify the coupling.
2. Explain the risk.
3. Explain alternatives.
4. Do not assume business intent.

⸻

Development Principles

1. Audit before modification.
2. Explain before implementation.
3. Preserve working systems.
4. Prefer enhancement over replacement.
5. Use existing architecture before creating new architecture.
6. Prefer explicit systems over clever systems.
7. Make the smallest correct change first.
8. Validate after changes.
9. Report exactly what changed.
10. Challenge assumptions when evidence disagrees.

⸻

Audit Requirements

Before proposing modifications:

1. Identify affected products.
2. Identify affected governance states.
3. Identify affected rollout phases.
4. Identify affected commercial tiers.
5. Identify affected entitlements.
6. Identify Atlas impacts.
7. Identify FleetOS impacts.
8. Identify AI governance impacts.
9. Identify billing impacts.
10. Identify operational impacts.
11. Identify business risks.
12. Identify technical risks.
13. Explain alternatives.
14. Explain assumptions.
15. Request approval.

⸻

Validation Requirements

When possible:

* Run linting
* Run type checking
* Run tests
* Run build validation

Never claim validation passed if it was not executed.

Never hide errors.

⸻

Codex Behavioral Contract

Always:

* Read AGENTS.md first.
* Audit before modifying.
* Provide evidence.
* Explain findings.
* Explain risks.
* Challenge assumptions.
* Preserve architecture.
* Respect product boundaries.
* Request approval before significant changes.

Never:

* Invent requirements.
* Invent business intent.
* Invent architecture.
* Create duplicate systems.
* Create parallel implementations.
* Rewrite architecture without approval.
* Hide failures.
* Claim functionality exists when it does not.

Success is measured by:

* Architectural clarity
* Maintainability
* Correctness
* Explicit boundaries
* Long-term scalability
* Operational usefulness

Not clever code.

⸻

LoadIQ Repository Addendum

This repository is the LoadIQ application.

Domain boundary:

* `karpilo-liq.com` is the public website.
* The LoadIQ app project includes the protected product application and future Apple App Store / Google Play application surfaces.
* `app.karpilo-liq.com` is the web account-access portal for profile, settings, billing, Fit Check, access/request status, and related account-side flows.
* `/portal` routes are account-side bridge routes only. They must not become a blockade, replacement, or limiting definition for the full app project.
* `/dashboard` and related protected routes are operational web-app routes. Mobile/app-store work and protected product workflows must not be reduced to portal/billing-only behavior unless Joshua explicitly scopes the task that way.
* Website code should not duplicate app business logic; app code should not treat public marketing pages as operational application surfaces.

Repository evidence at the time this addendum was written:

* Next.js app using `src/app`.
* `package.json` declares Next.js `16.2.6`, React `19.2.4`, Tailwind CSS 4, Supabase, Stripe, Sentry, PostHog, OpenAI, Upstash Redis, Zustand, Recharts, and Capacitor iOS dependencies.
* Supabase schemas and migrations exist under `supabase/`.
* iOS/Capacitor surface exists under `ios/` and `capacitor.config.ts`.
* Product areas include dashboard, billing, calculator, Atlas/AI, fit check, saved loads, settings, support, and admin surfaces.

Do not rely on older Next.js assumptions. For version-sensitive framework behavior, inspect the local Next.js documentation in `node_modules/next/dist/docs/` or the local package source before changing APIs, routing, metadata, middleware/proxy behavior, server actions, or config.

LoadIQ-specific implementation rules:

* Do not turn LoadIQ into FleetOS.
* Do not duplicate billing, entitlement, rollout, governance, AI, or analytics systems.
* Keep billing, entitlement, rollout, and governance logic explicitly separated.
* Treat AI output, diagnostics, and analytics as governed operational surfaces, not decorative UI.
* Treat trucking operations, driver records, saved loads, billing records, diagnostics, and AI events as sensitive operational data.
* Do not weaken RLS, auth, billing checks, or entitlement checks to make a UI path work.
* Do not say a UI works unless it was verified in the rendered app.

Permanent repo-safety rules:

* Before making code changes, always check the current branch and working tree status. Do not work on main. Create or switch to a dedicated task branch before editing. If the working tree is dirty, stop and report the existing changes before proceeding. Do not commit or deploy unless explicitly instructed.
* Never replace the existing app experience with a temporary portal, bridge page, launch gate, or controlled-access shell. Temporary access surfaces must be isolated and must not remove calculator, dashboard, settings, billing, saved loads, Fit Check, or core application routes.
* Preserve existing product pillars unless explicitly instructed. Do not remove, rename, deprecate, or replace calculator, mileage, fuel, billing, settings, saved loads, Supabase, Stripe, Sentry, PostHog, auth, dashboard, pricing, or app routing logic without explicit approval.

Recommended validation when relevant:

```bash
npm run lint
npx tsc --noEmit
npm run build
```
