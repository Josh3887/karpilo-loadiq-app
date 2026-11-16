# Web HQ Sentry observations

## Official sources
- https://docs.sentry.io/api/guides/create-auth-token/
- https://docs.sentry.io/api/organizations/retrieve-an-organization/
- https://docs.sentry.io/api/organizations/list-an-organizations-projects/
- https://docs.sentry.io/api/events/list-an-organizations-issues/
- https://docs.sentry.io/api/pagination/

## Authentication and requests
Founder middleware protects GET /api/sentry. SENTRY_AUTH_TOKEN comes from the existing
allowlisted AWS provider secret reader (60-second credential cache); no ingestion DSN.
Internal integration limited to karpilo-endeavor-technologies, org:read and event:read.
No project:read, team/member/release/write/admin permissions are needed for these reads.
No webhooks, alert actions, JavaScript origins or customer ingestion changes.
Three concurrent server-only Bearer GETs to the fixed sentry.io API host:
- /api/0/organizations/karpilo-endeavor-technologies/
- .../projects/?per_page=100
- .../issues/?query=is%3Aunresolved&statsPeriod=14d&sort=date&limit=20
The current organization issue endpoint replaces the deprecated project issue endpoint.
All projects and environments in this organization are included, with the stated window.

## Responses and privacy
Consume org id/slug; project id/slug/platform/firstEvent; issue id/shortId/project.id,
project.slug/status/level/count/firstSeen/lastSeen. Validate collection shapes and IDs;
return only these normalized fields. Build issue links from fixed host and numeric ID.
Do not return raw titles, culprit, stacks, request context, user identity, assignees,
attachments, tags, provider links or credentials. Event-read scope itself authorizes
provider event data; HQ intentionally exposes only the listed metadata.
Each endpoint has independent coverage; only all three successful reads are connected.
A denial/malformed payload is unavailable data, never a successful empty inventory.

## Bounds, errors and drift
At most three GETs per explicit refresh, eight-second timeout each, no retries,
redirects, polling, result caching or automatic pagination. Private/no-store response;
30-second route budget. Parse Link rel=next/results=true into pagination booleans and
never follow provider URLs. Display first-page limits and additional-page notices.
401/403 access-denied, 429 rate-limited, other HTTP/network/schema errors unavailable.
Exceptions/provider error bodies are suppressed; secret-store failure returns generic 503.
Empty issues do not prove health. Provider issue count is not a bill or a whole-org total.
Releases, alerts, performance, quotas and billing remain unimplemented. API schema,
permissions, organization slug, pagination headers and retention windows can drift.

## Source and validation
hq-web/lib/sentry-read.mjs; app/api/sentry/route.js; components/SentryObservations.jsx;
app/page.jsx; app/api/providers/route.js. Tests cover auth, fixed endpoints, privacy,
malformed responses, partial denial, missing credentials, pagination and failures.
Live verification remains pending until credential creation and deployment.

### Product boundary — 2026-11-16
HQ filters returned project/issue inventories to the explicitly identified karpilo-loadiq-isolated project. Generic or other project names are excluded rather than guessed to belong to LoadIQ. Pagination describes the provider page, so an empty filtered page is not an assertion that the organization has no issues. Organization metadata remains connection evidence only, not product billing or health evidence.
