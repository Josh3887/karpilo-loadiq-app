# AWS customer-data gateway — deployment contract

This is the backend deployment contract for the existing `hq-web/app/api/aws/accounts/route.js` adapter. This document does **not** claim a gateway has been deployed.

## Architecture
- Run a private, read-only service in the isolated AWS VPC, with network access to the existing RDS PostgreSQL security group. Do not make RDS publicly reachable for this integration.
- Store gateway authentication material in AWS Secrets Manager; never expose it to browser JavaScript or source control.
- Terminate HTTPS at the gateway ingress. Require founder HQ authentication at the HQ boundary and a separate service-to-service credential at the gateway. Limit ingress to HQ's approved path; prefer an authenticated private network or signed short-lived requests over a permanently exposed bearer token.
- Use a dedicated PostgreSQL role with SELECT permissions on explicitly approved views only; never use the RDS master user or runtime administrative role.
- Apply least-privilege IAM, rate limits, request timeouts, audit logs without personal data, and credential rotation.

## API contract
`GET /v1/hq/account-index?index=<name>&cursor=<opaque>`

Supported indexes: `subscribers`, `subscriptions`, `vehicles`, `expenses`, `profit_profiles`, `saved_loads`.

Response: `{ "records": [], "nextCursor": null }` for a successful empty page; populated pages contain at most 100 objects. Validate index allowlist and cursor; reject invalid inputs with 400, unauthenticated requests with 401, unauthorized requests with 403, and upstream failures with 5xx. Never substitute an empty customer list for a database failure.

## Implementation prerequisites
1. Inspect actual isolated-test PostgreSQL schema and existing application ORM migrations; map each index to a verified read-only view, with explicit allowed fields. Do not invent tables or assume subscriptions and profiles are stored in RDS.
2. Implement gateway in the existing application runtime or a dedicated VPC-attached service, using its own read-only DB identity and strict response schema.
3. Configure `HQ_AWS_ACCOUNT_GATEWAY_URL` and `HQ_AWS_ACCOUNT_GATEWAY_TOKEN` only in the HQ server environment. Restrict egress and destination host to the approved gateway.
4. Verify with an empty database, synthetic fixtures in isolated test, pagination, authorization failures, malformed responses, network failures, and real authenticated HQ requests.
5. Record deployment identity and test evidence before marking the integration complete.

No actual customer records are required to validate the zero-customer state. Never seed production with fake customers.
