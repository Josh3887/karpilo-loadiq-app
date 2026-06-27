# Route Intelligence API Contract

## Purpose

The Route Intelligence API provides LoadIQ-owned server routes for address
validation and route mileage estimates. It keeps protected provider credentials
server-side and returns normalized LoadIQ response shapes to the calculator UI.

Product behavior is documented in
[Route Intelligence](../features/route-intelligence.md).

## Endpoints

- `POST /api/route-intelligence/validate-address`
- `POST /api/route-intelligence/estimate`

Both endpoints return `Cache-Control: no-store`.

## POST /api/route-intelligence/validate-address

Request body:

```json
{
  "address": "123 Main St, Chicago, IL 60601",
  "provider": "google_estimate"
}
```

`provider` is optional and defaults to `google_estimate`. Allowed values are
`google_estimate` and `trimble_truck`.

Response body:

```ts
{
  status: "available" | "invalid" | "unavailable" | "error";
  provider: "google_estimate" | "trimble_truck";
  address: {
    input: string;
    formattedAddress: string;
    lat: number | null;
    lng: number | null;
    confidence: "low" | "medium" | "high";
    verdict?: string;
    warnings: string[];
  } | null;
  message: string;
  warnings: string[];
}
```

Success example:

```json
{
  "status": "available",
  "provider": "google_estimate",
  "address": {
    "input": "123 Main St, Chicago, IL 60601",
    "formattedAddress": "123 Main St, Chicago, IL 60601-0000, USA",
    "lat": 41.0,
    "lng": -87.0,
    "confidence": "high",
    "verdict": "validation=PREMISE; geocode=PREMISE; complete",
    "warnings": []
  },
  "message": "Address validated by Google.",
  "warnings": []
}
```

Error example:

```json
{
  "status": "invalid",
  "provider": "google_estimate",
  "address": null,
  "message": "Address validation requires an address.",
  "warnings": ["Enter a pickup or delivery address before validation."]
}
```

## POST /api/route-intelligence/estimate

Request body:

```json
{
  "origin": "123 Main St, Chicago, IL 60601",
  "destination": "500 Market St, St. Louis, MO 63101",
  "provider": "google_estimate"
}
```

`provider` is optional and defaults to `google_estimate`. Allowed values are
`google_estimate` and `trimble_truck`.

Response body:

```ts
{
  status: "available" | "invalid" | "unavailable" | "error";
  provider: "google_estimate" | "trimble_truck";
  estimate: {
    provider: "google_estimate" | "trimble_truck";
    origin: VerifiedAddress;
    destination: VerifiedAddress;
    estimatedMiles: number | null;
    estimatedDurationMinutes: number | null;
    trafficAwareDurationMinutes?: number | null;
    routeMileageVariance?: number | null;
    truckSpecific: boolean;
    confidence: "low" | "medium" | "high";
    warnings: string[];
    disclaimer: string;
    trackedMovementMiles?: number;
    actualDrivenLoadedMiles?: number;
    movementMileageVariance?: number;
    trackingConfidence?: "low" | "medium" | "high";
    trackingSource?:
      | "manual"
      | "browser_geolocation"
      | "native_mobile"
      | "eld_telematics"
      | "future_integration";
    deadheadOdometerStart?: number;
    deadheadOdometerEnd?: number;
    loadedOdometerStart?: number;
    loadedOdometerEnd?: number;
    actualDeadheadMiles?: number;
    actualLoadedMiles?: number;
    actualTotalTripMiles?: number;
    loadedPaidVsActualVariance?: number;
    loadedEstimatedVsActualVariance?: number;
    deadheadEstimatedVsActualVariance?: number;
  } | null;
  message: string;
  warnings: string[];
}
```

Success example:

```json
{
  "status": "available",
  "provider": "google_estimate",
  "estimate": {
    "provider": "google_estimate",
    "origin": {
      "input": "123 Main St, Chicago, IL 60601",
      "formattedAddress": "123 Main St, Chicago, IL 60601-0000, USA",
      "lat": 41.0,
      "lng": -87.0,
      "confidence": "high",
      "warnings": []
    },
    "destination": {
      "input": "500 Market St, St. Louis, MO 63101",
      "formattedAddress": "500 Market St, St. Louis, MO 63101-0000, USA",
      "lat": 38.0,
      "lng": -90.0,
      "confidence": "high",
      "warnings": []
    },
    "estimatedMiles": 298.4,
    "estimatedDurationMinutes": 275,
    "trafficAwareDurationMinutes": 275,
    "truckSpecific": false,
    "confidence": "high",
    "warnings": [
      "Google estimate uses standard driving routes and does not account for truck-specific restrictions.",
      "Mileage estimate only. Not truck-legal routing."
    ],
    "disclaimer": "Mileage estimate only. Not truck-legal routing."
  },
  "message": "Google route estimate available.",
  "warnings": [
    "Google estimate uses standard driving routes and does not account for truck-specific restrictions.",
    "Mileage estimate only. Not truck-legal routing."
  ]
}
```

Error example:

```json
{
  "status": "unavailable",
  "provider": "google_estimate",
  "estimate": {
    "provider": "google_estimate",
    "origin": {
      "input": "Chicago, IL",
      "formattedAddress": "Chicago, IL",
      "lat": null,
      "lng": null,
      "confidence": "low",
      "warnings": ["GOOGLE_MAPS_API_KEY is not configured."]
    },
    "destination": {
      "input": "St. Louis, MO",
      "formattedAddress": "St. Louis, MO",
      "lat": null,
      "lng": null,
      "confidence": "low",
      "warnings": ["GOOGLE_MAPS_API_KEY is not configured."]
    },
    "estimatedMiles": null,
    "estimatedDurationMinutes": null,
    "trafficAwareDurationMinutes": null,
    "truckSpecific": false,
    "confidence": "low",
    "warnings": [
      "Pickup: GOOGLE_MAPS_API_KEY is not configured.",
      "Delivery: GOOGLE_MAPS_API_KEY is not configured.",
      "Route mileage requires validated pickup and delivery coordinates.",
      "Mileage estimate only. Not truck-legal routing."
    ],
    "disclaimer": "Mileage estimate only. Not truck-legal routing."
  },
  "message": "Route estimate unavailable.",
  "warnings": [
    "Pickup: GOOGLE_MAPS_API_KEY is not configured.",
    "Delivery: GOOGLE_MAPS_API_KEY is not configured.",
    "Route mileage requires validated pickup and delivery coordinates.",
    "Mileage estimate only. Not truck-legal routing."
  ]
}
```

## Provider Boundaries

`google_estimate` is the active V1 provider. It uses Google Address Validation
and Google Routes behind LoadIQ server routes.

`trimble_truck` is scaffolded only. It returns unavailable status until a later
approved integration configures live Trimble routing. Do not require Trimble
keys in V1.

## Mileage Contract

Google must not silently overwrite paid loaded miles. The calculator stores
Google mileage separately as `routeLoadedMiles` and `routeEstimate`. The UI may
let a user copy a route estimate into paid loaded miles only through an
explicit user action.

Route mileage variance is:

```text
estimated route miles - paid loaded miles
```

## Security

`GOOGLE_MAPS_API_KEY` is server-side only. Do not expose it to client
components. Do not create `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or any other
`NEXT_PUBLIC_` secret for protected Google calls.

UI components call LoadIQ API routes. They must not call Google directly.

## Error Handling

The API returns normalized `invalid`, `unavailable`, or `error`-capable status
values and warning arrays. Missing keys, invalid addresses, API disabled,
quota, billing, and provider failures must degrade to manual mileage entry.

## Persistence

V1 persists route context through the existing calculator `input_snapshot`.
No Supabase migrations are required for this feature branch. Direct saved-load
columns continue to represent user-entered paid loaded miles and deadhead
miles.

## Product Disclaimers

Google route mileage is a decision-support estimate only. It is not
truck-legal routing and does not replace ELD, legal, tax, permit, HAZMAT,
height/weight, insurance, accounting, or compliance authority.

## Future Extensions

- Add durable server-side rate limits before production provider expansion.
- Add provider privacy and cost-control review before public enablement.
- Add Trimble truck-specific routing after launch on a separate approved
  branch.
- Add tracked movement mileage only after explicit product, privacy, and
  permission decisions.
- Add post-trip odometer validation without changing the paid-mileage contract.
