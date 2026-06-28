# Provider Contract: Google Address Validation API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://developers.google.com/maps/documentation/address-validation
- API reference: https://developers.google.com/maps/documentation/address-validation/reference/rest/v1/TopLevel/validateAddress
- SDK docs: none used by LoadIQ; the app calls REST directly.
- Pricing/quota/rate-limit docs, if available: Google Maps Platform billing and quotas apply by project.
- Error-handling docs, if available: Google Maps Platform standard HTTP/API error responses apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses Address Validation to normalize pickup, delivery, deadhead, and stop
addresses before requesting route estimates. It is not used as legal compliance
authority, dispatch authority, ELD, guaranteed profitability source,
tax/accounting advice, broker/load-board/rate-board behavior, or proof that a
truck may legally access a location.
## Authentication
- Auth method required by provider docs: Google Maps Platform API key.
- Env var names used in app: `GOOGLE_MAPS_API_KEY`.
- Server-only or client-safe: server-only.
- Secret exposure risk: do not expose this value through `NEXT_PUBLIC_`.
- Required headers: `Content-Type: application/json`.
- Key restrictions recommended: restrict by enabled API, environment, and
  server deployment controls.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `https://addressvalidation.googleapis.com`
- Endpoint path or SDK method: `/v1:validateAddress`
- HTTP method: `POST`
- Required headers: `Content-Type: application/json`
- Content type: JSON
- API version if applicable: v1
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `address.addressLines` | yes | string[] | Address lines to validate. | `src/services/route-intelligence/google-provider.ts` | App trims input and requires length >= 3 before calling provider. | Only one user-entered address line is sent. |
| `key` query parameter | yes | string | Google API key. | `src/services/route-intelligence/google-provider.ts` | Must be configured server-side. | Never log or print. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `result.address.formattedAddress` | string | Provider-formatted address. | yes | `validateGoogleAddress` | Falls back to user input. |
| `result.address.missingComponentTypes` | string[] | Address components missing from validation result. | yes | `buildAddressWarnings` | Warning omitted when absent. |
| `result.address.unconfirmedComponentTypes` | string[] | Address components not confirmed. | yes | `buildAddressWarnings` | Warning omitted when absent. |
| `result.address.unresolvedTokens` | string[] | Tokens provider could not resolve. | yes | `buildAddressWarnings` | Warning omitted when absent. |
| `result.geocode.location.latitude` | number | Latitude for geocoded result. | yes | `validateGoogleAddress` | Address marked invalid when missing. |
| `result.geocode.location.longitude` | number | Longitude for geocoded result. | yes | `validateGoogleAddress` | Address marked invalid when missing. |
| `result.verdict.addressComplete` | boolean | Whether address is considered complete. | yes | `getAddressConfidence`, `buildAddressWarnings` | Lowers confidence / warning when false. |
| `result.verdict.validationGranularity` | string | Validation granularity. | yes | `getAddressConfidence`, `verdictLabel` | Lowers confidence when `OTHER`. |
| `result.verdict.geocodeGranularity` | string | Geocode granularity. | yes | `getAddressConfidence`, `verdictLabel` | Lowers confidence when `OTHER`. |
| `result.verdict.hasInferredComponents` | boolean | Provider inferred components. | yes | `buildAddressWarnings` | Warning omitted when absent. |
| `result.verdict.hasReplacedComponents` | boolean | Provider replaced components. | yes | `buildAddressWarnings` | Warning omitted when absent. |
| `result.verdict.possibleNextAction` | string | Suggested next action. | yes | `buildAddressWarnings` | Warning omitted when absent. |
| `error.message` / `error.status` | string | Provider error details. | yes | `formatGoogleError` | Safe fallback message returned. |
## Error contract
Include:
- Documented provider error shape: LoadIQ reads `error.message` and
  `error.status` when returned.
- HTTP status codes used by provider: non-2xx is treated as provider
  unavailable.
- Auth failures: returned as unavailable with provider message or HTTP status.
- Validation failures: local address length < 3 returns `invalid` without a
  provider call.
- Quota/rate-limit failures: returned as unavailable; no retry loop exists.
- Timeout/network failure behavior: no custom timeout/backoff in this provider.
- App fallback behavior: returns empty verified address, warnings, and
  `status: "unavailable"` or `status: "invalid"`.
- User-safe error message: provider message or generic Google unavailable text.
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
- Data sent to provider: user-entered address text.
- PII risk: pickup/delivery addresses can be sensitive operational data.
- Location data risk: validated coordinates are sensitive route context.
- Payment data risk: none sent.
- Logging restrictions: never log API keys or full sensitive route context.
- What must never be logged: API key, auth headers, full customer/load context.
- Whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/services/route-intelligence/google-provider.ts` | `validateGoogleAddress` | Address validation REST call. | `GOOGLE_MAPS_API_KEY` | Normalizes provider response into `VerifiedAddress`. |
| `src/app/api/route-intelligence/validate-address/route.ts` | `POST` | Authenticated server endpoint. | `GOOGLE_MAPS_API_KEY` | Returns LoadIQ-owned response shape. |
| `src/app/api/route-intelligence/estimate/route.ts` | `POST` | Indirectly validates route points before route estimate. | `GOOGLE_MAPS_API_KEY` | Keeps provider shape out of UI. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for address confidence and warnings.
- mock response tests: needed for successful and invalid provider payloads.
- schema validation tests: needed for consumed response fields.
- error fallback tests: needed for auth/quota/non-2xx.
- env var missing tests: needed for unavailable state.
- provider contract drift tests: needed.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in official docs.
- legacy API: none confirmed in official docs.
- SDK major version risk: none; REST direct.
- pricing/quota changes: Google Maps project quota or billing changes.
- response field dependency: `result.geocode.location` and verdict fields.
- undocumented assumptions: app confidence labels are LoadIQ-derived.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
