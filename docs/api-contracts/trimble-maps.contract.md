# Provider Contract: Trimble Maps / PC*Miler
## Status
- App status: scaffolded
- Contract status: needs provider-doc verification
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://developer.trimblemaps.com/
- API reference: https://developer.trimblemaps.com/restful-apis/routing/introduction/
- SDK docs: not used by LoadIQ.
- Pricing/quota/rate-limit docs, if available: UNVERIFIED -- requires provider-doc confirmation or removal.
- Error-handling docs, if available: UNVERIFIED -- requires provider-doc confirmation or removal.
## Karpilo LoadIQ usage boundary
LoadIQ does not make live Trimble calls today. The current code returns an
unavailable truck-routing scaffold for future truck-specific route estimates.
Trimble must not be treated as active dispatch authority, legal route authority,
ELD, guaranteed profitability source, permit authority, safety certifier,
tax/accounting advice, or broker/load-board/rate-board behavior.
## Authentication
- Auth method required by provider docs: UNVERIFIED -- requires provider-doc
  confirmation or removal.
- Env var names used in app: none for live Trimble calls.
- Server-only or client-safe: future protected keys must be server-only.
- Secret exposure risk: any future key must not use `NEXT_PUBLIC_`.
- Required headers: UNVERIFIED -- requires provider-doc confirmation or removal.
- Key restrictions recommended: server-only and environment/provider controls.
## Base URL / SDK entrypoint
- REST base URL or SDK package: UNVERIFIED -- requires provider-doc confirmation
  or removal.
- Endpoint path or SDK method: no active endpoint is used by LoadIQ.
- HTTP method: no active method is used by LoadIQ.
- Required headers: UNVERIFIED -- requires provider-doc confirmation or removal.
- Content type: UNVERIFIED -- requires provider-doc confirmation or removal.
- API version if applicable: UNVERIFIED -- requires provider-doc confirmation or removal.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `tractorTrailerProfile` | no | unknown | UNVERIFIED -- requires provider-doc confirmation or removal. | `src/services/route-intelligence/trimble-provider.ts` | Scaffold only; not sent. | Future placeholder. |
| `vehicleHeightInches` / `vehicleWidthInches` / `vehicleLengthFeet` | no | number | UNVERIFIED -- requires provider-doc confirmation or removal. | `trimble-provider.ts` | Scaffold only; not sent. | Future placeholder. |
| `grossWeightPounds` / `axleCount` | no | number | UNVERIFIED -- requires provider-doc confirmation or removal. | `trimble-provider.ts` | Scaffold only; not sent. | Future placeholder. |
| `hazmatLoad` / `loadFlags` | no | unknown | UNVERIFIED -- requires provider-doc confirmation or removal. | `trimble-provider.ts` | Scaffold only; not sent. | Future placeholder. |
| `preferredRoutingProfile` / `tollPreference` | no | unknown | UNVERIFIED -- requires provider-doc confirmation or removal. | `trimble-provider.ts` | Scaffold only; not sent. | Future placeholder. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| none | none | No live provider response is consumed. | no | `getUnavailableTrimbleRouteEstimate` | Always returns app-owned unavailable response. |
## Error contract
Include:
- documented provider error shape: UNVERIFIED -- requires provider-doc
  confirmation or removal.
- HTTP status codes used by provider: none consumed by app.
- auth failures: no live auth exists.
- validation failures: scaffold does not validate provider payloads.
- quota/rate-limit failures: none consumed by app.
- timeout/network failure behavior: no network call exists.
- app fallback behavior: returns unavailable Trimble placeholder.
- user-safe error message: Trimble truck-specific routing is scaffolded only.
- internal logging behavior: no provider logging exists.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: UNVERIFIED -- requires
  provider-doc confirmation or removal.
- cache strategy: none.
- retry/backoff strategy: none.
- abuse prevention: no provider call exists.
- client-side vs server-side call protection: future calls must be server-side.
- tier impact if relevant: future truck-specific routing remains separate from
  base Google Route Intelligence.
## Data privacy / security
Include:
- data sent to provider: none today.
- PII risk: future route points and vehicle profile may be sensitive.
- location data risk: high for any future route provider call.
- payment data risk: none intended.
- logging restrictions: future provider credentials and route context must not
  be logged.
- what must never be logged: provider keys, coordinates, customer/load context.
- whether requests must be server-side only: yes for any future integration.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/services/route-intelligence/trimble-provider.ts` | `getUnavailableTrimbleRouteEstimate` | No live provider call. | none | Scaffolded unavailable response. |
| `src/services/route-intelligence/trimble-provider.ts` | `futureTrimbleRouteInputs` | Future app input list. | none | Every field requires provider-doc verification before use. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for unavailable scaffold.
- mock response tests: needed only when live integration is approved.
- schema validation tests: needed before any provider response is consumed.
- error fallback tests: needed before live integration.
- env var missing tests: needed before live integration.
- provider contract drift tests: needed before live integration.
## Drift risks
List anything likely to break:
- deprecated endpoint: UNVERIFIED -- requires provider-doc confirmation or removal.
- legacy API: UNVERIFIED -- requires provider-doc confirmation or removal.
- SDK major version risk: UNVERIFIED -- requires provider-doc confirmation or removal.
- pricing/quota changes: future provider terms.
- response field dependency: none today.
- undocumented assumptions: all future Trimble request fields in code are
  placeholders until verified.
## Required follow-up
- [ ] Confirm provider docs URL
- [ ] Confirm endpoint/method
- [ ] Confirm auth
- [ ] Confirm request fields
- [ ] Confirm consumed response fields
- [ ] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
