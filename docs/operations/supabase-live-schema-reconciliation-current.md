# LoadIQ Live Supabase Schema Reconciliation Current Audit

Audit run: June 27, 2026

This document records a read-only reconciliation audit of the live Supabase
schema against the clean LoadIQ audit base, restored governance docs, and the
known forward-only reconciliation migration.

No Supabase mutation was performed. No migration was applied. No `supabase db
push`, migration repair, destructive SQL, branch merge, rebase, cherry-pick, or
push was performed.

## Branch And Evidence

- Starting branch before clean-base construction:
  `fix/loadiq-supabase-forward-reconciliation`
- Clean audit branch:
  `audit/live-supabase-schema-reconciliation-clean-base-20260626`
- Clean-base source:
  `origin/main`
- Clean-base divergence at branch creation:
  `origin/main...HEAD = 0 0`
- Local `main` remains unsafe by history:
  `origin/main...main = 0 85`
- Clean-base commit:
  `b4e5ff5851f97ea7f3ce42c12a61bc913d3815a2`
- Read-only migration evidence:
  `/tmp/loadiq-live-supabase-migrations-current.json`
- Read-only schema catalog evidence:
  `/tmp/loadiq-live-supabase-schema-current.json`

The migration evidence file uses the requested `.json` path but the Supabase
CLI emitted its migration list in table form even with `-o json`.

## Restored Clean-Base Sources

| File | Source ref | Reason |
| --- | --- | --- |
| `AGENTS.md` | `c64a94b` | Governance branch source; same content as later `797499c`. |
| `docs/operations/data-propagation-map.md` | `b601033` | Only file source found for the data propagation map. |
| `docs/operations/supabase-reconciliation-plan.md` | `a447aee` | Standalone Supabase reconciliation plan source; same content as later chained commit. |
| `docs/operations/supabase-forward-reconciliation-design.md` | `28b30ab` | Standalone forward reconciliation design source; same content as later chained commit. |
| `docs/operations/supabase-forward-reconciliation-application-runbook.md` | `3aa266f` | Only file source found for the application runbook. |
| `docs/operations/open-risk-register.md` | `7d83a20` | Source commit that added the open risk register. |
| `supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql` | `92079e1` | Source commit that added the forward reconciliation migration. |

## Local Expectations Inspected

The clean branch app code currently expects these Supabase-backed surfaces:

- Saved loads: `saved_loads`, `post_trip_actuals`, snapshot columns, flattened
  fuel/revenue/cost fields, and `load_status_reason` by restored governance.
- Profile/settings: `users`, `user_settings`, `truck_profiles`, and
  `pay_structure_templates`.
- Expense intelligence: `user_overhead_items`.
- Calculator defaults: profile, overhead, pay template, saved-load, and lane
  template data.
- Lane templates: `lane_templates.input_snapshot`.
- Billing gates: `subscriptions`, `usage_events`, and saved-load counts.
- Fuel cache: `fuel_price_cache`.

The clean branch does not contain the newer Fit Check, portal, Atlas equipment,
fuel gauge, or AI add-on app modules named by the restored governance docs.
Those newer expectations are represented in the restored data propagation map,
forward design, runbook, and forward migration, not in the clean-base app code.

## Local Migrations Inspected

The clean audit branch contains:

- Legacy local migrations `001` through `008`.
- `supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql`.

No `supabase/archive/` directory exists on the clean audit branch. The branch
intentionally does not preserve broad contaminated migration ancestry.

The forward migration was inspected for destructive or business-data changes.
It contains additive `alter table add column if not exists`, `create table if
not exists`, constraints, indexes, RLS enablement, grants, policies, triggers,
and comments. It does not contain `insert into`, data `update`, `delete from`,
`truncate`, `drop table`, `drop column`, or `launch_program_state` statements.
Its `grant ... insert/update/delete` statements are privilege grants, not data
mutation.

## Online Migration State

Live Supabase currently records these remote migration versions:

```text
20260611141000
20260611192122
20260611193403
20260611194259
20260611194739
20260616031812
```

The local clean-base migration list shows legacy local migrations `001` through
`008` and the forward reconciliation migration as local-only. The live project
has the later 2026 baseline history, not the legacy local migration history.

## Online Schema State

Catalog-only query results:

- Public table/view entries inspected: 77.
- Public base tables with RLS inspected: 75.
- Public base tables with RLS disabled: 0.
- Security-sensitive public views observed:
  - `active_system_health_notices` with `security_invoker=true`.
  - `public_notification_notices` with `security_invoker=true` and
    `security_barrier=true`.

Expected baseline tables present online:

- `users`
- `user_settings`
- `truck_profiles`
- `pay_structure_templates`
- `user_overhead_items`
- `saved_loads`
- `saved_load_stops`
- `post_trip_actuals`
- `lane_templates`
- `subscriptions`
- `usage_events`
- `ai_budget_limits`

Expected forward-reconciliation tables missing online:

- `ai_token_addons`
- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`

Expected columns present online:

- `saved_loads.load_status_reason`
- `saved_loads.input_snapshot`
- `saved_loads.result_snapshot`
- `saved_loads.actuals_snapshot`
- `saved_loads.pay_structure_snapshot`
- `truck_profiles.default_mpg`

Expected forward-reconciliation columns missing online:

- `saved_loads.fuel_gauge_snapshot`
- `saved_loads.equipment_context_snapshot`
- `truck_profiles.fuel_tank_count`
- `truck_profiles.fuel_tank_capacity_gallons`
- `truck_profiles.atlas_equipment_pack`
- `truck_profiles.equipment_type`
- `truck_profiles.combination_type`
- `truck_profiles.trailer_length_feet`
- `truck_profiles.trailer_width_inches`
- `truck_profiles.trailer_height_inches`
- `truck_profiles.max_payload_lbs`
- `truck_profiles.gross_vehicle_weight_rating_lbs`
- `truck_profiles.axle_count`
- `truck_profiles.hazmat_capable`
- `truck_profiles.tanker_capable`
- `truck_profiles.refrigerated_capable`
- `truck_profiles.specialized_capabilities`
- `truck_profiles.securement_equipment`
- `truck_profiles.route_restriction_notes`
- `ai_budget_limits.premium_addon_allowed`
- `ai_budget_limits.addon_token_block_size`
- `ai_budget_limits.addon_token_price_cents`
- `ai_budget_limits.overage_surcharge_multiplier`
- Portal-table columns under the missing `profiles`, `portal_access`,
  `billing_accounts`, `fit_checks`, and `legal_acceptances` tables.

Because the target portal and AI add-on tables do not exist yet, their target
RLS, policies, service-role grants, indexes, and triggers also do not exist
yet.

## Forward Migration Fit

The existing forward migration still matches the live missing schema shape.

It covers:

- Fuel profile fields and `saved_loads.fuel_gauge_snapshot`.
- Atlas/equipment fields and `saved_loads.equipment_context_snapshot`.
- AI add-on schema columns on `ai_budget_limits`.
- `ai_token_addons` table, indexes, RLS, own-row select policy, and
  service-role grants.
- Primitive portal/profile bridge tables: `profiles`, `portal_access`,
  `billing_accounts`, `fit_checks`, and `legal_acceptances`.
- RLS, authenticated own-row policies, service-role grants, indexes, triggers,
  and comments for the new tables.

It excludes:

- `launch_program_state` pricing mutation.
- Public pricing amount changes.
- AI budget row value upserts.
- Saved-load status constraint replay already covered by the live
  `20260616031812` migration.
- Destructive table or column drops.

Residual review note: `portal_access` allows authenticated own-row
insert/update because the primitive portal path stores pending access/profile
state from the client. Do not treat `portal_access.status` as authoritative
billing, approval, rollout, governance, or entitlement state unless a later
server-owned design changes that boundary.

## RLS, Policies, And Grants

Existing live public base tables have RLS enabled in the inspected catalog.

For the missing target objects, live RLS/policy/grant safety cannot be verified
because the objects do not exist. The forward migration appears to set the
right shape:

- RLS enabled on every new public table.
- No anonymous grants on the new portal or AI add-on tables.
- Authenticated grants limited to current app-required client actions.
- Own-row policies using `(select auth.uid())`.
- `billing_accounts` authenticated access is read-only.
- Service-role grants are explicit for new backend/admin/billing paths.

Service-role grants are still needed because the target tables are absent
online and therefore could not have inherited earlier grant normalization.

## Recommendation

Remote application is recommended later, but only as a controlled single-file
SQL application after explicit approval and backup/PITR confirmation.

Do not run `supabase db push`.

`supabase db push` remains unsafe because the local and remote migration
histories are not aligned, older pending migration effects are mixed with
business-data mutation, and pricing/AI budget value changes must remain outside
schema reconciliation.

The exact proposed later application command, not run in this audit, is:

```bash
npx supabase db query --linked --file supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql
```

Before any later application, re-run the read-only migration list and schema
catalog query, confirm the target project, confirm backup/PITR, review the SQL
line-by-line, and keep app deployment blocked until post-application
verification passes.

## Stop Conditions Remaining

Stop before any remote application if:

- The linked Supabase project is not the intended LoadIQ project.
- Remote migration history changes unexpectedly.
- Any target object exists remotely with an incompatible shape.
- Backup/PITR or equivalent recovery posture is unknown.
- Any SQL statement touches `launch_program_state`.
- Any SQL changes public pricing amounts.
- Any SQL changes AI budget row values.
- Any SQL includes destructive table or column changes.
- Any secret, database URL, service-role key, or token would be printed or
  stored.

## Audit Boundary

This audit did not query user, customer, trucking operation, saved-load,
billing, or business row data. It queried metadata only.

No app code, existing migrations, `.env.local`, package files, native files, or
remote services were modified.
