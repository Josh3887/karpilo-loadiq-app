# HQ continuous monitoring

Scope: only LoadIQ website, app and HQ HTTPS probes; Redis PING; LoadIQ Resend domains; fixed karpilo-liq.com Cloudflare zone; isolated LoadIQ Sentry issues. PostHog capture is deferred until customer V1 refinement. No messages or customer data are collected.

AWS EventBridge Scheduler invokes a dedicated Lambda every five minutes. Its role reads only the existing provider secret and writes only the monitoring table and dedicated logs/dead-letter queue. HQ has Query-only access to that table. No customer infrastructure is modified.

## Contract

DynamoDB PutItem stores pk=loadiq, a five-minute epoch sk, checkedAt and normalized observations in payload, plus expiresAt (30 days). Query uses the fixed partition, latest 24 hours, descending Limit=288 and consistent reads. LastEvaluatedKey means partial history. TTL deletion is asynchronous. No history, malformed responses or denied reads never imply health. Older than 15 minutes is stale. The protected HQ route caches successful reads 30 seconds and failures 15 seconds; HTTP responses are private/no-store.

Provider requests use server-only existing bearer credentials, bounded GETs, eight-second timeouts and no redirects. HTTPS HEAD probes use no credentials; expected HQ 401 establishes reachability only. Provider counts describe returned pages, not lifetime totals. Resend stores only product domain names/status; Cloudflare only DNS count and pagination; Sentry only bounded unresolved count. Redis requires validated HTTPS Upstash host and PONG. No payloads, addresses, tokens or customer records enter history.

## Cost and failure controls

One scheduled invocation per five minutes, 45-second function timeout, one scheduler retry, encrypted on-demand table, 14-day logs and dead-letter retention. This creates metered AWS usage. Account Lambda limits prevent a reserved concurrency allocation; the collector uses the shared account pool. The retained history table from initial provisioning is referenced explicitly by the runtime stack. Missing credentials, HTTP failures and schema failures are explicit. No external alarm delivery exists yet. Provider API/schema drift and scope changes require review.

## Sources and mapping

- https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html
- https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html
- https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html
- https://resend.com/docs/api-reference/domains/list-domains
- https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/list/
- https://docs.sentry.io/api/events/list-a-projects-issues/
- https://upstash.com/docs/redis/features/restapi

Implementation: aws/hq-monitoring/collector.py and generated stack.json; hq-web/lib/monitor-history.mjs; app/api/monitoring/history/route.js; components/ContinuousMonitoring.jsx. Availability duration is not page load performance or visitor traffic.
