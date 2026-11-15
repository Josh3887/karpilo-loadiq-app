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
