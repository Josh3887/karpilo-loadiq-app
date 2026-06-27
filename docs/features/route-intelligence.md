# Route Intelligence

## Purpose

Route Intelligence adds address verification and route mileage planning context
to the calculator without replacing the user's revenue, settlement, or
post-trip records. V1 uses Google for address validation and standard driving
route estimates. Future truck-specific routing, tracking, and odometer
validation remain separate concepts.

API details are documented in
[Route Intelligence API Contract](../api-contracts/route-intelligence.md).

## Mileage Terms

LoadIQ keeps these mileage concepts separate:

- Paid loaded miles: user-entered revenue miles from the rate confirmation,
  broker/carrier agreement, or dispatch source.
- Google estimated route miles: planning mileage from the active V1 Google
  provider.
- Future Trimble truck-specific miles: planned post-launch truck-aware route
  mileage.
- Future tracked movement miles: movement-based estimates from browser,
  native mobile, ELD, telematics, or later integrations.
- Post-trip odometer validation: user-entered odometer readings that represent
  post-trip operational truth.

## Paid Loaded Miles

Paid loaded miles are authoritative for revenue modeling. They remain
user-entered and must not be silently overwritten by provider estimates. If the
UI lets a user copy an estimate into paid loaded miles, that must be an explicit
user action.

## Google Estimated Route Miles

Google estimated route miles are planning estimates only. They are stored
separately from paid loaded miles using `routeLoadedMiles` and the
`routeEstimate` snapshot. Google estimates do not define settlement miles,
truck legality, reimbursement, toll legality, permit legality, or final trip
truth.

## Future Trimble Truck-Specific Miles

Trimble is future/post-launch. The current code scaffolds `trimble_truck` as a
disabled provider only. It must not require Trimble credentials, billing, or
live API calls until a later approved integration branch.

Future Trimble routing is expected to require tractor/trailer profile,
dimensions, gross weight, axle count, HAZMAT/load flags, routing profile, and
toll preference.

## Future Tracked Movement Miles

Tracked movement miles are future movement-based estimates. They may later use
manual tracking, browser geolocation, native mobile, ELD, telematics, or future
integrations. V1 must not request geolocation permissions or run live location
tracking.

## Post-Trip Odometer Validation

Post-trip odometer validation is a future user-entered truth source. It should
represent deadhead and loaded actual miles with fields such as:

- `deadheadOdometerStart`
- `deadheadOdometerEnd`
- `loadedOdometerStart`
- `loadedOdometerEnd`
- `actualDeadheadMiles`
- `actualLoadedMiles`
- `actualTotalTripMiles`

Odometer validation must remain separate from paid mileage and provider
estimates.

## Variance Rules

Route mileage variance is:

```text
Google estimated route miles - paid loaded miles
```

If paid loaded miles are missing, show the Google estimate but do not treat it
as paid mileage. Future variance fields may compare paid, estimated, tracked,
and actual mileage:

- `routeMileageVariance`
- `movementMileageVariance`
- `loadedPaidVsActualVariance`
- `loadedEstimatedVsActualVariance`
- `deadheadEstimatedVsActualVariance`

## V1 Google Provider

The active V1 provider is `google_estimate`. It validates pickup and delivery
addresses, returns formatted addresses and coordinates when available, then
uses Google Routes to estimate standard driving miles and drive time.

The implementation must keep Google calls behind server-side routes/services.
Client components may call the LoadIQ API route but must not call Google
directly with protected credentials.

## Future Trimble Provider

The future provider is `trimble_truck`. V1 returns unavailable/scaffolded
responses only. Do not mark Trimble as implemented until repo code and
validated configuration prove a live truck-specific provider exists.

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
- Label Google estimated route miles separately.
- Show mileage variance when paid loaded miles and estimated miles are both
  available.
- Do not silently overwrite paid loaded miles.
- Keep manual mileage entry usable when route estimates are unavailable.
- Show that Google is not truck-legal routing.
- Show Trimble as planned after launch, not active.

## Persistence Rules

V1 does not require schema changes. Existing direct saved-load mileage columns
continue to store paid loaded miles and deadhead miles. Route estimate context
is persisted through `input_snapshot` via `routeLoadedMiles` and
`routeEstimate`.

Do not add Supabase migrations for this V1 route-intelligence foundation.

## Future Work

- Add durable rate limits before production provider expansion.
- Add reviewed provider privacy and cost-control documentation before broader
  rollout.
- Wire Trimble truck-specific routing after launch on a separate approved
  branch.
- Add post-trip odometer validation without weakening paid-mileage ownership.
- Add tracking only after explicit mobile/browser permission, privacy, and
  product decisions.
