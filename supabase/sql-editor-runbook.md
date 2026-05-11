# Karpilo LoadIQ SQL Editor Runbook

Generated: 2026-05-11

These files are designed for manual review and paste into the Supabase SQL Editor. They are additive and non-destructive: no `DROP TABLE`, `TRUNCATE`, destructive reset, hardcoded user ID, API key, or service-role secret is included.

## Run Order

Run files in this exact order:

1. `001_extensions_and_functions.sql`
2. `002_profiles_and_operational_settings.sql`
3. `003_overhead_categories.sql`
4. `004_saved_loads_and_calculations.sql`
5. `005_fuel_price_cache_eia.sql`
6. `006_demo_calculations.sql`
7. `007_legal_documents_and_acknowledgments.sql`
8. `008_subscriptions_and_billing.sql`
9. `009_feedback_and_reviews.sql`
10. `010_indexes_triggers_rls.sql`
11. `011_optional_seed_legal_documents.sql`

## What Each File Does

### 001 Extensions and Functions

Creates `pgcrypto` and `public.set_updated_at()`.

Safe to rerun: yes.

Check after run:

- Extension creation succeeds.
- Function `public.set_updated_at()` exists.

### 002 Profiles and Operational Settings

Creates/updates:

- `users`
- `operator_profiles`
- `user_settings`
- `truck_profiles`
- `pay_structure_templates`

Safe to rerun: yes.

Check after run:

- `users` has disclaimer columns.
- `user_settings` has profile/default calculator fields.
- `truck_profiles` exists for MPG and truck metadata.

### 003 Overhead Categories

Creates/updates:

- `user_overhead_items`
- `overhead_categories`

Safe to rerun: yes.

Check after run:

- `user_overhead_items` exists with `amount_type`, `frequency`, `responsibility`, and `is_active`.

### 004 Saved Loads and Calculations

Creates/updates:

- `saved_loads`
- `load_estimates`
- `post_trip_actuals`
- `lane_templates`
- `trip_history`
- `calculation_overrides`
- `accessorial_items`

Safe to rerun: yes.

Check after run:

- `saved_loads` has `input_snapshot`, `result_snapshot`, `actuals_snapshot`, `calculation_version`, `load_run_status`, and EIA fuel fields.
- `post_trip_actuals` exists.

### 005 Fuel Price Cache EIA

Creates/updates `fuel_price_cache`.

Safe to rerun: yes.

Check after run:

- Unique index on `cache_key` exists.
- Table has `price_per_gallon`, `source_period`, `fetched_at`, and `expires_at`.

### 006 Demo Calculations

Creates `demo_calculations` for optional public demo/event capture.

Safe to rerun: yes.

Check after run:

- Anonymous inserts will be allowed only after file `010` creates the policy.
- No anonymous select policy is created.

### 007 Legal Documents and Acknowledgments

Creates:

- `legal_documents`
- `user_legal_acknowledgments`
- `disclaimer_acceptances`

Safe to rerun: yes.

Check after run:

- `legal_documents` has unique `(document_type, version)`.
- `disclaimer_acceptances` exists for current disclaimer audit logging.

### 008 Subscriptions and Billing

Creates/updates:

- `subscriptions`
- `usage_limits`
- `usage_events`
- `promo_codes`
- `founder_pricing_access`
- `pilot_access`

Safe to rerun: yes.

Check after run:

- `subscriptions` has `provider`, provider IDs, `billing_interval`, trial fields, cancellation fields, and `metadata`.
- `founder_pricing_access` supports code/seat/redeemed fields.

### 009 Feedback and Reviews

Creates:

- `feedback`
- `review_prompt_tracking`
- `support_tickets`
- `onboarding_states`
- `entity_notes`
- `analytics_events`

Safe to rerun: yes.

Check after run:

- `review_prompt_tracking.user_id` is unique.
- `support_tickets.related_load_id` references `saved_loads`.

### 010 Indexes, Triggers, RLS

Creates indexes, updated-at triggers, grants, enables RLS, and creates RLS policies using `pg_policies` checks.

Safe to rerun: yes.

Check after run:

- RLS is enabled on public tables.
- User-owned tables have policies using `auth.uid() = user_id` or `auth.uid() = id`.
- Reference tables have read-only policies where appropriate.
- `subscriptions`, `founder_pricing_access`, `promo_codes`, `pilot_access`, and `fuel_price_cache` are not generally client-writable.

### 011 Optional Seed Legal Documents

Seeds `usage_limits` and legal document registry rows.

Safe to rerun: yes, uses `on conflict`.

Check after run:

- `usage_limits` has `free`, `pro`, `founder`, and `pilot`.
- `legal_documents` has active rows for terms, privacy, refund, subscription terms, disclaimer, and data sources.

## Expected Success Behavior

Supabase SQL Editor should report successful execution for each file. Re-running should either do nothing or update seed rows without duplicating tables, columns, indexes, policies, or legal document versions.

## Common SQL Editor Errors

### `relation already exists`

Usually safe when caused by an existing table/index from prior migrations. The generated files use `IF NOT EXISTS` for tables and indexes. If this appears for a policy, run the query below to inspect existing policy names:

```sql
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### `policy already exists`

The generated RLS file uses `DO` blocks that check `pg_policies`. If you still see this error, a policy may have been created concurrently or copied outside the block. Do not drop it blindly. Inspect it first:

```sql
select *
from pg_policies
where schemaname = 'public'
  and tablename = '<table_name>';
```

### `column already exists`

The generated files use `ADD COLUMN IF NOT EXISTS`. If this occurs, confirm the pasted SQL did not lose the `IF NOT EXISTS` clause.

### `foreign key constraint fails`

This usually means a referenced table was not created yet. Confirm you ran the files in order. Most user-owned tables reference `public.users`.

### `permission denied for schema public`

Run `001_extensions_and_functions.sql` and `010_indexes_triggers_rls.sql` again. Confirm `grant usage on schema public to anon, authenticated, service_role;` succeeded.

### RLS blocks inserts

For user-owned tables, the inserted `user_id` must equal `auth.uid()` from the active authenticated session. For `users`, inserted `id` must equal `auth.uid()`.

For server-side service-role operations, RLS is bypassed by the service role. Do not expose the service-role key in browser code.

### `new row violates row-level security policy`

Check:

- Is the user authenticated?
- Does `user_id` equal `auth.uid()`?
- Is the insert going to a reference/admin table that is intentionally not client-writable?
- Did file `010_indexes_triggers_rls.sql` run successfully?

### `null value in column violates not-null constraint`

The app expects required saved-load values such as pickup/delivery ZIPs, loaded miles, deadhead miles, gross revenue, fuel cost, operational cost, estimated net, true RPM, score, and band. Confirm the app is sending complete payloads.

## Manual Verification Queries

Run after all files:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users',
    'operator_profiles',
    'user_settings',
    'truck_profiles',
    'pay_structure_templates',
    'user_overhead_items',
    'overhead_categories',
    'saved_loads',
    'fuel_price_cache',
    'legal_documents',
    'disclaimer_acceptances',
    'subscriptions',
    'usage_events',
    'support_tickets',
    'onboarding_states'
  )
order by table_name;
```

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
select tablename, policyname
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Important Security Notes

- Do not add public SELECT policies for user-owned tables.
- Do not add client write policies for `subscriptions`, `fuel_price_cache`, `promo_codes`, `founder_pricing_access`, or `pilot_access` unless a backend authorization design is added.
- Do not use JWT `user_metadata` for authorization decisions.
- Keep service-role and EIA API keys only in server environment variables.
