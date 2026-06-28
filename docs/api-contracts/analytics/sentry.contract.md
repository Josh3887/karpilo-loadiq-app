# Provider Contract: Sentry SDK/API

## Provider Name
Sentry Next.js SDK and related API surfaces.

## Karpilo Module Owner
Internal monitoring.

## Purpose
Error capture, release/environment metadata, and internal diagnostics.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://docs.sentry.io/platforms/javascript/guides/nextjs/ | verified 2026-06-28 |
| Endpoint documentation URL | https://docs.sentry.io/platforms/javascript/guides/nextjs/ | SDK-based integration; direct event endpoint not used by app code |
| Authentication documentation URL | https://docs.sentry.io/api/auth/ | verified 2026-06-28 |
| Rate limit/quota documentation URL | https://docs.sentry.io/product/accounts/quotas/ | requires org-plan review before production tuning |

## Required Environment Variables
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- Sentry environment, release, and sample-rate vars documented in
  `docs/operations/env-contracts.md`

## Forbidden Environment Usage
- `NEXT_PUBLIC_SENTRY_AUTH_TOKEN`
- Provider keys, secrets, raw provider payloads, direct personal identifiers, or
  sensitive route/load data in Sentry events.

## Endpoints Used
- SDK capture surfaces; source-map upload may use Sentry auth token in build
  tooling only.

## Normalized Internal Output
Sentry remains internal monitoring and must not be exposed as customer-facing
product state.

## Required Mock Files
- `test-fixtures/api/analytics/sentry/capture.success.json`
- `test-fixtures/api/analytics/sentry/errors/unauthorized-401.json`
- `test-fixtures/api/analytics/sentry/errors/forbidden-403.json`
- `test-fixtures/api/analytics/sentry/errors/not-found-404.json`
- `test-fixtures/api/analytics/sentry/errors/rate-limited-429.json`
- `test-fixtures/api/analytics/sentry/errors/server-error-500.json`
- `test-fixtures/api/analytics/sentry/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint/project
drift, 408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON,
empty response, and network failure for any direct API usage.

## Drift Rules
- Sentry auth token must never be public.
- Sentry payload filtering must prevent secrets and sensitive operational data
  from leaving the app.

## Last Verified Date
2026-06-28.

