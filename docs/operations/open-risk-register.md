# LoadIQ Open Risk Register

Last updated: June 25, 2026

This risk register tracks known build-readiness risks from the current
governance, Supabase, billing, environment, API/security, and platform audits.
It is documentation only and does not approve implementation or deployment.

## Critical Risks

| Risk | Status | Impact | Required action |
| --- | --- | --- | --- |
| Blind Supabase `db push` or production deployment against the current live project | Open | Could apply migrations out of order, replay pricing mutation, or deploy routes against missing schema. | Keep blocked. Use the reviewed forward-only reconciliation strategy and runbook only after approval. |

## High Risks

| Risk | Status | Impact | Required action |
| --- | --- | --- | --- |
| Forward-only Supabase reconciliation migration not remotely applied | Open | Portal, fuel gauge, Atlas/vehicle, and AI add-on dependent routes may fail or degrade. | Review and apply `fix/loadiq-supabase-forward-reconciliation` only through approved production steps. |
| Launch pricing mutation remains separate | Open | Pricing state could change without product/legal approval if bundled with schema work. | Keep `20260621045851_align_launch_pricing_phase_prices.sql` separate until approved. |
| Billing/tier conflict unresolved | Open | Silver/Gold/Platinum/Pro, Pilot, Launch 500, Atlas, and FleetOS meanings can drift into incorrect entitlement or public claims. | Create a billing decision record before implementation changes. |
| Durable rate-limit gaps | Open | Admin auth, billing, analytics, fuel, and public intake routes may be abused or generate provider cost/noise. | Build shared rate limits and apply route-by-route. |
| Public intake spam/abuse surfaces | Open | Anonymous intake tables can receive spam or duplicate operational noise even with RLS. | Verify server-side validation, duplicate controls, rate limits, and monitoring. |

## Medium Risks

| Risk | Status | Impact | Required action |
| --- | --- | --- | --- |
| Preview production gate undecided | Open | Public preview mode could expose non-authoritative app state in production. | Decide whether preview is production-allowed; gate if not. |
| Provider privacy review incomplete | Open | OpenAI/Atlas, OpenWeather, EIA, Sentry, PostHog, and future maps may process operational data without complete documentation. | Complete provider privacy and data-flow review before production enablement. |
| Protected route smoke testing incomplete | Open | Dashboard, portal, admin, billing, and API protection could regress without targeted checks. | Add or document smoke tests for protected routes and auth states. |
| Mobile/iOS/Android readiness incomplete | Open | Capacitor/iOS presence could be mistaken for complete native release readiness; Android is absent. | Keep Android planned/absent, verify iOS build/support, and avoid app-store claims until tested. |
| Internal billing harness remains powerful in non-production | Mitigated but open | Harness can synthesize Pro/fleet states when explicitly enabled outside production. | Keep production blocked, keep access restricted, and consider audit logging/non-public server-only controls. |
| Developer entitlement override | Mitigated | Prior hardcoded developer Pro/fleet/full access could bypass normal subscription state. | Removed in `3d7228c`; do not reintroduce without approved entitlement policy. |

## Low Risks

| Risk | Status | Impact | Required action |
| --- | --- | --- | --- |
| Documentation drift across split branches | Open | Future work may cite stale standalone branch docs instead of consolidated docs. | Use the branch integration map and roadmap before new branches. |
| Existing lint warnings in marketing scripts | Open | Does not currently block lint, but creates noise in validation output. | Clean up on a separate marketing/tooling branch if needed. |
| Google Maps/mileage claims | Controlled | Base Google-backed Route Intelligence exists for authenticated app planning estimates, while truck-specific, weather, traffic, toll, legal-routing, and live-navigation claims remain future or gated. | Keep base Google estimates labeled as planning estimates only and keep advanced routing claims future-facing until separately reviewed. |

## Risk Closure Rules

A risk is closed only when:

- the implementation or documentation change is committed
- validation appropriate to the change has run
- changed paths match the risk scope
- no remote-service mutation occurred without explicit approval
- public/legal/product claims match actual implementation

Do not close risks merely because a branch exists.

## Current Highest Priority

1. Keep Supabase deployment/db push blocked.
2. Review and integrate the developer entitlement override hardening fix.
3. Add durable rate limits before public/provider expansion.
4. Gate or explicitly approve preview mode for production.
5. Finish provider privacy review.
6. Add protected route smoke testing.
7. Resolve billing/tier policy before changing Stripe or entitlement behavior.
