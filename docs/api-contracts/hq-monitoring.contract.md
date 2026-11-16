# HQ provider history and cost visibility

Scope: authenticated web HQ only. Server-only getProviderConfig credentials; private,
no-store responses. No sends, customer mutations, billing settings changes or native work.

## Requests and normalized response

GET /api/monitoring accepts provider Sentry, Cloudflare, PostHog or Vercel and range
24h/7d. Unknown values return 400. Response has status, reason, checkedAt, window,
scope and series [{name,unit,description,points:[{time,value}]}]. Missing readings
remain missing, never zero. Successful reads cache 60 seconds per warm instance;
failures 15 seconds. Upstream timeouts 15 seconds (PostHog 18); route limit 30.
Refresh is manual or opt-in every minute while the page is visible. No background alarms.

- Sentry: bearer token org:read; GET organization stats_v2 with project
  4512353987133440, category error, field sum(quantity), groupBy outcome, interval 1h,
  explicit start/end. Consume intervals and groups.by.outcome/series.sum(quantity).
  Fixed product project, no event identities, stack traces or payloads.
  https://docs.sentry.io/api/organizations/retrieve-event-counts-for-an-organization-v2/
- Cloudflare: bearer token with Zone Analytics Read; POST read-only GraphQL,
  fixed karpilo-liq.com zone 354a61884ea0777e1c8a1a8f01b8aa8a. httpRequests1dGroups
  limit 8, complete UTC dates, ascending date; consume dimensions.date and
  sum.requests/bytes/cachedRequests/threats. Non-proxied hosts have no HTTP data.
  GraphQL rejection is unavailable unless the response indicates authorization denial.
  https://developers.cloudflare.com/analytics/graphql-api/migration-guides/zone-analytics/
- PostHog: personal API key query:read, pinned us.posthog.com project 447918;
  POST query HogQLQuery with fixed hourly aggregate event count over 1/7 days,
  limit 168. Consume results timestamp/count pairs only. No user-supplied query,
  identities, properties or recordings. An empty result is distinct from missing access.
  https://posthog.com/docs/api/queries
  https://posthog.com/docs/api/scopes
- Vercel: existing server bearer token, GET /v1/billing/charges for the HQ team,
  latest complete UTC day, streamed JSONL capped at 8 MB. Validate complete parse;
  no partial totals. The current documented export does not establish a verified
  LoadIQ allocation mapping: return attribution-missing, no monetary totals.
  ResourceId/Tags/x_CostAttribution project mapping is UNVERIFIED and is not used.
  https://vercel.com/docs/rest-api/billing/list-focus-billing-charges

401/403 -> access-denied, 429 -> rate-limited, malformed/transport/query errors ->
unavailable. Raw provider error bodies and credentials never reach clients.
Provider schemas, scopes, retention and plan restrictions remain drift risks.

## AWS and existing inventory charts

/api/aws/metrics adds ordered timestamp/value points to existing CloudWatch reads,
7d hourly or 24h five-minute buckets, ten fixed LoadIQ ECS/RDS/Lambda metrics,
20-second SDK deadline, 10,000-point cap. NextToken or incomplete result status
is partial. Existing latest-value consumers remain compatible. cloudwatch:GetMetricData
is already authorized. This endpoint is uncached; optional UI refresh is once/minute.
https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricData.html

Resend daily send counts use the existing bounded latest page (up to 20); GitHub
uses latest 10 workflows; Vercel deployment readiness uses returned HQ deployment
created/ready timestamps. These are labelled bounded activity, not invoiced usage,
latency, uptime or quota. No extrapolated monthly totals.

AWS allocation keys were observed inactive. Automatic approval review blocked
activation/backfill; no mutation was executed. Product costs remain unavailable.
Other provider costs show exact access/attribution gaps. No company-wide total is
represented as LoadIQ spend. Live Stripe remains outside authorization.

Source: lib/monitoring-read.mjs, app/api/monitoring/route.js,
app/api/aws/metrics/route.js, components/MonitoringPanel.jsx, ProviderPage.jsx.
