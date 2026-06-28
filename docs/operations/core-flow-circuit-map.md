# LoadIQ Core Flow Circuit Map

Last updated: June 26, 2026

This document maps the core LoadIQ web app circuits. It is documentation only.
It does not change app behavior, apply Supabase migrations, alter billing, or
approve deployment.

## Circuit Status Legend

- Connected: repository evidence shows the source can feed the target through
  an implemented route/service/component path.
- Partially connected: some implemented path exists, but it is blocked,
  incomplete, unverified, or only covers part of the intended flow.
- Disconnected: no meaningful implemented connection was found.
- Duplicated: more than one overlapping path or source of truth exists.
- Unknown: not enough evidence was inspected to classify safely.
- Blocked: an implemented path depends on missing schema, unresolved billing,
  provider readiness, or launch-control decisions.

## Target Circuit

The stabilized web app circuit should be:

```text
Signup/Login
  -> Settings/Profile
  -> Expense Intelligence
  -> Vehicle Intelligence
  -> Pay Templates
  -> Calculator
  -> Saved Loads
  -> Loads Page / Detail / Report
  -> Billing/Entitlements
  -> Admin/Observability
```

Fit Check should feed Settings/Profile, Expense Intelligence, and Vehicle
Intelligence. It should not replace onboarding, billing, entitlement, legal
consent, or compliance qualification.

The website should not call the app. The website and app should use shared
backend/API/profile truth where integration is needed.

## Connection Map

| Connection | Status | Evidence inspected | What works | Break, duplication, or blocker | Next action |
| --- | --- | --- | --- | --- | --- |
| Signup/Login -> Dashboard | Connected, smoke-test needed | `proxy.ts`, `src/app/auth/*`, `src/app/login/page.tsx`, `src/app/(dashboard)/dashboard/page.tsx` | `/dashboard` is protected by Supabase auth and redirects unauthenticated users. | Needs protected-route smoke testing in deployed-like env. | Add smoke tests after docs work. |
| Signup/Login -> Portal | Partially connected and blocked | `proxy.ts`, `src/app/portal/*`, `src/lib/portal/server.ts`, portal docs | `/portal` is protected and has account bridge pages. | Portal tables are absent remotely until Supabase reconciliation. | Verify after portal tables exist. |
| Portal -> Dashboard | Partially connected | `src/app/portal/page.tsx`, `docs/app-portal-access.md` | Portal links account-side status/settings/Fit Check and locks full app features. | Portal is intentionally primitive and must not define the full app. | Keep portal as bridge only. |
| Dashboard -> Calculator | Connected | `src/app/(dashboard)/dashboard/page.client.tsx`, `src/components/calculator/load-input-form.tsx`, `src/hooks/use-load-calculator.ts` | Dashboard renders the calculator and calls the calculator hook. | Calculator is dense and mobile cleanup is still needed. | Mobile-first calculator cleanup. |
| Settings/Profile -> Calculator | Partially connected and blocked | `src/services/calculator-defaults.ts`, `src/services/operational-profile.ts`, `LoadInputForm` defaults | Calculator defaults read overhead, operational profile, vehicle, fuel tank, equipment, pay templates, reserves, dispatch, and factoring. | Operational profile reads/writes missing live vehicle/fuel/equipment columns. | Reconcile Supabase, then verify default-loading behavior. |
| Fit Check -> Settings/Profile | Partially connected | `src/components/fitcheck/fitcheck-intake.tsx`, `src/services/fitcheck-profile.ts`, `FitCheckProfilePanel` | Fit Check saves reusable profile snapshots, hydrates core Settings context, replaces labeled overhead rows, updates operator-profile targets, and exposes the FitCheck review route from Settings. | Vehicle/equipment hydration remains schema-degraded when live `truck_profiles` columns are missing; rendered/mobile verification still needed. | Apply Supabase reconciliation, then smoke test FitCheck save/review/settings hydration. |
| Fit Check -> Expense Intelligence | Partially connected | `hydrateSettingsFromFitCheck`, `replaceFitCheckOverheadRows`, `OverheadManager` | Fit Check can replace labeled overhead rows that Expense Intelligence reads. Expense Intelligence is now grouped into mobile-friendly snapshot, guide, add-item, and saved-item sections. | UX and overwrite behavior still need smoke review; rendered mobile verification remains open. | Verify controlled overhead sync and mobile layout. |
| Fit Check -> Vehicle Intelligence | Partially connected and blocked | `buildOperationalProfileFromFitCheck`, `saveOperationalProfile`, vehicle settings route | Fit Check attempts to flow equipment, trailer, capability, and route-note context into the operating profile. Known missing truck-profile columns now produce an explicit schema-gap warning instead of making the saved FitCheck snapshot appear lost. | Truck/equipment/fuel fields are missing remotely; vehicle input grouping is improved but not rendered-verified. | Reconcile schema, then verify vehicle hydration and mobile layout. |
| Settings/Profile -> Expense Intelligence | Connected, verification needed | Expense settings page, `OverheadManager`, `overhead-items` service, calculator defaults | Expense overhead items feed weekly/daily/cpm/percent cost calculations and calculator defaults. Expense inputs and saved items are grouped by fixed, equipment, variable, and admin expense context for mobile review. | Needs rendered mobile verification and calculator-default smoke testing. | Smoke test Expense Intelligence save/delete/default loading on mobile. |
| Settings/Profile -> Vehicle Intelligence | Partially connected and blocked | Vehicle settings page, `OperationalProfileForm`, `operational-profile` service | The `/dashboard/settings/vehicle` route is now labeled as the operating profile plus Vehicle Intelligence source for driver targets, truck/equipment, fuel assumptions, reserves, pay templates, and calculator defaults. Vehicle inputs are grouped by tractor/truck, equipment/fuel, trailer, weight/capability, and operating notes. | Missing live vehicle/fuel/equipment schema columns remain; rendered mobile verification still needed. | Reconcile schema, then smoke test Vehicle Intelligence save/hydration and mobile layout. |
| Pay Templates -> Calculator | Connected, needs verification | `createPayTemplate`, `getOperationalProfile`, `getCalculatorDefaults`, `LoadInputForm` | Default pay template is managed inside the operating-profile station and loaded into calculator defaults. | Need smoke test for default and loaded template behavior. | Include in protected route/core flow smoke pass. |
| Calculator -> Saved Loads | Partially connected and schema-degraded | `ResultsPanel`, `saveLoad`, `saved_loads` inserts | Save action exists, entitlement checks exist, save feedback is explicit. Save now retries without optional fuel/equipment snapshots if the live schema lacks those columns. | Full fuel/equipment snapshot capture still requires Supabase reconciliation. | Verify fallback save/show behavior, then reconcile Supabase before relying on snapshot reporting. |
| Saved Loads -> Loads Page | Connected if core save succeeds | `history/page.tsx`, `history/[id]/page.tsx`, report route, saved load actions | History, detail, actuals, duplicate, outcome, and report paths exist. Duplicate now uses the same optional snapshot-column fallback. | Reliability still depends on route stops, entitlements, RLS, and the remaining schema gap for full snapshots. | Test save/show/detail/report and duplicate behavior after stabilization. |
| Saved Loads -> Lane Templates | Partially connected | `lane-templates.ts`, templates page, saved-load detail actions | Lane templates can be created from saved load input snapshots and loaded back into dashboard. | Depends on saved-load snapshot compatibility and saved-load reliability. | Stabilize saved loads first. |
| Billing/Entitlements -> Dashboard/Calculator/Saved Loads | Partially connected and billing-blocked | `server-entitlements.ts`, `client-entitlements.ts`, `entitlement-service.ts`, dashboard client, billing routes | Entitlement state gates calculation/save behavior and updates local usage. | Silver/Gold/Platinum/Pro and rollout/tier/entitlement vocabulary conflict remains unresolved. | Resolve billing/tier/entitlement before public paid launch. |
| Stripe -> Entitlements | Partially connected | Stripe checkout, portal, webhook routes, `stripe-subscriptions.ts` | Checkout, portal, and webhook code exist with signature/placeholder checks. | Price/env/live mode and tier policy need final review. | Billing reconciliation implementation branch. |
| Launch phases -> Billing access | Partially connected | `subscription-launch-phases.ts`, `operator-program.ts`, `pricing.ts`, billing docs | Pilot and Launch 500 eligibility paths exist. | Rollout phases can still blur into tier/entitlement labels. | Keep rollout separate from commercial tiers. |
| Admin -> Product controls | Scaffolded | `src/app/admin/*`, `src/app/api/admin/*`, admin docs | Role/elevated access, audit, diagnostics, notification, PostHog, and Sentry-test routes exist. | Admin page says scaffold; no complete users/plans/invite/billing/cache admin plane yet. | Build basic launch control admin only after P0 circuits. |
| Admin -> Sentry | Partially connected | `src/app/admin/sentry-test/page.tsx`, Sentry configs/docs | Development-only Sentry test surface exists and is elevated/admin gated. | Production observability review still needed. | Keep internal; complete provider privacy review. |
| Admin -> PostHog | Partially connected | `src/app/admin/posthog/page.tsx`, analytics docs/server code | Internal PostHog status surface exists. | Analytics route lacks durable rate limit/origin policy. | Add rate limits and keep internal. |
| Admin -> Redis/rate limits | Disconnected/scaffolded | `src/lib/redis.ts`, API/security audit | Server-only Redis wrapper exists. | Not wired into durable rate limits, cache, or admin status. | Build shared rate-limit/cache support. |
| Admin -> Email pipeline | Partially connected | `admin-email.ts`, elevated auth routes | Resend supports elevated admin challenge email. | Not a broad support or notification pipeline; rate limiting needed. | Keep narrow and verify admin flow. |
| AI/Atlas -> Calculator/results | Scaffolded and blocked | AI routes, Atlas components, `ResultsPanel`, AI governance docs | Atlas components and gated AI routes exist. | AI dev gate, provider privacy, billing-like tier budget labels, and missing AI schema block production. | Defer to P3. |
| EIA fuel -> Calculator | Partially connected | Fuel API routes, fuel services, `LoadInputForm` fuel lookup | Server-side fuel reference lookup and manual fallback exist. | Public fuel endpoints lack durable rate limits; cache/service-role needs review. | Add rate limits/cache review. |
| Weather -> Results | Scaffolded | Weather route/services, weather panel | Auth/entitlement-gated weather profitability route exists. | Cache is `not_implemented`, no durable rate limit, provider privacy needed. | Keep post-launch unless explicitly scoped. |
| Google Maps/routing -> Mileage | Disconnected/future | `docs/api/google-maps.md`, code search | No material Google Maps implementation found. | Future provider decision and route-authority risk. | Do not build during web stabilization. |
| Legal/support -> User account lifecycle | Connected, abuse review needed | Legal pages, support page, support ticket form, account deletion route | Authenticated support and deletion flows exist; legal boundary copy exists. | Public intake DB tables remain spam/abuse surfaces from Supabase docs. | Verify rate limits and public intake controls. |
| Mobile web -> Core flows | Unknown until rendered; high risk | Mobile UI docs, dense calculator/settings/Fit Check forms | Code uses responsive classes in many places. | No rendered mobile verification in this task; dense forms likely need cleanup. | Run mobile UI pass after P0 backend stability. |
| Capacitor/iOS/Android -> Core app | Scaffolded/platform future | `capacitor.config.ts`, `ios/`, absent `android/` | Capacitor and iOS project evidence exist. | Native support is not current priority; Android absent. | Wait until web app is stable. |

## Short Circuits To Avoid

- Do not make the public website call the app as a workaround. Use shared
  backend/API/profile truth.
- Do not let the primitive portal become the full product definition.
- Do not let Fit Check replace onboarding, billing, entitlement, or legal
  consent.
- Do not let Stripe price IDs define product authority.
- Do not let rollout phases become commercial tiers.
- Do not let Atlas become a subscription tier.
- Do not let admin scaffolds count as product features.
- Do not treat Sentry, PostHog, Redis, Resend, or diagnostics as
  customer-facing benefits.
- Do not treat Google Maps, IFTA, live navigation, or Pro/FleetOS as launch
  requirements.

## Most Important Broken Circuits

1. Calculator -> Saved Loads -> Loads Page is blocked by live schema divergence.
2. Fit Check -> Settings/Profile -> Expense/Vehicle is partially implemented
   but needs verification and source-of-truth cleanup.
3. Settings/Profile -> Vehicle Intelligence -> Calculator now has clearer
   source-of-truth naming, but is still blocked by missing vehicle/fuel/
   equipment fields remotely.
4. Billing/Entitlements -> Product Feature Walls is blocked by unresolved
   tier/rollout/entitlement vocabulary.
5. Admin -> Launch Control is protected but scaffolded, not complete.
6. Redis -> Rate Limits is disconnected, leaving provider/admin/billing/public
   routes without the desired durable control layer.

## Stabilization Order

1. Reconcile Supabase schema through the approved forward-only path.
2. Stabilize saved-load save/show/report behavior.
3. Clean profile source of truth across Settings, Fit Check, Expense, Vehicle,
   and portal.
4. Verify Fit Check hydration into settings and overhead; verify vehicle
   profile hydration after Supabase reconciliation.
5. Render-verify Expense and Vehicle mobile layouts after this grouping pass.
6. Clean Calculator mobile layout.
7. Resolve billing/tier/entitlement policy.
8. Add launch-control rate limits, admin visibility, and protected-route smoke
   tests.
