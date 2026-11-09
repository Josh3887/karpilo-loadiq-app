# Route Intelligence API Contract

## Purpose

The Route Intelligence API provides LoadIQ-owned server routes for address
validation and route mileage estimates. It keeps protected provider credentials
server-side and returns normalized LoadIQ response shapes to the calculator UI.
Base Google-backed Route Intelligence is available to all authenticated app
tiers; paid tier state must not be used to block address validation, Google
estimated deadhead miles, Google estimated loaded miles, total Google estimated
route miles, P/U and DEL stops, or paid-vs-estimated mileage variance.

Product behavior is documented in
[Route Intelligence](../features/route-intelligence.md).

## Endpoints

- `POST /api/route-intelligence/validate-address`
- `POST /api/route-intelligence/estimate`

Both endpoints return `Cache-Control: no-store`.

Both endpoints require an authenticated LoadIQ session. Authentication is the
base access boundary; commercial tier, saved-load limits, weather gates,
Atlas/AI gates, report/export gates, and future truck-specific routing gates
remain separate.

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
      "kind": "pickup",
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
type RouteStopKind = "pickup" | "delivery";
```

Stops are routed in ascending `sequence` order. The API does not optimize stop
order. Stops are freight stops only; fuel and DEF purchases are load actuals,
not route stops. Stop labels are not part of the primary route contract.

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
- `input_snapshot.odometerValidation`
- `actuals_snapshot.odometerValidation`
- `actuals_snapshot.fuelPurchases`
- `actuals_snapshot.defPurchases`

Origin odometer may be captured while the load is running. End odometer belongs
in saved-load post-trip actuals.

Fuel and DEF purchases support better IFTA-style estimates and profitability
intelligence. They are not tax filing records.

## Provider Boundaries

`google_estimate` is the active V1 provider. It uses Google Address Validation
and Google Routes behind LoadIQ server routes.

If the Google provider is not configured or cannot return a usable estimate,
the API returns an `unavailable` or `error` response shape. UI should treat this
as provider unavailability, not as a subscription-tier lock.

`trimble_truck` is scaffolded only. It returns unavailable status until a later
approved integration configures live Trimble routing. Do not require Trimble
keys in V1.

Trimble truck-specific routing, weather risk intelligence, Atlas/AI route
profitability explanation, advanced route history/analytics, and route trend
analysis are outside the all-tier base Route Intelligence contract.

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

## Address directory integration update — 2026-11-09

`POST /api/facilities` accepts `{query: string}` (3–100 characters), requires
session authentication, and returns at most eight normalized facility records
plus non-sensitive warnings. It uses an explicit `user_id` filter and existing
RLS to read only the driver's latest 500 saved-load snapshots. The configured
`LOADIQ_FACILITY_DIRECTORY_JSON` seed allows at most 1,000 validated records.
The response is `Cache-Control: private, no-store`; browser storage is not used.
Driver-owned results take precedence over duplicate seed records. No cross-user
publishing, schema changes, or new write permissions are added. Auth failures
return 401, malformed queries 400, and unavailable history with no seed 503.
An empty but functioning directory returns 200 and an empty result set.

Optional seed `source` is `directory`, `openstreetmap`, or `driver_saved`.
OpenStreetMap-sourced visible results carry an attribution link. Seed provenance
and redistribution rights must be reviewed before loading production data; this
branch does not import external datasets or retain Google lookup content as a
facility master. Private names and raw entered addresses remain in existing
load input snapshots and follow saved-load retention/deletion behavior.

Estimate requests now bound each address to 500 characters and stops to 10.
Google requests have a 15-second timeout per provider call; there are no retries
or new provider caches. Network/timeout exceptions return a normalized 503
unavailable response without vendor error details. In-flight client requests
are aborted on route changes; late results cannot overwrite a different route.
Provider usage remains explicit button-driven, not one request per keystroke.
A distributed per-user rate limiter remains a production follow-up.
