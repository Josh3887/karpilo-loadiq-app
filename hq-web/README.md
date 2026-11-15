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
analytics/security are explicitly not implemented. Inventory is bounded to 100 records
per zone, with pagination disclosure. See docs/api-contracts/hq-cloudflare.contract.md.

Resend inventory access was browser-verified after the prior deployment per the
November 15 handoff; the earlier denied-key blocker is resolved. Sender-domain failure,
newsletter publishing and two-way mail remain separate from inventory connectivity.
