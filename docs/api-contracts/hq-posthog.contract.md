# Web HQ PostHog read-only inventory

## Official sources
- https://posthog.com/docs/api/personal-api-keys
- https://posthog.com/docs/api/projects
- https://posthog.com/docs/api/dashboards
- https://posthog.com/docs/api/insights

## Authentication and requests
Founder middleware protects GET /api/posthog. Existing getProviderConfig reads
POSTHOG_PERSONAL_API_KEY, POSTHOG_HOST and POSTHOG_PROJECT_ID from the dedicated
AWS provider secret, with a 60-second credential cache. Personal key is restricted
to project 447918, with project:read, dashboard:read and insight:read only; one-year
expiry. Existing ARGUS key and customer ingestion configuration are untouched.
Three concurrent Bearer-authenticated GETs, with no user-supplied query input:
- /api/organizations/019e7d60-e839-0000-2715-136885c6fd67/projects/{id}/
- /api/projects/{id}/dashboards/?limit=50
- /api/projects/{id}/insights/?limit=50&saved=true&basic=true&refresh=force_cache
Host must be an exact HTTPS PostHog cloud origin (US, EU or legacy app), with no
credentials, path, query or fragment. Project ID must be a positive safe integer.
Organization is pinned; returned project ID and organization must match.

## Normalization and privacy
Consume project id, organization, name, timezone and ingested_event. Return only
id/name/timezone and nullable ingestion boolean. Ingestion is provider-reported,
not a live capture test and not a total event count. Consume collection results
id/name/created_at and next; return at most 50 metadata rows and pagination booleans.
Never follow next URLs or forward raw payloads, project tokens, creator identities,
queries, result series, person records, recordings, descriptions or error bodies.
Separate project/dashboard/insight coverage; connected requires all three reads.
Null means unavailable; successful empty lists remain empty, never inferred health.

## Errors, bounds and drift
Eight-second request timeout, 30-second route budget, no retries, no background
polling, no automatic pagination, no result cache. Responses private/no-store.
401/403 access-denied; 429 rate-limited; network/schema/other HTTP unavailable.
Secret-store errors produce generic 503. Basic saved-insight metadata uses force_cache;
no explicit analytics query, capture, write, flag or replay requests are made.
Billing, usage totals and funnel/retention calculations remain unimplemented.
Schema fields, permissions, project ownership, key expiry and pagination may drift.

## Implementation and validation
hq-web/lib/posthog-read.mjs; app/api/posthog/route.js;
components/PosthogObservations.jsx; app/page.jsx; app/api/providers/route.js.
Mock tests cover bounded reads, redaction, partial denial, empty inventories,
malformed data, invalid host/project and provider errors. Live verification pending.
