# Provider Contract: PostHog API

## Provider Name
PostHog Capture API and Next.js library surfaces.

## Karpilo Module Owner
Internal analytics.

## Purpose
Internal product analytics and event capture. PostHog is not a customer-facing
product feature.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://posthog.com/docs | verified 2026-06-28 |
| Endpoint documentation URL | https://posthog.com/docs/api/capture, https://posthog.com/docs/libraries/next-js | verified 2026-06-28 |
| Authentication documentation URL | https://posthog.com/docs/api/overview | requires provider-doc confirmation before production review |
| Rate limit/quota documentation URL | https://posthog.com/docs/api/rate-limits | requires provider-doc confirmation before production review |

## Required Environment Variables
- `POSTHOG_ENABLED`
- `POSTHOG_PROJECT_TOKEN`
- `POSTHOG_HOST`
- Documented browser-safe PostHog vars only when analytics review permits.

## Forbidden Environment Usage
- Provider secrets in browser bundles.
- Sensitive trucking operational data, direct personal identifiers, payment
  identifiers, provider keys, or raw route/load data in analytics events.

## Endpoints Used
- Capture API and library-based event capture where enabled.

## Normalized Internal Output
PostHog events must pass through internal analytics routing and privacy review.

## Required Mock Files
- `test-fixtures/api/analytics/posthog/capture.success.json`
- `test-fixtures/api/analytics/posthog/errors/unauthorized-401.json`
- `test-fixtures/api/analytics/posthog/errors/forbidden-403.json`
- `test-fixtures/api/analytics/posthog/errors/not-found-404.json`
- `test-fixtures/api/analytics/posthog/errors/rate-limited-429.json`
- `test-fixtures/api/analytics/posthog/errors/server-error-500.json`
- `test-fixtures/api/analytics/posthog/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint drift,
408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON, empty
response, and network failure.

## Drift Rules
- Analytics capture must not become product entitlement evidence.
- Provider keys and sensitive operational payloads must not be sent to PostHog.

## Last Verified Date
2026-06-28.

