# LoadIQ Supabase Forward Reconciliation Design

Last updated: June 23, 2026

This document designs the forward-only Supabase reconciliation work needed
after the read-only live audit. It does not create a migration, apply SQL,
repair migration history, or authorize production database mutation.

## Current Live Migration State

The live Supabase project currently records these applied migration versions:

```text
20260611141000
20260611192122
20260611193403
20260611194259
20260611194739
20260616031812
```

The local migration directory also contains these later migrations that are not
applied remotely:

```text
20260612041136_load_fuel_gauge_status_profile.sql
20260612051426_atlas_vehicle_usage_marketing_foundation.sql
20260621045851_align_launch_pricing_phase_prices.sql
20260621213322_app_portal_access_foundation.sql
```

The live schema audit found the missing versions are not only missing from
migration history. Their expected schema effects are also absent in the live
schema, except for `saved_loads.load_status_reason`, which exists because
`20260616031812_expand_saved_load_run_statuses.sql` was applied remotely.

## Missing Schema State

Confirmed absent from the live schema:

- Portal tables: `profiles`, `portal_access`, `billing_accounts`,
  `fit_checks`, and `legal_acceptances`.
- Fuel gauge fields: `truck_profiles.fuel_tank_count`,
  `truck_profiles.fuel_tank_capacity_gallons`, and
  `saved_loads.fuel_gauge_snapshot`.
- Atlas equipment/profile fields on `truck_profiles`, including
  `atlas_equipment_pack`, `equipment_type`, `combination_type`,
  dimensions, payload/GVWR fields, capability flags, capability arrays, and
  `route_restriction_notes`.
- `saved_loads.equipment_context_snapshot`.
- AI add-on structures: `ai_token_addons` and add-on budget columns on
  `ai_budget_limits`.

Related app references confirm runtime dependency:

- `src/services/save-load.ts` writes `fuel_gauge_snapshot` and
  `equipment_context_snapshot` when saving a load.
- `src/services/operational-profile.ts` reads and writes the missing fuel and
  Atlas equipment fields on `truck_profiles`.
- `src/lib/ai/ai-governance.ts` reads the add-on columns on
  `ai_budget_limits` and reads `ai_token_addons`.
- `src/lib/portal/server.ts`, `src/components/settings/SettingsForm.tsx`, and
  `src/components/fit-check/FitCheckForm.tsx` read or write the portal tables.

## Migration Ordering Problem

The remote history is no longer a simple prefix of the local migration folder:

- `20260616031812_expand_saved_load_run_statuses.sql` is applied remotely.
- Earlier local migrations `20260612041136` and `20260612051426` remain
  unapplied remotely.
- Later local migrations `20260621045851` and `20260621213322` also remain
  unapplied remotely.

Running the missing migrations in timestamp order would mix additive schema,
constraint churn already covered by the applied saved-load status repair, AI
budget data changes, and launch pricing data mutation. That is too broad for a
safe production reconciliation.

## Why Blind `supabase db push` Is Unsafe

Do not run blind `supabase db push` against the live project.

The current local folder contains a mixture of:

- already-applied remote migrations,
- missing additive schema,
- missing RLS/policy/grant definitions,
- data mutation for AI budget rows,
- public launch pricing mutation,
- compatibility tables for portal routes,
- status-constraint logic partly superseded by a later applied migration.

Blind replay can create unclear migration history, apply public pricing changes
without product/legal approval, and hide the difference between additive schema
repair and business-state mutation.

## Candidate Reconciliation Options

### Option A: Replay Missing Local Migrations Directly

This would run the four missing local migrations in their existing order.

This option is not recommended. It couples schema reconciliation with
`launch_program_state` pricing mutation and AI budget data updates, and it
would replay saved-load status constraint work even though the later status
repair migration is already applied remotely.

### Option B: Create One Forward-Only Schema Reconciliation Migration

This would create a new migration after `20260621213322` that applies only the
missing additive schema, RLS, policies, indexes, triggers, comments, and grants
needed for the live project to match the current app contract.

This is the recommended primary path.

The migration should be idempotent where practical, dependency-aware, and
explicit about already-present live schema such as `saved_loads.load_status_reason`.

### Option C: Separate Schema Reconciliation And Business Data Migrations

This extends Option B by keeping any data mutation in separate migrations:

- one forward-only schema reconciliation migration,
- one AI budget seed/update migration if billing/product owners approve the
  updated AI token budget values,
- one launch pricing migration only after product/legal approval.

This is the recommended operational release model.

### Option D: New Supabase Project Baseline

This would abandon live reconciliation and create a new project baseline from a
reviewed full schema snapshot.

This remains a possible fallback if the live project is disposable or if
migration history repair becomes more dangerous than recreating the project.
It is not the first recommendation because the live project already contains a
substantial aligned 2026 baseline and all inspected public base tables have RLS
enabled.

## Recommended Option

Use Option C:

1. Create a new forward-only schema reconciliation migration for missing
   additive schema, RLS, policies, grants, indexes, triggers, and comments.
2. Exclude `launch_program_state` pricing mutation from the schema migration.
3. Treat AI budget row changes as business configuration and either:
   - keep only the required `ai_budget_limits` columns in the schema
     reconciliation migration, or
   - add the budget row upsert in a separate approved AI budget configuration
     migration.
4. Re-run read-only migration and catalog checks after review and before any
   production application.

## Proposed Forward-Only Migration Scope

Include these pieces from
`20260612041136_load_fuel_gauge_status_profile.sql`:

- Add `truck_profiles.fuel_tank_count`.
- Add `truck_profiles.fuel_tank_capacity_gallons`.
- Add nonnegative constraints for those fuel fields.
- Add `saved_loads.fuel_gauge_snapshot`.
- Add fuel-related comments.

Do not re-add or rename saved-load status constraints unless the live catalog
proves the applied `20260616031812` constraints are insufficient. The live
project already has `saved_loads.load_status_reason`.

Include these schema pieces from
`20260612051426_atlas_vehicle_usage_marketing_foundation.sql`:

- Add Atlas/equipment fields on `truck_profiles`.
- Add `saved_loads.equipment_context_snapshot`.
- Add nonnegative and valid-value constraints for Atlas equipment fields.
- Add add-on budget columns to `ai_budget_limits`.
- Add `ai_token_addons` table.
- Add indexes for `ai_token_addons`.
- Enable RLS on `ai_token_addons`.
- Add authenticated own-row SELECT policy on `ai_token_addons`.
- Add `service_role` write grants for `ai_token_addons`.
- Add `set_ai_token_addons_updated_at` trigger if `public.set_updated_at()`
  exists.
- Add comments.

Do not bundle the `ai_budget_limits` row upsert without explicit product,
billing, and AI governance approval. The columns are schema; the limits and
prices are business configuration.

Include these pieces from
`20260621213322_app_portal_access_foundation.sql`:

- Create `profiles`.
- Create `portal_access`.
- Create `billing_accounts`.
- Create `fit_checks`.
- Create `legal_acceptances`.
- Add table indexes.
- Enable RLS on all five portal tables.
- Grant authenticated access only to the operations the portal needs.
- Add own-row policies for user profile, access, Fit Check, and legal
  acknowledgement records.
- Keep `billing_accounts` authenticated read-only.
- Add `service_role` grants for server/admin/billing writes.
- Add `set_updated_at()` triggers where relevant.
- Add comments.

## Explicitly Excluded Pricing Mutation

Exclude
`20260621045851_align_launch_pricing_phase_prices.sql` from the forward-only
schema reconciliation.

That migration updates and inserts `launch_program_state` row data for public
pricing and waitlist mode. It requires separate product/legal approval and
should be reviewed against the current public pricing architecture before any
production replay.

## Required SQL Categories

The eventual migration should be organized by category:

1. Dependency checks for prerequisite baseline tables and functions.
2. Additive table/column creation.
3. Constraints, preferably `not valid` for existing tables where appropriate.
4. Indexes.
5. RLS enablement.
6. Grants and revokes.
7. Policies.
8. Triggers.
9. Comments.
10. Post-application verification queries documented as comments or a separate
    runbook.

The migration should avoid querying or mutating user/customer row data except
where a reviewed, explicit data migration is separately approved.

## RLS, Policy, And Grant Requirements

Every new public table must have RLS enabled before exposed role grants matter.

Policy requirements:

- Portal profile/access/Fit Check/legal records must be own-row scoped with
  `(select auth.uid())` predicates.
- `billing_accounts` must be read-only to authenticated users. Client writes
  would create billing-state spoofing risk.
- `ai_token_addons` must be visible only to the owning authenticated user.
- Admin, billing, and server writes must use service-role paths, not client
  policies.
- Do not use policies that grant `TO authenticated` without an ownership or
  equivalent authorization predicate.
- Do not grant anonymous access to the new portal or AI add-on tables.

Grant requirements:

- Keep `anon` without access to the new portal and AI add-on tables.
- Grant authenticated users only the minimum client operations required by the
  current app routes.
- Grant `service_role` enough access for server-side billing, admin, and portal
  management tasks.
- Verify Data API exposure behavior after creation; RLS alone does not expose a
  table if role grants are missing.

## Service-Role Grant Requirements

The forward migration should explicitly grant service-role access for tables
created after the baseline:

- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`
- `ai_token_addons`

Service-role grants are required for server-side billing, admin, and controlled
portal management paths. They should not be treated as inherited from earlier
baseline grant normalization, because these tables do not yet exist remotely.

## Public Intake And Rate-Limit Notes

The reconciliation migration should not widen public intake access.

Anonymous inserts currently remain allowed on:

- `contact_inquiries`
- `newsletter_subscribers`
- `rollout_waitlist`
- `support_intake`
- `website_reservations`

Those surfaces are intentional website/app intake surfaces, but they remain
spam and abuse surfaces. Before deployment, confirm server-side validation,
rate limiting, duplicate handling, logging, and monitoring. RLS protects row
visibility; it does not prevent form abuse.

## Validation Plan

Before writing SQL:

1. Re-run read-only migration list against the intended project.
2. Re-run a read-only catalog query for the missing tables, columns, policies,
   grants, indexes, triggers, and views.
3. Confirm no additional manual changes landed since the June 23 audit.

Before applying SQL:

1. Review the generated migration line-by-line.
2. Confirm the migration excludes `launch_program_state` pricing mutation.
3. Confirm the migration excludes unapproved AI budget value upserts.
4. Confirm rollback/stop conditions are understood.
5. Confirm the target project ref and project name.

After applying SQL in an approved environment:

1. Run read-only migration list.
2. Run read-only catalog verification for all reconciled tables and columns.
3. Verify RLS is enabled on every new public table.
4. Verify policies match the intended own-row access model.
5. Verify grants for `anon`, `authenticated`, and `service_role`.
6. Run app validation for portal settings, portal Fit Check save, operational
   profile save, saved-load save, and AI governance fallback/add-on reads.
7. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before release.

## Rollback And Stop Conditions

Stop before production application if:

- The linked Supabase project is not the intended LoadIQ project.
- The remote migration list changed unexpectedly.
- Live schema already contains any target object with incompatible shape.
- Any migration statement requires destructive changes.
- Any statement touches `launch_program_state` pricing data.
- Any statement changes billing, entitlement, or AI budget values without
  explicit approval.
- Any policy grants broad authenticated access without row ownership checks.
- Any new table is exposed to `anon`.
- Any secret, service-role key, or database URL would be printed or stored.

Rollback planning should be reviewed before application. Additive migrations
are easier to stop than to roll back after app traffic writes data into the new
tables. For production, prefer a maintenance window or controlled deployment
gate rather than relying on destructive rollback SQL.

## Deployment Gate Rules

Do not deploy the app/platform baseline against the live project until:

- The missing schema reconciliation is applied and verified.
- Portal tables exist with expected RLS, policies, and grants.
- Fuel gauge and equipment snapshot columns exist.
- AI add-on schema is reconciled or app behavior is confirmed to degrade safely.
- Public intake anti-abuse controls are verified.
- Pricing mutation remains blocked unless separately approved.
- Read-only live catalog evidence has been saved outside the repo or summarized
  in docs without secrets.

Do not run `supabase db push` until a reviewer has accepted the migration plan
and the exact SQL.

## Manual Approvals Required Before Production Use

Required approvals:

- Product/legal approval for any `launch_program_state` pricing mutation.
- Billing/product approval for AI token add-on price and budget values.
- Security approval for RLS policies, grants, and public intake exposure.
- Release approval for applying the reconciliation to the live Supabase
  project.
- App owner approval that portal tables are still the intended primitive portal
  contract.

## Later Migration-History Handling

After a successful forward reconciliation, the old missing local migrations
should not be blindly replayed.

Recommended handling:

- Keep them as historical references until the live reconciliation is proven.
- Do not mark them applied with `supabase migration repair` unless there is a
  reviewed decision that the new forward migration fully supersedes their
  production effects and that future local/remote history tooling needs that
  repair.
- Consider archiving or superseding them only after the forward migration and
  any separately approved business data migrations are complete.
- Prefer a new project baseline only if live reconciliation becomes more risky
  than recreating the project from an approved full schema.
