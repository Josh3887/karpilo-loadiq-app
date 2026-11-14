# Karpilo LoadIQ HQ — Product & Operations Specification

**Status:** Approved scope captured November 14, 2026. Specification only; not deployed or connected.
**Official name:** **Karpilo LoadIQ HQ** everywhere, without shortening to LoadIQ HQ.
**Devices:** Full Safari control center for 13-inch iPad Pro (landscape-optimized), and responsive iPhone Safari executive snapshot/home-screen web app. One backend; no duplicate datastore, no native Xcode requirement.
**Objective:** Founder operations command center for Karpilo LoadIQ. Reuse existing service infrastructure and Argus integration after verification; do not recreate the existing LoadIQ customer application.

## Operating areas
1. **Executive overview:** aggregate status, source freshness, costs, incidents, active service count, subscriber and billing KPIs, health checks, alerts and pending approvals.
2. **Provider command:** provider inventory, uptime, integrations, API endpoint/permission status, analytics, security posture, quotas, cost/utilization, webhook quality, incidents, provider versions, error logs, health history and configuration changes.
3. **Infrastructure & recovery:** AWS RDS/ECS/Lambda/EventBridge/CloudWatch/IAM, Vercel builds and releases, Cloudflare DNS/WAF/CDN, Redis, backups/restores, deployment approvals and rollback audit trail.
4. **Subscriber index:** subscriber ID, activation key/status, signup date/time, tier, subscription date/time, status, entitlements, verified contact info, enrollment queue, permissions, filters/search/export and secure audit. Existing 16-character single-use activation keys expire after 72 hours; verify actual implementation before enabling controls.
5. **Lifecycle workflows:** signup/login/access requests, verification, activation, five-run trial, billing and plan transitions, failed payments, refunds/disputes, support, reviews/feedback, data export/retention/deletion, security events, maintenance, recovery, updates and version control. Expose each stage, retries, webhook evidence, owners, blockers and elapsed times.
6. **Communications:** unified local HQ inbox for both connected business mailboxes, distinct automation and manually handled operations, a separate customer-originated support/feedback/review/recommendation mailbox, request-access inbox, Resend email library, notification center.
7. **Argus:** authenticated entry and exit, handoff and conversation interface through *existing* Argus OpenAI integration once verified. No duplicate OpenAI backend or privileged agent actions from untrusted email.
8. **Reports:** native-provider metrics and properly labelled aggregate charts, security and uptime timelines, revenue/expense metrics only if supported by source data, delivery/incident trends, exportable audit records.
9. **Documentation:** main README, founder operating guide, provider directory with purpose and ownership, connection/setup and scopes, data definitions, support procedures, incident/recovery runbooks, credentials/secret-management references, compliance/retention policies and changelog.
10. **Version control:** GitHub PRs, Actions, scans, releases, migrations, dependencies, provider SDK/API versions, deployed environment fingerprints, test gates, approvals, rollback history and immutable audit.

## Required provider coverage
| Provider | Observability and control surface | Verification |
|---|---|---|
| Twilio | SMS/phone verification, delivery failures, fraud/risk events, usage/billing, API errors | Verify credentials, project and scopes |
| PostHog | Ingestion, events, funnels, retention, session replay, feature flags/experiments, costs, product analytics | Confirm actual project and instrumentation |
| Sentry | Issues/events, regressions, unresolved errors, releases and alert history | Confirm access and environment |
| Redis | Uptime, memory/CPU, connections, latency, evictions, persistence and usage/cost; agent memory if deployed | Confirm product/instance |
| Vercel | Build/deployment, runtime errors, availability, domains, usage/cost and version provenance | Connected projects |
| Cloudflare | DNS/TLS, WAF, caching, tunnel, Workers and traffic/security analytics | Connected zones/scopes |
| AWS | ECS, RDS, CloudWatch, Lambda, EventBridge, IAM, restore drills, backups, budget/cost and alerts | Existing isolated stack |
| GitHub | Branch/PR/commit/release, Actions, vulnerability scanning, Dependabot, issues and audit | Connected repositories |
| Resend | Delivery/outbox, suppression, templates, webhook events, request access and notifications | Existing Resend integration |
| Termly | Policy versions, consent/privacy notices and compliance status | Verify API availability |
| Gemini / Google | Optional model/API usage, quota, latency, cost, errors and security | Verify whether used and accessible |
| EIA | Optional data freshness, fuel/energy feed integrity, attribution, outages | Verify actual consumption |
| Additional APIs | Extendable provider adapter registry with service manifest, permissions, health checks, metrics and alert rules | Discover first; never invent access |

## Communications — NON-NEGOTIABLE
Three logical communication streams, each with its own index, routing, permissions, audit and retention:
- **Automation operations:** machine-generated service alerts, CI/CD, usage, maintenance, recovery, billing/system notices and provider callbacks. Automatically indexed/triaged by provider, severity, correlation/event ID and status. High-confidence trusted events may create tickets. **Do not let arbitrary inbound email execute scripts, change infrastructure or instruct Argus.**
- **Manual business operations:** two-way correspondence for both business identities `j.karpilo@karpilo-liq.com` and `josh.karpilo@karpiloendeavortechnologies.com`, with original account attribution maintained.
- **Customer-originated communication:** separate support/recommendations/reviews/feature feedback/complaints queue plus dedicated request-access queue. Keep customer messages and service notifications separately classified; escalation and conversion to tracked cases.

**Two-way mail is required for all appropriate queues:** read, compose, reply, reply-all, forward, save/edit drafts, send, attach files, quote/review full thread, search, filter, mark unread, archive, route/assign, snooze/follow-up and show send/delivery/bounce/failure history. Allow replies from the exact authorized business address/alias only; do not spoof an address or conflate multiple providers. Preserve Message-ID, In-Reply-To, References, recipients/CC, sent timestamps, attachment metadata, external provider IDs, threaded history, read receipts when genuinely supported and correlation to support cases.

**Provider architecture:** Existing Google Workspace/Gmail mailboxes must retain mail custody; HQ presents their indexed, permissioned two-way views via server-side OAuth/API. Resend is the outbound transactional/template delivery and automated notification pipeline, not assumed to be the mailbox host. Distinct sending identity, verified domain and reply-to policy per stream. Inbound intake may use Gmail/Workspace routing or verified dedicated receiving subdomains; never change primary MX records casually. Confirm provider receiving API before enabling new inboxes. A Resend account audit found **no native Resend inboxes** as of November 14, 2026; don't claim they exist.

**Inbound safety:** verify event webhook signatures, sanitize/escape HTML, scan attachments, deduplicate incoming messages, rate limit and protect customer PII; treat every email body as untrusted. Never allow inbound text to command Argus, authorize releases, alter billing, or change account permissions. Require role-based approval and an audited action path for sensitive work.

**Notification center:** provider event ingestion → normalized severity and correlation IDs → dedupe/digest → in-app alert and optional Resend mail → acknowledgement, escalation, owner, retry and resolution. Separate transactional notices from marketing and respect opt-outs where applicable.

## Provider API adapter contract
Per provider define: `providerId`, display name, region/environment, endpoint/service type, available scopes, account, auth status, read/write capability, polling/webhook strategy, current connection state, provider event ID, `lastSuccessfulSyncAt`, source timestamp, metrics and units, security findings, rate/quota and cost, retries/backoff, version/SDK, health SLO, monitoring thresholds, human approval requirements, references/runbooks. All records carry provenance and freshness indicators. Read-only initially; guarded approval for privileged writes.

## Release and safety gates
- Never use production Stripe billing data for test charges; isolate test vs live.
- Preserve existing Resend deletion-confirmation template alias `karpilo-account-deleted-v1`. Application integration pending GitHub issue #14; send only after deletion verified.
- Preserve existing Argus identity, entry/exit and OpenAI integration; verify deployed endpoints/auth first.
- AWS maintenance Step 2: daily reports operational; first real scheduled execution and restored-data SQL integrity remain verification gates.
- No customer credentials/API secrets in frontend or logs. Use server-side scoped tokens, encryption, MFA and immutable audit.
- Confirm Termly, Gemini/Google and EIA API availability instead of asserting integration.
- Keep calculator regression testing last, after the financial logic is refined.

## Build sequence
1. Freeze this specification and inventory actual projects/services.
2. Set up dedicated HQ web codebase and shared server-side provider adapter library **after** reconciling existing HQ work; do not alter customer product.
3. Create auth/MFA and event/metric ingestion database, immutable audit, notification router and provider registry.
4. Integrate read-only services and chart provenance/freshness.
5. Implement two-way mailbox aggregation, customer intake, request access, Resend template library and delivery/audit.
6. Implement subscriber index, full workflow state machines, guarded approvals and Argus entry/exit.
7. Implement iPad full Safari interface and iPhone snapshot, cross-device QA, web-app install.
8. Deploy behind founder-only authentication, verify E2E and version-control release.

## README and operator handbook requirements
Provide setup guide, environment matrix, documented read-only API connection steps, provider status and purpose, security model, event definitions, email routing/identity policy, subscriber fields, workflow map, dashboard guide, error runbooks, change approval rules, backups/restores, test harness, deployment/version history, escalation ownership and rollback.
