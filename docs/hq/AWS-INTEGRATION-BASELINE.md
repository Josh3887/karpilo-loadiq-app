# AWS-first HQ integration baseline — November 14, 2026

Authoritative environment: AWS account 337058058945, us-east-2, isolated test build. Legacy Supabase repository files are not the implementation source of truth. This record is based on direct AWS read-only API checks.

Verified:
- ECS cluster `karpilo-isolated-test` with running services `karpilo-isolated-test`, `karpilo-billing-workers`, `karpilo-enrollment-worker` (each 1 desired, 1 running).
- RDS PostgreSQL instance `karpilo-isolated-test`, database `karpilo_isolated_test`, status available. `PubliclyAccessible=true`: inspect security groups/subnet/network path before any HQ connection; do not expose database credentials or connect the browser directly.
- Lambda `KarpiloLoadIQIsolatedDailyHealth` and `karpilo-isolated-enrollment-guard`.
- Secrets Manager secret names `karpilo-isolated-test/hosting-runtime`, `KARPILO_LOADIQ_TEST` and one RDS-managed secret. Secret contents were NOT accessed.
- No API Gateway v2 APIs or DynamoDB tables listed in region; no ALBs listed.

Next implementation:
1. Inspect ECS task definitions (redact secret values), service networking and app entrypoints, RDS security groups, and AWS runtime endpoint.
2. Verify actual RDS schema and customer-data ownership using existing secure runtime; avoid direct public database exposure and avoid assuming legacy Supabase tables exist.
3. Implement AWS-authorized HQ backend adapter and account-scoped paginated read-only queries; founder authentication/MFA and immutable audit before private records.
4. Wire provider usage/cost and Gmail/Resend communications without using Supabase.
5. Verify integration through isolated AWS testing build and HQ Vercel deployment; record proof and errors.

Deferred app load workflow: PR #16 / issue #17. HQ stays Version 1 until launch.
