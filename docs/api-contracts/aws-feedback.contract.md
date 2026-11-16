# AWS ratings, feedback and public reviews

## Authority and boundaries

AWS PostgreSQL owns threads, publication decisions, founder replies and audit events.
App and HQ commands terminate in AWS. The website reads only the public projection.
No app-to-HQ or website-to-HQ data bridge exists in this implementation.
Private feedback, public-review submissions, general correspondence and account mail
are separate concepts. No existing private invitation response is automatically public.

## Requests and identity

- App: authenticated Cognito owner, same-origin mutations, existing account limiter,
  maximum ten submissions per account per day. `POST /api/aws/account/reviews` accepts
  a UUID requestId, kind, displayName (80), optional rating (1–5), body (4000), and
  publicConsent. Review submissions require explicit consent and a rating.
- HQ: founder-authenticated same-origin adapter signs AWS requests with SigV4.
  `GET /v1/feedback?offset=0` and `POST /v1/feedback` require AWS_IAM. The Lambda also
  verifies the pinned HQ principal from API Gateway's authorization context.
- Reply: action=reply, id, requestId, body. A unique thread/request key makes retries
  idempotent. Reply and audit record commit atomically. The reply record is the durable
  feedback inbox notification; there is no separate delivery queue to lose.
- Moderation: action=moderate, id, publication=published|withheld, reason,
  expectedVersion. Stale decisions fail with409. Publication requires author consent;
  withdrawing consent immediately removes a review from the public query.
- Public: `GET /v1/reviews?offset=0` returns only id, display_name, rating, body,
  created_at. Dedicated PostgreSQL role lacks private columns/reply-table permissions.

## Responses, errors and cost bounds

Private lists contain up to50 threads and an explicit nextOffset. Public lists contain
up to20 reviews. Inbox reply list is bounded to100 newest replies. No-store everywhere
ensures withdrawal is not obscured by a public cache. Missing configuration and database
errors are failures, never successful empty inventories. Errors400/403/404/409/429/503
are distinguished; raw database exceptions and credentials never reach the UI.
Gateway has API Gateway throttles,15-second Lambda timeout, two DB connections per
warm runtime and five-second SQL statement timeout. Existing account concurrency quota
is used; no quota increase was requested. Logs retain30days and omit message bodies.

## Email boundary

Existing template address: feedback@karpilo-liq.com. Website feedback previously pointed
to support; the change introduces the dedicated address. Mailto is not ingestion proof.
Resend receiving was verified disabled on all three domains on2026-11-16. Existing
Workspace mail routing must be verified before connecting an authenticated inbound
adapter into AWS. No MX replacement or mailbox-forwarding change has been made.
Inbound mail must never be attached to an account merely by a claimed From header;
verified account association is required. General/account email must not enter this queue.
Founder replies currently create app inbox notices only; no email is automatically sent.

## Source and migration

- Customer release baseline: archived billing candidate SHA256
  6d082e2c8b45b5ca9fa5ebadd9187ce514960914316980a2b8799d008d8d4bee.
- Additive migration019, RLS policies, restricted moderator/public roles, private import
  of existing invitation responses. Existing lifecycle migrations remain intact.
- Customer source changes retained in `aws/feedback/customer-app.patch`, applied to that
  baseline, plus its dedicated task branch. Do not apply to an unrelated legacy source.
- Gateway entry: customer `src/server/aws-backend/reviews-gateway.ts`; review service,
  authenticated route, app page and inbox component accompany it.
- HQ adapter: `hq-web/app/api/aws/feedback/route.js`; UI: FeedbackWorkspace.jsx.
- Website has its own task branch, `/reviews` and AWS-only `/api/reviews` projection.

## Official references and drift

- https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-access-control-iam.html
- https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html

Verify actual API Gateway IAM context, Cognito ownership, DB role inheritance and rendered
surfaces after deployment. Unit tests and successful builds do not substitute for live
authenticated acceptance. Existing direct HQ provider adapters remain outside this feature
and must be migrated/checked in the final project-wide pipeline audit.
