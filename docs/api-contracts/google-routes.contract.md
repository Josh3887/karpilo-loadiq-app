# Provider Contract: Google Routes API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://developers.google.com/maps/documentation/routes
- API reference: https://developers.google.com/maps/documentation/routes/compute_route_directions
- SDK docs: none used by LoadIQ; the app calls REST directly.
- Pricing/quota/rate-limit docs, if available: Google Maps Platform billing and quotas apply by project.
- Error-handling docs, if available: Google Maps Platform standard HTTP/API error responses apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses Routes for estimated driving mileage and duration between validated
coordinates. It is not truck-specific routing, dispatch authority, legal route
authority, ELD, guaranteed profitability source, tax/accounting advice, broker
or load-board behavior, or proof that a commercial vehicle may legally travel a
route.
## Authentication
- Auth method required by provider docs: Google Maps Platform API key.
- Env var names used in app: `GOOGLE_MAPS_API_KEY`.
- Server-only or client-safe: server-only.
- Secret exposure risk: do not expose this value through `NEXT_PUBLIC_`.
- Required headers: `Content-Type: application/json`,
  `X-Goog-FieldMask`.
- Key restrictions recommended: restrict by enabled API, environment, and
  server deployment controls.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `https://routes.googleapis.com`
- Endpoint path or SDK method: `/directions/v2:computeRoutes`
- HTTP method: `POST`
- Required headers: `Content-Type: application/json`,
  `X-Goog-FieldMask: routes.distanceMeters,routes.duration,routes.staticDuration`
- Content type: JSON
- API version if applicable: v2
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `origin.location.latLng.latitude` | yes | number | Origin latitude. | `src/services/route-intelligence/google-provider.ts` | Only sent after address validation returns finite coordinates. | Sensitive location data. |
| `origin.location.latLng.longitude` | yes | number | Origin longitude. | `src/services/route-intelligence/google-provider.ts` | Only sent after address validation returns finite coordinates. | Sensitive location data. |
| `destination.location.latLng.latitude` | yes | number | Destination latitude. | `src/services/route-intelligence/google-provider.ts` | Only sent after address validation returns finite coordinates. | Sensitive location data. |
| `destination.location.latLng.longitude` | yes | number | Destination longitude. | `src/services/route-intelligence/google-provider.ts` | Only sent after address validation returns finite coordinates. | Sensitive location data. |
| `travelMode` | yes | string | Travel mode for route computation. | `estimateGoogleLeg` | Hardcoded to `DRIVE`. | Not truck-specific. |
| `routingPreference` | no | string | Route computation preference. | `estimateGoogleLeg` | Hardcoded to `TRAFFIC_AWARE`. | Traffic-aware estimate, not guarantee. |
| `computeAlternativeRoutes` | no | boolean | Whether alternatives are requested. | `estimateGoogleLeg` | Hardcoded to `false`. | App consumes first route only. |
| `units` | no | string | Unit preference. | `estimateGoogleLeg` | Hardcoded to `IMPERIAL`. | App still converts meters to miles. |
| `key` query parameter | yes | string | Google API key. | `estimateGoogleLeg` | Must be configured server-side. | Never log or print. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `routes[0].distanceMeters` | number | Route distance in meters. | yes | `estimateGoogleLeg` | Leg marked unavailable when absent. |
| `routes[0].duration` | string | Duration string, traffic-aware when requested. | yes | `estimateGoogleLeg` | Falls back to `staticDuration`. |
| `routes[0].staticDuration` | string | Duration without traffic. | yes | `estimateGoogleLeg` | Used when `duration` is unavailable. |
| `error.message` / `error.status` | string | Provider error details. | yes | `formatGoogleError` | Safe fallback warning returned. |
## Error contract
Include:
- Documented provider error shape: LoadIQ reads `error.message` and
  `error.status` when returned.
- HTTP status codes used by provider: non-2xx is treated as unavailable.
- Auth failures: returned as unavailable with provider message or HTTP status.
- Validation failures: missing coordinates prevents provider call.
- Quota/rate-limit failures: returned as unavailable; no retry loop exists.
- Timeout/network failure behavior: no custom timeout/backoff in this provider.
- App fallback behavior: returns unavailable route leg with warnings.
- User-safe error message: provider message or generic Google Routes text.
- Internal logging behavior: no provider secret logging allowed.
## Rate limits / quotas / cost controls
Include:
- Provider quota or billing behavior when known: Google Maps Platform project
  quotas and billing apply.
- Cache strategy: `cache: "no-store"`; no app cache.
- Retry/backoff strategy: none.
- Abuse prevention: route endpoints require authenticated LoadIQ session.
- Client-side vs server-side call protection: provider calls are server-side.
- Tier impact if relevant: base Route Intelligence is available to all
  authenticated app tiers.
## Data privacy / security
Include:
- Data sent to provider: validated coordinates for route points.
- PII risk: route endpoints can imply customer/shipper/receiver locations.
- Location data risk: high; coordinate pairs are operational route context.
- Payment data risk: none sent.
- Logging restrictions: never log API key or full sensitive route context.
- What must never be logged: API key, auth headers, customer/load identifiers.
- Whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/services/route-intelligence/google-provider.ts` | `estimateGoogleLeg` | Compute route distance/duration. | `GOOGLE_MAPS_API_KEY` | Converts meters to miles and duration seconds to minutes. |
| `src/services/route-intelligence/google-provider.ts` | `estimateGoogleRoutePlan` | Multi-leg app route estimate orchestration. | `GOOGLE_MAPS_API_KEY` | Keeps paid miles separate from estimated miles. |
| `src/app/api/route-intelligence/estimate/route.ts` | `POST` | Authenticated server endpoint. | `GOOGLE_MAPS_API_KEY` | Returns LoadIQ-owned response shape. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for duration/mile conversion.
- mock response tests: needed for success, missing route, and non-2xx.
- schema validation tests: needed for consumed response fields.
- error fallback tests: needed for missing key and quota failures.
- env var missing tests: needed for unavailable state.
- provider contract drift tests: needed for field mask/response fields.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in official docs.
- legacy API: none confirmed in official docs.
- SDK major version risk: none; REST direct.
- pricing/quota changes: Google Routes billing/quota changes.
- response field dependency: field mask must include all consumed fields.
- undocumented assumptions: LoadIQ route confidence is app-derived.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
