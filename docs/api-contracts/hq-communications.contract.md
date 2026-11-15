# HQ communications observations — November 15, 2026

Scope: founder-only read-only HQ provider observations. Sending, verification creation,
broadcast publishing, webhook ingestion and subscriber changes are not implemented here.

## Official contracts
- Resend: https://resend.com/docs/api-reference/introduction
- https://resend.com/docs/api-reference/domains/list-domains
- https://resend.com/docs/api-reference/templates/list-templates
- https://resend.com/docs/api-reference/emails/list-emails
- https://resend.com/docs/api-reference/broadcasts/list-broadcasts
- Twilio: https://www.twilio.com/docs/iam/api/account
- https://www.twilio.com/docs/usage/api/usage-record
- https://www.twilio.com/docs/messaging/api/message-resource
- https://www.twilio.com/docs/verify/api/service

## Authentication and boundaries
HQ middleware requires founder authentication. Provider credentials remain server-only.
Resend uses RESEND_API_KEY as Bearer auth; listing requires access beyond a sending-only key.
Twilio uses TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN for Basic auth over HTTPS.
SID must match AC plus 32 hex characters before URL construction. No credentials are created.
Requests use fixed provider hosts, reject redirects, time out after eight seconds, and do not retry.
Responses use private/no-store. No sending or mutation endpoints are exposed.

## Requests and consumed responses
Resend GET /domains, /templates, /emails, /broadcasts uses limit=20. Consume data and
has_more; normalize IDs, names, statuses, aliases, subject and timestamps. No recipient
list or message bodies are returned. All-success is connected, mixed-success partial,
all-failure error; missing key is unconfigured. Malformed data is unavailable, never empty.
Twilio GET account, Usage/Records/ThisMonth.json (PageSize=100), Messages.json
(PageSize=20), and Verify v2 Services (PageSize=20). Account: sid/friendly_name/status/type.
Usage: category/count/count_unit/usage/usage_unit/price/price_unit/start_date/end_date.
Messages: sid/status/direction/date_sent/date_created/error_code/price/price_unit.
Services: sid/friendly_name/code_length/date_created. next_page_uri and meta.next_page_url
become booleans only; no untrusted continuation URL is followed. No automatic pagination.
Twilio account auth_token, message bodies and phone numbers are discarded before response.

## Limits and interpretation
One bounded request per scope per refresh. No background polling. Repeated founder refreshes
can hit provider quotas; partial/error states must remain visible. Resend's account-wide
rate limits also include customer-app sends; this reader does not claim global coordination.
Pagination is explicitly disclosed: this is not full historical inventory. Twilio categories
may overlap and must not be summed into an invoice. Service presence is not verification
delivery or fraud-monitoring evidence. Billing reconciliation and webhook history are pending.
Provider error bodies and raw exceptions are never exposed. Twilio 401/403 are access-denied,
429 rate-limited, transport/schema problems unavailable. Missing metrics remain null.

## Source and verification
hq-web/app/api/resend/route.js; hq-web/app/api/twilio/route.js;
hq-web/lib/provider-read.mjs; hq-web/lib/twilio-read.mjs; hq-web/app/page.jsx.
Tests cover missing credentials, SID validation, redaction, denied scopes, malformed
responses and rate limits. Live credential acceptance remains deferred.

## Web credential wiring and read-only health — November 15, 2026
Official references additionally consulted:
- https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
- https://upstash.com/docs/redis/features/restapi
- https://www.eia.gov/opendata/documentation.php
- https://resend.com/docs/api-reference/rate-limit

Web configuration: HQ_PROVIDER_SECRET_ARN, AWS_REGION and the existing AWS identity.
Dedicated secret contains only explicitly reused provider values, not DB URLs or founder
passwords. IAM GetSecretValue is limited to the dedicated web secret ARN. Config is
allowlisted and cached 60 seconds; failure returns 503 with a generic message. No raw
provider exception or credential is rendered. Environment config overrides secret fields.

Redis uses HTTPS *.upstash.io /ping with Bearer auth. Reject userinfo, ports, query,
fragment, custom paths and other hosts; reject redirects. Consume only result=PONG and
measure response time. Does not read customer keys, write data, reconcile bills or claim
memory/CPU/eviction coverage. HTTP 200 with an invalid payload is an error.

EIA uses GET /v2/petroleum/pri/gnd/data/ with server-only api_key, frequency=weekly,
data[0]=value, facets[series][]=EMD_EPD2DXL0_PTE_NUS_DPG, period descending, offset=0,
length=1. Consume response.data[0].period/value; require a dated positive numeric price.
Normalize to latestPeriod/dieselPrice/units (USD per gallon). Publication period is not
connection time. No manual price is invented when EIA fails. The customer calculator's
existing fuel cache and behavior are unchanged.

Redis/EIA/Resend observations cache 60 seconds per warm process, with concurrent request
coalescing; no distributed rate-limit guarantee. Registry does not duplicate dedicated
Resend/Twilio/GitHub/Vercel/Cloudflare checks. Browser payloads are private/no-store.
HTTP 401/403 maps to access-denied, 429 rate-limited, transport errors unavailable.
Resend maintains per-scope failures; sending-only keys may deny every inventory call.

Source: hq-web/lib/provider-config.mjs, provider-cache.mjs, operational-read.mjs;
app/api/providers, app/api/resend, app/api/twilio; app/page.jsx.
Tests: secret allowlist/cache/failure, Redis URL validation/schema rejection, EIA schema
and redaction, observation coalescing. Live results must be checked after deployment.
