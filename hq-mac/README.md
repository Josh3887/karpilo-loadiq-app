# Karpilo LoadIQ HQ — native Mac application

Continues the original SwiftUI Mac workspace. Original sidebar, red/black/silver
format, template editor, draft keys, bundle identity and Touch ID lock are retained.
No embedded website is used. Analysis center and Integrations render native provider
cards with full returned observations, timestamps and partial-inventory indicators.

The independent Cognito operator session authenticates the read-only gateway.
Provider credentials remain server-side. Web HQ uses a separate frontend; connecting
both clients requires the same authorized backend, not a web view substitution.

Build with sh hq-mac/build.sh. Private bundled template snapshots live in ignored
build/ and are not committed. An original installed app backup is retained there.
Do not claim live provider access until the gateway and credentials are verified.

## Deployment and permissions
The gateway uses the existing independent HQ Cognito pool and enrolled subject.
HTTP API and Lambda both enforce operator access. GET-only routes: /v1/session,
/v1/analytics, /v1/templates and /v1/templates/{id}. Provider credentials are stored
in a dedicated retained Secrets Manager secret; no existing secret is read without
explicit approval. No emails, SMS, publishing or customer writes are enabled.

This account currently has ten Lambda concurrency slots, all unreserved. A two-slot
reservation would violate the account minimum of ten unreserved slots. The deployment
therefore leaves concurrency unreserved and retains HTTP API throttling at 2 requests
per second with burst 5, a 25-second timeout and 60-second provider cache. No account
quota or existing function settings are changed.

Native credential provisioning and signed-in end-to-end verification are separate
from infrastructure deployment. Provider coverage is incomplete: AWS, GitHub, Redis,
Stripe, Workspace, Cloudflare, Maps, Gemini, EIA and Termly remain adapter_pending
in this gateway. Resend, Vercel, Sentry, PostHog and Twilio have read adapters.

## Verified November 15, 2026
Gateway deployed: https://8gy1ncxn5k.execute-api.us-east-2.amazonaws.com
Both isolated CloudFormation stacks CREATE_COMPLETE; Lambda Active with successful
update. Direct unauthenticated Lambda invocation returns 401. Public session, analytics
and template requests return 401. Existing operator confirmed with software-token MFA.
The native bundle now includes the gateway URL. Provider credentials remain empty;
no signed-in end-to-end verification has been claimed. Native server tests: 16 passed.
Installing into /Applications was blocked by workspace permissions; original app remains
unchanged, with backup retained. Existing source secrets have not been read or copied.
