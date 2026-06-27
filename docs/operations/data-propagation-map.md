# LoadIQ Data Propagation Map

## Executive Summary

This audit traces the existing LoadIQ web app circuits without redesigning or
implementing new behavior. Confidence is high for the inspected code paths and
medium for live Supabase behavior because this pass did not query or mutate the
remote database.

The main operating circuit is present:

`Settings/Profile -> Expense Intelligence -> Vehicle Intelligence -> Pay Templates -> Calculator Defaults -> Calculator -> Saved Load -> Loads/Detail/Report`

The strongest source of truth is the protected Settings operating profile. It
is assembled from `users`, `user_settings`, `truck_profiles`,
`pay_structure_templates`, `user_overhead_items`, and the Fit Check snapshot in
`operator_profiles.profile_snapshot`.

The highest-risk circuit gap is still Supabase schema divergence. Current app
code references optional fields that the live audit documented as absent:
`truck_profiles.fuel_tank_count`, `truck_profiles.fuel_tank_capacity_gallons`,
`saved_loads.fuel_gauge_snapshot`, `saved_loads.equipment_context_snapshot`,
portal tables, and Atlas/AI add-on structures. The saved-load path has a narrow
compatibility fallback for missing optional snapshot columns, but full snapshot
persistence remains blocked until the approved Supabase reconciliation is
applied and verified.

The second major issue is duplicated profile/default loading. The calculator
page loads defaults into the Zustand calculator store, and the calculator form
also calls `getCalculatorDefaults()` and writes the same values into form state.
Both paths use the same service source, so this is not currently a competing
business model, but it is duplicated wiring.

The third issue is disconnected or scaffolded fields. Some typed calculator
fields and demo values exist without a complete production UI or report
consumer. Examples include `carrierLoadId`, `dispatcherReference`,
`routeLoadedMiles`, `actualLoadedMiles`, `routeDeadheadMiles`,
`actualDeadheadMiles`, and parts of the portal profile bridge. These should be
classified as scaffolded until a later wiring branch assigns clear ownership.

No implementation changes are made by this document.

## Source Of Truth Matrix

| Data object | Source | Owner | Consumers | Persistence | Dependencies | Current status |
| --- | --- | --- | --- | --- | --- | --- |
| Driver/operator profile | Settings operating profile form; Fit Check can hydrate reusable fields | Authenticated user | Settings summary, Fit Check review, calculator defaults, saved-load context | `users`, `operator_profiles.profile_snapshot` | Supabase auth, RLS | CONNECTED with duplicate company/display fields |
| Company profile | Settings operating profile and portal settings bridge | Authenticated user | Settings summary, portal access forms, saved profile context | `users.company_name`, `operator_profiles.profile_snapshot`, `profiles.company_name` | Portal tables for bridge path | DUPLICATED |
| Operating targets | Settings operating profile, Fit Check hydration | Authenticated user | Calculator defaults, target true RPM, result scoring, profile value snapshot | `user_settings`, `operator_profiles` fallback fields | Supabase auth, RLS | CONNECTED |
| Truck profile | Settings vehicle profile; Fit Check hydration attempts | Authenticated user | Vehicle Intelligence, calculator defaults, saved-load equipment context | `truck_profiles` | Missing live fuel/equipment columns | PARTIALLY CONNECTED/BLOCKED |
| Trailer/equipment profile | Settings vehicle profile; Fit Check hydration attempts | Authenticated user | Vehicle Intelligence, calculator default merge, Atlas route/freight surfaces, saved-load snapshots | `truck_profiles`, `input_snapshot`, optional `equipment_context_snapshot` | Missing live equipment context schema | PARTIALLY CONNECTED/BLOCKED |
| Fuel assumptions | Settings MPG and tank fields, calculator EIA/manual fuel price, load lifecycle fuel gauge value | Authenticated user for profile; public EIA data for estimate | Calculator, fuel gauge, saved-load flattened fuel fields, reports | `truck_profiles`, `saved_loads`, `input_snapshot`, optional `fuel_gauge_snapshot` | EIA service availability, missing live tank/snapshot columns | PARTIALLY CONNECTED/BLOCKED |
| Fixed expenses | Expense Intelligence overhead manager; Fit Check overhead hydration | Authenticated user | Calculator defaults, overhead summaries, saved-load cost snapshots | `user_overhead_items`; derived daily overhead in snapshots | Supabase auth, RLS | CONNECTED |
| Variable expenses | Settings profile defaults plus overhead CPM/percent items | Authenticated user | Calculator defaults, calculator cost breakdown, saved-load snapshots | `user_settings`, `user_overhead_items`, `input_snapshot`, `result_snapshot` | Supabase auth, RLS | CONNECTED |
| Insurance/compliance/admin costs | Settings defaults and overhead categories | Authenticated user | Expense Intelligence, calculator fixed/variable cost assumptions | `user_settings`, `user_overhead_items` | Category semantics are app-level, not legal/tax advice | CONNECTED with boundary risk |
| Pay templates | Settings operating profile form | Authenticated user | Calculator defaults, driver pay calculation, saved-load pay snapshot | `pay_structure_templates`, `input_snapshot`, `pay_structure_snapshot` | Supabase auth, RLS | CONNECTED |
| Calculator defaults | `getCalculatorDefaults()` from profile and overhead services | Application services | Dashboard calculator store, calculator form, calculator engine | React/Zustand state; no independent DB row | Operational profile and overhead services | PARTIALLY CONNECTED due duplicated loader |
| Calculator inputs | Calculator form, saved-load edit hydration, lane template hydration | Authenticated user | Calculator engine, save-load service, snapshots | React Hook Form, `LoadInput`, `input_snapshot` | Zod schema, defaults, optional EIA lookup | CONNECTED with scaffolded fields |
| Calculator outputs | `calculateLoadMetrics()` | Application calculator engine | Results panel, saved-load service, reports, dashboard history | Zustand state, `result_snapshot`, flattened saved_load columns | Calculator input schema | CONNECTED |
| Saved load estimate | Save Load action from current input/result | Authenticated user | Loads page, load detail, report, lane templates, edit estimate | `saved_loads`, `saved_load_stops`, snapshots | Entitlement gate, Supabase schema | CONNECTED with optional-column fallback |
| Saved load actuals | Load detail post-trip actuals form | Authenticated user | Detail actual result, report actual result, post-trip rollups | `saved_loads.actuals_snapshot`, `post_trip_actuals` | Supabase auth, RLS | CONNECTED |
| Lane templates | Saved load detail action from `input_snapshot` | Authenticated user | Calculator initial values | `lane_templates.input_snapshot` | Saved-load input compatibility | CONNECTED |
| Dashboard summaries | Saved-load history and calculator runtime state | Application UI | Dashboard/history widgets, billing usage counts | `saved_loads`, local store | Supabase auth, entitlements | CONNECTED |
| Reports | Saved load detail/report page | Authenticated user with export entitlement | Print/export-style report | Reads `saved_loads`, `saved_load_stops`, snapshots | Billing entitlement gate | CONNECTED, gated |
| Billing gates | Subscription records, usage events, saved load counts | Billing/domain layer | Calculator access, save/load, templates, exports, scenario/weather gates | `subscriptions`, `usage_events`, `saved_loads` | Stripe/manual records, test harness gate | CONNECTED with unresolved tier conflict |
| Portal profile/access | Portal settings and public Fit Check form | Authenticated user | Portal server bridge, launch/legal access surfaces | `profiles`, `portal_access`, `billing_accounts`, `fit_checks`, `legal_acceptances` | Missing live portal tables | BLOCKED/SEPARATE |

## Field-Level Propagation Notes

| Field group | Origin | Stored in | Owner | Edited by | Consumed by | Calculations/reports/snapshots | Circuit notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Driver name/profile name | Settings operating profile, Fit Check reusable snapshot | `users.profile_name`, `operator_profiles.profile_snapshot` | User | Settings vehicle/profile form; Fit Check hydration | Settings summary, profile context | Saved indirectly through profile values and snapshots | DUPLICATED with portal `profiles.full_name` path |
| Company name | Settings and portal settings | `users.company_name`, `operator_profiles.profile_snapshot`, `profiles.company_name` | User | Settings operating profile; portal settings | Settings summary, portal server | Profile snapshot only; not calculator math | DUPLICATED |
| Operation type | Settings/Fit Check | `users.operation_type`, snapshot | User | Settings, Fit Check hydration | Settings summary, Vehicle page | Profile context only | CONNECTED |
| Income target | Settings/Fit Check goals | `user_settings`, `operator_profiles` fallback | User | Settings target profitability, Fit Check hydration | Calculator defaults, profile-derived values | Drives target daily/weekly and scoring context | CONNECTED |
| Minimum true RPM | Settings/Fit Check result-derived guardrail | `user_settings`, `operator_profiles` fallback | User | Settings, Fit Check hydration | Calculator defaults, result comparisons | Stored in `target_true_rpm_snapshot` on save | CONNECTED |
| Minimum hourly profit | Settings | `user_settings` | User | Settings | Calculator profile-derived values | Input snapshot only; weak report consumer | PARTIALLY CONNECTED |
| Operating days per week/month | Settings/Fit Check | `user_settings`, `operator_profiles` fallback | User | Settings, Fit Check hydration | Overhead manager, calculator defaults | Daily overhead derivation, saved profile values | CONNECTED |
| Truck make/model/year/engine/odometer | Settings vehicle profile | `truck_profiles` | User | Settings vehicle/profile form | Settings vehicle summary | Mostly context, not calculator math | PARTIALLY CONNECTED |
| Default MPG | Settings/Fit Check | `truck_profiles.default_mpg`, fallback snapshot | User | Settings, Fit Check hydration, calculator temporary override | Calculator, fuel cost, fuel gauge | Flattened saved-load fuel fields and input snapshot | CONNECTED |
| Fuel tank count/capacity | Settings and calculator defaults | Intended `truck_profiles` and `saved_loads.fuel_gauge_snapshot` | User | Settings, calculator load lifecycle | Fuel gauge, saved-load snapshot | Optional snapshot only; live schema missing | BLOCKED with fallback |
| Equipment type/pack/combination | Settings vehicle profile, Fit Check | `truck_profiles`, `input_snapshot`, optional equipment snapshot | User | Settings, Fit Check hydration, calculator defaults | Calculator context, Atlas surfaces, reports/detail context | Not core profitability math | PARTIALLY CONNECTED/BLOCKED |
| Trailer dimensions/type/division | Settings vehicle profile | `truck_profiles`, `input_snapshot` | User | Settings | Vehicle Intelligence, calculator default merge, saved snapshots | Context only; not compliance authority | PARTIALLY CONNECTED |
| Weight/capability fields | Settings and calculator form estimated load weight | `truck_profiles`, `saved_loads.estimated_load_weight_lbs`, snapshots | User | Settings, calculator | Atlas route detail, report context | Estimated only; not certified scale/compliance | PARTIALLY CONNECTED |
| Specialized capabilities/securement/route notes | Settings | `truck_profiles`, snapshots | User | Settings | Atlas/vehicle context | Stored only where schema exists | BLOCKED on missing live columns |
| Fixed overhead rows | Expense Intelligence, Fit Check hydration | `user_overhead_items` | User | Overhead manager, Fit Check hydration | Calculator defaults, overhead UI | Daily/monthly/weekly/annual overhead; saved snapshots | CONNECTED |
| Subscription expense row | Derived from active subscription unless manually entered | Synthetic row from `subscriptions`, not user row | App service | Not directly edited | Expense Intelligence, calculator defaults | Affects overhead if active | CONNECTED with billing dependency |
| CPM/percent overhead rows | Expense Intelligence | `user_overhead_items` | User | Overhead manager | Calculator defaults | Variable CPM and factoring/percent deductions | CONNECTED |
| Reserve/maintenance/tire/trailer/insurance defaults | Settings profile | `user_settings` | User | Settings profile form | Calculator defaults, calculator form overrides | Input/result snapshots | CONNECTED |
| Dispatch/factoring percentages | Settings profile plus percent overhead rows | `user_settings`, `user_overhead_items` | User | Settings, overhead manager | Calculator defaults and engine | Cost breakdown, saved snapshots | CONNECTED |
| Pay template type/chain/basis/period | Settings profile pay template editor | `pay_structure_templates` | User | Settings | Calculator defaults, driver pay calculation | `pay_structure_snapshot`, result driver pay | CONNECTED |
| Load ID/display number | Calculator form and save service | `saved_loads.load_id`, `loadiq_load_number`, `driver_load_number` | App plus user display input | Calculator load identity | History/detail/report | Flattened saved-load columns | CONNECTED |
| Carrier load ID/dispatcher reference | Schema/demo only from inspected production UI | `input_snapshot` if present | Unknown | Not clearly surfaced in production UI | No clear consumer | Demo data only observed | SCAFFOLDED/UNKNOWN |
| Pickup/delivery/deadhead origin | Calculator form | `saved_loads`, `saved_load_stops`, `input_snapshot` | User | Calculator | Engine, route stops, detail/report | Lane, route stop records, report route context | CONNECTED |
| Loaded/deadhead miles | Calculator form | `saved_loads`, `input_snapshot`, result snapshot | User | Calculator | Calculator engine, detail/report, Atlas route | Fuel, RPM, true RPM, deadhead percent | CONNECTED |
| Route/actual loaded/deadhead miles | Schema/demo values | `input_snapshot` if present | Unknown | No clear production UI found | No clear engine/report consumer found | Not observed in main save/report path | SCAFFOLDED |
| Route stops | Calculator stop editor | `saved_load_stops`, `input_snapshot` | User | Calculator | Route model, detail/report, save service | Stop revenue/expense included through accessorial inputs if entered there; stops are route context | CONNECTED |
| Dispatch/deadhead dates and days | Calculator form | `input_snapshot`, `result_snapshot`, flattened saved load | User | Calculator | Engine, detail/report, Atlas route | Daily overhead, daily profitability, report dates | CONNECTED |
| Pay period dates | Calculator form | `input_snapshot` | User | Calculator | No clear report/engine consumer in inspected paths | Snapshot only | PARTIALLY CONNECTED |
| Revenue mode/gross/RPM/FSC | Calculator form | `saved_loads`, `input_snapshot`, `result_snapshot` | User | Calculator | Engine, results, history/detail/report | Gross, linehaul, revenue per mile, net | CONNECTED |
| Fuel price/source metadata | EIA service or manual override | `saved_loads`, `input_snapshot`, `result_snapshot` | EIA/manual user | Calculator | Engine, detail/report, saved load fuel source | Fuel cost, fuel percent, report fuel source | CONNECTED with external availability risk |
| Accessorial items | Calculator form local state | `input_snapshot`, `result_snapshot` | User | Calculator | Calculator engine | Revenue/expense/reimbursement calculations | CONNECTED |
| Load status and pulled reason | Calculator lifecycle controls/results save panel | `saved_loads.status`, `load_status_reason`, `input_snapshot` | User/app | Calculator form/results save panel, load detail outcome form | History/detail/report | Status and outcome display | CONNECTED |
| Starting fuel percent | Calculator lifecycle controls/results save panel | `input_snapshot`, optional fuel snapshot | User | Calculator form/results panel | Fuel gauge | Optional snapshot blocked in live schema | PARTIALLY CONNECTED/BLOCKED |
| Calculator results | Calculator engine | Zustand store, `result_snapshot`, flattened saved-load fields | App engine | Recomputed from inputs | Results panel, save service, history/detail/report | Profitability score/band, true RPM, costs, warnings | CONNECTED |
| Saved-load input snapshot | Save service | `saved_loads.input_snapshot` | User/app | Save Load | Edit estimate, lane templates, reports/detail context | Rehydrates calculator | CONNECTED |
| Saved-load result snapshot | Save service | `saved_loads.result_snapshot` | App engine | Save Load | Detail/report | Report metrics and explanations | CONNECTED |
| Saved-load actuals | Load detail actuals form | `saved_loads.actuals_snapshot`, `post_trip_actuals` | User | Load detail | Detail/report actuals | Actual net, actual expense total, variance | CONNECTED |
| Weather profitability snapshot | Results panel gated by Pro-like entitlement | `saved_loads.weather_profitability_snapshot` if allowed | App/user | Results panel | Saved load/detail future use | Not central to core circuit | PARTIALLY CONNECTED with tier conflict |
| Lane template input | Saved-load detail action | `lane_templates.input_snapshot` | User | Saved load detail | Calculator initial values | Reuses prior load structure | CONNECTED |
| Billing entitlement | Subscription records and usage events | `subscriptions`, `usage_events`, `saved_loads` count | Billing domain | Stripe/manual/test harness code | Calculate/save/export/template/weather gates | Feature access gates | CONNECTED with unresolved tier semantics |
| Portal settings/legal access | Portal forms and public Fit Check form | `profiles`, `portal_access`, `fit_checks`, `legal_acceptances` | User/app | Portal settings/public Fit Check | Portal server/access views | Not calculator source | BLOCKED live; separate from operating profile |

## Circuit Map

| Connection | Status | Evidence | Risk |
| --- | --- | --- | --- |
| Fit Check -> `operator_profiles.profile_snapshot` | CONNECTED | `saveLoadIqProfileSnapshot()` writes reusable snapshot and optional saved results | Sensitive financial result opt-in must stay explicit |
| Fit Check -> Settings operating profile | PARTIALLY CONNECTED | `hydrateSettingsFromFitCheck()` builds `OperationalProfile` and overhead rows | Vehicle/equipment columns degrade when live schema is missing |
| Fit Check -> Expense Intelligence | CONNECTED | Fit Check overhead rows replace only known Fit Check labels in `user_overhead_items` | Overwrite semantics are scoped but should stay documented |
| Fit Check -> Vehicle Intelligence | PARTIALLY CONNECTED/BLOCKED | Attempts to write truck/equipment fields through `saveOperationalProfile()` | Missing live `truck_profiles` columns block full hydration |
| Settings operating profile -> Expense Intelligence | CONNECTED | Overhead manager reads operating days and overhead services | `deleteOverheadItem()` relies on RLS for ownership scoping |
| Settings operating profile -> Vehicle Intelligence | CONNECTED | Vehicle page and form read/write `truck_profiles` through operational profile service | Live schema blocks newer fuel/equipment fields |
| Expense Intelligence -> Calculator Defaults | CONNECTED | `getCalculatorDefaults()` derives overhead, CPM, percent deductions | Subscription synthetic expense couples billing state into overhead |
| Vehicle Intelligence -> Calculator Defaults | PARTIALLY CONNECTED | `getCalculatorDefaults()` and Zustand merge equipment/fuel defaults | Newer vehicle fields blocked remotely |
| Pay Templates -> Calculator | CONNECTED | Default pay template becomes `payStructure` and affects driver pay | Pay period fields are weakly consumed |
| Calculator Defaults -> Calculator form | PARTIALLY CONNECTED/DUPLICATED | Page store and form both call/load defaults | One source service, two state owners |
| Calculator -> Results Panel | CONNECTED | Zustand stores `lastInput` and `result` | None found in this pass |
| Results Panel -> Saved Load | CONNECTED | `saveLoad()` stores flattened fields and snapshots | Optional snapshot fallback hides only known missing-column gap |
| Saved Load -> Loads page/history | CONNECTED | History page reads `saved_loads` by `user_id` | Depends on RLS and status schema |
| Saved Load -> Load detail | CONNECTED | Detail page reads `saved_loads`, stops, snapshots, actuals | None found in this pass |
| Saved Load -> Report | CONNECTED/GATED | Report page checks `canExport` before reading saved load | Billing tier conflict affects access semantics |
| Saved Load -> Calculator edit | CONNECTED | `getSavedLoadInput()` validates `input_snapshot` | Old/incompatible snapshots can fail rehydrate |
| Saved Load -> Lane Template | CONNECTED | `createLaneTemplateFromSavedLoad()` saves `input_snapshot` | Requires snapshot compatibility |
| Post-trip actuals -> Detail/Report | CONNECTED | Actuals form writes `actuals_snapshot` and `post_trip_actuals` | Does not back-propagate to original estimate by design |
| Billing gates -> Calculator/save/export | CONNECTED | Entitlement service gates calculate, save, export, templates, weather, scenario | Silver/Gold/Platinum/Pro conflict remains unresolved |
| Portal settings -> Operating profile | DISCONNECTED | Portal `profiles`/`portal_access` are not calculator defaults | Naming overlap can confuse ownership |
| Supabase profile persistence -> Current live remote | BLOCKED/PARTIAL | Reconciliation docs show missing portal/fuel/equipment/schema pieces | Blocks full deployment/db push |

Text circuit view:

```text
Fit Check
  -> operator_profiles.profile_snapshot [CONNECTED]
  -> Settings operating profile hydration [PARTIALLY CONNECTED/BLOCKED]
  -> Fit Check overhead rows [CONNECTED]

Settings/Profile
  -> user_settings/truck_profiles/pay_structure_templates [PARTIALLY CONNECTED/BLOCKED]
  -> Expense Intelligence [CONNECTED]
  -> Vehicle Intelligence [PARTIALLY CONNECTED/BLOCKED]
  -> Calculator Defaults [CONNECTED]

Expense Intelligence
  -> user_overhead_items [CONNECTED]
  -> fixed/CPM/percent default derivation [CONNECTED]
  -> Calculator form/store defaults [PARTIALLY CONNECTED/DUPLICATED]

Vehicle Intelligence
  -> truck_profiles [PARTIALLY CONNECTED/BLOCKED]
  -> equipment/fuel/weight context [PARTIALLY CONNECTED]
  -> saved-load optional equipment/fuel snapshots [BLOCKED with fallback]

Pay Templates
  -> calculator payStructure [CONNECTED]
  -> saved-load pay_structure_snapshot [CONNECTED]

Calculator
  -> result [CONNECTED]
  -> saved_loads/input_snapshot/result_snapshot [CONNECTED]
  -> saved_load_stops [CONNECTED]
  -> lane_templates [CONNECTED]

Saved Loads
  -> Loads page/history [CONNECTED]
  -> Load detail [CONNECTED]
  -> Report [CONNECTED/GATED]
  -> post-trip actuals [CONNECTED]
  -> Dashboard/billing usage counts [CONNECTED]
```

## Duplication Matrix

| Duplicated state | Competing owners | Evidence | Impact | Recommendation |
| --- | --- | --- | --- | --- |
| Company/name profile | App operating profile and portal profile | `users`, `operator_profiles.profile_snapshot`, `profiles` | User-facing naming can diverge | Keep Settings operating profile as app source; label portal bridge separately |
| Calculator defaults | Dashboard store and calculator form | `DashboardClientPage` sets Zustand defaults; `LoadInputForm` calls `getCalculatorDefaults()` | Double-load and possible stale form/store mismatch | Create a focused wiring branch to centralize calculator default hydration |
| Fit Check overhead vs manual overhead | Fit Check hydration and user-created overhead rows | Fit Check deletes/replaces only known Fit Check labels | Re-running Fit Check can change derived overhead rows | Keep labels scoped; add UI explanation if needed |
| Fuel/tank values | Settings profile, calculator override, optional saved snapshot | `truck_profiles`, form hidden fields, `fuel_gauge_snapshot` | Live schema blocks complete profile persistence | Apply forward Supabase reconciliation before relying on full snapshots |
| Equipment context | Settings profile, calculator defaults, Atlas surfaces, optional snapshot | `truck_profiles`, `input_snapshot`, `equipment_context_snapshot` | Context can exist in snapshot but not profile table remotely | Apply reconciliation, then verify profile -> saved snapshot propagation |
| Billing/tier labels | Entitlement code, pricing config, docs | Silver/Gold/Platinum/Pro scaffolding | Access gates may imply unresolved commercial tiers | Resolve billing tier reconciliation before public launch claims |
| Portal access state vs billing access | Portal tables and subscription entitlements | `portal_access`, `billing_accounts`, `subscriptions` | Rollout/access states can be mistaken for paid tiers | Keep rollout, governance, tier, entitlement separate |

## Dead-End Inputs

| Input/value | Where found | Current destination | Status | Notes |
| --- | --- | --- | --- | --- |
| `carrierLoadId` | `LoadInput`, schema, demo data | No inspected production UI/report consumer | SCAFFOLDED | Decide whether this is broker/carrier reference or remove from active form model later |
| `dispatcherReference` | `LoadInput`, schema, demo data | No inspected production UI/report consumer | SCAFFOLDED | Do not add dispatch feature semantics without product approval |
| `routeLoadedMiles` | Schema/types/demo | No main engine/report consumer found | SCAFFOLDED | Might be future route-vs-actual split |
| `actualLoadedMiles` | Schema/types/demo | No main engine/report consumer found | SCAFFOLDED | Actual miles currently handled by post-trip actuals only at cost level |
| `routeDeadheadMiles` | Schema/types/demo | No main engine/report consumer found | SCAFFOLDED | Current deadhead source is `deadheadMiles` |
| `actualDeadheadMiles` | Schema/types/demo | No main engine/report consumer found | SCAFFOLDED | Actual route reconciliation not wired |
| Pay period start/end | Calculator form | `input_snapshot`; no clear result/report math | PARTIALLY CONNECTED | Pay template period semantics exist, but report usage is thin |
| Portal plan interest | Portal settings/public forms | Portal tables | BLOCKED/SEPARATE | Not a commercial tier entitlement source |
| Weather profitability snapshot | Results panel Pro-like gate | Optional save field | PARTIALLY CONNECTED | Tier conflict and snapshot consumers need later audit |

## Missing Propagation

| Missing propagation | Expected direction | Current blocker | Recommended branch |
| --- | --- | --- | --- |
| Fuel tank profile to persistent saved fuel snapshot | Settings -> Calculator -> Saved Load -> Report | Missing live fuel tank and fuel snapshot columns | `fix/loadiq-supabase-forward-reconciliation-application` |
| Equipment context to persistent saved equipment snapshot | Settings -> Calculator -> Saved Load -> Detail/Report | Missing live equipment snapshot and truck profile columns | `fix/loadiq-supabase-forward-reconciliation-application` |
| Portal profile to app operating profile | Portal bridge -> Settings operating profile | Portal tables absent and ownership boundary unclear | `fix/loadiq-portal-profile-boundary` after Supabase reconciliation |
| Calculator default hydration ownership | Settings -> one calculator default owner -> form/store | Duplicate state owner in form and Zustand store | `fix/loadiq-calculator-default-hydration` |
| Route-vs-actual mile fields | Calculator estimate -> actual reconciliation/report | Fields exist but no primary consumer found | `fix/loadiq-route-actual-mileage-wiring` only if product-approved |
| Pay period fields to reports | Pay template/load input -> report/pay review | Snapshot only, no clear report math | `fix/loadiq-pay-period-report-context` |
| Weather profitability snapshot reporting | Weather panel -> saved load -> report/detail | Entitlement/tier conflict and consumer thinness | Wait for billing reconciliation |
| Billing tier semantics to feature gates | Product tiers -> entitlement code -> UI claims | Silver/Gold/Platinum/Pro conflict unresolved | `fix/loadiq-billing-tier-entitlement-alignment` |

## Circular Dependencies

| Loop | Evidence | Risk | Status |
| --- | --- | --- | --- |
| Fit Check -> Settings -> Fit Check input hydration | Fit Check snapshot hydrates Settings; `applyProfileToFitCheckInput()` can hydrate Fit Check input from saved snapshot | User may expect Settings edits to backfill every Fit Check answer, but only snapshot/profile paths are wired | PARTIALLY CONNECTED |
| Expense Intelligence -> Calculator defaults -> saved-load actuals comparison | Overhead defaults feed estimates; post-trip actuals compare against estimate but do not update overhead profile | Actual trip cost does not teach operating profile automatically | INTENTIONAL/DISCONNECTED |
| Billing subscription -> synthetic overhead -> calculator profitability | Active subscription can appear as operating expense and billing also gates save/export | Billing access affects both product availability and expense model | CONNECTED with product-claim risk |
| Calculator snapshot -> lane template -> calculator | Saved input becomes template and rehydrates calculator | Old snapshots may fail schema validation | CONNECTED with compatibility risk |

## Recommended Wiring Order

1. `fix/loadiq-supabase-forward-reconciliation-application`
   - Apply and verify the already designed forward-only reconciliation before
     depending on fuel/equipment snapshots, portal tables, or Atlas add-on
     structures.
   - Do not run blind `supabase db push`.

2. `fix/loadiq-calculator-default-hydration`
   - Centralize calculator default loading so Settings/Profile values have one
     runtime owner before reaching the form and calculator store.
   - Preserve formulas and saved-load stabilization.

3. `fix/loadiq-profile-portal-boundary`
   - Clarify whether portal `profiles`/`portal_access` are only portal bridge
     records or should hydrate app operating profile fields.
   - Do not treat rollout phase, plan interest, or portal status as paid tier
     entitlement.

4. `fix/loadiq-billing-tier-entitlement-alignment`
   - Resolve Silver/Gold/Platinum/Pro scaffolding and public claims before
     expanding feature gates or report/export claims.

5. `fix/loadiq-saved-load-report-context`
   - After schema reconciliation, add report/detail consumers for fuel gauge and
     equipment context snapshots where useful.
   - Keep reports framed as estimates and operational summaries.

6. `fix/loadiq-route-actual-mileage-wiring`
   - Only after product approval, decide whether route-vs-actual mileage fields
     are real feature inputs, saved-load actual fields, or dead schema.

7. `fix/loadiq-fitcheck-settings-roundtrip`
   - Decide whether Settings should backfill Fit Check intake fields beyond
     current snapshot reuse, or whether Fit Check remains an intake/review path.

## Audit Coverage

Inspected documentation:

- `AGENTS.md`
- `docs/operations/core-flow-circuit-map.md`
- `docs/operations/feature-state-classification.md`
- `docs/operations/build-readiness-roadmap.md`
- `docs/operations/open-risk-register.md`
- `docs/product/product-charter.md`
- `docs/product/feature-boundaries.md`
- `docs/testing/regression-checklist.md`
- `docs/operations/supabase-reconciliation-plan.md`
- `docs/operations/supabase-forward-reconciliation-design.md`

Inspected source areas:

- Fit Check: `src/lib/fitcheck.ts`, `src/services/fitcheck-profile.ts`,
  `src/components/fitcheck/fitcheck-intake.tsx`,
  `src/app/(dashboard)/dashboard/settings/fitcheck/page.tsx`
- Settings/Profile and operating profile:
  `src/services/operational-profile.ts`,
  `src/components/dashboard/operational-profile-form.tsx`,
  `src/app/(dashboard)/dashboard/settings/page.tsx`,
  `src/app/(dashboard)/dashboard/settings/vehicle/page.tsx`
- Expense Intelligence: `src/services/overhead-items.ts`,
  `src/components/dashboard/overhead-manager.tsx`,
  `src/app/(dashboard)/dashboard/settings/expenses/page.tsx`
- Calculator: `src/lib/load-schema.ts`, `src/types/load.ts`,
  `src/services/calculator-defaults.ts`,
  `src/hooks/use-load-calculator.ts`,
  `src/components/calculator/load-input-form.tsx`,
  `src/domains/calculator/calculator-engine.ts`
- Saved Loads and reports: `src/services/save-load.ts`,
  `src/services/saved-load-actions.ts`,
  `src/services/saved-load-input.ts`,
  `src/services/saved-load-schema-compatibility.ts`,
  `src/services/route-intelligence.ts`,
  `src/services/post-trip-actuals.ts`,
  `src/app/(dashboard)/dashboard/history/page.tsx`,
  `src/app/(dashboard)/dashboard/history/[id]/page.tsx`,
  `src/app/(dashboard)/dashboard/history/[id]/report/page.tsx`
- Lane templates: `src/services/lane-templates.ts`,
  `src/app/(dashboard)/dashboard/templates/page.tsx`
- Billing gates: `src/domains/billing/entitlement-service.ts`,
  `src/domains/billing/server-entitlements.ts`,
  `src/domains/billing/client-entitlements.ts`
- Portal bridge: `src/components/settings/SettingsForm.tsx`,
  `src/services/app-user-profile.ts`, `src/lib/portal/server.ts`
- Supabase schema evidence: current migrations and reconciliation docs for
  `operator_profiles`, `user_settings`, `truck_profiles`,
  `pay_structure_templates`, `user_overhead_items`, `saved_loads`,
  `saved_load_stops`, `post_trip_actuals`, `lane_templates`, portal tables,
  fuel/equipment snapshot columns, RLS, and policy expectations.

## Current Gate

The core saved-load circuit is no longer a blank or disconnected path, but
deployment remains gated by the Supabase reconciliation and billing/tier
alignment work documented elsewhere. This audit should be used to select narrow
implementation branches, not as approval to expand product scope.
