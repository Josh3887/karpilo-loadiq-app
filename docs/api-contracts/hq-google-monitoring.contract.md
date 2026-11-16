# HQ Google monitoring contract

Federation and project-only Monitoring Viewer provisioned 2026-11-16. Live token exchange succeeded after the signed-header fix. Cloud Monitoring API enabled with approval. Corrected one_of service selector verified live on HQ: seven-day history returned 226 Address Validation, 10 Places and 238 Routes requests, all in 2xx series. The 24-hour registry read returned no series, independently of the seven-day history. No synthetic requests were sent.

## Evidence and scope
Google console identifies `Karpilo LoadIQ - isolated sandbox` key ID
`3f4dea78-1edb-4ea7-9a14-440a382eb90d` in project
`gen-lang-client-0079060133` (78844481981). Project also contains a default Gemini
key; its activity is not assumed to belong to LoadIQ. No key values copied.

Official references:
- https://docs.cloud.google.com/iam/docs/reference/sts/rest/v1/TopLevel/token
- https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-clouds
- https://docs.cloud.google.com/monitoring/api/ref_v3/rest/v3/projects.timeSeries/list
- https://docs.cloud.google.com/monitoring/api/metrics_gcp_p_z
- https://cloud.google.com/blog/topics/developers-practitioners/api-keys-are-open-secrets/

## Authorization
Provisioned pool `loadiq-hq`, AWS provider `hq-aws`, account 337058058945.
Mapping google.subject=assertion.arn; condition restricts exactly
`arn:aws:iam::337058058945:user/karpilo-hq-preview-readonly`.
Grant Monitoring Viewer on this project only to that federated subject, not the
entire pool. No service-account private key. Existing AWS credentials sign an
STS GetCallerIdentity request with signed x-goog-cloud-target-resource.
Google token exchange has monitoring.read scope; token remains server-only.
Activation flag HQ_GOOGLE_MONITORING_ENABLED must be true after provisioning.
No grants or APIs for writes, billing administration, model inference or Gmail.

## Requests and responses
GET monitoring.googleapis.com/v3/projects/{fixed project}/timeSeries, metric
serviceruntime.googleapis.com/api/request_count, consumed_api, fixed credential_id
`apikey:<key UUID>`, three services Address Validation, Places New and Routes.
24h/7d complete-hour window excludes 180-second reporting delay; ALIGN_SUM and
REDUCE_SUM grouped by service/response_code_class. Maximum 10,000 points;
nextPageToken/executionErrors/malformed results suppress output rather than
claiming a complete total. Read int64Value and interval.endTime only. Empty
response is connected with no reported series, never fabricated zero buckets.
No addresses, prompts, user identities, key values or provider error bodies.
Gemini returns attribution-missing until a LoadIQ-specific mapping is verified.
Billing export, quotas, latency and invoice allocation are not yet implemented.

8-second token exchange plus 15-second metric timeout within 30-second route.
No retries. Existing observation cache: success 60 seconds, failure 15 seconds;
manual or visible-page opt-in minute refresh. Private/no-store, existing founder
auth. STS exchanges are not billable inference requests. Monitoring API quota
applies. 401/403 access-denied, 429 rate-limited, others unavailable.

Source: hq-web/lib/google-monitoring.mjs, lib/provider-config.mjs,
app/api/monitoring/route.js, components/MonitoringPanel.jsx.
Risks: label support by service, key rotation changing attribution, empty history,
provider trust and role binding, project metrics scope, schema drift. Live verify
before claiming connected; API activation, exact IAM trust, token exchange and product-filtered reads are verified. Billing export and latency/quota coverage remain outstanding.

Google STS rejects extra signed headers: applyChecksum=false prevents the Smithy x-amz-content-sha256 header. Verified against https://docs.cloud.google.com/iam/docs/troubleshooting-workload-identity-federation . Regression asserts the exact allowed header set.

Metrics selector uses documented one_of for service alternatives, keeping resource label comparisons in one AND expression. https://docs.cloud.google.com/monitoring/api/v3/filters . Provider registry now uses an actual bounded Google monitoring read, rather than looking for an unused Maps key in HQ.
