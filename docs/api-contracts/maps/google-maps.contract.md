# Provider Contract: Google Maps Platform

## Provider Name
Google Maps Platform: Routes API, Address Validation API, and future browser map
surfaces.

## Karpilo Module Owner
Route Intelligence.

## Purpose
Address validation, route mileage, route duration, and future map/geospatial
display governance.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://developers.google.com/maps/documentation | verified 2026-06-28 |
| Endpoint documentation URL | https://developers.google.com/maps/documentation/routes/compute_route_directions, https://developers.google.com/maps/documentation/address-validation/requests-validate-address, https://developers.google.com/maps/documentation/javascript/overview, https://developers.google.com/maps/documentation/places/web-service/overview, https://developers.google.com/maps/documentation/geocoding/overview | routes/address validation implemented; browser/places/geocoding planned |
| Authentication documentation URL | https://developers.google.com/maps/api-security-best-practices | verified 2026-06-28 |
| Rate limit/quota documentation URL | https://developers.google.com/maps/documentation/routes/usage-and-billing, https://developers.google.com/maps/documentation/address-validation/usage-and-billing | verified 2026-06-28 |

## Required Environment Variables
- `GOOGLE_MAPS_API_KEY`
- Future browser map usage may use `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` only
  when documented browser-safe and restricted in the Google project.

## Forbidden Environment Usage
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Any server Google Maps key exposed to client bundles.

## Endpoints Used
- `POST https://addressvalidation.googleapis.com/v1:validateAddress`
- `POST https://routes.googleapis.com/directions/v2:computeRoutes`
- Google Maps JavaScript, Places, and Geocoding are planned-only unless a
  future branch wires them with provider-doc confirmation.

## Normalized Internal Output
Route Intelligence owns LoadIQ route estimate, address validation, mileage, and
duration output shapes. Provider responses must not leak directly to UI.

## Required Mock Files
- `test-fixtures/api/maps/google-maps/addressValidation.success.json`
- `test-fixtures/api/maps/google-maps/computeRoutes.success.json`
- `test-fixtures/api/maps/google-maps/errors/unauthorized-401.json`
- `test-fixtures/api/maps/google-maps/errors/forbidden-403.json`
- `test-fixtures/api/maps/google-maps/errors/not-found-404.json`
- `test-fixtures/api/maps/google-maps/errors/rate-limited-429.json`
- `test-fixtures/api/maps/google-maps/errors/server-error-500.json`
- `test-fixtures/api/maps/google-maps/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint drift,
408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON, empty
response, and network failure.

## Drift Rules
- Paid loaded miles must stay user-entered and separate from Google estimates.
- Route estimates must not become truck-legal routing, dispatch, ELD, or safety
  authority.
- Browser-safe map keys must be documented separately from server keys.

## Last Verified Date
2026-06-28.

