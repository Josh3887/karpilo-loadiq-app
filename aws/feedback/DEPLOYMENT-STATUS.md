# Feedback pipeline — implementation and activation status

2026-11-16. Customer source baseline is the verified archived billing candidate;
local feature commit66790da4f5942ba1cdeaa87b086003141ff31999. Apply customer-app.patch
to that matching baseline, not to the unrelated legacy GitHub application tree.

## Passed
- Customer production build;82 integration tests, including five feedback security tests.
- HQ production build;86 existing tests.
- Website production build with new reviews page and AWS-only public projection.
- RLS tests cover account isolation, public field restrictions, consent withdrawal,
  stale moderation, duplicate request keys and atomic reply/inbox/audit rollback.

## Actual AWS state
- Stack karpilo-feedback-active-20261116 exists; API endpoint
  https://s70q3nwhb0.execute-api.us-east-2.amazonaws.com.
- Gateway is deliberately disabled: AWS_REVIEWS_ENABLED=false. No claim of a working
  live review list, subscriber reply delivery or publication is made.
- Migration Lambda was disabled with reserved concurrency0 after approval review blocked
  further privileged deployment. The isolated RDS feedback schema was NOT migrated.
- Existing source migration015 was absent in the live database; the runtime feedback
  flag was also absent. The attempted migration rolled back on its prerequisite check.
- Dedicated database secret exists but restricted login provisioning has not completed.
- HQ preview branch has HQ_AWS_FEEDBACK_GATEWAY_URL configured. Customer and website
  live releases have not been replaced. No main branch, DNS, MX or live billing changes.
- Earlier stacks karpilo-feedback-20261116 and karpilo-feedback-runtime-20261116 rolled
  back due to artifact transfer and account concurrency constraints. No quota increase.

## Explicit approval blocker
Automatic approval review rejected the CloudFormation update because it provisions
persistent IAM access, a database-login secret, gateway permissions and temporary access
to the isolated RDS master secret/KMS key. It judged broad pipeline authorization
insufficient for this privileged configuration. No alternate execution path was used.

Concrete remaining privileged action: apply additive migrations015/019 to
karpilo-isolated-test; create the restricted feedback login and moderator/public roles;
store only that login and CA in karpilo-feedback/gateway-active; retain scoped HQ
execute-api permission; enable the gateway after live permission/rollback tests.
The migrator needs temporary master-secret access, must be disabled afterward, and its
master-secret policy should be removed after successful migration acceptance.

## Other unfinished acceptance
- Resend receiving is disabled on all three domains. Feedback email ingestion needs a
  verified receiving/Workspace forwarding path into AWS; no MX or forwarding changes
  were made. Existing account/general mail must remain separate.
- Rendered browser and authenticated end-to-end acceptance remain open. No synthetic
  review was published to a public site, and no subscriber message/email was sent.
- Pair and deploy customer frontend/backend, deploy HQ page and website page, then prove
  submission → AWS → HQ reply → same subscriber inbox and consented public review.

## Deployment source
stack.json is the proposed inline-source CloudFormation template, including the blocked
prerequisite correction. It is not a statement that this exact revision is deployed.
Its gateway source is a gzip/base64-packed build of the reviewed TypeScript patch to
fit connector request limits. Lambda decompresses this fixed repository-owned bundle;
it does not load external executable content. Credentials are never embedded.
