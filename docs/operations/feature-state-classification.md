# LoadIQ Feature State Classification Audit

Last updated: June 26, 2026

This audit classifies the current LoadIQ app state for Web App Stabilization.
It is documentation only. It does not approve deployment, Supabase mutation,
Stripe mutation, pricing changes, native mobile work, provider activation, or
new feature implementation.

## Executive Summary

The repository contains a real LoadIQ web app baseline, not only a prototype.
Auth, protected dashboard routing, the calculator, settings stations, Fit
Check, saved-load history, billing routes, admin routes, Sentry, PostHog,
provider adapters, and a primitive portal are present.

The app is not launch-ready because several core circuits are only partially
wired or are blocked by the known Supabase live-schema gap. The most important
technical blocker is that app code writes or reads fields and tables documented
as absent from the live Supabase project:

- `saved_loads.fuel_gauge_snapshot`
- `saved_loads.equipment_context_snapshot`
- `truck_profiles.fuel_tank_count`
- `truck_profiles.fuel_tank_capacity_gallons`
- Atlas/equipment fields on `truck_profiles`
- portal tables: `profiles`, `portal_access`, `billing_accounts`,
  `fit_checks`, and `legal_acceptances`
- AI add-on structures and budget fields

The most important product blocker is the unresolved billing vocabulary and
entitlement conflict. Governance says Silver and Gold are current commercial
tiers, Platinum and Pro are reserved or undefined, and Atlas is not a tier.
Code still contains Platinum/Pro scaffolding in pricing display, plan limits,
feature access, entitlement resolution, AI/Atlas/fuel gates, and internal
harness states.

Current priority remains LoadIQ web app stabilization. Native iOS/Android,
full Atlas, Google Maps routing, IFTA, Pro/FleetOS, live navigation, and
referral incentives are later milestones.

## Classification Legend

Buckets:

- Built and working: implemented from repository evidence and not currently
  blocked by a known critical dependency, though rendered/mobile verification
  may still be required.
- Built but incomplete/broken: implemented, but blocked, inconsistent,
  duplicated, unreliable, or missing required launch validation.
- Scaffolded but not fully functional: route, component, config, or service
  exists, but the capability is gated, limited, internal, or not production
  complete.
- Non-existent / future milestone: no material implementation found or the
  repo explicitly treats it as future.
- Launch blocker: must be resolved before launch confidence.
- Post-launch milestone: should not block core web app stabilization.

Priority levels follow the requested P0 through P7 framework.

## Feature Classification Matrix

| Feature/system | Type | Current bucket | Priority | Evidence inspected | Current problem | Dependency | Recommended next action | Code timing | Supabase involved | Stripe/external APIs involved | Billing blocked | Mobile/layout risk | Launch effect |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth, login, callback, protected dashboard/portal routing | User-facing product and infrastructure | Built and working, with smoke-test need | P0/P1 | `proxy.ts`, `src/app/auth/*`, `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`, dashboard/portal protected pages | Static routing and auth guards exist; protected route smoke tests still required. | Supabase auth and deployed env correctness. | Add protected-route smoke coverage after docs work. | Later code/test branch. | Yes, auth. | No external provider beyond Supabase. | No. | Medium because login is launch-critical. | Launch blocker until smoke tested. |
| Dashboard shell and onboarding gate | User-facing product | Built but incomplete/broken | P0 | `src/app/(dashboard)/dashboard/page.tsx`, `page.client.tsx`, `src/app/(dashboard)/dashboard/onboarding/page.tsx` | Dashboard is implemented, but depends on entitlement/profile/default circuits and redirects to onboarding when setup is incomplete. | Auth, operator profile, entitlement state, billing harness isolation. | Keep dashboard, but validate full first-run path after Supabase reconciliation. | Later code/test branch. | Yes. | PostHog/Sentry indirectly. | Partially. | High due dense dashboard layout. | Launch blocker as part of core app flow. |
| Calculator | User-facing product | Built but incomplete/broken | P0 | `src/components/calculator/load-input-form.tsx`, `src/domains/calculator/calculator-engine.ts`, `src/hooks/use-load-calculator.ts`, `src/services/calculator-defaults.ts` | Calculator is the most complete feature, but form density and mobile complexity remain risks. It depends on defaults from profile, expense, vehicle, and pay-template circuits. | Settings/profile, expense, vehicle, pay templates, fuel reference, entitlements. | Clean mobile layout without removing fields or math. | Later code branch. | Yes through defaults/profile. | EIA fuel reference. | Entitlement gates affect calculation access. | High. | Launch blocker for usability, not evidence of missing implementation. |
| Saved loads, Loads page, detail, reports | User-facing product | Built but incomplete/broken and launch blocker | P0 | `src/services/save-load.ts`, `src/services/saved-load-actions.ts`, `src/app/(dashboard)/dashboard/history/page.tsx`, `src/app/(dashboard)/dashboard/history/[id]/page.tsx`, report route | Save, duplicate, update, history, and detail routes exist. Save/duplicate now retry without optional `fuel_gauge_snapshot` and `equipment_context_snapshot` when the live schema reports those columns missing, so core history can continue. Full snapshot-specific reporting still depends on Supabase reconciliation. | Supabase forward reconciliation, RLS, entitlements. | Verify saved-load save/show/report path, then apply the approved Supabase reconciliation before relying on fuel/equipment snapshots. | Current stabilization branch plus later DB readiness. | Yes, still partially blocked by live-schema gap. | No direct provider API. | Yes, saved-load entitlement gates. | Medium to high on history tables. | P0 launch blocker until verified and reconciled. |
| Fit Check dashboard workflow | User-facing product | Built but incomplete/broken | P0 | `src/components/fitcheck/fitcheck-intake.tsx`, `src/services/fitcheck-profile.ts`, `src/app/(dashboard)/dashboard/intake/fitcheck/page.tsx`, `src/app/(dashboard)/dashboard/settings/fitcheck/page.tsx` | Fit Check saves reusable profile snapshots, hydrates core Settings context, replaces FitCheck-labeled overhead rows, updates operator-profile targets, and exposes an explicit Settings review route. Known missing truck-profile columns now surface a schema-gap warning so saved snapshots are not mistaken for failed saves. | Operator profile, user settings, overhead items, truck profile schema. | Verify Fit Check -> Settings/Profile -> Expense circuit now; verify Vehicle Intelligence hydration after Supabase reconciliation. | Current stabilization branch plus later DB/test branch. | Yes, vehicle/equipment hydration remains blocked by schema gap. | No external provider. | Recommendation tier copy must respect billing governance. | High because multi-step form is dense. | P0 launch blocker until verified. |
| Settings/profile architecture | User-facing product | Built but incomplete/broken and duplicated | P0 | Dashboard settings pages, `src/components/dashboard/operational-profile-form.tsx`, `src/components/settings/SettingsForm.tsx`, `src/services/operational-profile.ts`, portal settings | Dashboard Settings is now labeled as the LoadIQ operating-profile source of truth, with `/dashboard/settings/vehicle` carrying the canonical operational profile form and `/dashboard/settings/fitcheck` exposed as review/snapshot context. Underlying storage still spans `users`, `user_settings`, `truck_profiles`, `pay_structure_templates`, `user_overhead_items`, `operator_profiles.profile_snapshot`, and primitive portal tables. | Supabase schema, portal boundary, protected route smoke tests. | Keep dashboard Settings as the operating-profile authority, keep portal primitive, and verify the full profile circuit after Supabase reconciliation. | Current stabilization branch plus later test branch. | Yes, blocked by portal and vehicle columns. | No external provider. | Billing status shown in settings. | High. | P0 launch blocker until verified. |
| Expense Intelligence | User-facing product | Built but incomplete/broken | P0/P2 | `src/app/(dashboard)/dashboard/settings/expenses/page.tsx`, `src/components/dashboard/overhead-manager.tsx`, `src/services/overhead-items.ts`, `src/services/calculator-defaults.ts` | Overhead and deduction controls exist and feed calculator defaults. The settings surface is now grouped into mobile-friendly snapshot, guide, add-item, and saved-item sections, with saved items reviewed by fixed, equipment, variable, and admin expense groups. Rendered mobile verification is still needed. | User settings, overhead items, subscription expense injection. | Smoke test Expense Intelligence on mobile and verify calculator-default linkage. | Current cleanup branch plus later test branch. | Yes. | No external provider. | Billing subscription price can appear as system expense. | Medium. | P0 for launch usability. |
| Vehicle Intelligence | User-facing product | Built but incomplete/broken | P0/P2 | `src/app/(dashboard)/dashboard/settings/vehicle/page.tsx`, `src/components/dashboard/operational-profile-form.tsx`, `src/services/operational-profile.ts`, `src/lib/equipment-profile.ts` | Vehicle fields exist, including equipment, tank, weight, capability, and route restriction context. The form is now grouped into tractor/truck, equipment/fuel, trailer, weight/capability, and operating-note sections, but it is still blocked by missing live truck-profile columns and needs rendered mobile verification. | Supabase reconciliation and mobile UI verification. | Reconcile schema, then smoke test Vehicle Intelligence save/hydration on mobile. | Current cleanup branch plus later DB/test branch. | Yes, blocked by schema gap. | No direct provider. | Some fields feed Atlas/fuel gates. | Medium. | P0 for launch usability and save reliability. |
| Pay templates | User-facing product | Built but incomplete/broken | P0/P2 | `src/components/dashboard/operational-profile-form.tsx`, `src/services/operational-profile.ts`, `src/services/calculator-defaults.ts` | Pay template creation and default template lookup exist and feed calculator defaults. Needs validation with settings/profile circuit and mobile cleanup. | Operational profile, Supabase tables, calculator defaults. | Validate default template -> calculator behavior in smoke tests. | Later test/code branch. | Yes. | No. | Not directly. | Medium. | Launch-impacting if driver pay assumptions are core. |
| Lane templates | User-facing product | Built but incomplete/broken | P2 | `src/app/(dashboard)/dashboard/templates/page.tsx`, `src/services/lane-templates.ts`, saved-load detail actions | Lane templates are saved-load-derived shortcuts. They depend on saved-load input snapshots being compatible and saved loads working first. | Saved loads reliability. | Stabilize saved loads before treating lane templates as ready. | Later code/test branch. | Yes. | No. | Entitlement limits include lane templates. | Medium. | Launch-adjacent, not first P0. |
| Billing, checkout, portal, entitlements | User-facing product and infrastructure | Built but incomplete/broken and launch blocker | P0/P1 | `src/app/api/billing/*`, `src/app/api/stripe/webhook/route.ts`, `src/domains/billing/*`, `src/config/pricing.ts`, billing docs | Stripe routes and entitlement resolver exist. Billing vocabulary remains unresolved: Gold is clearest active Stripe-backed path; Silver is modeled but no active Silver checkout was found; Platinum/Pro remain reserved while code contains scaffolding. | Product/legal/billing decision, Stripe env verification, Supabase subscription schema. | Create billing decision record before implementation changes. | Later code branch after approval. | Yes. | Stripe. | Yes, blocked by tier conflict. | Medium. | P0 launch blocker for paid access and claims. |
| Launch phases, invite/operator program access | Admin/control and rollout infrastructure | Scaffolded but not fully functional | P1/P7 | `src/config/launch-phases.ts`, `src/config/rollout.ts`, `src/domains/billing/operator-program.ts`, dashboard pilot status, billing docs | Rollout phases and slot counts exist, but must not be treated as commercial tiers. Enforcement and invite-code flow need launch-control review. | Operator program records, billing checkout gating, admin control. | Add launch-control admin/readiness branch; do not mix with tier definitions. | Later code branch. | Yes. | Stripe for gated checkout. | Yes where rollout values enter entitlement paths. | Low to medium. | P1 launch-control need. |
| Primitive portal | User-facing account bridge | Scaffolded but not fully functional | P2 | `src/app/portal/*`, `src/lib/portal/*`, `src/components/portal/*`, `docs/app-portal-access.md` | Portal is intentionally limited and must not replace full app. It depends on portal tables documented absent remotely. | Supabase forward reconciliation. | Keep primitive; verify after portal tables exist. | Later test branch after DB readiness. | Yes, blocked by portal tables. | No. | Shows billing status/plan interest. | Medium. | Not the full app launch blocker, but portal cannot be relied on until DB ready. |
| Admin control plane | Admin/control | Scaffolded but not fully functional | P1 | `src/app/admin/*`, `src/app/api/admin/*`, `src/lib/admin/*`, API/admin/security audit | Role and elevated gates exist. UI explicitly says functional scaffold only; polished users/plans/invite/billing/cache/provider admin is not implemented. | Admin roles, elevated session, durable rate limits. | Build basic launch admin view after rate-limit and billing decisions. | Later code branch. | Yes, service-role/admin tables. | Resend for elevated email, PostHog/Sentry visibility. | Indirect. | Low user-facing, high control-plane. | P1 launch-control need. |
| Sentry | Integration/internal observability | Built and working with production review need | P1 | `src/sentry.*.config.ts`, `src/instrumentation-client.ts`, `src/lib/sentry-config.ts`, `src/app/admin/sentry-test/page.tsx`, Sentry docs | Scrubbing/masking exists and Sentry is internal. Production sample rates, source maps, privacy, and admin visibility still need review. | Env contracts, privacy review. | Keep internal; complete provider privacy review. | Later docs/config review. | No direct DB dependency. | Sentry. | No. | Low. | P1 launch-control need. |
| PostHog | Integration/internal analytics | Built and working with rate/privacy review need | P1 | `src/lib/analytics.ts`, `src/lib/analytics-server.ts`, `src/app/api/analytics/events/route.ts`, `src/app/admin/posthog/page.tsx` | Event/property allowlists exist, but analytics ingestion lacks durable route-level rate limit/origin policy. It is internal, not a customer-facing plan benefit. | Redis/rate limits, privacy review. | Add durable analytics rate limit and privacy review. | Later code/docs branch. | No direct schema blocker noted. | PostHog. | No. | Medium. | P1 launch-control need. |
| Redis / Upstash | Infrastructure | Scaffolded but not fully functional | P1 | `src/lib/redis.ts`, API/security audit, env docs | Server-only wrapper exists but is not wired to route rate limits, provider caching, or admin status. | Rate-limit/cache design. | Use Redis only for rate limits/cache/API protection, not product redesign. | Later code branch. | No. | Upstash Redis. | No. | None. | P1 launch-control need. |
| Resend/email | Infrastructure/admin control | Scaffolded but partially active | P1 | `src/lib/admin/admin-email.ts`, admin elevated auth docs, env contracts | Resend supports elevated admin challenge email only; no broad public email pipeline found. | Env presence, admin flow rate limit. | Keep narrow; add pipeline status only if needed for admin control. | Later code/docs branch. | No. | Resend. | No. | Low. | P1 launch-control need. |
| OpenAI / Atlas | User-facing intelligence and integration | Scaffolded but not fully functional | P3 | `src/app/api/ai/*`, `src/lib/ai/*`, `src/lib/atlas/*`, AI docs, API/security audit | AI routes are gated by `ENABLE_LOADIQ_AI_DEV`, auth, budgets, validation, and safety prompts. Live schema lacks AI add-on structures; privacy review remains open. Atlas is architecture, not a tier. | Supabase AI schema, provider privacy, AI governance, entitlement cleanup. | Do not expand until core web app and DB are stable. | Later P3 branch. | Yes, blocked by AI schema gap. | OpenAI. | Yes, AI budgets map to tier-like labels. | Medium. | Post-launch milestone. |
| EIA fuel / diesel reference | User-facing support integration | Built but incomplete/broken | P0/P1 | `src/app/api/fuel/*`, `src/services/fuel/*`, `src/components/calculator/load-input-form.tsx`, API docs | Fuel lookup is implemented as informational server-side provider support, but public fuel endpoints lack durable rate limits and cache behavior needs launch review. | Rate limits, fuel cache schema, provider env. | Keep informational; add rate limits/cache review. | Later code branch. | Yes for cache writes. | EIA.gov. | Entitlements not primary. | Low. | Supports P0 calculator but not standalone launch blocker if manual fuel works. |
| Weather profitability | User-facing support integration | Scaffolded but not fully functional | P3 or later | `src/app/api/weather/profitability/route.ts`, `src/services/weather/*`, `src/components/dashboard/weather-profitability-risk-panel.tsx` | Auth/entitlement-gated route exists; cache reports `not_implemented`; no durable rate limit; provider privacy not approved. | Entitlements, provider privacy, rate limits/cache. | Keep gated; do not make launch-critical. | Later branch. | No direct schema blocker found, but saved snapshot depends on saved loads. | OpenWeather. | Yes for feature access. | Medium. | Post-launch milestone unless explicitly scoped. |
| Google Maps / truck routing | User-facing base support plus future milestone | Base Google Route Intelligence exists; truck/legal routing remains future | P1/P4 | Route Intelligence docs, route-intelligence API routes, provider services, API index | Base Google-backed planning estimates support authenticated address validation and route mileage estimates. Truck-specific/legal routing, live navigation, traffic/toll expansion, and broader provider strategy remain future work. | Provider privacy, rate limits, routing authority boundaries, truck-specific provider decision. | Keep base estimates informational; do not expand into truck/legal routing during web app stabilization. | Current route foundation plus later P4 branch. | No current blocker for base estimates. | Google Maps for base estimates; future providers later. | Base route access is all-tier; advanced routing may be gated later. | High if expanded beyond planning estimates. | Base support is launch support; expansion is not a launch blocker. |
| IFTA / jurisdiction estimates | Future milestone | Non-existent / future milestone, with some Pro copy scaffold | P4 | Dashboard Pro Estimation Readiness card, legal terms, pricing docs | IFTA is described as future Pro estimation support only, not tax filing. No implementation should be inferred. | Routing/mileage provider, saved history, legal/tax disclaimers, billing. | Keep future; do not launch as current. | Later P4 branch. | Future. | Future maps/routing/data providers. | Yes, Pro unresolved. | High if added. | Not a launch blocker. |
| Pro / multi-truck / FleetOS | Future milestone | Non-existent / future milestone with code scaffolding | P5 | `src/config/pricing.ts`, `src/domains/billing/feature-access.ts`, legal terms, billing docs | Code contains Pro/fleet scaffolding, but governance reserves/undefines Pro and says FleetOS is separate. | Product architecture, legal, billing, entitlement model. | Do not build until billing/product architecture is approved. | Later P5 branch. | Future. | Future. | Yes. | High if exposed. | Not a launch blocker. |
| Live navigation / real-time variance | Future milestone | Non-existent / future milestone | P6 | Product docs, absence of GPS/live navigation implementation, mobile platform docs | No verified native GPS/background/live navigation implementation. | Native/mobile, maps/routing, privacy, provider contracts. | Do not build during web stabilization. | Later P6 branch. | Future. | Future maps/native providers. | Potentially. | High. | Not a launch blocker. |
| Referral / word-of-mouth incentives | Future milestone and rollout growth | Non-existent / future milestone | P7 | Prompt, launch/rollout docs, billing docs | Referral credit logic was not found as implemented. It would touch billing/legal/revenue protection. | Billing/legal/product decision. | Document only until core launch is stable. | Later P7 branch. | Future. | Stripe likely later. | Yes. | Low. | Not a launch blocker. |
| Capacitor/iOS/Android | Platform | Scaffolded but not current priority | Post-launch/mobile | `capacitor.config.ts`, `ios/`, absent `android/`, mobile docs | Capacitor and iOS project exist; Android is absent. Native app deployment is explicitly not current priority. | Web app stability, mobile UX, platform validation. | Wait until web app is stable and mobile-friendly. | Later mobile branch. | No current DB blocker beyond app itself. | Native stores later. | Native billing future. | High if attempted now. | Not current launch blocker. |
| Legal/support/account deletion | Legal/compliance boundary and support | Built and working with abuse/rate review need | P0/P1 | Legal pages, support page, support ticket form, feedback service, account deletion API route | Legal/product boundary pages and authenticated support/deletion flows exist. Public intake tables remain abuse surfaces per Supabase docs. | Rate limits, public intake controls, legal review. | Verify abuse controls and keep claims bounded. | Later security/docs branch. | Yes. | Email/provider indirectly. | No. | Low to medium. | Launch support requirement. |
| Public website/app shared backend principle | Architecture boundary | Partially supported, not fully proven | P1/P2 | Repository addendum, API docs, portal docs, app service layers | Docs state website should not call the app; both should use shared backend/API/profile truth. App has service layers, but public website/app alignment is outside this repo and portal tables are not live. | Shared Supabase/API/profile contract and website repo alignment. | Use shared backend/profile truth; do not duplicate app logic in website. | Later cross-repo docs/API branch. | Yes. | Provider APIs through server routes. | Indirect. | Medium. | P1/P2 architecture need. |

## Built Features

Built from repository evidence:

- Supabase auth routes and protected `/dashboard` and `/portal` route guards.
- Dashboard calculator shell with entitlement-aware calculate/save behavior.
- Calculator engine and dense load input form.
- EIA diesel reference lookup support with manual fallback.
- Saved-load save/history/detail/report routes and actions.
- Fit Check dashboard intake and saved settings review.
- Operational profile, expense overhead controls, vehicle/equipment profile,
  pay templates, and calculator defaults linkage.
- Billing checkout, portal, webhook, entitlement status, and internal harness
  routes.
- Support, legal hub, subscription/refund/privacy/terms, and account deletion
  request surfaces.
- Admin role/elevated access scaffolding.
- Sentry and PostHog internal observability/analytics.

## Built But Incomplete Or Broken

The following exist but should not be treated as launch-ready:

- Saved loads: blocked by live Supabase schema divergence and needs save/show
  verification.
- Fit Check: partially connects into settings/profile/expense/vehicle.
  Snapshot, core Settings context, and overhead hydration are clearer; vehicle
  hydration still depends on Supabase reconciliation.
- Settings/profile: source-of-truth naming is clearer in dashboard Settings,
  but storage still spans multiple tables and primitive portal settings.
- Expense Intelligence: functional overhead controls exist and are now grouped
  for mobile review, but rendered verification is still needed.
- Vehicle Intelligence: functional operational profile fields are now grouped
  by truck, equipment/fuel, trailer, capability, and operating notes; missing
  live schema fields still block full readiness.
- Calculator: functionally deep, but too dense for unverified mobile launch.
- Billing/entitlements: code exists, but plan vocabulary and product authority
  are unresolved.
- Admin: protected and useful, but explicitly a scaffold rather than a
  complete launch control plane.

## Scaffolded But Not Fully Functional

- Primitive portal.
- Redis as shared rate-limit/cache infrastructure.
- Resend as narrow admin email infrastructure.
- OpenAI/Atlas AI routes and surfaces.
- Weather profitability.
- Launch/invite/operator program control.
- Pro/IFTA readiness card and Pro/FleetOS vocabulary.
- Capacitor/iOS packaging.

## Non-Existent Or Future Milestones

- Android native project.
- Google Maps truck-specific/legal routing beyond base Route Intelligence.
- Trimble or equivalent truck-specific routing.
- IFTA worksheet or jurisdiction-mile estimation.
- Live navigation, actual-vs-planned tracked miles, and real-time variance.
- Full Atlas module separation as K-ATLS Core, Freight, Route, and EDU.
- Multi-truck/fleet/FleetOS implementation.
- Referral-credit or word-of-mouth reward engine.
- Monthly exports as a verified production feature.

## Launch Blockers

P0 launch blockers:

1. Supabase reconciliation must be applied and verified before code paths that
   depend on missing saved-load, vehicle/fuel, portal, and AI structures are
   treated as deployable.
2. Saved-load save/show/detail/report reliability must be verified against the
   live schema.
3. Fit Check must be verified as a reliable circuit into Settings/Profile,
   Expense Intelligence, and Vehicle Intelligence.
4. Settings/Profile needs a source-of-truth cleanup so LoadIQ Profile does not
   become a disconnected duplicate of Settings.
5. Expense Intelligence needs rendered mobile verification after the grouping
   cleanup.
6. Vehicle Intelligence needs rendered mobile verification and Supabase
   reconciliation after the grouping cleanup.
7. Calculator needs mobile layout cleanup without removing functionality.
8. Billing, tier, rollout, Stripe, and entitlement vocabulary must be aligned
   before public paid launch claims.
9. Protected auth/dashboard/billing/support routes need smoke validation.
10. Web build, lint, and typecheck must pass after the implementation branches
    above, not merely after this docs-only audit.

## Post-Launch Milestones

Post-launch or later milestone work:

- Full Atlas/AI module buildout.
- Weather profitability expansion.
- Trimble, truck-specific/legal routing, and provider expansion beyond base
  Google Route Intelligence.
- IFTA worksheet or tax-estimation support.
- Pro/FleetOS/multi-truck workflows.
- Live navigation and real-time variance.
- Android scaffold and native app-store work.
- Referral-credit engine.
- Monthly export productization.

## Admin And Control Systems

Admin/control systems should observe, gate, debug, and configure product
systems. They should not be confused with the product milestones themselves.

Current admin/control evidence:

- Admin role and elevated access gates exist.
- Admin audit, diagnostic, identity, notification, PostHog, and Sentry-test
  surfaces exist.
- The admin home page identifies itself as a functional scaffold.
- Internal billing harness remains non-production and explicitly enabled after
  the developer entitlement override fix.

Admin should control or observe:

- users and support state
- billing status and Stripe sync health
- plans, tier entitlements, and rollout eligibility after decisions are made
- invite/launch phase caps
- feature flags
- Sentry and PostHog status
- Redis/rate-limit/cache status
- email pipeline status
- audit logs and diagnostics

Admin should not be treated as implementation of:

- IFTA
- Atlas AI
- navigation
- Pro fleet tools
- exports
- portal settings
- Google Maps routing

## Immediate P0 Stabilization Sequence

Recommended sequence:

1. `fix/loadiq-supabase-forward-reconciliation-apply`
   Apply and verify the reviewed forward-only Supabase reconciliation through
   the runbook. Do not run blind `supabase db push`.
2. `fix/loadiq-saved-loads-stabilization`
   Verify save, duplicate, history, detail, report, load status, fuel snapshot,
   equipment snapshot, and route-stop behavior against the reconciled schema.
3. `fix/loadiq-profile-settings-circuit`
   Define the app profile truth layer across `users`, `user_settings`,
   `truck_profiles`, `operator_profiles.profile_snapshot`, and primitive
   portal tables.
4. `fix/loadiq-fitcheck-profile-circuit`
   Verify Fit Check hydration into Settings/Profile and Expense Intelligence,
   and keep Vehicle Intelligence hydration schema-degraded until Supabase
   reconciliation is applied. Keep sensitive financial snapshots opt-in.
5. `fix/loadiq-expense-vehicle-mobile-cleanup`
   Reorganize Expense Intelligence and Vehicle Intelligence for mobile without
   deleting fields.
6. `fix/loadiq-calculator-mobile-cleanup`
   Make the calculator scannable on iPhone-sized screens while preserving
   existing math and fields.
7. `fix/loadiq-billing-tier-entitlement-reconciliation`
   Resolve Silver/Gold/Platinum/Pro, rollout, Stripe, Atlas, and entitlement
   conflicts before public pricing or paid feature-wall changes.
8. `test/loadiq-protected-route-smoke`
   Add smoke checks for auth, dashboard, settings, Fit Check, saved loads,
   billing, portal, support, admin, and API protection.

## What Not To Build Yet

Do not build or expand these during current web stabilization:

- native app deployment
- Android scaffold
- App Store or Play Store release work
- full Atlas AI module rollout
- Google Maps routing expansion beyond base Route Intelligence
- Trimble truck-specific routing
- IFTA support
- live navigation
- Pro/FleetOS/multi-truck systems
- referral-credit automation
- public Platinum or Pro claims
- public claims that EIA, weather, maps, AI, routing, or IFTA features are
  authoritative or guaranteed

## Recommended Next Implementation Branches

In order:

1. `fix/loadiq-supabase-forward-reconciliation-apply`
2. `fix/loadiq-saved-loads-stabilization`
3. `fix/loadiq-profile-settings-circuit`
4. `fix/loadiq-fitcheck-profile-circuit`
5. `fix/loadiq-expense-vehicle-mobile-cleanup`
6. `fix/loadiq-calculator-mobile-cleanup`
7. `fix/loadiq-billing-tier-entitlement-reconciliation`
8. `fix/loadiq-admin-billing-rate-limits`
9. `fix/loadiq-preview-production-gate`
10. `test/loadiq-protected-route-smoke`

## Confidence

Confidence is medium-high for static repository classification because the
audit inspected docs, route trees, services, components, domain logic, provider
docs, and prior reconciliation findings. Confidence is lower for rendered
mobile usability and live saved-load reliability because this task did not run
the app, inspect production data, call providers, or mutate remote services.
