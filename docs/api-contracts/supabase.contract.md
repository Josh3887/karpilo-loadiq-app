# Provider Contract: Supabase JavaScript Clients
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://supabase.com/docs
- API reference: https://supabase.com/docs/reference/javascript/initializing
- SDK docs: https://supabase.com/docs/guides/auth/server-side/nextjs
- Pricing/quota/rate-limit docs, if available: Supabase project limits apply.
- Error-handling docs, if available: https://supabase.com/docs/guides/api/securing-your-api
## Karpilo LoadIQ usage boundary
LoadIQ uses Supabase for auth/session resolution, browser/server clients,
service-role admin operations, table reads/writes, billing/entitlement data, AI
governance records, and fuel cache storage. Supabase is not a provider of route,
weather, fuel market, payment, OpenAI, broker/load-board, or guaranteed
profitability intelligence.
## Authentication
- Auth method required by provider docs: project URL plus publishable/anon key
  for client/server session operations; service role key for server-only admin
  operations.
- Env var names used in app: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- Server-only or client-safe: URL and anon/publishable key are client-safe;
  service role key is server-only.
- Secret exposure risk: never expose service role key.
- Required headers: SDK-managed.
- Key restrictions recommended: keep service role in server runtime only.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `@supabase/ssr`, `@supabase/supabase-js`.
- Endpoint path or SDK method: `createServerClient`, `createBrowserClient`,
  `createClient`, `auth.getUser`, `from(...).select/insert/upsert/update`.
- HTTP method: SDK-managed.
- Required headers: SDK-managed.
- Content type: SDK-managed JSON.
- API version if applicable: Supabase JS v2.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `supabaseUrl` | yes | string | Project URL. | `src/lib/supabase-env.ts` | Normalized to URL origin. | Client-safe URL. |
| `supabaseAnonKey` / publishable key | yes | string | Public client key. | `src/lib/supabase-env.ts`, `src/lib/supabase-server.ts` | Required for SSR client. | Client-safe but still environment-managed. |
| `serviceRoleKey` | yes for admin | string | Server admin/service role key. | `src/lib/supabase-admin.ts`, `src/services/fuel/fuel-service.ts` | Required only for server admin writes/cache. | Never expose client-side. |
| `cookies.getAll/setAll` | yes for SSR | functions | Cookie adapter for SSR auth. | `src/lib/supabase-server.ts` | Provided from Next cookies. | Server Components may not set cookies. |
| table query arguments | varies | strings/objects | PostgREST table operations through SDK. | multiple `src/**` files | Must be reviewed per source file before behavior changes. | Contract maps provider boundary, not schema. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `auth.getUser().data.user` | object/null | Authenticated user. | yes | server routes and protected pages | Unauthorized/locked response when missing. |
| `{ data, error }` from table queries | mixed | Query result and error. | yes | billing, AI governance, fuel cache, saved loads | Source-specific fallback. |
| `user.id`, `user.email` | string | Auth user identifiers. | yes | entitlement/billing/admin/AI routes | Unauthorized or limited behavior when missing. |
## Error contract
Include:
- documented provider error shape: Supabase JS returns `{ data, error }` for
  many operations and throws in some client creation paths.
- HTTP status codes used by provider: SDK/PostgREST/Auth managed.
- auth failures: missing user blocks protected routes.
- validation failures: source-specific.
- quota/rate-limit failures: project limits apply; no global retry/backoff.
- timeout/network failure behavior: source-specific error fallback.
- app fallback behavior: unauthorized, unavailable, locked, manual, or safe
  failure depending on route.
- user-safe error message: routes should not expose service-role or SQL details.
- internal logging behavior: never log service role key or sensitive records.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: Supabase project plan limits.
- cache strategy: source-specific; fuel cache and AI request cache use tables.
- retry/backoff strategy: none globally.
- abuse prevention: RLS, service boundaries, auth checks, entitlement checks.
- client-side vs server-side call protection: service role is server-only.
- tier impact if relevant: app entitlements are stored/read through Supabase but
  commercial tier is separate from provider auth.
## Data privacy / security
Include:
- data sent to provider: auth/session data, saved loads, billing state,
  diagnostics, AI governance, cache records, and operational app data.
- PII risk: high.
- location data risk: possible saved load and route context.
- payment data risk: Stripe customer/subscription IDs, not card data.
- logging restrictions: do not log sensitive rows, JWTs, cookies, service key.
- what must never be logged: service role key, cookies, auth tokens, sensitive
  load/billing/admin data.
- whether requests must be server-side only: admin/service-role operations yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/lib/supabase-env.ts` | env helpers | Project URL/key resolution. | Supabase env vars | Values not printed. |
| `src/lib/supabase-server.ts` | `createClient` | SSR auth client. | Supabase public env vars | Cookie-backed. |
| `src/lib/supabase-admin.ts` | `createSupabaseAdminClient` | Service-role client. | `SUPABASE_SERVICE_ROLE_KEY` | Server-only. |
| `src/services/fuel/fuel-service.ts` | cache helpers | `fuel_price_cache` read/upsert. | `SUPABASE_SERVICE_ROLE_KEY` | No migration changes in this task. |
| `src/app/api/**` | route handlers | Auth/table operations. | Supabase env vars | Review source-specific schema before changes. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for env helpers.
- mock response tests: needed for route-level auth/query behavior.
- schema validation tests: needed for table contracts.
- error fallback tests: needed for unavailable auth/table errors.
- env var missing tests: needed for client/admin creation.
- provider contract drift tests: needed for Supabase SDK major updates.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in docs read for this task.
- legacy API: none confirmed.
- SDK major version risk: Supabase JS/SSR major updates.
- pricing/quota changes: project plan limits.
- response field dependency: `{ data, error }`, auth user shape.
- undocumented assumptions: database schema/RLS are outside this provider
  contract and must be governed separately.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
