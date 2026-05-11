# Karpilo LoadIQ Schema Validation Report

Generated: 2026-05-11

## Scope Inspected

- `src/types/`
- `src/lib/`
- `src/services/`
- `src/hooks/`
- `src/app/api/`
- `src/app/`
- `src/components/calculator/`
- `src/components/settings/`
- `src/components/profile/`
- `src/components/legal/`
- `src/components/demo/`
- `src/domains/billing/`
- `src/database/`
- `supabase/`
- `package.json`
- `.env.example` if present

## Supabase / Next.js Notes

- The app uses `@supabase/ssr` and `@supabase/supabase-js`.
- Browser and server clients use the publishable/anon key from `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- EIA cache writes use a server-only service role key in `src/services/fuel/fuel-service.ts`; this is appropriate for server route usage and should never be exposed client-side.
- Supabase changelog review noted newer projects may require explicit grants for Data API access. The SQL chunks include explicit `GRANT` statements while still enabling RLS.

## App-Required Tables From Code Usage

The current app appears to require these public tables:

- `users`
- `operator_profiles` or future operational profile table
- `user_settings`
- `truck_profiles`
- `pay_structure_templates`
- `user_overhead_items`
- `overhead_categories`
- `saved_loads`
- `load_estimates`
- `post_trip_actuals`
- `lane_templates`
- `trip_history`
- `calculation_overrides`
- `accessorial_items`
- `fuel_price_cache`
- `demo_calculations`
- `legal_documents`
- `user_legal_acknowledgments`
- `disclaimer_acceptances`
- `subscriptions`
- `usage_limits`
- `usage_events`
- `founder_pricing_access`
- `promo_codes`
- `pilot_access`
- `feedback`
- `review_prompt_tracking`
- `support_tickets`
- `onboarding_states`
- `entity_notes`
- `analytics_events`

## Existing Schema Files

Found schema/migration sources:

- `supabase/schema-loadiq-current.sql`
- `supabase/schema/loadiq_schema.sql`
- `supabase/migrations/001_initial_loadiq.sql`
- `supabase/migrations/002_survivability_foundation.sql`
- `supabase/migrations/003_usage_read_policy.sql`
- `supabase/migrations/004_cloud_idempotent_repair.sql`
- `supabase/migrations/005_settings_driven_profile.sql`
- `supabase/migrations/006_legal_disclaimer_acceptance.sql`
- `supabase/migrations/007_eia_fuel_baseline.sql`
- `supabase/migrations/008_founder_pricing_product_readiness.sql`
- `supabase/migrations/009_pilot_support_history_intelligence.sql`
- `supabase/migrations/010_profile_overhead_dispatch_days.sql`
- `src/database/schema/001_initial_schema.sql`
- `src/database/migrations/001_initial_loadiq.sql`
- `src/database/migrations/002_survivability_foundation.sql`
- `src/database/migrations/003_usage_read_policy.sql`
- `src/database/rls/001_rls_policies.sql`

## Validation Findings

### Current Code vs Current Schema

- The consolidated `supabase/schema-loadiq-current.sql` is the closest match to the current app surface.
- The older migration files are incomplete compared with current app usage. They do not fully cover fuel cache, legal documents, billing provider fields, pilot/founder access, support tickets, review tracking, onboarding, post-trip actuals, and some profile-driven calculator columns.
- Current code still uses `public.users` as the profile compatibility table. The requested product terminology references `profiles / operational_profiles`; the update chunks preserve `users` and add `operator_profiles` for future-ready operational profile structure.
- No application code currently writes `operator_profiles`, `overhead_categories`, `demo_calculations`, `legal_documents`, or `user_legal_acknowledgments`, but these are required by the product/legal/demo roadmap and are safe additive tables.

### Missing Tables If Only Early Migrations Are Applied

If the Supabase project only has the early `src/database` or first migrations applied, these are likely missing:

- `truck_profiles`
- `operator_profiles`
- `overhead_categories`
- `load_estimates`
- `post_trip_actuals`
- `calculation_overrides`
- `accessorial_items`
- `fuel_price_cache`
- `demo_calculations`
- `legal_documents`
- `user_legal_acknowledgments`
- `disclaimer_acceptances`
- `usage_limits`
- `founder_pricing_access`
- `promo_codes`
- `pilot_access`
- `feedback`
- `review_prompt_tracking`
- `support_tickets`
- `onboarding_states`
- `entity_notes`

### Required Columns By Table

#### `users`

Required by current code:

- `id`
- `email`
- `full_name`
- `profile_name`
- `company_name`
- `operation_type`
- `disclaimer_accepted_at`
- `disclaimer_version`
- `disclaimer_last_updated`
- `created_at`
- `updated_at`

#### `user_settings`

Required by settings/profile/default calculator logic:

- `user_id`
- `target_true_rpm`
- `default_mpg`
- `default_fuel_price`
- `default_dispatch_percent`
- `default_factoring_percent`
- `default_lease_percent`
- `default_overhead`
- `default_reserve_allocation`
- `default_maintenance_reserve`
- `default_tire_reserve`
- `default_trailer_fee`
- `default_insurance_allocation`
- `default_variable_cost_per_mile`
- `default_fixed_cost_allocation`
- `target_profit_margin`
- `minimum_hourly_profitability`
- `operating_days_per_week`
- `operating_days_per_month`
- `income_target_amount`
- `income_target_period`
- `toll_handling_mode`
- `lumper_handling_mode`
- `default_pay_template_id`
- `default_deadhead_miles`
- `default_tolls`
- `default_accessorial_allowance`

#### `truck_profiles`

Required by operational profile logic:

- `user_id`
- `make`
- `model`
- `year`
- `engine`
- `odometer`
- `default_mpg`

#### `pay_structure_templates`

Required by profile/pay template logic:

- `user_id`
- `name`
- `structure`
- `is_default`

#### `user_overhead_items`

Required by overhead manager:

- `user_id`
- `label`
- `category`
- `amount`
- `amount_type`
- `frequency`
- `responsibility`
- `is_active`

#### `saved_loads`

Required by save/load/history/detail/report logic:

- `user_id`
- `status`
- `loadiq_load_number`
- `driver_load_number`
- `load_name`
- `load_outcome`
- `load_run_status`
- `was_run_status`
- pickup/delivery columns: `pickup_zip`, `pickup_city`, `pickup_state`, `delivery_zip`, `delivery_city`, `delivery_state`
- miles: `loaded_miles`, `deadhead_miles`, `total_miles`, `route_loaded_miles`, `actual_loaded_miles`, `route_deadhead_miles`, `actual_deadhead_miles`
- revenue/cost: `rate_per_mile`, `load_pay`, `fuel_surcharge`, `accessorials`, `tolls`, `lumper_fees`, `detention`, `layover`, `post_trip_costs`, `gross_revenue`, `payable_revenue`, `net_revenue`
- fuel: `mpg`, `fuel_price`, `estimated_fuel_cost`, `fuel_cost`, `fuel_estimate_source`, `estimated_fuel_price`, `actual_fuel_price`, `fuel_override`, `eia_period`, `fuel_fetched_at`
- profile/cost allocation: `dispatch_days`, `deadhead_days`, `daily_overhead`, `overhead_applied`, `dispatch_fee`, `factoring_fee`, `lease_deduction`, `maintenance_reserve`
- results: `operational_cost`, `total_expenses`, `total_trip_cost`, `estimated_net`, `actual_net`, `net_profit`, `true_rpm`, `profitability_score`, `profitability_band`, `profitability_rating`, `break_even_rpm`, `target_rpm`, `income_target_comparison`
- snapshots: `warnings`, `used_profile_values`, `used_temporary_overrides`, `profile_snapshot`, `calculation_snapshot`, `input_snapshot`, `result_snapshot`, `actuals_snapshot`, `pay_structure_snapshot`, `accessorial_items_snapshot`
- `calculation_version`
- `calculated_at`

#### `fuel_price_cache`

Required by EIA cache logic:

- `cache_key`
- `source`
- `fuel_type`
- `region`
- `diesel_price`
- `price_per_gallon`
- `source_label`
- `source_period`
- `is_estimate`
- `fetched_at`
- `expires_at`
- `updated_at`

#### Billing Tables

Current app reads:

- `subscriptions`: `tier`, `status`, `current_period_end`, plus provider fields for Stripe/Apple/Google readiness.
- `usage_events`: `user_id`, `event_name`, `event_payload`, `created_at`
- `founder_pricing_access`: `id`, `code`, `is_active`, `redeemed_at`

Product/legal requirements also justify:

- `promo_codes`
- `pilot_access`
- `usage_limits`

#### Legal Tables

Current app writes:

- `users.disclaimer_accepted_at`
- `users.disclaimer_version`
- `users.disclaimer_last_updated`
- `disclaimer_acceptances`

Product/legal requirements justify:

- `legal_documents`
- `user_legal_acknowledgments`

## Suspicious Mismatches / Risks

- `public.users` duplicates Auth user identity but is required by the current app. RLS must allow authenticated users to insert/select/update only their own `id`.
- `subscriptions` is currently read by clients but should normally be mutated by backend/webhook/admin flows. RLS should allow user SELECT only; client insert/update/delete should not be generally allowed.
- `fuel_price_cache` is written by a service-role server path. Authenticated users only need SELECT. Do not add client write policies for this table.
- `founder_pricing_access`, `promo_codes`, and `pilot_access` should not be client-mutated. The SQL grants SELECT to authenticated users where appropriate and relies on service role for writes.
- `demo_calculations` can allow anonymous INSERT if used for public website conversion tracking, but should not allow anonymous SELECT.
- Existing older RLS files use direct `auth.uid()`; the new chunks use `(select auth.uid())` in policies, which is generally friendlier to planner behavior.
- Older migrations do not always include `WITH CHECK` on UPDATE policies. For user-owned tables, UPDATE policies should include both `USING` and `WITH CHECK`.

## Nullable vs Required Concerns

- Existing data may already exist. The SQL chunks avoid changing existing nullable columns to `NOT NULL` via `ALTER COLUMN` because that can fail in production.
- New tables define critical fields as `NOT NULL`, but additive `ALTER TABLE ADD COLUMN IF NOT EXISTS` statements avoid destructive constraints on existing columns.
- `saved_loads.pickup_zip`, `delivery_zip`, `loaded_miles`, `deadhead_miles`, `gross_revenue`, `total_miles`, `fuel_cost`, `operational_cost`, `estimated_net`, `true_rpm`, `profitability_score`, and `profitability_band` are required by inserts and should have defaults or non-null definitions.

## Index Recommendations

Important indexes included in the update chunks:

- `saved_loads(user_id, created_at desc)`
- `saved_loads(user_id, loadiq_load_number)`
- `saved_loads(user_id, load_run_status, created_at desc)`
- `saved_loads(user_id, calculated_at desc)`
- `usage_events(user_id, event_name, created_at desc)`
- `subscriptions(user_id, status, created_at desc)`
- `subscriptions(provider, provider_subscription_id)`
- `fuel_price_cache(cache_key)`
- `fuel_price_cache(provider, updated_at desc)`
- `legal_documents(document_type, is_active)`
- `user_legal_acknowledgments(user_id, created_at desc)`
- `disclaimer_acceptances(user_id, created_at desc)`
- `support_tickets(user_id, created_at desc)`
- `review_prompt_tracking(user_id)`
- `onboarding_states(user_id, is_complete)`

## Assumptions

- Supabase Auth is the source of truth for identity, and `auth.uid()` maps to `public.users.id` or table `user_id`.
- Tables are in `public` because the app uses Supabase Data API via `.from("table")`.
- Service-role-only writes are handled by trusted server code or future webhooks.
- SQL chunks are intended for manual Supabase SQL Editor review and application, not as destructive migration resets.
- Existing policy names may differ. The chunks create only missing policy names and do not drop existing policies.

## Generated SQL Chunks

Generated under `supabase/sql-editor-updates/`:

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
