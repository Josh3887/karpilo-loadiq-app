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

AWS allocation keys were activated after explicit approval. The November 1 backfill
succeeded November 16 at 04:16:45 UTC. A subsequent tagged read returned no groups;
this is pending cost attribution, not a verified zero bill.
Other provider costs show exact access/attribution gaps. No company-wide total is
represented as LoadIQ spend. Live Stripe remains outside authorization.

Source: lib/monitoring-read.mjs, app/api/monitoring/route.js,
app/api/aws/metrics/route.js, components/MonitoringPanel.jsx, ProviderPage.jsx.

## Live verification, November 15, 2026

Deployed HQ rendered seven-day CloudWatch series (up to 168 readings per metric),
Sentry accepted error-event series (169 inclusive hourly buckets), Resend bounded
send history and 98 ready Vercel deployments with readiness durations. Cloudflare
returned an authorization denial for analytics. PostHog trends were unavailable with
its inventory credential. Vercel billing returned HTTP 404 with the deployed project
token, although the separate connector could read a team export. Neither result
establishes product costs. Mobile Sentry page width was 390/390 with no page overflow.

Inventory descriptions now point to the separate history check. Cloudflare inventory
coverage.analytics is `separate-check`; it does not assert successful analytics access.
Daily UTC chart labels preserve their date; AWS storage charts display decimal GB.

## AWS cost adapter, November 16
GET /api/aws/costs uses existing IAM ce:GetCostAndUsage, us-east-1, DAILY
UnblendedCost grouped by SERVICE, current month through today exclusive (UTC).
Fixed OR filter: Project=KarpiloLoadIQ or Karpilo LoadIQ; Application=LoadIQ-HQ
or KarpiloLoadIQHQ; application=loadiq-hq; aws:ecs:clusterName=karpilo-isolated-test.
OR prevents double counting resources carrying multiple matching tags. Consume
ResultsByTime.TimePeriod, Estimated, Groups.Keys, Metrics.UnblendedCost.Amount/Unit.
Only USD finite amounts are accepted. NextPageToken suppresses totals (partial).
Empty groups yield connected-empty with null total, never a zero bill. Reported
values cover only tagged resources: untagged costs and shared credits are excluded.
No grant-balance claim or account-wide fallback. One request per warm instance/hour
for successful and empty reads, failure cache 15 seconds; no auto billing refresh,
20-second deadline, no SDK retries, route max 30, private/no-store.
Official: https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostAndUsage.html
Source: lib/aws-costs.mjs, app/api/aws/costs/route.js, components/MonitoringPanel.jsx.
Cost Explorer API requests may incur query charges; caching bounds routine reads.

Cloudflare Analytics Read and PostHog query:read were saved with approval and
verified through live HQ on November 16: successful empty histories, fixed domain
and project respectively. Old permission-needed copy was removed.

PostHog collection diagnosis: ECS primary task revision 24 has no POSTHOG-named
environment or secret bindings. The separate Vercel isolated frontend environment
has NEXT_PUBLIC_POSTHOG_ENABLED=false and no configured ingestion token. The repository client requires
NEXT_PUBLIC_POSTHOG_ENABLED=true; server capture requires an enabled flag and
project ingestion token. This is separate from HQ query access. No customer
deployment or collection enablement was performed during this HQ-only task.

Founder clarified that PostHog event structure/collection has never been set up.
The HQ alarm now labels this as setup pending, not a broken integration.
Vercel minimum-scope investigation confirmed Billing Read is available to a
private integration, plus mandatory Integration Configuration Read. Registration
requires an Integration Agreement and an OAuth redirect flow; existing HQ PAT
has no edit action. No broad team token was created.

## Founder priority update — November 16, 2026

- **PostHog event design and capture: deliberately deferred.** Build only after the
  customer V1 interface is refined and its interactions are defined. Then define
  the event catalogue, allowed properties, funnels and privacy boundaries before
  activating capture. Preserve the working HQ read connection. No synthetic events
  or customer tracking activation to make an empty dashboard look connected.
- **All other HQ integrations remain active implementation scope.** Centralize live
  operations, usage, attributable costs, deployments, errors, delivery, domains,
  quotas and alarms for the LoadIQ website and customer application.
- **Surfaces:** karpilo-liq.com (website), app.karpilo-liq.com (customer app), and
  hq.karpilo-liq.com (back office). Keep website traffic, customer activity and HQ
  administrative traffic distinct; exclude unrelated company/Argus projects.
- Website traffic monitoring is required now, independently of future PostHog
  customer event instrumentation. Verify the hosting/traffic source: Cloudflare
  DNS-only records cannot supply proxied HTTP traffic analytics. Provider request
  counts must not be mislabeled as unique visitors or sessions.
- An inactive customer app can have no customer events while infrastructure and
  website monitoring continue. Missing metrics, deliberately deferred collection,
  measured zero activity and failed observations must remain distinct.

This is the implementation scope and dependency record, not a claim that all
provider billing, traffic collection or background monitoring is complete.

## Vercel project traffic

POST /v2/observability/query is verified in official Vercel CLI source (legacy metrics branch): https://github.com/vercel/vercel/blob/main/packages/cli/src/commands/metrics/query.ts . Bearer server token, teamId fixed; metric vercel.request.count, sum, project scope ownerId/projectIds, hourly granularity, last 24h/7d complete hours, limit168. Website and HQ project IDs are fixed; no team-wide fallback. Consume data.timestamp/vercel_request_count_sum; malformed/negative values reject the series. Coverage remains independent per project. This counts all-environment HTTP requests, including assets/bots/probes, never unique visitors. Customer app is separately hosted, not attributed to the isolated frontend. Two parallel queries, 15-second timeout, 60-second success / 15-second failure cache, private/no-store. Billing is a separate nested result. Legacy endpoint drift is a known risk; no automatic alternate endpoint or permission expansion.
