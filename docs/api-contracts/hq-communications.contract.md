# HQ communications observations — November 15, 2026

Scope: founder-only HQ provider observations and an operator-reviewed single-recipient
Resend template composer. Verification creation, broadcast publishing, webhook ingestion
and subscriber changes are not implemented here.

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
Twilio uses TWILIO_ACCOUNT_SID for resource paths and TWILIO_API_KEY_SID /
TWILIO_API_KEY_SECRET for Basic auth over HTTPS. A legacy TWILIO_AUTH_TOKEN remains
supported only when neither API-key field is configured; incomplete key pairs fail closed.
Account SID must match AC plus 32 hex characters; API-key SID must match SK plus 32 hex
characters before network access. Credential provisioning is a separate operator action.
Requests use fixed provider hosts, reject redirects, time out after eight seconds, and do not retry.
Observation responses use private/no-store. The separately documented template composer
below adds an explicit operator-reviewed send endpoint; inventory routes remain read-only.

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
responses and rate limits. Twilio live credential acceptance remains deferred.

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

Redis/Resend observations cache 60 seconds and EIA one hour per warm process, with concurrent request
coalescing; no distributed rate-limit guarantee. Registry does not duplicate dedicated
Resend/Twilio/GitHub/Vercel/Cloudflare checks. Browser payloads are private/no-store.
HTTP 401/403 maps to access-denied, 429 rate-limited, transport errors unavailable.
Resend maintains per-scope failures; sending-only keys may deny every inventory call.

Source: hq-web/lib/provider-config.mjs, provider-cache.mjs, operational-read.mjs;
app/api/providers, app/api/resend, app/api/twilio; app/page.jsx.
Tests: secret allowlist/cache/failure, Redis URL validation/schema rejection, EIA schema
and redaction, observation coalescing. Live results must be checked after deployment.

EIA read timeout is 20 seconds; the registry route maximum is 30 seconds. Resend scope
HTTP statuses are normalized without exposing error bodies. Live checks verified Redis
PING and existing AWS/GitHub/Vercel connections. The original Resend credential denied
all inventory scopes; this was resolved after deployment on November 15, 2026.
The handoff records browser verification of domains, templates, emails and broadcasts
using a dedicated full_access inventory key in the existing HQ secret. HQ routes remain
read-only. Templates include the five-load snapshot templates and deliveries include prior
records. Templates/emails are bounded first-page inventories with additional-page notices.
karpiloliq.com showed Failed; karpilo-liq.com and karpiloloadiq.com showed Verified.
No DNS changes were made. This does not complete newsletter publishing or two-way mail.
This continuation has not independently repeated that browser verification.

Stripe test observation: https://docs.stripe.com/api/balance/balance_retrieve.
GET https://api.stripe.com/v1/balance, Basic API-key auth, Stripe-Version
2026-10-28.endive. STRIPE_TEST_SECRET_KEY only; reject live prefixes before network.
Require object=balance, livemode=false and available/pending arrays. Discard amounts
and private fields; render connection and explicit test-mode label. Existing isolated
test credential is reused in Secrets Manager. Prefer a dedicated balance-read restricted
key when credentials are provisioned. No customer queries, charges, mutations or live
payment verification; existing billing webhooks remain unchanged. Cache 60 seconds,
8-second timeout, no retry or redirect. Test rejects live keys and live-mode payloads.

Failed observations expire after 15 seconds instead of holding a transient failure for
the full success cache lifetime. No automatic background retry is performed.

## Communications reusable-template interface — November 15, 2026
Official contracts additionally reviewed:
- https://resend.com/docs/api-reference/templates/get-template
- https://resend.com/docs/dashboard/templates/introduction
- https://resend.com/docs/api-reference/emails/send-email

The existing Resend collection contains 55 templates per live connector read: two
published, 53 unpublished, including six named SUPERSEDED. These are templates,
not saved message drafts. Display provider draft status as Unpublished; preserve the
original provider status and aliases internally. Do not rename or publish templates.

GET /api/resend/templates proxies /templates?limit=100 with optional validated after
cursor. Explicit Load more only; no automatic traversal. GET with id reads
/templates/{id}: id/name/alias/status/created_at/updated_at/current_version_id,
published_at/has_unpublished_versions/from/subject/reply_to/html/text/variables
(key/type/fallback_value). Reject malformed responses; exclude unrelated fields.
IDs/aliases allow letters, digits, underscores and hyphens, max 128. Server-only Bearer
auth uses the existing secret reader. Reads cache 60 seconds (failures 15); one 8-second
request per page or detail. Cache keys contain identifiers, never personalization.

Communications supports searching loaded templates, HQ name-derived categories,
publication filtering, selecting, desktop/mobile/plain-text preview and Use template.
Personalization is held only in component memory; there is no message-draft storage.
Fields come from provider variables, with string/number validation and fallback values.
The reusable source is not modified. Missing placeholders stay visible. Undeclared
placeholders block sending until corrected in Resend; no customer data is inferred.
Template HTML is isolated in a sandboxed iframe with no scripts, forms, navigation or
same-origin permission. DOM sanitization strips active elements/attributes; restrictive
CSP permits inline email styles and only the existing CloudFront image host/data images.
Variable values are escaped in the preview. Preview is not proof of email-client layout.

POST /api/resend/send-template is founder-authenticated by existing middleware and requires
same-origin JSON, <=64k characters, explicit confirmed=true, one validated recipient,
templateId, version, declared variables and requestId. Re-fetch the template before send;
require published, non-superseded, no unpublished changes, matching version and configured
sender/subject. No arbitrary HTML, sender or extra variables are accepted. POST /emails
uses from/subject/reply_to from the template, to=[recipient], and template.id/variables.
Number variables are finite and within JS safe magnitude; strings max 2000 characters.
One provider send, ten-second timeout, no automatic retry/redirect. Idempotency-Key is a
request UUID plus SHA256 of the exact payload; retries of the same message reuse it.
Resend keys expire after 24 hours. Changing a message starts a new operation.
Returned id means accepted, never delivered. Timeouts/invalid acceptance responses
remain unknown; direct users to retry the same operation or inspect delivery history.
No recipients/content/credentials are logged. Provider error bodies are not exposed.
No sending occurred during development verification; send tests use a mock provider.
Resend delivery records provide provider evidence, not a complete HQ case audit.

This does not connect Gmail, replies, inbound cases, attachments or newsletter campaigns.
It adds no automatic publication, customer lifecycle triggers or provider credentials.
Source: hq-web/components/CommunicationsTemplates.jsx; lib/resend-templates.mjs;
lib/resend-send.mjs; app/api/resend/templates/route.js;
app/api/resend/send-template/route.js; app/page.jsx; app/hq.css.
Tests: tests/resend-templates.test.mjs. Drift: template versions/variable semantics,
publication defaults, sender verification, pagination and provider idempotency retention.

## Twilio restricted HQ credential — November 15, 2026
Official permission mappings:
- https://www.twilio.com/docs/iam/api-keys/restricted-api-keys
- https://docs-resources.prod.twilio.com/documents/Twilio_Restricted_API_Keys_Permissions_-_IAM_Permissons.pdf
- https://docs-resources.prod.twilio.com/documents/Twilio_Restricted_API_Keys_Permissions_-_Messaging_Permissions.pdf
- https://docs-resources.prod.twilio.com/documents/Twilio_Restricted_API_Keys_Permissions_-_Verify_Permissions.pdf
- https://docs-resources.prod.twilio.com/documents/Twilio_Restricted_API_Keys_Permissions_-_Usage_Records_Permissions.pdf

Minimum requested permissions: iam/accounts/read, billing/usage/read,
messaging/messages/list, verify/service/list. No create/update/delete permissions.
The account endpoint may return an auth_token; the adapter discards it along with all
message bodies and phone numbers. The restricted key can access the provider's full
message-list payload; HQ only returns delivery metadata. Account-wide reads cover
all services in the selected account, including Argus; no workflows are modified.

API-key credentials take precedence without fallback after denial. Malformed or
incomplete key configuration never triggers a request with the legacy auth token.
Secret reader allowlists both new fields. Twilio observations cache for 60 seconds
(15 seconds for failures), coalesce concurrent reads, and have a 30-second route budget.
No automatic retry, sending, verification creation or account mutation is implemented.
Provisioning/live verification remain pending until actual successful endpoint reads.
