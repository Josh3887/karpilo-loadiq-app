# Provider Contract: Supabase JavaScript Clients

## Provider Name
Supabase JavaScript clients and REST-backed table/auth operations.

## Karpilo Module Owner
Auth, app data access, admin data access, and saved operational data.

## Purpose
Authentication, session handling, RLS-protected table access, admin/server-only
operations, and app persistence.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://supabase.com/docs | verified 2026-06-28 |
| Endpoint documentation URL | https://supabase.com/docs/reference/javascript/initializing, https://supabase.com/docs/guides/auth/server-side/nextjs, https://supabase.com/docs/guides/api/securing-your-api | verified 2026-06-28 |
| Authentication documentation URL | https://supabase.com/docs/guides/auth | verified 2026-06-28 |
| Rate limit/quota documentation URL | https://supabase.com/docs/guides/platform/going-into-prod | requires project-plan review before production tuning |

## Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server/admin paths only.

## Forbidden Environment Usage
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
- Service-role keys in browser bundles, snapshots, Sentry, PostHog, or logs.

## Endpoints Used
- Supabase Auth and table operations through Supabase JS clients.

## Normalized Internal Output
Supabase data must pass through LoadIQ service/domain boundaries before UI
consumption. Vendor response shapes and service-role behavior must not leak to
client components.

## Required Mock Files
- `test-fixtures/api/database/supabase/auth.success.json`
- `test-fixtures/api/database/supabase/tableRead.success.json`
- `test-fixtures/api/database/supabase/errors/unauthorized-401.json`
- `test-fixtures/api/database/supabase/errors/forbidden-403.json`
- `test-fixtures/api/database/supabase/errors/not-found-404.json`
- `test-fixtures/api/database/supabase/errors/rate-limited-429.json`
- `test-fixtures/api/database/supabase/errors/server-error-500.json`
- `test-fixtures/api/database/supabase/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden/RLS denied, 404 table
or function drift, 408/timeout, 429 rate limited, 500+ provider unavailable,
malformed JSON, empty response, and network failure.

## Drift Rules
- RLS/service-role boundaries must not be weakened to make UI paths work.
- Supabase migrations or commands require explicit separate approval.
- Public anon/publishable keys must remain distinct from service-role keys.

## Last Verified Date
2026-06-28.

