# Karpilo LoadIQ HQ workspace audit and restructure

Scope: product-specific WEB HQ. Native app, customer production application and main branch are unchanged. Subscriber-behavior work is deferred by Josh. Existing provider observations are preserved.

| Workspace | Responsibility and implemented restructure | Remaining coverage |
|---|---|---|
| Overview | Executive snapshot, priorities, workspace shortcuts | Counts retain source-page limits; no invented totals |
| Integrations | Filterable provider directory and individual provider pages | Existing credential/attribution limitations remain visible |
| Communications | Resend Inbox, Outbox, reusable templates, existing attachment/editor/review workflows | Inbox requires actual receiving records; not Gmail OAuth-client equivalence |
| HQ Records | Six tiles, current-page search/status filter, source record inspector, next-page queries | AWS supports subscribers/subscriptions/vehicles/expenses/profit_profiles/saved_loads; no address gateway |
| Workflows | Five visual progression/exception schematics | Descriptions, not live execution traces |
| Feature Control | Maintenance/state/tier/reason editor, local save/export | AWS writer/audit and customer enforcement not connected |
| Data Center | Consolidated market references; EIA fuel | Subscriber decisions, cohorts, run rates deferred |
| Newsletter Studio | Blocks, ordering, template-copy HTML editor, sandbox previews, local save/export | Scheduling/campaign delivery not connected |
| Notifications | Preset/custom banner editor, severity/audience/window, preview/save/export | App publication/expiry consumer absent |
| Version Control | Existing GitHub releases/workflows/branches and Vercel deployment operations | Customer release publication not implemented here |
| Usage & Billing | Consolidated coverage table and selectable actual provider charts/cost reads | Unknown allocation/credits/invoices never converted to zero |
| Policies & Instructions | Termly destination and version draft workspace | Consent lookup is not policy administration; publication unverified |
| Health Center | Persistent probe observations, CloudWatch pressure, alarms, recent workflow context | Probe latency is not customer page-load measurement |

## Provider coverage preserved

AWS infrastructure/health/recovery/cost reads, GitHub, Vercel deployment inventory, Cloudflare LoadIQ domains, Redis management usage/PING, EIA, Resend, scoped Twilio Verify summaries, Sentry and Google API usage remain on their existing adapters. Stripe remains test-only. PostHog inventory can be read; event design and capture are deferred. Vercel billing/traffic, shared account costs/credits, Gmail mailbox OAuth and Termly administration remain incomplete. No email/SMS was sent for this restructure.

## Newsletter implementation decision

Reviewed official open-source projects https://github.com/GrapesJS/preset-newsletter and https://github.com/usewaypoint/email-builder-js . GrapesJS dependency installation failed because registry.npmjs.org could not resolve in this environment. Shipped a self-contained block/HTML studio using existing React dependencies, rather than claiming GrapesJS installed. Imported templates are copies; six retired originals remain retired. Preview uses existing sanitization/CSP and sandbox; exported HTML needs campaign review.

## Navigation and verification contract

Old section URLs resolve to consolidated destinations. Browser back/forward is supported. Overview and Integrations have distinct rendering branches. Existing providers, authentication and private/no-store responses remain intact. No schema, customer data or permission mutations are part of this change.

Validation results are recorded in the final delivery and changelog. Missing APIs are implementation gaps, not completed live controls.
