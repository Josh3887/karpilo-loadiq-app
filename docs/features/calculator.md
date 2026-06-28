# Karpilo LoadIQ Calculator

## Purpose

The Karpilo LoadIQ Calculator estimates load profitability before and during a
load. It preserves trucking business logic while staying mobile friendly.

The calculator is an operational planning surface. It is not a dispatch system,
broker system, tax system, ELD, legal routing authority, permit authority, or
guaranteed-profit system.

## Core Rule

Mobile-friendly layout must not remove calculator intelligence. Inputs may be
organized into sections, accordions, cards, or progressive steps, but the
underlying planning model must not lose required business logic.

The calculator must preserve:

- revenue inputs
- fuel surcharge logic
- mileage inputs
- Route Intelligence estimates
- planning-day assumptions
- date, time, and appointment-window inputs
- load weight
- fuel assumptions
- profitability results
- LoadIQ Intelligence explanation
- saved-load and actuals separation

## Revenue Inputs

The calculator must support revenue modeling from both RPM and gross-revenue
perspectives.

Required revenue inputs:

- gross revenue or load gross
- RPM mode versus gross mode
- linehaul revenue
- fuel surcharge amount
- whether fuel surcharge is included in gross

When the user chooses RPM mode, linehaul revenue is derived from paid loaded
miles multiplied by RPM. When the user chooses gross mode, load gross is the
entered revenue basis and fuel surcharge treatment determines whether FSC is
modeled inside or outside linehaul.

Accessorials, tolls, lumpers, fuel purchases, and DEF purchases belong to
saved-load and post-trip actuals unless a later approved branch explicitly
reintroduces them as planning inputs.

## Mileage Inputs

Paid loaded miles are user-entered and revenue-based. They come from the rate
confirmation, carrier agreement, broker agreement, dispatch source, or other
operator business record.

Mileage concepts must remain separate:

- Paid loaded miles: user-entered revenue miles.
- Deadhead miles: may be user-entered for planning.
- Google estimated deadhead miles: Route Intelligence planning estimate from
  deadhead origin to pickup.
- Google estimated loaded miles: Route Intelligence planning estimate from
  pickup through ordered P/U or DEL stops to delivery.
- Total estimated route miles: Google estimated deadhead miles plus Google
  estimated loaded miles when both are available.
- Mileage variance: estimated or actual miles minus paid loaded miles.

Google estimates must not silently overwrite paid loaded miles. If the UI
allows copying a Google estimate into paid loaded miles, that must be an
explicit user action.

## Required Date And Time Inputs

The calculator planning model must support these inputs:

- deadhead origin date and time
- pickup date and time
- delivery date and time
- each P/U or DEL stop date and time
- stop appointment window start
- stop appointment window end
- open-ended stop window support
- user override fields for estimated time and planning days

If a date exists but no exact appointment time or appointment window is set, the
calculator should treat it as an open-ended one-day planning window until the
user narrows it. If no date exists, the calculator must not silently invent a
schedule. It should show missing-schedule intelligence and let the user enter
dates.

## Stop Timing Rules

Route stops are freight stops only. Stops are typed as `P/U` or `DEL` and route
in the order entered. Stop labels are not required.

Each P/U or DEL stop can have:

- date and time
- appointment window start
- appointment window end
- open-ended window flag
- dwell, loading, or unloading time

The default dwell, loading, or unloading time is `2.00` hours unless the user
changes it.

Fuel and DEF purchases are not route stops. They belong in saved-load or
post-trip actuals.

## Google Route Intelligence Time Rule

Google route duration belongs to Route Intelligence. Google should display real
route time in human-readable form, such as `11h 59m`.

Google time may be converted into `0.25` hour increments for planning
suggestions. Google time is not forced truth, and the user can override
planning hours or planning days.

Example:

- Google returns `719` minutes.
- Route Intelligence display: `11h 59m`.
- Calculator planning suggestion: `12.00` hours.

## 50 MPH Planning Benchmark

The 50 mph rule is secondary to Google Route Intelligence. It is a standard
planning benchmark and fallback, not the primary route estimator when Google
time is available.

Use the 50 mph benchmark for:

- revenue leakage analysis
- time exposure estimation
- deadhead-day presets
- loaded-day or days-on-load presets
- fallback when Google duration is unavailable

Formula:

```text
planningHours = miles / 50
```

Then convert planning hours into planning days using the standard planning day.

## Standard Planning Day

The default planning day equals `10.00` driving/planning hours unless the user
overrides it.

Formula:

```text
planningDays = planningHours / 10
```

Examples:

- `500` deadhead miles / `50` mph = `10` hours = `1.00` deadhead day.
- `1,750` loaded miles / `50` mph = `35` hours = `3.50` loaded days.

These are presets, not forced truth.

## Deadhead Days

Deadhead days should be derived from:

- deadhead miles
- 50 mph benchmark
- standard 10-hour planning day
- user-entered deadhead start date and time when available
- Route Intelligence deadhead estimate as supporting context

User can override:

- deadhead planning hours
- deadhead days
- deadhead start date and time

## Loaded Days And Days On Load

Loaded days, also called days on load, should be derived from:

- paid loaded miles
- Google estimated loaded miles as supporting context
- 50 mph benchmark
- standard 10-hour planning day
- pickup date and time
- stop date/time/windows
- delivery date and time
- pickup/loading dwell
- stop dwell
- delivery/unloading dwell

User can override:

- loaded planning hours
- loaded days or days on load
- dwell assumptions
- appointment/window assumptions

## Time Increment Rules

Calculator planning time uses `0.25` hour increments.

- `0.25` hour = `15` minutes.
- Generated time suggestions should round to the nearest `0.25`.
- User inputs should allow `0.25` increments.
- Do not overwrite user-entered time values once changed.

Expected helper:

```ts
function roundHoursToQuarter(hours: number): number {
  return Math.round(hours * 4) / 4;
}
```

## User Override Rule

Any calculated time or day value is a suggestion. User-entered values are the
final planning authority.

Do not force these values over user-entered values:

- Google route time
- 50 mph benchmark
- default dwell time
- default days
- generated planning-hour suggestions

## Load Weight

Load weight or cargo weight is a required planning input.

Load weight supports:

- profitability context
- fuel exposure analysis
- route context
- equipment fit analysis
- future Trimble truck-specific routing

Load weight is not permit, legal, or compliance authority. It does not replace
scale tickets, bills of lading, certified gross weight records, permit review,
or operator compliance judgment.

Future Trimble truck-specific routing should use load weight together with
truck profile dimensions, gross weight, axle count, HAZMAT/load flags, routing
profile, and toll preference.

LoadIQ may later use load weight for fuel exposure, equipment fit, gross weight
warnings, and route intelligence.

## Fuel Inputs

The calculator must preserve fuel assumptions:

- EIA diesel baseline when available
- fuel price displayed as `x.xx`
- user fuel price override
- MPG
- fuel cost estimate

Fuel and DEF purchases belong to saved-load or post-trip actuals, not
calculator planning inputs.

## Route Intelligence Relationship

Route Intelligence supplies provider estimates to the calculator. The
calculator consumes those estimates as planning support.

Route mapping:

- deadhead origin -> pickup = deadhead estimate
- pickup -> P/U or DEL stops -> delivery = loaded route estimate
- Google route time and mileage are Route Intelligence outputs
- calculator consumes route estimates as planning support
- route estimates are decision support only

Route Intelligence outputs are not:

- truck-legal routing
- navigation
- HAZMAT routing authority
- permit authority
- height, weight, bridge, or restriction authority
- final settlement truth

## Saved Loads And Actuals Relationship

The calculator plans the load. Saved-load actuals capture what happened.

Post-trip end odometer belongs on Loads/Post Trip, not calculator planning.
Accessorials, tolls, lumpers, fuel purchases, and DEF purchases belong in
saved-load actuals. Actuals may later refine calculator assumptions, but they
must not silently rewrite the original planning inputs.

## Revenue Leakage Analysis

The calculator should use time and mileage assumptions to expose:

- unpaid deadhead exposure
- paid versus estimated loaded-mile variance
- route time exposure
- broad pickup/delivery windows
- days-on-load impact
- load revenue spread across time
- profitability confidence

Future AI/Atlas intelligence may explain:

- "This window is broad, but the route can likely be completed in less time."
- "Your planning days are conservative compared to estimated route time."
- "Deadhead time is consuming unpaid margin."

Do not build this AI behavior as part of this contract task. Treat it as future
intelligence.

## Product Boundaries

The calculator is decision support only. It is not:

- tax advice
- IFTA filing authority
- ELD
- legal routing
- compliance authority
- permit authority
- truck-legal routing
- broker, carrier, or dispatcher authority
- guaranteed-profit logic

## Current Implementation Evidence

Inspected code shows:

- `src/types/load.ts` and `src/lib/load-schema.ts` already define pickup,
  delivery, deadhead origin, route stops, paid loaded miles, deadhead miles,
  route estimate snapshots, dispatch days, deadhead days, date-only fields, and
  `estimatedLoadWeightLbs`.
- `src/components/calculator/load-input-form.tsx` renders route addresses,
  ordered P/U and DEL stops, paid loaded miles, deadhead miles, Google mileage
  estimates, raw estimated drive-time minutes, load status, dispatch days, and
  deadhead days.
- `src/services/route-intelligence/google-provider.ts` returns estimated
  duration minutes for deadhead, loaded, total, and route leg estimates.
- `src/components/dashboard/results-panel.tsx` renders revenue basis, fuel
  intelligence, mileage intelligence, LoadIQ intelligence, Atlas surface, and
  entitlement-gated weather surface.
- `src/services/save-load.ts` persists estimated load weight to
  `estimated_load_weight_lbs` when present and includes weight context in the
  equipment snapshot.
- Saved-load detail and report surfaces read saved date fields and estimated
  weight from snapshots/columns.

## Current Implementation Gaps

The current implementation does not yet expose or fully model:

- deadhead origin time of day
- pickup time of day
- delivery time of day
- stop date/time fields in the calculator UI
- stop appointment window start/end fields
- open-ended stop window flags
- pickup/loading dwell time
- delivery/unloading dwell time
- stop dwell time
- loaded planning hours
- deadhead planning hours
- explicit user override state for generated planning hours/days
- 50 mph benchmark-generated deadhead and loaded presets
- Google duration displayed as `11h 59m` instead of raw minutes
- visible calculator input for load weight, despite existing type/schema/save
  support

Existing snapshots appear sufficient for a V1 implementation pass because
`input_snapshot` and `result_snapshot` can carry the expanded planning model,
and `estimated_load_weight_lbs` already exists as a saved-load column in the
current app contract. First-class schema columns may be useful later for
analytics, filtering, reporting, or durable query performance, but schema work
should stay on a separate approved branch.

## Future Work

Recommended next implementation branch:

```text
fix/loadiq-calculator-time-weight-inputs
```

That branch should add the calculator UI/model support for date, time,
appointment windows, dwell defaults, load weight, 50 mph benchmark presets,
Google duration display formatting, and user override behavior.

Other separate future branches:

- first-class schema for time/window/load-weight analytics if needed
- Trimble truck-specific routing
- weather risk integration
- fuel gauge recovery
- GPS/location tracking
- AI/Atlas schedule and window analysis
