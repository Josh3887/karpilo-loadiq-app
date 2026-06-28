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

## POST /api/route-intelligence/estimate

Preferred request body:

```json
{
  "deadheadOrigin": "Dayton, OH 45402",
  "pickupAddress": "7800 Col. H. Weir Cook Memorial Dr, Indianapolis, IN 46241",
  "deliveryAddress": "2400 Aviation Dr, Dallas, TX 75261",
  "stops": [
    {
      "id": "stop-1",
      "address": "Little Rock, AR 72201",
      "label": "Customer stop",
      "kind": "customer",
      "sequence": 1
    }
  ],
  "provider": "google_estimate"
}
```

Legacy `origin` and `destination` request bodies remain supported and map to
`pickupAddress` and `deliveryAddress`:

```json
{
  "origin": "Indianapolis, IN 46241",
  "destination": "Dallas, TX 75261",
  "provider": "google_estimate"
}
```

`provider` is optional and defaults to `google_estimate`. Allowed values are
`google_estimate` and `trimble_truck`.

Supported stop `kind` values:

```ts
type RouteStopKind =
  | "pickup"
  | "delivery"
  | "intermediate_stop"
  | "fuel"
  | "def"
  | "scale"
  | "rest"
  | "customer"
  | "other";
```

Stops are routed in ascending `sequence` order. The API does not optimize stop
order.

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
    deadheadEstimate?: {
      origin: VerifiedAddress | null;
      pickup: VerifiedAddress | null;
      estimatedDeadheadMiles: number | null;
      estimatedDeadheadDurationMinutes: number | null;
      warnings: string[];
    };
    loadedEstimate?: {
      pickup: VerifiedAddress | null;
      stops: VerifiedAddress[];
      delivery: VerifiedAddress | null;
      estimatedLoadedMiles: number | null;
      estimatedLoadedDurationMinutes: number | null;
      legs?: Array<{
        fromLabel: string;
        toLabel: string;
        estimatedMiles: number | null;
        estimatedDurationMinutes: number | null;
      }>;
      warnings: string[];
    };
    totalEstimate?: {
      estimatedMiles: number | null;
      estimatedDurationMinutes: number | null;
    };
    routeLegs?: Array<{
      fromLabel: string;
      toLabel: string;
      estimatedMiles: number | null;
      estimatedDurationMinutes: number | null;
    }>;
    truckSpecific: boolean;
    confidence: "low" | "medium" | "high";
    warnings: string[];
    disclaimer: string;
  } | null;
  message: string;
  warnings: string[];
}
```

`estimate.estimatedMiles` remains a legacy-compatible alias for Google
estimated loaded miles. New UI should prefer
`estimate.loadedEstimate.estimatedLoadedMiles`.

If no `deadheadOrigin` is provided, the response may omit `deadheadEstimate` and
`totalEstimate` equals loaded estimate when loaded estimate is available.

## Mileage Contract

Paid loaded miles are user-entered and authoritative for revenue modeling.
Google estimated loaded miles remain separate in `routeLoadedMiles` and
`routeEstimate`. Google estimated deadhead miles remain separate in
`routeDeadheadMiles` and `routeEstimate.deadheadEstimate`.

Loaded route mileage variance is:

```text
Google estimated loaded miles - paid loaded miles
```

The UI may let a user copy Google estimated loaded miles into paid loaded miles
only through an explicit user action.

## Odometer And Purchase Snapshots

Running-load odometer validation and fuel/DEF purchases are not separate API
routes. They persist through existing saved-load snapshot structures:

- `input_snapshot.originOdometer`
- `input_snapshot.endOdometer`
- `input_snapshot.odometerValidation`
- `actuals_snapshot.odometerValidation`
- `actuals_snapshot.fuelPurchases`
- `actuals_snapshot.defPurchases`

Fuel and DEF purchases support better IFTA-style estimates and profitability
intelligence. They are not tax filing records.

## Provider Boundaries

`google_estimate` is the active V1 provider. It uses Google Address Validation
and Google Routes behind LoadIQ server routes.

`trimble_truck` is scaffolded only. It returns unavailable status until a later
approved integration configures live Trimble routing. Do not require Trimble
keys in V1.

## Security

`GOOGLE_MAPS_API_KEY` is server-side only. Do not expose it to client
components. Do not create `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` or any other
`NEXT_PUBLIC_` secret for protected Google calls.

## Explicit Non-Goals

- No Supabase migrations.
- No `.env.local` changes.
- No Trimble live calls.
- No weather expansion.
- No GPS or live location tracking.
- No IFTA filing compliance claim.
- No fuel gauge recovery in this task.
