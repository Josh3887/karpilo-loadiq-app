# Karpilo LoadIQ HQ — Safari web foundation Version 1 (prelaunch)
Separate Next.js app under hq-web/ with dedicated Vercel project. Full iPad Safari UI and iPhone snapshot planned. Founder authentication **fails closed** with 503 until HQ_ADMIN_USER and HQ_ADMIN_PASSWORD (>=16 characters) are set. Temporary HTTPS Basic authentication is for development only; production requires MFA, server sessions and audit. GET /api/providers performs live read-only GET checks of GitHub, Vercel and Resend only when server tokens are configured; remaining providers show unconfigured. The existing static prototype and future Data Center/newsletter/subscriber/Argus/mail workflows are not live integrations. Never expose secrets in browser code. No production actions from untrusted email. See docs/hq/KARPILO-LOADIQ-HQ-SPEC.md for complete requirements.
## Version policy
Karpilo LoadIQ HQ stays **Version 1** throughout prelaunch development. Git commits, pull requests, internal build IDs and deployment IDs distinguish revisions. Do not label prelaunch milestones as v0.x, v1.1 or Version 2. Only introduce a new public product version after launch with founder approval.

## Communications continuation
Resend Library shows bounded sender/template/delivery/broadcast inventories with partial
access and additional-page indicators. Providers includes Twilio account, current-month
usage, recent message status and Verify services. Both are read-only; missing credentials
remain explicitly unconfigured. See docs/api-contracts/hq-communications.contract.md.
The original native client is separate; web integrations run in this dedicated HQ deployment.

## Server credential connection
HQ_PROVIDER_SECRET_ARN selects a dedicated AWS Secrets Manager JSON object. The existing
HQ IAM identity can GetSecretValue only for that secret; customer database and enrollment
secrets are excluded. Environment values take precedence, allowlisted fields only, with a
60-second in-memory cache. Failures return a credential-store error, not an empty success.
Resend, Twilio, Cloudflare and the provider registry use this reader. Redis PING and EIA latest weekly
diesel checks are live read-only adapters. Provider observations are cached for 60 seconds (EIA: one hour)
per warm instance; browser responses remain private/no-store. No background polling.
Missing credentials remain explicitly listed. Sentry DSNs and PostHog ingestion keys do
not provide dashboard access. No native bundle installation is part of this web release.

## Cloudflare observations
Cloudflare uses the dedicated secret reader and validates actual zone/DNS responses.
A valid token alone is not a connected inventory. Each zone exposes separate zone and
record access results. Public DNS/HTTPS observations remain separate from API access;
analytics is checked separately; security monitoring is not implemented. Inventory is bounded to 100 records
per zone, with pagination disclosure. See docs/api-contracts/hq-cloudflare.contract.md.

Resend inventory access was browser-verified after the prior deployment per the
November 15 handoff; the earlier denied-key blocker is resolved. Sender-domain failure,
newsletter publishing and two-way mail remain separate from inventory connectivity.

## Reusable templates in Communications
Communications now loads Resend templates directly, supports name/alias search and
publication/category filtering, previews original designs at desktop/mobile widths,
and applies their variables to an individual message. Use in Communications is also
available from Resend Library. Provider draft status displays as Unpublished template;
these are reusable templates, not saved message drafts. Source templates stay unchanged.
Published, current templates can be sent to one recipient after explicit review. Missing
variables, unpublished changes and superseded templates prevent sending. Development
checks use mocked sends; no real email was sent as part of verification. Gmail/inbound
case management and newsletters remain separate integrations.

## Twilio restricted read access
Configure TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET in the
dedicated server secret. Only account read, usage read, messages list and Verify
service list are needed. Legacy auth-token configuration remains supported, but is
never used as fallback when either API-key field exists. Reads cache 60 seconds,
failures 15 seconds; no SMS or verification request is sent by connection checks.

## Sentry read-only observations
The Providers view reads the Karpilo Endeavor Technologies organization, its first
100 projects and first 20 unresolved issues seen in the last 14 days, all environments.
A dedicated internal integration needs only org:read and event:read. The existing
SENTRY_AUTH_TOKEN secret field is used. Raw error text, stacks and user details are
omitted; issue links open Sentry for further investigation. No result cache or polling.
Endpoint coverage and pagination remain explicit. See docs/api-contracts/hq-sentry.contract.md.

## PostHog restricted read access
Providers shows project identity, provider-reported event ingestion state and bounded
dashboard/saved-insight inventories. Configure POSTHOG_PERSONAL_API_KEY, POSTHOG_HOST
and POSTHOG_PROJECT_ID in the dedicated server secret. Only project:read,
dashboard:read, insight:read and query:read are used. Queries return aggregate
event counts only. No raw events, replay, flags or billing are connected. See docs/api-contracts/hq-posthog.contract.md.

## Command center and branding
Overview and Integrations use the founder-selected chrome/red truck HQ identity.
Public static brand assets and manifest support browser/home-screen icons; all
operational routes retain founder authentication. No service worker or offline
business-data cache is installed. Existing sections and communications workflows remain.
Alarm cards derive from current bounded reads: failed/partial provider access,
CloudWatch ALARM/INSUFFICIENT_DATA, stale successful observations, PostHog ingestion
gap, unresolved Sentry issues, Resend failed domains and Twilio delivery history.
Historical issues are labelled; setup gaps are not outages. Refresh is manual and
there is no notification/acknowledgement persistence or background monitoring.

### Product-scoped workspaces (2026-11-16)
Each integration opens its own URL-backed page (`?integration=...`) with connection, usage, cost and alarm panels. Unavailable usage/quota/cost figures remain explicit, never zero or company-wide estimates. Cloudflare reads only karpilo-liq.com and its apex/app/HQ probes. Shared Twilio messages/usage and AWS account-wide Cost Explorer totals are excluded pending product allocation. Sentry shows only the explicitly identified karpilo-loadiq-isolated project. Argus is a separate company-wide control plane.
Communications now has Sent, Received (Resend receiving only), and Templates, message reading, template HTML/subject/name edits with explicit review, and locally selected file/image attachments for reviewed template sends. Saves do not publish templates; this avoids silently activating operational emails. After explicit authorization on November 15 (America/Chicago), 47 current originals were published and the full inventory verified: 49 published, six superseded unpublished. No messages were sent. Current templates and retired originals now have separate views.

## Monitoring pages

Provider pages include real historical charts where the API allows them, exact readings, period controls and opt-in visible-page refresh. See `docs/api-contracts/hq-monitoring.contract.md` for bounds and scopes. Billing access is distinct from provider connectivity. AWS allocation activation/backfill succeeded; tagged cost reads now distinguish empty allocation from a measured zero; Vercel shared charges are withheld until product allocation is verified. Missing provider access does not display zero cost or healthy performance.

## Workspace restructure — 2026-11-16

Overview is the executive snapshot; Integrations is the provider directory. Records are consolidated into HQ Records, Freight Intelligence into Data Center, address verification into Google Maps, and README into Policies & Instructions. Health Center owns system life support and change context. Subscriber-behavior analytics and PostHog capture remain deferred.

Newsletter Studio supports editable/reorderable blocks, desktop/mobile sandbox previews, Resend template copies (including retired originals), local save and HTML/design export. GrapesJS and Waypoint were evaluated; the official npm registry was unreachable (ENOTFOUND), so no unverified dependency or CDN script was installed. The bundled editor has no campaign delivery backend. Template originals remain unchanged.

Feature, banner and policy editors currently save explicitly labeled local drafts, not enforced/published customer settings. Address Book has no gateway mapping. Detailed audit and remaining backend coverage: `../docs/hq/HQ-WORKSPACE-AUDIT-20261116.md`.

Resend inventory now uses the dedicated full-access key stored server-side, with read-only inventory routes. Earlier denied-key descriptions are historical, superseded by live successful reads. Current template editing and sending routes retain their own explicit validation/review requirements; inventory connectivity alone does not imply all communication workflows are available.
