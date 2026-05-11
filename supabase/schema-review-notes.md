# Karpilo LoadIQ Schema Review Notes

Generated file: `supabase/schema-loadiq-current.sql`

This schema was generated from the current app code rather than from a greenfield model. It preserves the active table names the app already uses while adding normalized future-ready tables where the current product direction requires them.

## Code Paths Reviewed

Primary Supabase table references were found in:

- `src/services/operational-profile.ts`
- `src/services/overhead-items.ts`
- `src/services/save-load.ts`
- `src/services/saved-load-actions.ts`
- `src/services/saved-load-input.ts`
- `src/services/lane-templates.ts`
- `src/services/fuel/fuel-service.ts`
- `src/services/disclaimer-acceptance.ts`
- `src/services/onboarding.ts`
- `src/services/support-tickets.ts`
- `src/services/entity-notes.ts`
- `src/domains/billing/client-entitlements.ts`
- `src/domains/billing/server-entitlements.ts`
- `src/domains/billing/usage-service.ts`
- `src/components/dashboard/review-prompt.tsx`
- `src/app/(dashboard)/dashboard/*.tsx`
- `src/types/load.ts`
- `src/types/saved-load.ts`
- `src/types/accessorial.ts`

## Tables Included

Current app compatibility tables:

- `users`
- `user_settings`
- `truck_profiles`
- `pay_structure_templates`
- `user_overhead_items`
- `saved_loads`
- `load_estimates`
- `post_trip_actuals`
- `accessorial_items`
- `lane_templates`
- `trip_history`
- `fuel_price_cache`
- `disclaimer_acceptances`
- `subscriptions`
- `usage_limits`
- `usage_events`
- `founder_pricing_access`
- `promo_codes`
- `pilot_access`
- `review_prompt_tracking`
- `support_tickets`
- `onboarding_states`
- `entity_notes`
- `analytics_events`

Future-ready / normalized additions requested by the current product model:

- `operator_profiles`
- `overhead_categories`
- `calculation_overrides`
- `demo_calculations`
- `legal_documents`
- `user_legal_acknowledgments`
- `feedback`

## Fields Inferred From App Code

Profile and settings fields were inferred from `OperationalProfile`, `getOperationalProfile`, `saveOperationalProfile`, and calculator defaults:

- operation type
- profile/company name
- income target amount and period
- target true RPM
- target profit margin
- minimum hourly profitability
- operating days per week/month
- default MPG
- maintenance/tire/trailer/insurance allocations
- variable CPM and fixed allocation
- dispatch/factoring percentages
- default pay template

Saved-load fields were inferred from `LoadInput`, `LoadResult`, and `saveLoad`:

- route and ZIP fields
- loaded/deadhead/total miles
- dispatch days and deadhead days
- rate per mile and gross revenue
- fuel source, estimated fuel price, actual fuel price, EIA period, fetched timestamp
- daily overhead and overhead applied
- dispatch/factoring fees
- net profit, true RPM, break-even RPM, target RPM
- profit per mile/day/hour
- `load_run_status` / `was_run_status`
- `used_profile_values`
- `used_temporary_overrides`
- `input_snapshot`
- `result_snapshot`
- `calculation_version`

Fuel cache fields were inferred from `src/services/fuel/fuel-service.ts`:

- `cache_key`
- `source` / `provider`
- `fuel_type`
- `region`
- `diesel_price`
- `price_per_gallon`
- `source_label`
- `source_period`
- `fetched_at`
- `expires_at`

Legal/billing fields were inferred from the legal pages, disclaimer acceptance service, and billing config:

- legal document type/version
- user acknowledgment records
- Apple/Google/Stripe provider readiness
- provider customer/subscription IDs
- billing interval
- trial dates
- cancel-at-period-end
- pilot pricing lock

## Nullable Fields And Why

Many billing provider fields are nullable because the app is not yet wired to Stripe, Apple, or Google checkout:

- `provider_customer_id`
- `provider_subscription_id`
- `trial_start`
- `trial_end`
- `current_period_start`
- `current_period_end`
- `canceled_at`

Fuel fields such as `actual_fuel_price` are nullable because actual fuel cost is only known after a load is run.

Route city/state fields are nullable because the calculator can operate with ZIPs and mileage.

`operator_profiles.profile_id` references are nullable in compatibility tables because the current app still uses `users`, `user_settings`, and `truck_profiles` as the active profile model.

`ip_hash` and `user_agent` are nullable in legal acknowledgment records because the current app does not yet capture them.

## Safe To Run Sections

The file is designed to be safe for manual Supabase SQL Editor execution:

- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `CREATE OR REPLACE FUNCTION`
- `DROP TRIGGER IF EXISTS` followed by `CREATE TRIGGER`
- RLS enablement
- policy creation guarded by `pg_policies` checks
- seed inserts using `ON CONFLICT`

No destructive table resets are included.

## Manual Review Before Running

Review these areas before pasting into production:

- Existing RLS policies with the same names but different logic will be left untouched.
- `grant` statements intentionally expose tables to the Supabase Data API where the app uses `supabase-js`. This is needed for newer Supabase projects where public tables may not be exposed automatically.
- `subscriptions`, `promo_codes`, `founder_pricing_access`, and `pilot_access` should be mutated by backend/admin/webhook flows, not arbitrary client UI.
- `fuel_price_cache` should be written only by service-role/server-side fuel logic. Authenticated users get read-only access.
- `demo_calculations` allows anonymous inserts but no public select.

## Assumptions Made

- The active app profile table remains `public.users` for compatibility.
- `operator_profiles` is included as a normalized future-ready profile model, but the current app does not yet read/write it.
- `overhead_categories` is included for future normalized overhead breakdowns; current code uses `user_overhead_items`.
- `calculation_overrides` is included even though current saved-load logic stores overrides in JSONB on `saved_loads`.
- `legal_documents` and `user_legal_acknowledgments` are included for Terms, Privacy, Refund Policy, Subscription Terms, disclaimer, and data-source disclosures. Current first-launch disclaimer still writes `users` and `disclaimer_acceptances`.
- `feedback` is included for review prompt evolution; current prompt tracking writes `review_prompt_tracking`.

## Supabase Platform Note

Supabase announced that newer projects may not expose new `public` tables to the Data API automatically. This schema includes explicit `GRANT` statements plus RLS. Grants make tables reachable; RLS still controls which rows users can access.

## No Secrets Included

The schema does not include API keys, Supabase keys, Stripe keys, EIA keys, or service-role secrets.
