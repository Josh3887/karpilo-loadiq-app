# LoadIQ Supabase Forward Reconciliation Application Runbook

Last updated: June 24, 2026

This runbook defines the controlled review and application path for the
forward-only Supabase reconciliation migration. It does not authorize remote
application by itself.

## Migration

Migration file:

```text
supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql
```

Purpose:

- Reconcile live LoadIQ schema gaps found in the June 23, 2026 read-only audit.
- Add missing additive schema, constraints, indexes, RLS, policies, grants,
  triggers, and comments needed by the app/platform baseline.
- Avoid replaying older pending migrations directly.
- Keep business data mutations separate from schema reconciliation.

## Live Remote State At Audit Time

The read-only audit found these remote migrations applied:

```text
20260611141000
20260611192122
20260611193403
20260611194259
20260611194739
20260616031812
```

The remote schema was missing the effects of these local migrations:

```text
20260612041136_load_fuel_gauge_status_profile.sql
20260612051426_atlas_vehicle_usage_marketing_foundation.sql
20260621045851_align_launch_pricing_phase_prices.sql
20260621213322_app_portal_access_foundation.sql
```

This reconciliation migration supersedes only the additive schema/RLS/grant
pieces from:

```text
20260612041136_load_fuel_gauge_status_profile.sql
20260612051426_atlas_vehicle_usage_marketing_foundation.sql
20260621213322_app_portal_access_foundation.sql
```

## Explicit Exclusions

The reconciliation migration intentionally excludes:

- The full `20260621045851_align_launch_pricing_phase_prices.sql` migration.
- Any `launch_program_state` pricing mutation.
- Any public launch pricing amount change.
- AI budget row/value upserts from
  `20260612051426_atlas_vehicle_usage_marketing_foundation.sql`.
- Saved-load status constraint replay already covered by remote migration
  `20260616031812_expand_saved_load_run_statuses.sql`.
- Any `insert into`, data `update`, `delete from`, or `truncate` operation.
- Any `drop table`, `drop column`, or destructive schema operation.

Pricing mutation remains a separate product/legal approval path.

## SQL Review Findings

The migration appears suitable for controlled review and application, subject to
the stop conditions below.

Confirmed properties:

- It is forward-only and additive.
- It adds fuel gauge fields and `saved_loads.fuel_gauge_snapshot`.
- It adds Atlas/equipment fields and `saved_loads.equipment_context_snapshot`.
- It adds AI budget schema columns, but not AI budget row values.
- It creates `ai_token_addons` with RLS, own-row authenticated select, and
  service-role write grants.
- It creates primitive portal tables: `profiles`, `portal_access`,
  `billing_accounts`, `fit_checks`, and `legal_acceptances`.
- It enables RLS on new public tables.
- It revokes anonymous access on new portal and AI add-on tables.
- It creates ownership-scoped policies using `(select auth.uid())`.
- It grants authenticated users only the current app-required client actions.
- It grants service-role access for backend/admin/billing use on new tables.
- It adds indexes and `set_updated_at()` triggers where expected.

Residual review note:

- `portal_access` is authenticated own-row insert/update capable because the
  current primitive portal code writes pending access/profile state from the
  client. Do not treat `portal_access.status` as server-authoritative approval,
  billing, or entitlement state unless a later migration moves writes to
  service-role-only paths.

## Why Blind `supabase db push` Remains Unsafe

Do not run blind `supabase db push`.

The local migration directory still contains older unapplied migrations whose
effects are mixed:

- additive schema now superseded by this forward reconciliation migration,
- launch pricing data mutation that requires product/legal approval,
- AI budget value mutation that requires product/billing/AI governance approval,
- saved-load status work already applied remotely through a later migration.

Blind push risks applying stale or unsafe business mutations and can make
migration history harder to reconcile.

## Required Pre-Application Checks

Before any remote application:

1. Confirm the target Supabase project ref and project name without printing
   secrets.
2. Confirm the local Git branch and commit intended for release.
3. Confirm the exact migration file hash or Git commit containing the reviewed
   SQL.
4. Re-run read-only remote migration list.
5. Re-run a read-only schema catalog check for target tables, columns, RLS,
   policies, grants, indexes, and triggers.
6. Confirm the remote still has the same missing schema shape documented in the
   June 23, 2026 audit.
7. Confirm backup/PITR or an equivalent restorable database backup is available.
8. Confirm the app deployment is paused or gated until post-application
   verification succeeds.
9. Confirm product/legal has not approved pricing mutation as part of this
   operation, because pricing is out of scope.
10. Confirm AI budget row values are not being changed as part of this
    operation.

Do not print tokens, DB URLs, service-role keys, `.env.local`, or connection
strings in logs, docs, issues, commits, or chat.

## Required Read-Only Verification Before Application

Use read-only metadata checks only. Do not query customer/user table data.

Remote migration history:

```sql
select version
from supabase_migrations.schema_migrations
order by version;
```

Expected target tables:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by table_name;
```

Expected target columns:

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'truck_profiles' and column_name in (
      'fuel_tank_count',
      'fuel_tank_capacity_gallons',
      'atlas_equipment_pack',
      'equipment_type',
      'combination_type',
      'trailer_length_feet',
      'trailer_width_inches',
      'trailer_height_inches',
      'max_payload_lbs',
      'gross_vehicle_weight_rating_lbs',
      'axle_count',
      'hazmat_capable',
      'tanker_capable',
      'refrigerated_capable',
      'specialized_capabilities',
      'securement_equipment',
      'route_restriction_notes'
    ))
    or (table_name = 'saved_loads' and column_name in (
      'fuel_gauge_snapshot',
      'equipment_context_snapshot'
    ))
    or (table_name = 'ai_budget_limits' and column_name in (
      'premium_addon_allowed',
      'addon_token_block_size',
      'addon_token_price_cents',
      'overage_surcharge_multiplier'
    ))
  )
order by table_name, column_name;
```

RLS status:

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by c.relname;
```

Existing policies:

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by tablename, policyname;
```

Existing grants:

```sql
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by table_name, grantee, privilege_type;
```

## Stop Conditions

Stop before application if any of these are true:

- The linked Supabase project is not the intended LoadIQ project.
- Remote migration history differs from the expected read-only audit state and
  the difference has not been reviewed.
- Any target table already exists with an incompatible shape.
- Any target column exists with an incompatible type, nullability, default, or
  ownership model.
- Any target table has anonymous access that the migration would not revoke.
- Any required prerequisite table is missing: `users`, `truck_profiles`,
  `saved_loads`, or `ai_budget_limits`.
- The exact SQL to apply includes `insert into`, data `update`, `delete from`,
  `truncate`, `drop table`, `drop column`, or destructive schema changes.
- The exact SQL touches `launch_program_state`.
- The exact SQL changes public pricing amounts.
- The exact SQL changes AI budget row values.
- Product/legal asks to combine pricing work into this reconciliation.
- The operation would print, store, or expose a secret.
- Backup/PITR status is unknown.

## Recommended Application Path

Recommended controlled path:

1. Complete code review of
   `20260624000745_forward_reconcile_live_schema_gap.sql`.
2. Run the read-only verification checks above.
3. Save read-only evidence outside the repo or summarize it without secrets.
4. Apply only the exact reviewed SQL from this single migration in an approved
   Supabase SQL execution path.
5. Do not include older pending migrations in the same operation.
6. Do not include pricing or AI budget row-value SQL in the same operation.
7. After application, run the post-application verification queries below.
8. Decide separately whether migration-history repair is needed. Do not run
   `supabase migration repair` without an explicit reviewed decision.
9. Keep application deployment blocked until verification succeeds.

## Post-Application Verification Queries

Verify created tables:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by table_name;
```

Verify required columns:

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'truck_profiles',
    'saved_loads',
    'ai_budget_limits',
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by table_name, ordinal_position;
```

Verify RLS is enabled:

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by c.relname;
```

Verify policies:

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by tablename, policyname;
```

Verify anonymous grants are absent on new sensitive tables:

```sql
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and table_name in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by table_name, privilege_type;
```

Expected result: zero rows.

Verify service-role grants:

```sql
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'service_role'
  and table_name in (
    'ai_token_addons',
    'profiles',
    'portal_access',
    'billing_accounts',
    'fit_checks',
    'legal_acceptances'
  )
order by table_name, privilege_type;
```

Verify indexes:

```sql
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'ai_token_addons_user_feature_status_idx',
    'ai_token_addons_purchase_reference_idx',
    'portal_access_status_idx',
    'portal_access_launch_phase_idx',
    'fit_checks_user_created_at_idx',
    'legal_acceptances_user_accepted_at_idx'
  )
order by tablename, indexname;
```

Verify triggers:

```sql
select event_object_table, trigger_name
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'set_ai_token_addons_updated_at',
    'profiles_set_updated_at',
    'portal_access_set_updated_at',
    'billing_accounts_set_updated_at'
  )
order by event_object_table, trigger_name;
```

## App Verification After Schema Application

After schema verification passes, run app-level validation before deployment:

- Portal page read path.
- Portal settings save path.
- Portal Fit Check save path.
- Operational profile save path.
- Saved-load save path.
- AI governance budget/add-on read path.
- `npm run lint`.
- `npx tsc --noEmit`.
- `npm run build`.

App deployment remains blocked until the migration is applied and verified.

## Rollback Limitations

This migration is intentionally additive, but rollback is still not trivial once
traffic writes data into new tables or columns.

Rollback limitations:

- Dropping new columns or tables after production writes can lose data.
- Reverting grants/policies without a reviewed replacement can break app flows.
- Manual migration-history edits can make future reconciliation harder.
- A destructive rollback should not be the default incident response.

Preferred recovery path:

1. Stop app deployment or route traffic away from affected paths.
2. Preserve the database state.
3. Inspect catalog and error evidence.
4. Apply a reviewed forward fix.
5. Only consider destructive rollback with explicit approval and a backup
   restore plan.

## Remaining Separate Work

Still separate from this runbook:

- Product/legal review of launch pricing mutation.
- Billing/product/AI governance review of AI budget row values.
- Decision on whether migration-history repair is needed after the controlled
  application is proven.
- Public intake anti-abuse verification for anonymous form surfaces.
