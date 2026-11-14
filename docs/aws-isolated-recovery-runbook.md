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

## Pending for maintenance Step 2
- Confirm delivery of the test SNS email in both inboxes.
- Execute and document an isolated restoration drill, after reviewing cost and temporary resource safeguards.
- Implement a genuine daily health report with current metrics and a persistent execution history. A static scheduled email is not a valid health report.
