# Route Intelligence

## Purpose

Route Intelligence adds address verification and route mileage planning context
to the calculator without replacing the user's revenue, settlement, or
post-trip records. V1 uses Google for address validation and standard driving
route estimates across deadhead origin, pickup, user-ordered stops, and
delivery. Future truck-specific routing and movement tracking remain separate
concepts.

API details are documented in
[Route Intelligence API Contract](../api-contracts/route-intelligence.md).

## Mileage Terms

LoadIQ keeps these mileage concepts separate:

- Paid loaded miles: user-entered revenue miles from the rate confirmation,
  broker/carrier agreement, or dispatch source.
- Google estimated deadhead miles: planning mileage from a deadhead origin to
  pickup when the user provides a deadhead origin.
- Google estimated loaded miles: planning mileage from pickup through
  user-ordered stops to delivery.
- Total Google estimated route miles: deadhead estimate plus loaded estimate
  when both are available, or loaded estimate only when no deadhead origin is
  provided.
- Future Trimble truck-specific miles: planned post-launch truck-aware route
  mileage.
- Future tracked movement miles: movement-based estimates from browser,
  native mobile, ELD, telematics, or later integrations.
- Running-load odometer context: origin odometer captured only while a load is
  running, with end odometer and actual mileage validation captured later in
  saved-load post-trip actuals.

## Paid Loaded Miles

Paid loaded miles are authoritative for revenue modeling. They remain
user-entered and must not be silently overwritten by provider estimates. If the
UI lets a user copy an estimate into paid loaded miles, that must be an explicit
user action.

## Google Estimated Route Miles

Google estimated route miles are planning estimates only. Loaded estimates are
stored separately from paid loaded miles using `routeLoadedMiles` and the
`routeEstimate` snapshot. Deadhead estimates are stored separately through
`routeDeadheadMiles` and `routeEstimate.deadheadEstimate`. Google estimates do
not define settlement miles, truck legality, reimbursement, toll legality,
permit legality, or final trip truth.

## Deadhead, Stops, And Total Estimate

The route model supports:

- Suggested deadhead origin from the previous saved/running/completed delivery
  destination when existing saved-load data is available.
- Deadhead origin to pickup estimate when the user provides a deadhead origin.
- Pickup to optional stops to delivery estimate.
- Optional stops are freight stops only. Each stop is typed as `P/U` or `DEL`;
  user-facing stop labels are not required or stored as primary route input.
- Stop routing in the exact order entered by the user. Route Intelligence does
  not optimize stop order because freight stop order matters.
- Total Google estimated route miles and drive time from deadhead plus loaded
  legs when a complete deadhead estimate exists.
- Fuel and DEF purchases are not route stops. They belong in saved/running load
  actuals.

Suggested previous-delivery deadhead origin is a default only. Users can edit
or clear it, and LoadIQ must not overwrite user-entered deadhead origin values.

## Running-Load Odometer Validation

Odometer validation is a user-entered truth source for active and post-trip
load workflows. It supports:

- `originOdometer`
- `endOdometer`
- `actualTotalMiles`
- `odometerVarianceVsEstimated`
- `odometerVarianceVsPaid`

Origin odometer entry is allowed only when the load status is `running`.
Planned, booked, and dispatched loads do not allow odometer input. End
odometer belongs in the saved-load detail/post-trip actuals workflow. Completed
or ran loads may show locked odometer summary values if values were captured
previously.

The end odometer from a previous running/completed load may be suggested as the
next origin odometer, but it must never be forced.

Odometer validation must remain separate from paid mileage, provider estimates,
ELD records, tax records, legal records, and compliance records.

## Fuel And DEF Purchases

Saved/running load actuals support diesel fuel and DEF purchase entries through
existing snapshot structures. Purchase fields include city, state, gallons,
price per gallon, calculated total, purchase date, and optional vendor/note
context where the existing post-trip expense pattern supports it.

DEF gallons remain separate from diesel fuel metrics and must not be mixed into
diesel MPG calculations.

Fuel and DEF purchases support better IFTA-style estimates and profitability
intelligence. They are not tax filing records.

Accessorials, tolls, and lumpers are saved-load/load-actuals values. They are
not calculator planning inputs.

## Variance Rules

Loaded mileage variance is:

```text
Google estimated loaded miles - paid loaded miles
```

If paid loaded miles are missing, show the Google estimate but do not treat it
as paid mileage. Odometer variance compares actual odometer miles against
estimated route miles and paid loaded miles as profitability intelligence only.

## V1 Google Provider

The active V1 provider is `google_estimate`. It validates deadhead origin when
provided, pickup, ordered stops, and delivery addresses, returns formatted
addresses and coordinates when available, then uses Google Routes to estimate
standard driving miles and drive time.

The implementation keeps Google calls behind server-side routes/services.
Client components may call the LoadIQ API route but must not call Google
directly with protected credentials.

## Future Trimble Provider

The future provider is `trimble_truck`. V1 returns unavailable/scaffolded
responses only. Do not mark Trimble as implemented until repo code and
validated configuration prove a live truck-specific provider exists.

Future Trimble routing is expected to require tractor/trailer profile,
dimensions, gross weight, axle count, HAZMAT/load flags, routing profile, and
toll preference.

## Future Tracked Movement Miles

Tracked movement miles are future movement-based estimates. They may later use
manual tracking, browser geolocation, native mobile, ELD, telematics, or future
integrations. Route Intelligence V1 must not request geolocation permissions or
add live location tracking.

## Product Boundaries And Disclaimers

Google mileage is decision-support only and not truck-legal routing. Route
Intelligence does not replace:

- ELD records
- legal advice
- tax advice
- permit authority
- HAZMAT authority
- height, weight, bridge, or route compliance authority
- insurance or accounting review
- carrier/broker settlement records
- IFTA filing records

## Provider Architecture

Provider behavior is normalized through the route-intelligence service layer:

- `src/services/route-intelligence/google-provider.ts`
- `src/services/route-intelligence/trimble-provider.ts`
- `src/services/route-intelligence/route-intelligence-service.ts`
- `src/app/api/route-intelligence/validate-address/route.ts`
- `src/app/api/route-intelligence/estimate/route.ts`

Vendor response shapes must not leak directly into UI components.

## Environment Variables

Names only:

- `GOOGLE_MAPS_API_KEY`

`GOOGLE_MAPS_API_KEY` is server-side only. Do not expose it through a
`NEXT_PUBLIC_` variable.

## UI Rules

- Label paid loaded miles clearly.
- Label Google estimated loaded miles, Google estimated deadhead miles, and
  total Google estimated route miles separately.
- Show loaded mileage variance when paid loaded miles and estimated loaded
  miles are both available.
- Do not silently overwrite paid loaded miles.
- Keep manual mileage entry usable when route estimates are unavailable.
- Show that Google is not truck-legal routing.
- Show that stops are routed in the order entered.
- Show route stop type only as `P/U` or `DEL`; do not require stop labels.
- Show Trimble as planned after launch, not active.
- Show fuel/DEF purchase copy as IFTA-style estimate support only, not tax
  filing authority.
- Display EIA diesel price values to two decimals. Internal calculations may
  use normalized numeric values as defined by the calculator engine.

## Persistence Rules

V1 does not require schema changes. Existing direct saved-load mileage columns
continue to store paid loaded miles and user-entered deadhead miles. Route
estimate context is persisted through `input_snapshot` via `routeLoadedMiles`,
`routeDeadheadMiles`, `routeEstimate`, ordered route stops, deadhead suggestion
metadata, and running origin odometer where applicable. Saved/running load fuel
and DEF purchase entries, end odometer, tolls, lumpers, and accessorial actuals
are persisted through `actuals_snapshot`.

Do not add Supabase migrations for this V1 route-intelligence foundation.

Fuel gauge recovery is not part of this feature pass. Existing fuel/equipment
snapshot code remains separate and must not be treated as recovered fuel gauge
workflow from this document.

## Future Work

- Add durable rate limits before production provider expansion.
- Add reviewed provider privacy and cost-control documentation before broader
  rollout.
- Wire Trimble truck-specific routing after launch on a separate approved
  branch.
- Add tracking only after explicit mobile/browser permission, privacy, and
  product decisions.
- Add first-class schema columns for route estimates, odometer validation, and
  fuel/DEF purchase analytics only after a separate schema branch is approved.
