# Karpilo LoadIQ — Isolated AWS database recovery runbook

Scope: `us-east-2`, isolated test PostgreSQL instance `karpilo-isolated-test`. This document does **not** authorize production restores or destructive changes.

## Current protections (verified 2026-11-14)
- Automated backup retention: 7 days.
- Storage encryption and deletion protection: enabled.
- Automated snapshots observed and available.
- Single-AZ database; a snapshot is not high availability.
- RDS event subscription `loadiq-isolated-rds-events` sends availability, failure, backup, recovery and maintenance events to the isolated maintenance SNS topic.
- SNS recipients must confirm their subscriptions; delivery should be verified in the inboxes.

## Non-destructive restore drill (pending)
1. Confirm available snapshot and check AWS cost/budget before creating a temporary RDS instance.
2. Record source instance identifier, snapshot identifier, engine version, security group, subnet group, KMS settings, and restoration start time.
3. Restore to a **new** isolated identifier (never overwrite the original). Restrict public accessibility and network access.
4. Wait until available, connect using temporary test credentials and run read-only schema/data-integrity checks. Do not expose customer data.
5. Record RTO, observed data freshness/RPO, connectivity and validation evidence.
6. Delete the temporary restored instance only after approval and evidence capture; retain the original instance and backups.
7. Escalate any restore failure through the maintenance alert topic.

**Important:** A successful snapshot listing does not prove restoration. The drill is not complete until a temporary restore is executed and validated.

## Monitoring
CloudWatch dashboard: `Karpilo-LoadIQ-Isolated-Maintenance`.
Alarms: `LoadIQ-Isolated-RDS-LowFreeStorage`, `LoadIQ-Isolated-RDS-HighCPU`, and the existing application rollback alarm.
SNS topic: `karpilo-loadiq-isolated-maintenance-alerts`.

## Verified execution — 2026-11-14
- Both SNS recipients confirmed; alert delivery and first daily health email independently verified in both Gmail inboxes.
- Daily Lambda `KarpiloLoadIQIsolatedDailyHealth` deployed via CloudFormation stack `karpilo-loadiq-isolated-daily-health`; EventBridge rule enabled for 03:00 UTC daily.
- Function invoked successfully and reported healthy with zero findings. Lambda log retention set to 30 days.
- Added `LoadIQ-Isolated-DailyHealth-FunctionErrors` and `LoadIQ-Isolated-DailyHealth-MissingRun` alarms. Missing-run alarm uses a 24-hour metric-math window; validate its real behavior after a full scheduled cycle.
- Restored 2026-11-14 automated snapshot to temporary private encrypted instance `karpilo-isolated-restore-drill-20261114`; RDS provisioned an endpoint. Temporary instance was subsequently deleted and verified absent.
- **Recovery qualification:** SQL connectivity, schema integrity and record consistency on restored copy were NOT verified. Do not mark full data-integrity recovery complete.

## Remaining Step 2 verification
1. Confirm the first *scheduled* daily invocation and absence of false missing-run alarms.
2. Perform a fresh temporary restoration with read-only SQL verification using an isolated VPC-connected client, then delete it and document recovery time and data freshness.
3. Keep recovery credentials in AWS Secrets Manager; do not embed them in reports, repository files, or logs.
