# LoadIQ Supabase Forward Migration Production Application Plan

Date: June 27, 2026

This plan defines the safest later path for applying:

```text
supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql
```

It is documentation only. It does not approve production database mutation,
does not apply SQL, does not repair migration history, and does not approve a
Supabase `db push`.

## 1. Current State Summary

- Local `main` was reset cleanly to `origin/main`.
- `origin/main...main` was verified as `0 0` before this planning branch was
  created.
- The clean live-schema audit branch exists:
  `audit/live-supabase-schema-reconciliation-clean-base-20260626`.
- The clean-base commit exists on that branch:
  `b4e5ff5851f97ea7f3ce42c12a61bc913d3815a2`.
- The live Supabase reconciliation audit report exists on that branch:
  `docs/operations/supabase-live-schema-reconciliation-current.md`.
- A Draft PR exists from the audit branch into `main`.
- The Draft PR must not be merged yet.
- The live schema gaps are confirmed by the read-only audit report.
- Online Supabase has not been mutated by the audit or this planning pass.
- The forward reconciliation migration has not been applied.

Live migration history recorded by the audit:

```text
20260611141000
20260611192122
20260611193403
20260611194259
20260611194739
20260616031812
```

## 2. Scope Of Target Migration

Target migration:

```text
supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql
```

The migration is intended to supersede the additive schema, RLS, policy, grant,
index, trigger, and comment portions of these older local migrations:

- `20260612041136_load_fuel_gauge_status_profile.sql`
- `20260612051426_atlas_vehicle_usage_marketing_foundation.sql`
- `20260621213322_app_portal_access_foundation.sql`

### Table Creations

The migration creates these public tables if they do not already exist:

- `ai_token_addons`
- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`

### Column Additions

The migration adds these columns to existing tables:

- `truck_profiles.fuel_tank_count`
- `truck_profiles.fuel_tank_capacity_gallons`
- `saved_loads.fuel_gauge_snapshot`
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
- `saved_loads.equipment_context_snapshot`
- `ai_budget_limits.premium_addon_allowed`
- `ai_budget_limits.addon_token_block_size`
- `ai_budget_limits.addon_token_price_cents`
- `ai_budget_limits.overage_surcharge_multiplier`

The migration also uses `alter table ... add column if not exists` after the
portal table creation statements to make the portal table bodies more tolerant
of partial prior application. This does not make incompatible pre-existing
tables safe automatically; incompatible object shape remains a stop condition.

### RLS And Policy Changes

The migration enables RLS on:

- `ai_token_addons`
- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`

It drops and recreates these policies:

- `ai_token_addons_select_own`
- `profiles_select_own`
- `profiles_insert_own`
- `profiles_update_own`
- `portal_access_select_own`
- `portal_access_insert_own`
- `portal_access_update_own`
- `billing_accounts_select_own`
- `fit_checks_select_own`
- `fit_checks_insert_own`
- `legal_acceptances_select_own`
- `legal_acceptances_insert_own`

The policies use authenticated own-row predicates based on
`(select auth.uid())`. `billing_accounts` is authenticated read-only. The
primitive portal path still allows authenticated own-row insert/update on
`profiles` and `portal_access`; `portal_access.status` must not be treated as
authoritative billing, entitlement, rollout, or governance state.

### Trigger And Function Changes

The migration does not create or replace functions.

It conditionally uses the existing `public.set_updated_at()` function if that
function exists. It drops and recreates these triggers:

- `set_ai_token_addons_updated_at` on `ai_token_addons`
- `profiles_set_updated_at` on `profiles`
- `portal_access_set_updated_at` on `portal_access`
- `billing_accounts_set_updated_at` on `billing_accounts`

If `public.set_updated_at()` is absent, these triggers are skipped.

### Grants

The migration revokes all anonymous access from:

- `ai_token_addons`
- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`

The migration grants:

- `select` on `ai_token_addons` to `authenticated`
- `select, insert, update, delete` on `ai_token_addons` to `service_role`
- `usage` on schema `public` to `authenticated` and `service_role`
- `select, insert, update` on `profiles` to `authenticated`
- `select, insert, update` on `portal_access` to `authenticated`
- `select` on `billing_accounts` to `authenticated`
- `select, insert` on `fit_checks` to `authenticated`
- `select, insert` on `legal_acceptances` to `authenticated`
- `select, insert, update, delete` on each portal table to `service_role`

### Indexes

The migration creates these indexes if they do not already exist:

- `ai_token_addons_user_feature_status_idx`
- `ai_token_addons_purchase_reference_idx`
- `portal_access_status_idx`
- `portal_access_launch_phase_idx`
- `fit_checks_user_created_at_idx`
- `legal_acceptances_user_accepted_at_idx`

### Explicit Non-Goals

The migration does not intentionally include:

- `launch_program_state` pricing mutation.
- Public pricing amount changes.
- AI budget row value upserts.
- Saved-load status constraint replay already covered by remote migration
  `20260616031812`.
- User/customer/business row-data reads.
- Data `insert`, `update`, `delete`, or `truncate` statements.
- `drop table` or `drop column` statements.
- App deployment approval.
- Migration history repair approval.

## 3. Known Live Schema Gaps

The read-only live audit confirmed these expected tables are missing online:

- `ai_token_addons`
- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`

The read-only live audit confirmed these expected columns are missing online:

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

Because the target tables are absent, their RLS state, policies, service-role
grants, indexes, and triggers also cannot exist online yet.

## 4. Application Path Options

### Option A - Controlled Single-File SQL Application

Possible later command, DO NOT RUN YET:

```bash
npx supabase db query --linked --file supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql
```

This path applies only the reviewed forward reconciliation SQL file, rather
than asking Supabase CLI migration tooling to decide which pending local
migrations should run.

Pros:

- Keeps the operation limited to one reviewed SQL file.
- Avoids replaying older pending local migrations directly.
- Keeps launch pricing mutation out of the schema operation.
- Keeps AI budget row value mutation out of the schema operation.
- Matches the June 27, 2026 read-only audit recommendation.

Cons:

- Direct SQL application does not automatically create a matching
  `supabase_migrations.schema_migrations` ledger row for
  `20260624000745`.
- Future migration tooling may still see local/remote migration history as
  divergent.
- A partial application can leave some objects present and others absent.
- `drop policy if exists` and `drop trigger if exists` intentionally replace
  matching policies/triggers on the target objects.
- Additive schema changes can still take locks, affect Data API exposure, and
  create runtime behavior changes once app code writes to the new columns.

Migration-history risk:

- The production schema may become correct while the Supabase migration ledger
  remains intentionally unrepaired.
- Migration ledger repair might later be needed, but only after a separate
  reviewed decision that the forward migration fully supersedes the older local
  unapplied schema effects.
- Do not run `supabase migration repair` as part of the schema application
  unless separately approved.

Required verification after application:

- Migration list.
- Metadata catalog query for expected tables and columns.
- RLS, policies, grants, indexes, triggers, and functions.
- Absence of anonymous grants on new sensitive tables.
- Service-role grants on portal and AI add-on tables.
- App smoke tests after schema verification.

Recommendation:

- This is the preferred production application path only after backup/PITR,
  target project, migration hash, and fresh read-only catalog gates pass.
- Do not execute this command until explicitly approved.

### Option B - Ledger-First Migration Workflow

Possible later investigation, DO NOT RUN YET:

```bash
npx supabase migration list
npx supabase db push
```

This option would attempt to use Supabase migration tooling so the schema and
ledger are advanced together.

Current verdict:

- Not currently recommended.
- Prior audit and runbook evidence say blind `supabase db push` remains unsafe.

Why `supabase db push` remains unsafe:

- Remote migration history is not a simple prefix of the local migration
  folder.
- Some older local migrations remain unapplied remotely.
- The older pending migrations mix additive schema with business-data mutation.
- `20260621045851_align_launch_pricing_phase_prices.sql` mutates public launch
  pricing state and remains outside this schema reconciliation.
- AI budget row value upserts remain outside this schema reconciliation.
- Some saved-load status work was already applied remotely by
  `20260616031812`.

Preconditions before this could become safe:

- A fresh read-only migration list confirms exact remote history.
- A fresh catalog check confirms no incompatible partial schema exists.
- Pricing mutation is separated and explicitly approved or excluded.
- AI budget row values are separated and explicitly approved or excluded.
- A reviewer proves the CLI will apply only the intended migration effects.
- Migration history repair or supersession is documented before execution.
- The target Supabase project is verified without printing secrets.
- Backup/PITR recovery posture is verified.

Recommendation:

- Do not use this option unless those preconditions are met and owner approval
  explicitly names the ledger-first workflow.

### Option C - Supabase Preview/Clone/Staging Validation First

This option validates the exact forward migration against a non-production
Supabase target first.

Acceptable targets if available:

- Supabase preview branch.
- Cloned Supabase project.
- Staging project with the same relevant baseline schema and migration state.

Pros:

- Finds SQL, lock, RLS, grant, policy, trigger, and Data API exposure problems
  before production.
- Provides evidence for whether the one-file application behaves as expected.
- Allows app smoke tests against reconciled schema without mutating production.
- Reduces risk before deciding whether migration ledger repair is needed.

Cons:

- Requires owner dashboard checks and possibly paid-plan features.
- A clone or staging project may not perfectly match production migration
  history.
- Preview/staging validation still does not authorize production mutation.
- Requires discipline to avoid copying secrets or production row data into
  documentation.

Required owner dashboard checks:

- Confirm whether Supabase preview branches are available.
- Confirm whether database clone/restore-to-new-project is available.
- Confirm whether the staging or clone target has the intended baseline.
- Confirm whether PITR/backups are available before any production step.
- Confirm no GitHub/Supabase integration will auto-apply migrations.

Recommendation:

- Prefer this option before production if an equivalent staging, clone, or
  preview target is available.

### Option D - No Action

This option leaves the live schema as-is.

Consequences:

- Full fuel gauge snapshot persistence remains blocked.
- Full equipment context snapshot persistence remains blocked.
- Newer `truck_profiles` fuel, equipment, weight, and capability fields remain
  absent online.
- Portal/profile bridge tables remain absent.
- AI token add-on schema remains absent.
- Service-role grants, RLS, policies, indexes, and triggers for those missing
  tables remain absent.
- App/runtime schema mismatch remains unresolved.

Recommendation:

- This option is safer than an unapproved or broad database mutation, but it
  leaves deployment and feature-readiness risks open.

## 5. Backup/PITR Gate

Owner checklist before any production application:

- Supabase project name and project ref verified.
- Supabase plan level recorded.
- Database Backups page checked.
- Latest backup timestamp recorded.
- PITR status recorded as enabled or not enabled.
- Restore-to-new-project option recorded as available or unavailable.
- Acceptable downtime or degraded-service window approved.
- Exact pre-change timestamp recorded immediately before application.
- Confirm who can approve restore or rollback.
- Confirm the app deployment remains paused or gated until verification passes.

Stop if backup/PITR status is unknown.

## 6. Pre-Application Checklist

The following commands are read-only or local-only as written, but they are
listed for a future approved run. DO NOT RUN YET.

Git branch and status verification, DO NOT RUN YET:

```bash
git branch --show-current
git status --short --untracked-files=all
git rev-parse HEAD
git diff --check
```

Migration list, DO NOT RUN YET:

```bash
npx supabase migration list
```

Schema metadata check, DO NOT RUN YET:

```bash
npx supabase db query --linked --file /path/to/reviewed-catalog-query.sql
```

Minimum catalog scope for that reviewed query:

- Migration versions.
- Public tables.
- Columns.
- RLS status.
- Policies.
- Grants.
- Functions.
- Triggers.
- Indexes.
- Views.

Integration verification, DO NOT RUN YET:

```bash
test -f supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql
git log --oneline --decorate --max-count=8
```

Do not print tokens, service-role keys, database URLs, `.env.local`, or
connection strings.

## 7. Application Checklist

This section documents possible future commands. DO NOT RUN YET.

### Schema Application

Preferred one-file schema application candidate, DO NOT RUN YET:

```bash
npx supabase db query --linked --file supabase/migrations/20260624000745_forward_reconcile_live_schema_gap.sql
```

Application stop conditions:

- The target project is not verified.
- The worktree is dirty.
- The migration file hash differs from the reviewed version.
- Fresh read-only catalog evidence differs from the audit in a way that has
  not been reviewed.
- Any target object exists with incompatible shape.
- Backup/PITR status is unknown.
- Any command would print or store secrets.

### Migration Ledger Handling

Potential later migration-history command, DO NOT RUN YET:

```bash
npx supabase migration repair --status applied 20260624000745
```

Current verdict:

- Do not run migration repair during schema application.
- Only consider ledger repair after controlled SQL application succeeds,
  catalog verification passes, and a separate reviewed decision confirms the
  ledger action is necessary and correct.

### Post-Application Verification

Post-application read-only verification, DO NOT RUN YET:

```bash
npx supabase migration list
npx supabase db query --linked --file /path/to/reviewed-post-application-catalog-query.sql
```

Post-application app checks, DO NOT RUN YET:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Run app smoke tests only after schema metadata verification passes.

## 8. Rollback Plan

Rollback approval:

- The owner must approve rollback or restore.
- A security/release reviewer should confirm whether a forward fix or restore
  is safer.
- Product/legal must remain involved if any incident touches pricing, legal
  acknowledgements, billing state, or public claims.

Preferred recovery sequence:

1. Stop app deployment or route traffic away from affected paths.
2. Preserve current database state and logs.
3. Inspect catalog state and application errors.
4. Prefer a reviewed forward fix when safe.
5. Restore from backup/PITR if schema state or production writes make a forward
   fix unsafe.

Backup/PITR restore:

- Restore to a new project if available and time allows.
- Record the pre-change timestamp before application so PITR has an exact
  target.
- Confirm the restore target and cutover process before production mutation.

Rollback SQL feasibility:

- Additive migrations can be hard to reverse after production writes begin.
- Dropping new columns or tables can lose data.
- Removing grants or policies can break app flows.
- Reverting trigger/policy changes without a replacement can create security or
  runtime regressions.

Partial-success handling:

- Stop immediately after any failed application.
- Do not retry blindly.
- Re-run read-only catalog checks to identify what applied.
- Compare applied objects against the migration statement inventory.
- Decide between a small forward fix, restore, or a fresh clone/staging
  reproduction before touching production again.

## 9. Post-Application Verification

Verify expected tables exist:

- `ai_token_addons`
- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`

Verify expected columns exist:

- All target `truck_profiles` fuel/equipment columns.
- `saved_loads.fuel_gauge_snapshot`.
- `saved_loads.equipment_context_snapshot`.
- All target `ai_budget_limits` add-on schema columns.
- Portal table columns created by the migration.

Verify RLS:

- RLS enabled on every new public table.
- No new sensitive table exposed to `anon`.

Verify policies:

- Own-row select policy on `ai_token_addons`.
- Own-row select/insert/update policies on `profiles`.
- Own-row select/insert/update policies on `portal_access`.
- Own-row select policy on `billing_accounts`.
- Own-row select/insert policies on `fit_checks`.
- Own-row select/insert policies on `legal_acceptances`.

Verify grants:

- No `anon` grants on `ai_token_addons` or portal tables.
- Authenticated grants match the migration inventory.
- Service-role grants exist for `ai_token_addons` and all portal tables.

Verify triggers:

- `set_ai_token_addons_updated_at`, if `public.set_updated_at()` exists.
- `profiles_set_updated_at`, if `public.set_updated_at()` exists.
- `portal_access_set_updated_at`, if `public.set_updated_at()` exists.
- `billing_accounts_set_updated_at`, if `public.set_updated_at()` exists.

Verify functions:

- `public.set_updated_at()` existence determines whether update triggers were
  created.
- No new functions should appear from this migration.

Verify migration history state:

- Record whether `20260624000745` appears in
  `supabase_migrations.schema_migrations`.
- If direct SQL was used, expect the ledger may not include
  `20260624000745` unless a separate approved ledger action was performed.

App smoke-test checklist after schema verification:

- Portal page read path.
- Portal settings save path.
- Portal Fit Check save path.
- Operational profile save path.
- Vehicle profile save path for fuel/equipment fields.
- Saved-load save path with fuel gauge snapshot.
- Saved-load save path with equipment context snapshot.
- AI governance budget/add-on read path.
- Dashboard/history saved-load read path.
- Report/detail read path for saved load snapshots.
- Billing gates still respect existing entitlement logic.

## 10. Decision Recommendation

Conservative recommendation:

1. Do not merge the Draft PR yet.
2. Prefer Supabase preview, clone, or staging validation first if an equivalent
   target is available.
3. If staging/clone validation is unavailable, use controlled single-file SQL
   application only after:
   - fresh read-only migration and catalog checks pass,
   - backup/PITR posture is recorded,
   - the target project is verified,
   - owner approval explicitly names the migration file,
   - the app deployment remains paused or gated,
   - the SQL is reviewed line by line against this plan.
4. Keep `supabase db push` blocked until a separate ledger-first plan proves it
   can apply only the intended schema effects without pricing or AI budget
   row-value mutation.

Remote application is recommended later only after all gates are satisfied. It
is not recommended immediately from this plan alone.

## 11. Explicit Blocked Actions

- Do not merge the Draft PR yet.
- Do not run `supabase db push`.
- Do not run `supabase db query --file`.
- Do not run `supabase migration repair`.
- Do not alter live Supabase.
- Do not expose secrets.
- Do not apply pricing mutation.
- Do not upsert AI budget row values.
- Do not deploy app code that assumes the reconciled schema until the schema is
  applied and verified.
