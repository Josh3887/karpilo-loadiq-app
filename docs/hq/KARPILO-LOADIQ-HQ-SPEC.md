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


### Serviceable email case workflow — status vs audit
Every actionable incoming or outgoing email that requires follow-up is indexed as a service case with these **operational statuses only**:
1. **Open** — newly received/unassigned or ready for action.
2. **Pending** — waiting for a customer, internal response, provider, or scheduled dependency.
3. **Investigating** — active fact-finding, troubleshooting or resolution work.
4. **Closed** — resolved with documented outcome, closure time and responsible actor; reopenable with history retained.

**Review is NOT a case status.** Review means a separate **historical audit** of all correspondence and case handling, including complete thread chronology, message content and metadata, original and changed statuses, actor and timestamps, assignments, internal notes, decisions, attachments, escalations, replies, provider delivery evidence, reopening, and closure rationale. It must be filterable by period, owner, mailbox, case, customer, provider and outcome. Review/audit must not alter case status by itself. If a reviewer finds an issue, they explicitly reopen or assign the case, with an audited action.

Keep **message delivery state** (queued, sent, delivered, bounced, failed) separate from **case workflow state** (open, pending, investigating, closed). Customer-support queues and manual business mail share the case model; routine automated alerts become cases only if actionable or escalated.

**Two-way mail is required for all appropriate queues:** read, compose, reply, reply-all, forward, save/edit drafts, send, attach files, quote/review full thread, search, filter, mark unread, archive, route/assign, snooze/follow-up and show send/delivery/bounce/failure history. Allow replies from the exact authorized business address/alias only; do not spoof an address or conflate multiple providers. Preserve Message-ID, In-Reply-To, References, recipients/CC, sent timestamps, attachment metadata, external provider IDs, threaded history, read receipts when genuinely supported and correlation to support cases.

**Provider architecture:** Existing Google Workspace/Gmail mailboxes must retain mail custody; HQ presents their indexed, permissioned two-way views via server-side OAuth/API. Resend is the outbound transactional/template delivery and automated notification pipeline, not assumed to be the mailbox host. Distinct sending identity, verified domain and reply-to policy per stream. Inbound intake may use Gmail/Workspace routing or verified dedicated receiving subdomains; never change primary MX records casually. Confirm provider receiving API before enabling new inboxes. A Resend account audit found **no native Resend inboxes** as of November 14, 2026; don't claim they exist.

**Inbound safety:** verify event webhook signatures, sanitize/escape HTML, scan attachments, deduplicate incoming messages, rate limit and protect customer PII; treat every email body as untrusted. Never allow inbound text to command Argus, authorize releases, alter billing, or change account permissions. Require role-based approval and an audited action path for sensitive work.

**Notification center:** provider event ingestion → normalized severity and correlation IDs → dedupe/digest → in-app alert and optional Resend mail → acknowledgement, escalation, owner, retry and resolution. Separate transactional notices from marketing and respect opt-outs where applicable.

## Serviceable Email Case Management — Required
Every inbound email that requires human or automated service action must be convertible to a **service case** without losing the original mail, thread or provider message IDs. This includes both business accounts, customer support, access requests, suggestions, reviews, complaints, provider issues and operational incidents. Routine non-actionable notification traffic may stay in the indexed automation stream until triaged.

**Canonical service-case statuses (exact labels):**
1. **Open** — newly received, validated and actionable; awaiting triage or assignment.
2. **Pending** — awaiting external information, customer response, provider action or a scheduled dependency; includes next follow-up due.
3. **Investigating** — assigned and actively being analyzed or worked.
4. **Subject to Review** — resolution, proposed change, risk, billing decision or response awaiting authorized review/approval; this is **not** closed.
5. **Closed** — resolution completed, recorded and communicated as required. Reopen restores actionability with full history.

Allow authorized transition among statuses based on explicit rules, including reopen, and preserve time spent in each state. Distinguish **mail delivery status** (sent, delivered, bounced, failed) from **service-case status**; they are never interchangeable.

**Case index and controls:** case/reference ID; account/mailbox; sender; subject; original message + thread identifiers; service/provider; category/subcategory; severity/priority; status; assignee/team; customer or subscriber ID when grounded; created/updated timestamps; first response due and actual; next action/follow-up; SLA clock and breached indicator; linked incident/PR/ticket/billing/deletion record; internal notes; attachments; full correspondence and status-change history; closure reason; reviewer identity and approval result. Filters and saved views for each canonical status, provider, mailbox, owner, severity and aging. Thread replies, drafts, forwarding and customer communication are available directly on each case, using the correct authorized sender.

**Routing:** automation-originated incidents may automatically create or update cases using verified source events, with correlation/deduplication; customer-originated items are routed into the separate support/request-access triage. Automated acknowledgement is permissible with a safe approved template, but never auto-close cases on the basis of sending an email. Human review required for refunds, account/access changes, destructive operations, legal/privacy requests, sensitive security actions and production releases.

**Metrics:** open backlog, case count by status, first-response latency, investigation duration, time-to-resolution, pending-aging, review bottlenecks, reopen rate, SLA breaches and communication delivery success. Report per mailbox/provider and for the consolidated command center; record the query window and timezone.

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


## Web deployment and progressive integration (confirmed)
HQ is a **hosted web application**, not a downloadable local HTML artifact and not a native iOS/Xcode project. Implement a secure server-backed responsive Safari web app, full iPad Pro command center plus iPhone snapshot, with installable PWA affordances where supported. A standalone HTML prototype is only a prototype and must never be represented as the live HQ. Connect providers incrementally as modules are built; every connection must expose configured/unconfigured/error/last-successful-sync states. Do not gate the whole UI on completion of all provider integrations.

## Data Center — proprietary trucking benchmarks
Build a governed historical data platform with ingestion pipelines, source registry, data lineage, event-time and ingest-time timestamps, normalization, quality gates, retention and deletion controls, backfills, revisions, access boundaries, aggregates and exports. Partition datasets by observed public/licensed freight and energy data, verified first-party opt-in operational data, and derived predictive model outputs. Never treat customer-specific financial records as public industry statistics. Publish benchmarks only with adequate cohort size and privacy thresholds, sample counts, dates, coverage and methodology; avoid identifying a subscriber from a thin market segment. Track market lane, geography, equipment type, mileage, deadhead, revenue, fuel, accessorials, seasonality and operating cost only when collected lawfully and measured consistently. Preserve data rights and third-party licensing restrictions.

## Predictive spot-market and freight-market intelligence
Model freight demand/supply, rates and cost signals from permitted historical and current sources; include EIA fuel series if an appropriate API and dataset are confirmed. Show actual observed values separately from forecasts. Provide scenario-based lane/equipment/region trends, confidence/uncertainty intervals, model version, training-window boundaries, forecast horizon, backtests, drift detection and source freshness. Do not invent real-time rates, proprietary coverage, forecast accuracy or market benchmarks before sources and validation exist. Keep benchmark computation separate from subscriber-level LoadIQ financial calculator.

## Resend Newsletter Studio and categorized email template library
Implement a founder-authorized newsletter composer: drafts, blocks, HTML/text preview, audience/segment selection, sender identity, test sends, approval, schedule, campaign history, unsubscribe/suppression checks, delivery/bounce/complaint analytics, versioning and archive. No bulk send without explicit founder approval. Resend template catalog categories: **Enrollment & Verification**, **Billing & Subscription**, **Security & Access**, **Customer Support**, **System & Maintenance Notifications**, **Data Privacy & Deletion**, **Marketing & Referral**, **Newsletter & Market Intelligence**, **Internal Operations**. Each template records Resend ID/alias, category, purpose, locale, published/draft version, sender/reply-to, variables schema, test status, last update, workflow trigger and change audit. Preserve existing template aliases and verify actual Resend status before mapping. Newsletter campaigns remain separate from transactional emails and respect opt-in/opt-out rules.

## Required service usage and billing ledger
**Every provider** has a Usage & Billing tab with service subscription/plan, billing period, usage units, SKU/rate, included allowances, credits/grants, billable units, overage, estimated cost, actual invoiced cost, payment status, spend-to-date, month-end forecast, historical trends, alerts/budgets and data source/freshness. Record currency and timezone. **Separate estimated costs from actual invoice charges** and distinguish first-party meter logs from provider billing API evidence. No zeroes for unknown values. Include fixed monthly service costs even if API calls are free. Reconcile usage and billing by service/account/project; do not double count shared provider bills. The provider registry must also include Google Maps Platform and a placeholder for a private-network/VPN service whose identity has not been recovered.

### Google address intelligence
Reuse existing LoadIQ address intelligence requirements: pickup, delivery, multi-stop, deadhead and business-name lookup, locked account addresses, failure counting, duplicate checks and manual-review workflow. Google Places Autocomplete (New), Place Details, Address Validation, Geocoding and Routes are **separate APIs and SKUs**. Validate/standardize address components, obtain a verified place reference, and compute appropriate point-to-point mileage estimates only with authorized routing data. Use session tokens and field masks correctly, rate limits, restricted server keys, quotas and cost ceilings. Track request/response ID, project, SKU, usage, failure, estimated billable cost and actual billed amount when available. Do not claim Google routes are necessarily truck-legal or that a geocoded address guarantees a truck-accessible loading dock. Preserve user confirmation for ambiguous destinations. Do not enable billable requests before project, API, credentials, quotas and budget are verified.

### Private networking
Previous VPN/tunnel product identity is **unverified**. Do not silently substitute Cloudflare Tunnel, Zero Trust or Tailscale; investigate prior project records, provider billing and configuration before linking. Track it in the same cost, security, access and health registry when identified.
