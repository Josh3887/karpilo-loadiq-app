# Provider Contract: U.S. EIA Open Data API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://www.eia.gov/opendata/documentation.php
- API reference: https://www.eia.gov/opendata/documentation.php
- SDK docs: none used by LoadIQ; the app calls REST directly.
- Pricing/quota/rate-limit docs, if available: EIA API key and service limits apply.
- Error-handling docs, if available: EIA HTTP/API error responses apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses EIA Open Data for a national diesel baseline displayed as planning
context. It is not a guaranteed fuel price, carrier settlement record,
tax/accounting advice, broker/load-board/rate-board behavior, or fuel purchase
receipt system.

Karpilo FSC Intelligence reuses this existing diesel baseline to compare fuel
surcharge coverage against modeled fuel exposure. It does not add a new EIA
client, request path, environment variable, cache path, or provider contract.

## Authentication
- Auth method required by provider docs: EIA API key query parameter.
- Env var names used in app: `EIA_API_KEY`, optional `EIA_BASE_URL`.
- Server-only or client-safe: server-only.
- Secret exposure risk: do not expose through `NEXT_PUBLIC_`.
- Required headers: none beyond standard HTTP.
- Key restrictions recommended: keep server-side only.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `https://api.eia.gov/v2`
- Endpoint path or SDK method: `/petroleum/pri/gnd/data/`
- HTTP method: `GET`
- Required headers: none.
- Content type: JSON response.
- API version if applicable: v2
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `frequency` | yes | string | Data frequency. | `src/services/fuel/eia-client.ts` | Hardcoded to `weekly`. | Diesel weekly series. |
| `data[0]` | yes | string | Requested data column. | `eia-client.ts` | Hardcoded to `value`. | App consumes price value. |
| `facets[product][]` | yes | string | EIA product facet. | `eia-client.ts` | Hardcoded to `EPD2DXL0`. | ULSD diesel. |
| `facets[duoarea][]` | yes | string | EIA area facet. | `eia-client.ts` | Hardcoded to `NUS`. | U.S. national average. |
| `facets[series][]` | yes | string | EIA series facet. | `eia-client.ts` | Hardcoded to `EMD_EPD2DXL0_PTE_NUS_DPG`. | Series ID. |
| `facets[process][]` | yes | string | EIA process facet. | `eia-client.ts` | Hardcoded to `PTE`. | Retail price process. |
| `sort[0][column]` / `sort[0][direction]` | yes | string | Sort control. | `eia-client.ts` | Sort by `period` descending. | Latest row selected in app too. |
| `offset` / `length` | yes | number | Pagination controls. | `eia-client.ts` | Hardcoded to `0` / `5000`. | Fetches a range then sorts. |
| `api_key` | yes | string | EIA API key. | `fetchLatestEiaDieselPrice` | Must be configured server-side. | Never log or print. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `response.data[]` | array | Returned data rows. | yes | `fetchLatestEiaDieselPrice` | Manual fuel entry if missing/unusable. |
| `response.data[].period` | string | Data period. | yes | `latestDieselRow`, `normalizeEiaDieselPrice` | Row unusable when missing. |
| `response.data[].value` | number/string | Requested price value. | yes | `normalizeEiaDieselPrice` | Row unusable when not positive number. |
## Error contract
Include:
- documented provider error shape: app currently uses HTTP status and payload
  usability, not a typed EIA error body.
- HTTP status codes used by provider: non-2xx is treated as failure.
- auth failures: missing `EIA_API_KEY` returns failure before provider call.
- validation failures: unusable response row returns failure.
- quota/rate-limit failures: non-2xx failure; no special 429 mapping.
- timeout/network failure behavior: caught and returned as manual fallback.
- app fallback behavior: use fresh cache, stale cache, or manual entry.
- user-safe error message: manual fuel entry remains active.
- internal logging behavior: logs failure reason without API key.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: EIA API key limits apply.
- cache strategy: app caches normalized fuel price in Supabase for 12 hours.
- retry/backoff strategy: none.
- abuse prevention: fuel API route/server service centralizes live refresh.
- client-side vs server-side call protection: provider call is server-side.
- tier impact if relevant: fuel baseline is calculator context, not a paid
  provider upsell in this contract.
## Data privacy / security
Include:
- data sent to provider: fixed diesel-series query and API key.
- PII risk: none.
- location data risk: none.
- payment data risk: none.
- logging restrictions: do not log API key.
- what must never be logged: API key.
- whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/services/fuel/eia-client.ts` | `fetchLatestEiaDieselPrice` | EIA v2 petroleum price query. | `EIA_API_KEY`, `EIA_BASE_URL` | Fetches provider data. |
| `src/services/fuel/fuel-normalizer.ts` | `normalizeEiaDieselPrice` | Normalize EIA row. | none | Adds 12 hour expiry. |
| `src/services/fuel/fuel-service.ts` | `getLatestDieselFuelPrice` | Cache/fallback orchestration. | `SUPABASE_SERVICE_ROLE_KEY`, `EIA_API_KEY` | Uses Supabase cache before/after provider call. |
| `src/app/api/fuel/eia/route.ts` | `GET` | Fuel API route. | `EIA_API_KEY` | Route details should be reviewed before behavior change. |
| `src/services/fsc-intelligence.ts` | `calculateFscIntelligence` | Reuses calculator diesel price after the existing EIA/manual fuel path resolves. | none | No provider call, cache write, or env read. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for normalization and latest-row selection.
- mock response tests: needed for EIA response payload.
- schema validation tests: needed for consumed row fields.
- error fallback tests: needed for missing key/non-2xx/malformed payload.
- env var missing tests: needed for manual fallback.
- provider contract drift tests: needed for EIA series/facet fields.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in official docs.
- legacy API: v2 is current in EIA docs read for this task.
- SDK major version risk: none; REST direct.
- pricing/quota changes: EIA API key policy/limits.
- response field dependency: `period` and `value`.
- undocumented assumptions: exact petroleum facet/series semantics should be
  rechecked before changing fuel category or geography.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
