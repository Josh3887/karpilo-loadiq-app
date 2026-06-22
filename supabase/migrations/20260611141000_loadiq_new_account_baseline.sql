-- Karpilo LoadIQ new-account baseline.
-- Generated 2026-06-11 from reviewed app + website schema sources.
-- Target project: esgfkccsiardiwkscprq (Karpilo LoadIQ).
--
-- Intent:
-- - Replace the drifted old migration replay path with one clean baseline for the new Supabase account.
-- - Preserve previous migration files under supabase/archive/migrations-pre-new-account-20260611/.
-- - Keep APP and WEBSITE ownership boundaries explicit.
-- - Use explicit grants and RLS because new Supabase projects may not expose SQL-created tables automatically.
--
-- Do not blindly reintroduce the archived migration stack with db push.


-- ============================================================
-- SOURCE: core_app_consolidated_schema
-- FILE: supabase/schema-loadiq-current.sql
-- ============================================================

-- Karpilo LoadIQ current consolidated Supabase schema.
-- Generated from the current Next.js/TypeScript app model.
-- Manual Supabase SQL Editor compatible.
--
-- Safety posture:
-- - No DROP TABLE statements.
-- - Uses CREATE TABLE IF NOT EXISTS and ALTER TABLE ADD COLUMN IF NOT EXISTS.
-- - Enables RLS on user-owned tables.
-- - Includes explicit GRANT statements because newer Supabase projects may not
--   expose new public tables to the Data API automatically.

-- ==================================================
-- 1. Extensions
-- ==================================================

create extension if not exists "pgcrypto";

-- ==================================================
-- 2. Utility Functions
-- ==================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ==================================================
-- 3. Enums / Check Strategy
-- ==================================================

-- This schema intentionally uses text + check constraints instead of CREATE TYPE
-- enums so future plan/status additions can be made with safer ALTER TABLE flows.

-- ==================================================
-- 4. Core Profile Tables
-- ==================================================

-- App compatibility profile table. Current code reads/writes public.users.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  profile_name text,
  company_name text,
  operation_type text default 'otr'
    check (operation_type in ('local', 'regional', 'dedicated', 'otr')),
  disclaimer_accepted_at timestamptz,
  disclaimer_version text,
  disclaimer_last_updated text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists profile_name text,
  add column if not exists company_name text,
  add column if not exists operation_type text default 'otr',
  add column if not exists disclaimer_accepted_at timestamptz,
  add column if not exists disclaimer_version text,
  add column if not exists disclaimer_last_updated text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- Normalized future-ready operator profile. The current app can continue using
-- users/user_settings/truck_profiles while this table supports clearer growth.
create table if not exists public.operator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  account_type text not null default 'leased_owner_operator'
    check (account_type in (
      'leased_owner_operator',
      'independent_owner_operator',
      'company_driver',
      'fleet'
    )),
  operation_type text not null default 'otr'
    check (operation_type in ('local', 'regional', 'dedicated', 'otr')),
  leased_owner_operator boolean not null default false,
  independent_owner_operator boolean not null default false,
  company_name text,
  display_name text,
  default_mpg numeric(8,2) default 6.50 check (default_mpg is null or default_mpg > 0),
  default_fuel_price numeric(10,3) default 4.00 check (default_fuel_price is null or default_fuel_price >= 0),
  target_income numeric(12,2) default 60000 check (target_income is null or target_income >= 0),
  target_income_period text default 'yearly'
    check (target_income_period in ('yearly', 'monthly', 'weekly')),
  target_true_rpm numeric(10,3) default 2.00 check (target_true_rpm is null or target_true_rpm >= 0),
  target_profit_margin numeric(8,2) default 20 check (target_profit_margin is null or target_profit_margin >= 0),
  minimum_hourly_profitability numeric(10,2) default 50 check (minimum_hourly_profitability is null or minimum_hourly_profitability >= 0),
  operating_days_per_week numeric(8,2) default 5.5 check (operating_days_per_week is null or operating_days_per_week > 0),
  operating_days_per_month numeric(8,2) default 23.8 check (operating_days_per_month is null or operating_days_per_month > 0),
  fixed_overhead_monthly numeric(12,2) default 0 check (fixed_overhead_monthly >= 0),
  fixed_overhead_weekly numeric(12,2) default 0 check (fixed_overhead_weekly >= 0),
  fixed_overhead_daily numeric(12,2) default 0 check (fixed_overhead_daily >= 0),
  dispatch_percentage numeric(8,3) default 0 check (dispatch_percentage between 0 and 100),
  factoring_percentage numeric(8,3) default 0 check (factoring_percentage between 0 and 100),
  lease_percentage numeric(8,3) default 0 check (lease_percentage between 0 and 100),
  maintenance_reserve_rate numeric(10,3) default 0 check (maintenance_reserve_rate >= 0),
  settings_completed boolean not null default false,
  onboarding_completed boolean not null default false,
  profile_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  target_true_rpm numeric(10,3) default 2.00 check (target_true_rpm is null or target_true_rpm >= 0),
  default_mpg numeric(8,2) default 6.50 check (default_mpg is null or default_mpg > 0),
  default_fuel_price numeric(10,3) default 4.00 check (default_fuel_price is null or default_fuel_price >= 0),
  default_dispatch_percent numeric(8,3) default 0 check (default_dispatch_percent between 0 and 100),
  default_factoring_percent numeric(8,3) default 0 check (default_factoring_percent between 0 and 100),
  default_lease_percent numeric(8,3) default 0 check (default_lease_percent between 0 and 100),
  default_overhead numeric(12,2) default 0 check (default_overhead >= 0),
  default_reserve_allocation numeric(12,2) default 0 check (default_reserve_allocation >= 0),
  default_maintenance_reserve numeric(12,2) default 0 check (default_maintenance_reserve >= 0),
  default_tire_reserve numeric(12,2) default 0 check (default_tire_reserve >= 0),
  default_trailer_fee numeric(12,2) default 0 check (default_trailer_fee >= 0),
  default_insurance_allocation numeric(12,2) default 0 check (default_insurance_allocation >= 0),
  default_variable_cost_per_mile numeric(10,3) default 0 check (default_variable_cost_per_mile >= 0),
  default_fixed_cost_allocation numeric(12,2) default 0 check (default_fixed_cost_allocation >= 0),
  target_profit_margin numeric(8,2) default 20 check (target_profit_margin >= 0),
  minimum_hourly_profitability numeric(10,2) default 50 check (minimum_hourly_profitability >= 0),
  operating_days_per_week numeric(8,2) default 5.5 check (operating_days_per_week > 0),
  operating_days_per_month numeric(8,2) default 23.8 check (operating_days_per_month > 0),
  income_target_amount numeric(12,2) default 60000 check (income_target_amount >= 0),
  income_target_period text default 'yearly'
    check (income_target_period in ('yearly', 'monthly', 'weekly')),
  toll_handling_mode text default 'trip_specific'
    check (toll_handling_mode in ('trip_specific', 'overhead')),
  lumper_handling_mode text default 'trip_specific'
    check (lumper_handling_mode in ('trip_specific', 'overhead')),
  default_pay_template_id uuid,
  default_deadhead_miles numeric(10,2) default 0 check (default_deadhead_miles >= 0),
  default_tolls numeric(12,2) default 0 check (default_tolls >= 0),
  default_accessorial_allowance numeric(12,2) default 0 check (default_accessorial_allowance >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings
  add column if not exists default_lease_percent numeric(8,3) default 0,
  add column if not exists minimum_hourly_profitability numeric(10,2) default 50,
  add column if not exists operating_days_per_week numeric(8,2) default 5.5,
  add column if not exists operating_days_per_month numeric(8,2) default 23.8,
  add column if not exists default_deadhead_miles numeric(10,2) default 0,
  add column if not exists default_tolls numeric(12,2) default 0,
  add column if not exists default_accessorial_allowance numeric(12,2) default 0;

create table if not exists public.truck_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  make text,
  model text,
  year integer check (year is null or year between 1900 and 2200),
  engine text,
  odometer numeric(12,1) check (odometer is null or odometer >= 0),
  default_mpg numeric(8,2) default 6.50 check (default_mpg is null or default_mpg > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pay_structure_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  structure jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- App compatibility overhead table. Current code reads/writes this table.
create table if not exists public.user_overhead_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  category text not null default 'fixed_operations',
  amount numeric(12,2) not null default 0 check (amount >= 0),
  amount_type text not null default 'flat'
    check (amount_type in ('flat', 'cpm', 'percent')),
  frequency text not null default 'monthly'
    check (frequency in (
      'daily',
      'by_day',
      'by_mile',
      'weekly',
      'biweekly',
      'monthly',
      'quarterly',
      'annual',
      'annually',
      'per_trip',
      'none'
    )),
  responsibility text not null default 'driver'
    check (responsibility in ('driver', 'carrier', 'split', 'reimbursed')),
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Normalized future-ready overhead categories.
create table if not exists public.overhead_categories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.operator_profiles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  category_name text not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  frequency text not null default 'monthly'
    check (frequency in (
      'daily',
      'weekly',
      'biweekly',
      'monthly',
      'quarterly',
      'annually',
      'per_mile',
      'percentage',
      'flat'
    )),
  monthly_equivalent numeric(12,2) default 0 check (monthly_equivalent >= 0),
  daily_equivalent numeric(12,2) default 0 check (daily_equivalent >= 0),
  included_in_overhead boolean not null default true,
  notes text,
  source_overhead_item_id uuid references public.user_overhead_items(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==================================================
-- 5. Calculator Tables
-- ==================================================

create table if not exists public.saved_loads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'saved'
    check (status in ('calculated', 'saved', 'accepted', 'completed', 'archived', 'estimated')),
  loadiq_load_number text,
  driver_load_number text,
  load_name text,
  load_outcome text not null default 'unknown',
  load_status_reason text,
  load_run_status text default 'planned' check (
    load_run_status in (
      'planned',
      'booked',
      'dispatched',
      'running',
      'rejected',
      'pulled',
      'ran',
      'test'
    )
  ),
  was_run_status text check (
    was_run_status is null
    or was_run_status in (
      'planned',
      'booked',
      'dispatched',
      'running',
      'rejected',
      'pulled',
      'ran',
      'test'
    )
  ),
  pickup_zip text not null,
  pickup_city text,
  pickup_state text,
  delivery_zip text not null,
  delivery_city text,
  delivery_state text,
  loaded_miles numeric(12,2) not null check (loaded_miles >= 0),
  deadhead_miles numeric(12,2) not null default 0 check (deadhead_miles >= 0),
  total_miles numeric(12,2) not null default 0 check (total_miles >= 0),
  route_loaded_miles numeric(12,2) default 0 check (route_loaded_miles >= 0),
  actual_loaded_miles numeric(12,2) default 0 check (actual_loaded_miles >= 0),
  route_deadhead_miles numeric(12,2) default 0 check (route_deadhead_miles >= 0),
  actual_deadhead_miles numeric(12,2) default 0 check (actual_deadhead_miles >= 0),
  rate_per_mile numeric(12,3) not null default 0 check (rate_per_mile >= 0),
  load_pay numeric(12,2) default 0 check (load_pay >= 0),
  fuel_surcharge numeric(12,2) default 0 check (fuel_surcharge >= 0),
  accessorials numeric(12,2) default 0 check (accessorials >= 0),
  tolls numeric(12,2) default 0 check (tolls >= 0),
  lumper_fees numeric(12,2) default 0 check (lumper_fees >= 0),
  detention numeric(12,2) default 0 check (detention >= 0),
  layover numeric(12,2) default 0 check (layover >= 0),
  post_trip_costs numeric(12,2) default 0 check (post_trip_costs >= 0),
  mpg numeric(8,2) default 6.50 check (mpg is null or mpg > 0),
  fuel_price numeric(10,3) default 0 check (fuel_price >= 0),
  estimated_fuel_cost numeric(12,2) default 0 check (estimated_fuel_cost >= 0),
  fuel_cost numeric(12,2) not null default 0 check (fuel_cost >= 0),
  fuel_estimate_source text,
  estimated_fuel_price numeric(10,3),
  actual_fuel_price numeric(10,3),
  fuel_override boolean not null default false,
  eia_period text,
  fuel_fetched_at timestamptz,
  dispatch_days numeric(8,2) default 1 check (dispatch_days >= 1),
  deadhead_days numeric(8,2) default 0 check (deadhead_days >= 0),
  daily_overhead numeric(12,2) default 0 check (daily_overhead >= 0),
  overhead_applied numeric(12,2) default 0 check (overhead_applied >= 0),
  dispatch_fee numeric(12,2) default 0 check (dispatch_fee >= 0),
  factoring_fee numeric(12,2) default 0 check (factoring_fee >= 0),
  lease_deduction numeric(12,2) default 0 check (lease_deduction >= 0),
  maintenance_reserve numeric(12,2) default 0 check (maintenance_reserve >= 0),
  gross_revenue numeric(12,2) not null default 0 check (gross_revenue >= 0),
  payable_revenue numeric(12,2) default 0 check (payable_revenue >= 0),
  net_revenue numeric(12,2) default 0,
  total_expenses numeric(12,2) default 0 check (total_expenses >= 0),
  operational_cost numeric(12,2) not null default 0 check (operational_cost >= 0),
  total_trip_cost numeric(12,2) default 0 check (total_trip_cost >= 0),
  net_profit numeric(12,2) default 0,
  estimated_net numeric(12,2) not null default 0,
  actual_net numeric(12,2),
  profit_per_mile numeric(12,3) default 0,
  profit_per_loaded_mile numeric(12,3) default 0,
  profit_per_total_mile numeric(12,3) default 0,
  profit_per_day numeric(12,2) default 0,
  profit_per_hour numeric(12,2) default 0,
  true_rpm numeric(12,3) not null default 0,
  break_even_rpm numeric(12,3) default 0,
  target_rpm numeric(12,3) default 0,
  income_target_comparison numeric(12,2) default 0,
  profitability_score integer not null default 0 check (profitability_score between 0 and 100),
  profitability_rating text,
  profitability_band text not null default 'moderate',
  warnings jsonb not null default '[]'::jsonb,
  used_profile_values jsonb not null default '{}'::jsonb,
  used_temporary_overrides jsonb not null default '{}'::jsonb,
  profile_snapshot jsonb not null default '{}'::jsonb,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  actuals_snapshot jsonb not null default '{}'::jsonb,
  pay_structure_snapshot jsonb not null default '{}'::jsonb,
  accessorial_items_snapshot jsonb not null default '[]'::jsonb,
  calculation_version text not null default 'loadiq-v1.1-profile-overhead',
  calculated_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.saved_loads
  add column if not exists loadiq_load_number text,
  add column if not exists driver_load_number text,
  add column if not exists load_name text,
  add column if not exists load_outcome text not null default 'unknown',
  add column if not exists load_status_reason text,
  add column if not exists load_run_status text default 'planned',
  add column if not exists was_run_status text,
  add column if not exists pickup_city text,
  add column if not exists pickup_state text,
  add column if not exists delivery_city text,
  add column if not exists delivery_state text,
  add column if not exists route_loaded_miles numeric(12,2) default 0,
  add column if not exists actual_loaded_miles numeric(12,2) default 0,
  add column if not exists route_deadhead_miles numeric(12,2) default 0,
  add column if not exists actual_deadhead_miles numeric(12,2) default 0,
  add column if not exists load_pay numeric(12,2) default 0,
  add column if not exists fuel_surcharge numeric(12,2) default 0,
  add column if not exists accessorials numeric(12,2) default 0,
  add column if not exists tolls numeric(12,2) default 0,
  add column if not exists lumper_fees numeric(12,2) default 0,
  add column if not exists detention numeric(12,2) default 0,
  add column if not exists layover numeric(12,2) default 0,
  add column if not exists post_trip_costs numeric(12,2) default 0,
  add column if not exists mpg numeric(8,2) default 6.50,
  add column if not exists fuel_price numeric(10,3) default 0,
  add column if not exists estimated_fuel_cost numeric(12,2) default 0,
  add column if not exists fuel_estimate_source text,
  add column if not exists estimated_fuel_price numeric(10,3),
  add column if not exists actual_fuel_price numeric(10,3),
  add column if not exists fuel_override boolean not null default false,
  add column if not exists eia_period text,
  add column if not exists fuel_fetched_at timestamptz,
  add column if not exists dispatch_days numeric(8,2) default 1,
  add column if not exists deadhead_days numeric(8,2) default 0,
  add column if not exists daily_overhead numeric(12,2) default 0,
  add column if not exists overhead_applied numeric(12,2) default 0,
  add column if not exists dispatch_fee numeric(12,2) default 0,
  add column if not exists factoring_fee numeric(12,2) default 0,
  add column if not exists lease_deduction numeric(12,2) default 0,
  add column if not exists maintenance_reserve numeric(12,2) default 0,
  add column if not exists payable_revenue numeric(12,2) default 0,
  add column if not exists net_revenue numeric(12,2) default 0,
  add column if not exists total_expenses numeric(12,2) default 0,
  add column if not exists total_trip_cost numeric(12,2) default 0,
  add column if not exists net_profit numeric(12,2) default 0,
  add column if not exists actual_net numeric(12,2),
  add column if not exists profit_per_mile numeric(12,3) default 0,
  add column if not exists profit_per_loaded_mile numeric(12,3) default 0,
  add column if not exists profit_per_total_mile numeric(12,3) default 0,
  add column if not exists profit_per_day numeric(12,2) default 0,
  add column if not exists profit_per_hour numeric(12,2) default 0,
  add column if not exists break_even_rpm numeric(12,3) default 0,
  add column if not exists target_rpm numeric(12,3) default 0,
  add column if not exists income_target_comparison numeric(12,2) default 0,
  add column if not exists profitability_rating text,
  add column if not exists used_profile_values jsonb not null default '{}'::jsonb,
  add column if not exists used_temporary_overrides jsonb not null default '{}'::jsonb,
  add column if not exists profile_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists calculation_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists input_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists result_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists actuals_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists pay_structure_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists accessorial_items_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists calculation_version text not null default 'loadiq-v1.1-profile-overhead',
  add column if not exists calculated_at timestamptz default now();

create table if not exists public.calculation_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid references public.saved_loads(id) on delete cascade,
  field_name text not null,
  original_profile_value numeric,
  override_value numeric,
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.load_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid references public.saved_loads(id) on delete cascade,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  calculation_version text not null default 'loadiq-v1.1-profile-overhead',
  created_at timestamptz default now()
);

create table if not exists public.post_trip_actuals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid not null references public.saved_loads(id) on delete cascade,
  actuals_snapshot jsonb not null default '{}'::jsonb,
  actual_net numeric(12,2),
  actual_fuel_price numeric(10,3),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.accessorial_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid references public.saved_loads(id) on delete cascade,
  category text not null default 'misc',
  direction text not null default 'expense' check (direction in ('revenue', 'expense')),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  is_reimbursed boolean not null default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.lane_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  pickup_zip text not null,
  delivery_zip text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.trip_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid references public.saved_loads(id) on delete set null,
  status text not null default 'analyzed',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==================================================
-- 6. Fuel Data Cache
-- ==================================================

create table if not exists public.fuel_price_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique,
  provider text not null default 'eia',
  source text not null default 'eia',
  fuel_type text not null default 'ULSD Diesel',
  region text not null default 'U.S. National Average',
  series_id text default 'EPD2DXL0',
  diesel_price numeric(10,3),
  price numeric(10,3),
  price_per_gallon numeric(10,3),
  unit text default 'dollars per gallon',
  source_label text default 'U.S. Energy Information Administration',
  source_period text,
  period text,
  effective_date date,
  is_estimate boolean not null default true,
  fetched_at timestamptz default now(),
  expires_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.fuel_price_cache
  add column if not exists cache_key text,
  add column if not exists provider text not null default 'eia',
  add column if not exists source text not null default 'eia',
  add column if not exists fuel_type text not null default 'ULSD Diesel',
  add column if not exists region text not null default 'U.S. National Average',
  add column if not exists series_id text default 'EPD2DXL0',
  add column if not exists diesel_price numeric(10,3),
  add column if not exists price numeric(10,3),
  add column if not exists price_per_gallon numeric(10,3),
  add column if not exists unit text default 'dollars per gallon',
  add column if not exists source_label text default 'U.S. Energy Information Administration',
  add column if not exists source_period text,
  add column if not exists period text,
  add column if not exists effective_date date,
  add column if not exists is_estimate boolean not null default true,
  add column if not exists fetched_at timestamptz default now(),
  add column if not exists expires_at timestamptz,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

-- ==================================================
-- 7. Demo Tables
-- ==================================================

create table if not exists public.demo_calculations (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id text,
  scenario_name text,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  conversion_event text,
  created_at timestamptz default now()
);

-- ==================================================
-- 8. Legal Tables
-- ==================================================

create table if not exists public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in (
    'terms_of_service',
    'privacy_policy',
    'refund_policy',
    'subscription_terms',
    'disclaimer',
    'data_sources'
  )),
  title text not null,
  version text not null,
  last_updated date,
  content_hash text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (document_type, version)
);

create table if not exists public.user_legal_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_id uuid references public.legal_documents(id) on delete set null,
  document_type text not null,
  document_version text not null,
  acknowledged_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- App compatibility legal audit table.
create table if not exists public.disclaimer_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  disclaimer_version text not null,
  disclaimer_last_updated text,
  accepted_at timestamptz not null default now(),
  created_at timestamptz default now()
);

-- ==================================================
-- 9. Billing Tables
-- ==================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe', 'apple', 'google', 'manual')),
  provider_customer_id text,
  provider_subscription_id text,
  plan_code text not null default 'free',
  tier text not null default 'free',
  status text not null default 'inactive',
  billing_interval text check (billing_interval is null or billing_interval in ('month', 'year', 'trial', 'lifetime')),
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  pilot_pricing_locked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions
  add column if not exists provider text not null default 'stripe',
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists plan_code text not null default 'free',
  add column if not exists billing_interval text,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists pilot_pricing_locked boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  tier text not null unique,
  monthly_calculations integer,
  saved_loads integer,
  exports_allowed boolean not null default false,
  advanced_analytics_allowed boolean not null default false,
  comparisons_allowed boolean not null default false,
  templates_allowed boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.founder_pricing_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  code text unique,
  promotion_name text not null default 'Founding Operator Access',
  promo_code_id uuid,
  is_active boolean not null default true,
  discount_percent numeric(8,2) default 0,
  monthly_price numeric(10,2) default 19.99,
  annual_price numeric(10,2) default 149.99,
  seat_number integer,
  assigned_by text,
  created_at timestamptz default now(),
  redeemed_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  promotion_name text not null default 'Founding Operator Access',
  tier text not null default 'founder',
  monthly_price numeric(10,2) default 19.99,
  annual_price numeric(10,2) default 149.99,
  max_redemptions integer default 500,
  redeemed_count integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.founder_pricing_access
  add column if not exists promotion_name text not null default 'Founding Operator Access',
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null,
  add column if not exists monthly_price numeric(10,2) default 19.99,
  add column if not exists annual_price numeric(10,2) default 149.99,
  add column if not exists seat_number integer,
  add column if not exists assigned_by text,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.pilot_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  invite_code text unique,
  is_active boolean not null default true,
  monthly_price numeric(10,2) not null default 14.99,
  max_days integer not null default 30,
  seat_number integer,
  starts_at timestamptz,
  ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==================================================
-- 10. Feedback / Support / Onboarding Tables
-- ==================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  rating integer check (rating is null or rating between 1 and 5),
  feedback text,
  triggered_after_load_count integer default 0,
  source text default 'app',
  created_at timestamptz default now()
);

create table if not exists public.review_prompt_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  last_prompted_at timestamptz,
  prompt_count integer not null default 0,
  last_response text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null default 'support'
    check (category in (
      'support',
      'bug',
      'refund',
      'billing',
      'feature',
      'privacy',
      'account_deletion'
    )),
  subject text not null,
  message text not null,
  related_load_id uuid references public.saved_loads(id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'in_review', 'resolved', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_email text,
  requested_scope text not null default 'account_and_data'
    check (requested_scope in ('account_and_data', 'data_only')),
  reason text,
  status text not null default 'open'
    check (status in ('open', 'in_review', 'completed', 'rejected', 'canceled')),
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.onboarding_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  current_step text not null default 'profile',
  completed_steps jsonb not null default '[]'::jsonb,
  is_complete boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.entity_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid references public.saved_loads(id) on delete set null,
  entity_type text not null default 'facility'
    check (entity_type in ('shipper', 'consignee', 'facility')),
  company_name text not null,
  address text,
  rating integer check (rating is null or rating between 1 and 5),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- ==================================================
-- 11. Indexes
-- ==================================================

create index if not exists idx_operator_profiles_user
on public.operator_profiles (user_id);

create index if not exists idx_user_settings_user
on public.user_settings (user_id);

create index if not exists idx_truck_profiles_user
on public.truck_profiles (user_id);

create index if not exists idx_pay_templates_user_created
on public.pay_structure_templates (user_id, created_at desc);

create index if not exists idx_user_overhead_items_user_active
on public.user_overhead_items (user_id, is_active);

create index if not exists idx_overhead_categories_user
on public.overhead_categories (user_id, created_at desc);

create index if not exists idx_saved_loads_user_created
on public.saved_loads (user_id, created_at desc);

create index if not exists idx_saved_loads_user_loadiq_number
on public.saved_loads (user_id, loadiq_load_number);

create index if not exists idx_saved_loads_user_run_status
on public.saved_loads (user_id, load_run_status, created_at desc);

create index if not exists idx_saved_loads_user_calculated
on public.saved_loads (user_id, calculated_at desc);

create index if not exists idx_calculation_overrides_load
on public.calculation_overrides (saved_load_id, created_at desc);

create index if not exists idx_load_estimates_user_created
on public.load_estimates (user_id, created_at desc);

create index if not exists idx_post_trip_actuals_load
on public.post_trip_actuals (saved_load_id, created_at desc);

create index if not exists idx_accessorial_items_load
on public.accessorial_items (saved_load_id, created_at desc);

create index if not exists idx_lane_templates_user_created
on public.lane_templates (user_id, created_at desc);

create index if not exists idx_fuel_price_cache_cache_key
on public.fuel_price_cache (cache_key);

create index if not exists idx_fuel_price_cache_provider_updated
on public.fuel_price_cache (provider, updated_at desc);

create index if not exists idx_demo_calculations_session_created
on public.demo_calculations (anonymous_session_id, created_at desc);

create index if not exists idx_legal_documents_type_active
on public.legal_documents (document_type, is_active);

create index if not exists idx_user_legal_ack_user_created
on public.user_legal_acknowledgments (user_id, created_at desc);

create index if not exists idx_disclaimer_acceptances_user_created
on public.disclaimer_acceptances (user_id, created_at desc);

create index if not exists idx_subscriptions_user_status
on public.subscriptions (user_id, status, created_at desc);

create index if not exists idx_subscriptions_provider_subscription
on public.subscriptions (provider, provider_subscription_id);

create index if not exists idx_usage_events_user_event_created
on public.usage_events (user_id, event_name, created_at desc);

create index if not exists idx_promo_codes_code_active
on public.promo_codes (code, is_active);

create index if not exists idx_founder_pricing_access_active
on public.founder_pricing_access (is_active, redeemed_at);

create index if not exists idx_pilot_access_active
on public.pilot_access (is_active, seat_number);

create index if not exists idx_feedback_user_created
on public.feedback (user_id, created_at desc);

create index if not exists idx_review_prompt_tracking_user
on public.review_prompt_tracking (user_id);

create index if not exists idx_support_tickets_user_created
on public.support_tickets (user_id, created_at desc);

create index if not exists idx_account_deletion_requests_user_status
on public.account_deletion_requests (user_id, status, requested_at desc);

create index if not exists idx_onboarding_states_user_complete
on public.onboarding_states (user_id, is_complete);

create index if not exists idx_entity_notes_user_entity
on public.entity_notes (user_id, entity_type, created_at desc);

-- ==================================================
-- 12. Triggers
-- ==================================================

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_operator_profiles_updated_at on public.operator_profiles;
create trigger set_operator_profiles_updated_at
before update on public.operator_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_truck_profiles_updated_at on public.truck_profiles;
create trigger set_truck_profiles_updated_at
before update on public.truck_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_saved_loads_updated_at on public.saved_loads;
create trigger set_saved_loads_updated_at
before update on public.saved_loads
for each row execute function public.set_updated_at();

drop trigger if exists set_fuel_price_cache_updated_at on public.fuel_price_cache;
create trigger set_fuel_price_cache_updated_at
before update on public.fuel_price_cache
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- ==================================================
-- 13. RLS Enablement
-- ==================================================

alter table public.users enable row level security;
alter table public.operator_profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.truck_profiles enable row level security;
alter table public.pay_structure_templates enable row level security;
alter table public.user_overhead_items enable row level security;
alter table public.overhead_categories enable row level security;
alter table public.saved_loads enable row level security;
alter table public.calculation_overrides enable row level security;
alter table public.load_estimates enable row level security;
alter table public.post_trip_actuals enable row level security;
alter table public.accessorial_items enable row level security;
alter table public.lane_templates enable row level security;
alter table public.trip_history enable row level security;
alter table public.fuel_price_cache enable row level security;
alter table public.demo_calculations enable row level security;
alter table public.legal_documents enable row level security;
alter table public.user_legal_acknowledgments enable row level security;
alter table public.disclaimer_acceptances enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_limits enable row level security;
alter table public.usage_events enable row level security;
alter table public.founder_pricing_access enable row level security;
alter table public.promo_codes enable row level security;
alter table public.pilot_access enable row level security;
alter table public.feedback enable row level security;
alter table public.review_prompt_tracking enable row level security;
alter table public.support_tickets enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.onboarding_states enable row level security;
alter table public.entity_notes enable row level security;
alter table public.analytics_events enable row level security;

-- Explicit Data API grants. RLS still controls rows.
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on
  public.users,
  public.operator_profiles,
  public.user_settings,
  public.truck_profiles,
  public.pay_structure_templates,
  public.user_overhead_items,
  public.overhead_categories,
  public.saved_loads,
  public.calculation_overrides,
  public.load_estimates,
  public.post_trip_actuals,
  public.accessorial_items,
  public.lane_templates,
  public.trip_history,
  public.user_legal_acknowledgments,
  public.disclaimer_acceptances,
  public.subscriptions,
  public.usage_events,
  public.feedback,
  public.review_prompt_tracking,
  public.support_tickets,
  public.account_deletion_requests,
  public.onboarding_states,
  public.entity_notes,
  public.analytics_events
to authenticated;

grant select on
  public.fuel_price_cache,
  public.legal_documents,
  public.usage_limits,
  public.promo_codes
to authenticated;

grant insert on public.demo_calculations to anon, authenticated;
grant select on public.legal_documents to anon;

grant select, insert, update, delete on all tables in schema public to service_role;

-- ==================================================
-- 14. RLS Policies
-- ==================================================

do $$
begin
  -- User-owned tables.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can manage own profile') then
    create policy "Users can manage own profile" on public.users for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operator_profiles' and policyname = 'Users can manage own operator profile') then
    create policy "Users can manage own operator profile" on public.operator_profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users can manage own settings') then
    create policy "Users can manage own settings" on public.user_settings for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'truck_profiles' and policyname = 'Users can manage own truck profile') then
    create policy "Users can manage own truck profile" on public.truck_profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pay_structure_templates' and policyname = 'Users can manage own pay templates') then
    create policy "Users can manage own pay templates" on public.pay_structure_templates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_overhead_items' and policyname = 'Users can manage own overhead items') then
    create policy "Users can manage own overhead items" on public.user_overhead_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'overhead_categories' and policyname = 'Users can manage own overhead categories') then
    create policy "Users can manage own overhead categories" on public.overhead_categories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_loads' and policyname = 'Users can manage own saved loads') then
    create policy "Users can manage own saved loads" on public.saved_loads for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calculation_overrides' and policyname = 'Users can manage own calculation overrides') then
    create policy "Users can manage own calculation overrides" on public.calculation_overrides for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'load_estimates' and policyname = 'Users can manage own load estimates') then
    create policy "Users can manage own load estimates" on public.load_estimates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_trip_actuals' and policyname = 'Users can manage own post trip actuals') then
    create policy "Users can manage own post trip actuals" on public.post_trip_actuals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'accessorial_items' and policyname = 'Users can manage own accessorial items') then
    create policy "Users can manage own accessorial items" on public.accessorial_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lane_templates' and policyname = 'Users can manage own lane templates') then
    create policy "Users can manage own lane templates" on public.lane_templates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_history' and policyname = 'Users can manage own trip history') then
    create policy "Users can manage own trip history" on public.trip_history for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_legal_acknowledgments' and policyname = 'Users can manage own legal acknowledgments') then
    create policy "Users can manage own legal acknowledgments" on public.user_legal_acknowledgments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'disclaimer_acceptances' and policyname = 'Users can manage own disclaimer acceptances') then
    create policy "Users can manage own disclaimer acceptances" on public.disclaimer_acceptances for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'subscriptions' and policyname = 'Users can view own subscriptions') then
    create policy "Users can view own subscriptions" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usage_events' and policyname = 'Users can manage own usage events') then
    create policy "Users can manage own usage events" on public.usage_events for all to authenticated using ((select auth.uid()) = user_id or user_id is null) with check ((select auth.uid()) = user_id or user_id is null);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'feedback' and policyname = 'Users can manage own feedback') then
    create policy "Users can manage own feedback" on public.feedback for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'review_prompt_tracking' and policyname = 'Users can manage own review prompt tracking') then
    create policy "Users can manage own review prompt tracking" on public.review_prompt_tracking for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'support_tickets' and policyname = 'Users can manage own support tickets') then
    create policy "Users can manage own support tickets" on public.support_tickets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'account_deletion_requests' and policyname = 'Users can create and view own account deletion requests') then
    create policy "Users can create and view own account deletion requests" on public.account_deletion_requests for select to authenticated using ((select auth.uid()) = user_id);
    create policy "Users can insert own account deletion requests" on public.account_deletion_requests for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_states' and policyname = 'Users can manage own onboarding state') then
    create policy "Users can manage own onboarding state" on public.onboarding_states for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'entity_notes' and policyname = 'Users can manage own entity notes') then
    create policy "Users can manage own entity notes" on public.entity_notes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  -- Public/reference tables.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'fuel_price_cache' and policyname = 'Authenticated users can view fuel cache') then
    create policy "Authenticated users can view fuel cache" on public.fuel_price_cache for select to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'demo_calculations' and policyname = 'Anyone can insert demo calculations') then
    create policy "Anyone can insert demo calculations" on public.demo_calculations for insert to anon, authenticated with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'legal_documents' and policyname = 'Anyone can view active legal documents') then
    create policy "Anyone can view active legal documents" on public.legal_documents for select to anon, authenticated using (is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usage_limits' and policyname = 'Authenticated users can view usage limits') then
    create policy "Authenticated users can view usage limits" on public.usage_limits for select to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'promo_codes' and policyname = 'Authenticated users can view active promo codes') then
    create policy "Authenticated users can view active promo codes" on public.promo_codes for select to authenticated using (is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'founder_pricing_access' and policyname = 'Users can view own founder access') then
    create policy "Users can view own founder access" on public.founder_pricing_access for select to authenticated using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pilot_access' and policyname = 'Users can view own pilot access') then
    create policy "Users can view own pilot access" on public.pilot_access for select to authenticated using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_events' and policyname = 'Users can insert own analytics events') then
    create policy "Users can insert own analytics events" on public.analytics_events for insert to authenticated with check ((select auth.uid()) = user_id or user_id is null);
  end if;
end
$$;

-- ==================================================
-- 15. Seed / Optional Legal Document Inserts
-- ==================================================

insert into public.usage_limits (
  tier,
  monthly_calculations,
  saved_loads,
  exports_allowed,
  advanced_analytics_allowed,
  comparisons_allowed,
  templates_allowed
)
values
  ('free', 10, 0, false, false, false, false),
  ('pro', null, null, true, true, true, true),
  ('founder', null, null, true, true, true, true),
  ('pilot', null, null, true, true, true, true)
on conflict (tier) do update set
  monthly_calculations = excluded.monthly_calculations,
  saved_loads = excluded.saved_loads,
  exports_allowed = excluded.exports_allowed,
  advanced_analytics_allowed = excluded.advanced_analytics_allowed,
  comparisons_allowed = excluded.comparisons_allowed,
  templates_allowed = excluded.templates_allowed;

insert into public.legal_documents (
  document_type,
  title,
  version,
  last_updated,
  metadata
)
values
  ('terms_of_service', 'Terms of Service', '2026-05-11', '2026-05-11', '{"route":"/terms"}'::jsonb),
  ('privacy_policy', 'Privacy Policy', '2026-05-11', '2026-05-11', '{"route":"/privacy"}'::jsonb),
  ('refund_policy', 'Refund Policy', '2026-05-11', '2026-05-11', '{"route":"/refund-policy"}'::jsonb),
  ('subscription_terms', 'Subscription Terms', '2026-05-11', '2026-05-11', '{"route":"/subscription-terms"}'::jsonb),
  ('disclaimer', 'LoadIQ First-Launch Disclaimer', 'loadiq-disclaimer-v1', '2026-05-11', '{"component":"DisclaimerModal"}'::jsonb),
  ('data_sources', 'Data Source Disclosure', '2026-05-11', '2026-05-11', '{"providers":["EIA"]}'::jsonb)
on conflict (document_type, version) do update set
  title = excluded.title,
  last_updated = excluded.last_updated,
  metadata = excluded.metadata,
  is_active = true,
  updated_at = now();

-- ==================================================
-- 16. Manual Review Notes
-- ==================================================

-- Review before running:
-- 1. If existing policies use the same names but different definitions, this file
--    leaves them untouched. Drop/alter policies manually only after reviewing.
-- 2. fuel_price_cache writes are intended for service-role/server-side code. RLS
--    grants authenticated users read access only.
-- 3. subscriptions, founder_pricing_access, promo_codes, and pilot_access should
--    be mutated by backend/admin/Stripe webhook flows, not arbitrary clients.
-- 4. demo_calculations allows anonymous insert by design and no public select.
-- 5. This file is non-destructive. It does not remove obsolete columns.

-- ============================================================
-- SOURCE: app_survivability_controls
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260513030525_app_survivability_controls.sql
-- ============================================================

-- Karpilo LoadIQ app survivability controls.
-- Additive, SQL-editor compatible, and safe to rerun.
-- Covers required app policy acceptance, driver safety reminders, public-safe
-- health notices, reservation codes, and live pricing lock state.

create table if not exists public.app_policy_documents (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null,
  title text not null,
  version text not null,
  is_required boolean not null default true,
  is_active boolean not null default true,
  effective_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (policy_key, version)
);

create table if not exists public.app_policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  policy_key text not null,
  policy_version text not null,
  email text,
  app_version text,
  platform text not null default 'web',
  acceptance_source text not null default 'app_gate',
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (user_id, policy_key, policy_version)
);

create table if not exists public.driver_safety_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  policy_version text not null,
  acknowledged_at timestamptz not null default now(),
  source text not null default 'monthly_safety_reminder',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.system_health_notices (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'info'
    check (status in ('info', 'degraded', 'maintenance', 'warning', 'critical', 'resolved')),
  title text not null,
  public_message text not null,
  internal_notes text,
  is_active boolean not null default true,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reservation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  cohort text not null check (cohort in ('pilot50', 'launch500')),
  status text not null default 'reserved'
    check (status in ('available', 'reserved', 'redeemed', 'lapsed', 'revoked')),
  user_id uuid references public.users(id) on delete set null,
  email text,
  seat_number integer,
  monthly_price numeric(10,2) not null,
  annual_price numeric(10,2) not null,
  billing_provider text check (billing_provider is null or billing_provider in ('stripe', 'apple', 'google', 'manual')),
  reserved_at timestamptz,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pricing_lock_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  cohort text not null check (cohort in ('pilot50', 'launch500')),
  lock_status text not null default 'active'
    check (lock_status in ('active', 'past_due', 'lapsed', 'revoked')),
  billing_provider text not null check (billing_provider in ('stripe', 'apple', 'google', 'manual')),
  provider_subscription_id text,
  monthly_price numeric(10,2) not null,
  annual_price numeric(10,2) not null,
  active_since timestamptz not null default now(),
  lapsed_at timestamptz,
  revoked_at timestamptz,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, cohort)
);

create index if not exists idx_app_policy_acceptances_user_policy
on public.app_policy_acceptances (user_id, policy_key, policy_version);

create index if not exists idx_driver_safety_ack_user_ack
on public.driver_safety_acknowledgments (user_id, acknowledged_at desc);

create index if not exists idx_system_health_notices_active
on public.system_health_notices (is_active, status, starts_at, ends_at);

create index if not exists idx_reservation_codes_user_cohort
on public.reservation_codes (user_id, cohort, status);

create index if not exists idx_pricing_lock_status_user_status
on public.pricing_lock_status (user_id, cohort, lock_status);

create or replace view public.active_system_health_notices
with (security_invoker = true)
as
select
  id,
  status,
  title,
  public_message,
  starts_at,
  ends_at,
  resolved_at,
  created_at,
  updated_at
from public.system_health_notices
where is_active = true
  and status <> 'resolved'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now());

alter table public.app_policy_documents enable row level security;
alter table public.app_policy_acceptances enable row level security;
alter table public.driver_safety_acknowledgments enable row level security;
alter table public.system_health_notices enable row level security;
alter table public.reservation_codes enable row level security;
alter table public.pricing_lock_status enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.app_policy_documents to authenticated;
grant select, insert on public.app_policy_acceptances to authenticated;
grant select, insert on public.driver_safety_acknowledgments to authenticated;
grant select on public.active_system_health_notices to authenticated;
grant select on public.reservation_codes to authenticated;
grant select on public.pricing_lock_status to authenticated;

grant select, insert, update, delete on
  public.app_policy_documents,
  public.app_policy_acceptances,
  public.driver_safety_acknowledgments,
  public.system_health_notices,
  public.reservation_codes,
  public.pricing_lock_status
to service_role;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_policy_documents' and policyname = 'Authenticated users can view active required app policies') then
    create policy "Authenticated users can view active required app policies"
    on public.app_policy_documents
    for select to authenticated
    using (is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_policy_acceptances' and policyname = 'Users can create and view own app policy acceptances') then
    create policy "Users can create and view own app policy acceptances"
    on public.app_policy_acceptances
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own app policy acceptances"
    on public.app_policy_acceptances
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'driver_safety_acknowledgments' and policyname = 'Users can create and view own safety acknowledgments') then
    create policy "Users can create and view own safety acknowledgments"
    on public.driver_safety_acknowledgments
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own safety acknowledgments"
    on public.driver_safety_acknowledgments
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'system_health_notices' and policyname = 'Authenticated users can view public active health notices') then
    create policy "Authenticated users can view public active health notices"
    on public.system_health_notices
    for select to authenticated
    using (
      is_active = true
      and status <> 'resolved'
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reservation_codes' and policyname = 'Users can view own reservation codes') then
    create policy "Users can view own reservation codes"
    on public.reservation_codes
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pricing_lock_status' and policyname = 'Users can view own pricing lock status') then
    create policy "Users can view own pricing lock status"
    on public.pricing_lock_status
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end
$$;

insert into public.app_policy_documents (policy_key, title, version, is_required, is_active)
values
  ('terms_conditions', 'Terms & Conditions', '2026-05-13', true, true),
  ('privacy_policy', 'Privacy Policy', '2026-05-13', true, true),
  ('refund_policy', 'Refund Policy', '2026-05-13', true, true),
  ('subscription_terms', 'Subscription Terms', '2026-05-13', true, true),
  ('acceptable_use_policy', 'Acceptable Use Policy', '2026-05-13', true, true),
  ('driver_safety_disclosure', 'Hands-Free & Driver Safety Disclosure', '2026-05-13', true, true),
  ('billing_policy', 'Billing Policy', '2026-05-13', true, true),
  ('pricing_lock_policy', 'Pricing Lock Policy', '2026-05-13', true, true),
  ('data_usage_disclosure', 'Data Usage Disclosure', '2026-05-13', true, true),
  ('informational_use_disclaimer', 'Informational Use Disclaimer', '2026-05-13', true, true),
  ('limitation_of_liability', 'Limitation of Liability', '2026-05-13', true, true)
on conflict (policy_key, version) do update set
  title = excluded.title,
  is_required = excluded.is_required,
  is_active = excluded.is_active,
  updated_at = now();

-- ============================================================
-- SOURCE: pilot_operator_program
-- FILE: supabase/sql-editor-updates/014_pilot_operator_program.sql
-- ============================================================

-- Karpilo LoadIQ pilot / legacy launch operator program layer.
-- Safe to run in the Supabase SQL Editor after the consolidated schema.

create table if not exists public.operator_program_status (
  user_id uuid primary key references public.users(id) on delete cascade,
  pilot_user boolean not null default false,
  founding_operator boolean not null default false,
  launch500_user boolean not null default false,
  legacy_price_locked boolean not null default false,
  subscription_grandfathered boolean not null default false,
  program text not null default 'standard'
    check (program in ('standard', 'pilot50', 'launch500')),
  phase text not null default 'prelaunch'
    check (phase in ('prelaunch', 'pilot_active', 'official_launch')),
  assigned_by text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_experience_state (
  user_id uuid primary key references public.users(id) on delete cascade,
  founder_welcome_completed_at timestamptz,
  pilot_status_card_dismissed_at timestamptz,
  pilot_status_card_minimized_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.operator_pricing_locks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  program text not null check (program in ('pilot50', 'launch500')),
  tier text not null check (tier in ('pilot', 'launch500', 'founder')),
  monthly_price numeric(10,2) not null check (monthly_price >= 0),
  annual_price numeric(10,2) not null check (annual_price >= 0),
  billing_provider text not null default 'stripe'
    check (billing_provider in ('stripe', 'apple', 'google', 'manual')),
  provider_price_id text,
  provider_subscription_id text,
  lifetime_lock boolean not null default true,
  locked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, program)
);

create index if not exists idx_operator_program_status_phase
on public.operator_program_status (phase, program);

create index if not exists idx_operator_pricing_locks_program
on public.operator_pricing_locks (program, locked_at);

create or replace function public.prevent_operator_pricing_lock_mutation()
returns trigger as $$
begin
  raise exception 'operator_pricing_locks are immutable; insert a new administrative record instead of updating or deleting';
end;
$$ language plpgsql;

drop trigger if exists prevent_operator_pricing_lock_update on public.operator_pricing_locks;
create trigger prevent_operator_pricing_lock_update
before update on public.operator_pricing_locks
for each row execute function public.prevent_operator_pricing_lock_mutation();

drop trigger if exists prevent_operator_pricing_lock_delete on public.operator_pricing_locks;
create trigger prevent_operator_pricing_lock_delete
before delete on public.operator_pricing_locks
for each row execute function public.prevent_operator_pricing_lock_mutation();

drop trigger if exists set_operator_program_status_updated_at on public.operator_program_status;
create trigger set_operator_program_status_updated_at
before update on public.operator_program_status
for each row execute function public.set_updated_at();

drop trigger if exists set_user_experience_state_updated_at on public.user_experience_state;
create trigger set_user_experience_state_updated_at
before update on public.user_experience_state
for each row execute function public.set_updated_at();

create or replace function public.get_operator_program_counts()
returns table (program text, claimed_count bigint)
security definer
set search_path = public
as $$
  select operator_pricing_locks.program, count(*)::bigint
  from public.operator_pricing_locks
  group by operator_pricing_locks.program;
$$ language sql stable;

alter table public.operator_program_status enable row level security;
alter table public.user_experience_state enable row level security;
alter table public.operator_pricing_locks enable row level security;

grant select on public.operator_program_status to authenticated;
grant select, insert, update on public.user_experience_state to authenticated;
grant execute on function public.get_operator_program_counts() to authenticated;
grant select, insert on public.operator_program_status to service_role;
grant select, insert on public.operator_pricing_locks to service_role;
grant select, insert, update on public.user_experience_state to service_role;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operator_program_status' and policyname = 'Users can view own operator program status') then
    create policy "Users can view own operator program status"
    on public.operator_program_status
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_experience_state' and policyname = 'Users can manage own app experience state') then
    create policy "Users can manage own app experience state"
    on public.user_experience_state
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operator_pricing_locks' and policyname = 'Users can view own immutable pricing locks') then
    create policy "Users can view own immutable pricing locks"
    on public.operator_pricing_locks
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end
$$;

insert into public.usage_limits (
  tier,
  monthly_calculations,
  saved_loads,
  exports_allowed,
  advanced_analytics_allowed,
  comparisons_allowed,
  templates_allowed
)
values
  ('launch500', null, null, true, true, true, true)
on conflict (tier) do update set
  monthly_calculations = excluded.monthly_calculations,
  saved_loads = excluded.saved_loads,
  exports_allowed = excluded.exports_allowed,
  advanced_analytics_allowed = excluded.advanced_analytics_allowed,
  comparisons_allowed = excluded.comparisons_allowed,
  templates_allowed = excluded.templates_allowed;

alter table public.support_tickets
  drop constraint if exists support_tickets_category_check;

alter table public.support_tickets
  add constraint support_tickets_category_check
  check (category in (
    'support',
    'bug',
    'refund',
    'billing',
    'feature',
    'privacy',
    'account_deletion'
  ));

-- ============================================================
-- SOURCE: rollout_onboarding_control
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260513031500_rollout_onboarding_control.sql
-- ============================================================

-- Karpilo LoadIQ phased rollout and onboarding telemetry controls.
-- Additive, SQL-editor compatible, and safe to rerun.

alter table public.operator_program_status
  drop constraint if exists operator_program_status_phase_check;

alter table public.operator_program_status
  add constraint operator_program_status_phase_check
  check (phase in (
    'prelaunch',
    'pilot_active',
    'official_launch',
    'FOUNDER_PILOT',
    'CONTROLLED_PUBLIC_LAUNCH',
    'EXPANSION_ACCESS',
    'GENERAL_AVAILABILITY'
  ));

create table if not exists public.rollout_phase_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  rollout_phase text not null
    check (rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  cohort text not null default 'standard'
    check (cohort in ('pilot50', 'launch500', 'standard')),
  seat_number integer check (seat_number is null or seat_number > 0),
  assignment_source text not null default 'admin',
  is_active boolean not null default true,
  assigned_by text,
  assigned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.onboarding_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  event_name text not null,
  rollout_phase text
    check (rollout_phase is null or rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.disclaimer_acceptance_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text,
  policy_version text not null,
  rollout_phase text
    check (rollout_phase is null or rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  source text not null default 'app_access_gate',
  event_payload jsonb not null default '{}'::jsonb,
  accepted_at timestamptz not null default now(),
  created_at timestamptz default now()
);

create table if not exists public.welcome_message_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  rollout_phase text not null
    check (rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  message_key text not null,
  source text not null default 'founder_welcome',
  event_payload jsonb not null default '{}'::jsonb,
  viewed_at timestamptz not null default now(),
  created_at timestamptz default now()
);

create table if not exists public.onboarding_feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text,
  category text not null default 'onboarding'
    check (category in (
      'bug',
      'feature',
      'onboarding_confusion',
      'support',
      'billing',
      'onboarding'
    )),
  message text not null,
  rollout_phase text
    check (rollout_phase is null or rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create unique index if not exists idx_rollout_phase_assignments_active_seat
on public.rollout_phase_assignments (rollout_phase, seat_number)
where is_active = true and seat_number is not null;

create index if not exists idx_rollout_phase_assignments_user_active
on public.rollout_phase_assignments (user_id, is_active);

create index if not exists idx_onboarding_events_user_created
on public.onboarding_events (user_id, created_at desc);

create index if not exists idx_disclaimer_acceptance_events_user_created
on public.disclaimer_acceptance_events (user_id, accepted_at desc);

create index if not exists idx_welcome_message_views_user_phase
on public.welcome_message_views (user_id, rollout_phase, viewed_at desc);

create index if not exists idx_onboarding_feedback_events_user_created
on public.onboarding_feedback_events (user_id, created_at desc);

alter table public.rollout_phase_assignments enable row level security;
alter table public.onboarding_events enable row level security;
alter table public.disclaimer_acceptance_events enable row level security;
alter table public.welcome_message_views enable row level security;
alter table public.onboarding_feedback_events enable row level security;

grant select on public.rollout_phase_assignments to authenticated;
grant select, insert on public.onboarding_events to authenticated;
grant select, insert on public.disclaimer_acceptance_events to authenticated;
grant select, insert on public.welcome_message_views to authenticated;
grant select, insert on public.onboarding_feedback_events to authenticated;

grant select, insert, update, delete on
  public.rollout_phase_assignments,
  public.onboarding_events,
  public.disclaimer_acceptance_events,
  public.welcome_message_views,
  public.onboarding_feedback_events
to service_role;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'rollout_phase_assignments' and policyname = 'Users can view own rollout assignment') then
    create policy "Users can view own rollout assignment"
    on public.rollout_phase_assignments
    for select to authenticated
    using ((select auth.uid()) = user_id and is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_events' and policyname = 'Users can create and view own onboarding events') then
    create policy "Users can create and view own onboarding events"
    on public.onboarding_events
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own onboarding events"
    on public.onboarding_events
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'disclaimer_acceptance_events' and policyname = 'Users can create and view own disclaimer acceptance events') then
    create policy "Users can create and view own disclaimer acceptance events"
    on public.disclaimer_acceptance_events
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own disclaimer acceptance events"
    on public.disclaimer_acceptance_events
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'welcome_message_views' and policyname = 'Users can create and view own welcome message views') then
    create policy "Users can create and view own welcome message views"
    on public.welcome_message_views
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own welcome message views"
    on public.welcome_message_views
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_feedback_events' and policyname = 'Users can create and view own onboarding feedback events') then
    create policy "Users can create and view own onboarding feedback events"
    on public.onboarding_feedback_events
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own onboarding feedback events"
    on public.onboarding_feedback_events
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;
end
$$;

-- ============================================================
-- SOURCE: admin_control_plane_foundation
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260516024209_phase_3b_control_plane_foundation.sql
-- ============================================================

-- PHASE 3B CONTROL PLANE FOUNDATION
-- SAFE-TO-RUN-NOW SECTION ONLY.
--
-- DRAFTED FOR REVIEW. DO NOT APPLY TO SUPABASE UNTIL APPROVED.
--
-- Includes:
-- - pgcrypto extension
-- - app_private schema
-- - app_private.touch_updated_at()
-- - user_roles
-- - app_private.has_role_for(uuid, text[])
-- - admin_audit_events hardening
-- - append-only audit trigger
-- - admin_auth_challenges
-- - notification_templates
-- - notification_publications
-- - publication_audiences
-- - public_notification_notices view
-- - RLS enables/revokes/grants for control-plane tables
--
-- Excludes:
-- - user_badges
-- - user_milestones
-- - later-lifecycle optional sections
--
-- Security model:
-- - no payment details
-- - no plaintext challenge/token values
-- - no authenticated writes to admin/control-plane tables
-- - no anon/authenticated direct access to admin_auth_challenges
-- - public notices exposed through a safe view only
-- - admin portal writes must go through server/service-role paths

create extension if not exists pgcrypto;

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;
grant usage on schema app_private to service_role;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function app_private.touch_updated_at() from public;
grant execute on function app_private.touch_updated_at() to service_role;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'support', 'admin', 'developer', 'owner')),
  scope text not null default 'global' check (scope in ('global', 'app', 'website')),
  status text not null default 'active' check (status in ('active', 'revoked', 'suspended', 'expired')),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  expires_at timestamptz,
  reason text,
  source text not null default 'server',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_roles_active_uidx
on public.user_roles (user_id, role, scope)
where status = 'active';

create index if not exists idx_user_roles_user_status
on public.user_roles (user_id, status);

create index if not exists idx_user_roles_role_status
on public.user_roles (role, status);

drop trigger if exists user_roles_touch_updated_at on public.user_roles;
create trigger user_roles_touch_updated_at
before update on public.user_roles
for each row execute function app_private.touch_updated_at();

create or replace function app_private.has_role_for(
  check_user_id uuid,
  required_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and status = 'active'
      and role = any(required_roles)
      and (expires_at is null or expires_at > now())
  );
$$;

revoke all on function app_private.has_role_for(uuid, text[]) from public;
revoke all on function app_private.has_role_for(uuid, text[]) from anon;
revoke all on function app_private.has_role_for(uuid, text[]) from authenticated;
grant execute on function app_private.has_role_for(uuid, text[]) to service_role;

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  actor_email text,
  actor_role text,
  action text not null,
  event_type text not null default 'admin_action',
  status text not null default 'success'
    check (status in ('attempt', 'success', 'failure', 'blocked', 'expired')),
  subject_table text,
  subject_id uuid,
  target_user_id uuid references auth.users(id),
  request_ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_events
  add column if not exists actor_email text,
  add column if not exists actor_role text,
  add column if not exists event_type text not null default 'admin_action',
  add column if not exists status text not null default 'success',
  add column if not exists target_user_id uuid references auth.users(id),
  add column if not exists request_ip_hash text,
  add column if not exists user_agent_hash text;

create index if not exists idx_admin_audit_events_created
on public.admin_audit_events (created_at desc);

create index if not exists idx_admin_audit_events_actor_created
on public.admin_audit_events (actor_user_id, created_at desc);

create or replace function app_private.prevent_admin_audit_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'admin_audit_events is append-only';
end;
$$;

revoke all on function app_private.prevent_admin_audit_mutation() from public;
grant execute on function app_private.prevent_admin_audit_mutation() to service_role;

drop trigger if exists prevent_admin_audit_update_delete on public.admin_audit_events;
create trigger prevent_admin_audit_update_delete
before update or delete on public.admin_audit_events
for each row execute function app_private.prevent_admin_audit_mutation();

create table if not exists public.admin_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  identity_email text not null,
  challenge_hash text not null,
  challenge_hash_algorithm text not null default 'sha256',
  challenge_sent_to text not null,
  challenge_sent_at timestamptz not null default now(),
  challenge_expires_at timestamptz not null,
  challenge_verified_at timestamptz,
  token_hash text,
  token_hash_algorithm text default 'sha256',
  token_sent_at timestamptz,
  token_expires_at timestamptz,
  token_verified_at timestamptz,
  elevated_session_expires_at timestamptz,
  status text not null default 'challenge_sent'
    check (status in (
      'challenge_sent',
      'challenge_verified',
      'token_sent',
      'token_verified',
      'expired',
      'failed',
      'revoked'
    )),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  request_ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_auth_challenges_user_status
on public.admin_auth_challenges (user_id, status, created_at desc);

create index if not exists idx_admin_auth_challenges_email_status
on public.admin_auth_challenges (lower(identity_email), status, created_at desc);

create index if not exists idx_admin_auth_challenges_expiry
on public.admin_auth_challenges (challenge_expires_at, token_expires_at);

drop trigger if exists admin_auth_challenges_touch_updated_at on public.admin_auth_challenges;
create trigger admin_auth_challenges_touch_updated_at
before update on public.admin_auth_challenges
for each row execute function app_private.touch_updated_at();

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  channel text not null check (channel in (
    'noreply',
    'updates',
    'newsletter',
    'in_app',
    'web',
    'push_placeholder',
    'outage_banner',
    'release_notice',
    'fix_notice',
    'bug_notice'
  )),
  name text not null,
  subject text,
  body_text text not null,
  body_html text,
  variables_schema jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'approved', 'archived')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_publications (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.notification_templates(id) on delete set null,
  title text not null,
  channel text not null check (channel in (
    'noreply',
    'updates',
    'newsletter',
    'in_app',
    'web',
    'push_placeholder',
    'outage_banner',
    'release_notice',
    'fix_notice',
    'bug_notice'
  )),
  status text not null default 'draft'
    check (status in ('draft', 'review', 'approved', 'scheduled', 'published', 'cancelled', 'failed')),
  public_visible boolean not null default false,
  severity text not null default 'info'
    check (severity in ('info', 'degraded', 'maintenance', 'incident')),
  rendered_subject text,
  rendered_body_text text,
  rendered_body_html text,
  cta_label text,
  cta_href text,
  starts_at timestamptz,
  ends_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,
  cancelled_at timestamptz,
  author_user_id uuid references auth.users(id),
  submitted_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  published_by uuid references auth.users(id),
  cancelled_by uuid references auth.users(id),
  approval_notes text,
  public_metadata jsonb not null default '{}'::jsonb,
  private_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.publication_audiences (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.notification_publications(id) on delete cascade,
  audience_type text not null check (audience_type in (
    'all_users',
    'tier',
    'role',
    'cohort',
    'newsletter',
    'waitlist',
    'specific_users',
    'manual_filter'
  )),
  filter jsonb not null default '{}'::jsonb,
  estimated_recipient_count integer,
  approved_recipient_count integer,
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_templates_channel_status
on public.notification_templates (channel, status);

create index if not exists idx_notification_publications_status_channel
on public.notification_publications (status, channel, scheduled_at);

create index if not exists idx_publication_audiences_publication
on public.publication_audiences (publication_id);

drop trigger if exists notification_templates_touch_updated_at on public.notification_templates;
create trigger notification_templates_touch_updated_at
before update on public.notification_templates
for each row execute function app_private.touch_updated_at();

drop trigger if exists notification_publications_touch_updated_at on public.notification_publications;
create trigger notification_publications_touch_updated_at
before update on public.notification_publications
for each row execute function app_private.touch_updated_at();

create or replace view public.public_notification_notices
with (security_barrier = true)
as
select
  id,
  title,
  channel,
  severity,
  rendered_subject,
  rendered_body_text,
  cta_label,
  cta_href,
  starts_at,
  ends_at,
  published_at,
  public_metadata
from public.notification_publications
where public_visible = true
  and status = 'published'
  and channel in ('web', 'outage_banner', 'release_notice', 'fix_notice', 'bug_notice')
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now());

alter table public.user_roles enable row level security;
alter table public.admin_audit_events enable row level security;
alter table public.admin_auth_challenges enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_publications enable row level security;
alter table public.publication_audiences enable row level security;

revoke all on public.user_roles from anon, authenticated;
revoke all on public.admin_audit_events from anon, authenticated;
revoke all on public.admin_auth_challenges from anon, authenticated;
revoke all on public.notification_templates from anon, authenticated;
revoke all on public.notification_publications from anon, authenticated;
revoke all on public.publication_audiences from anon, authenticated;

grant select, insert, update on public.user_roles to service_role;
grant select, insert on public.admin_audit_events to service_role;
grant select, insert, update on public.admin_auth_challenges to service_role;
grant select, insert, update on public.notification_templates to service_role;
grant select, insert, update on public.notification_publications to service_role;
grant select, insert, update on public.publication_audiences to service_role;

revoke all on public.public_notification_notices from public;
grant select on public.public_notification_notices to anon, authenticated;

-- No anon/authenticated table policies are intentionally created for the
-- admin/control-plane tables above. All admin reads/writes go through
-- server/service-role routes after backend role verification.

-- ============================================================
-- SOURCE: public_notification_notice_grants
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260516160223_harden_public_notification_notices_grants.sql
-- ============================================================

-- Harden public_notification_notices grants.
--
-- public.public_notification_notices is a public-facing view over
-- notification_publications. Because the underlying publication table is the
-- server-controlled write path, anon/authenticated clients should only be able
-- to read the view.
--
-- Write access must remain server-side through public.notification_publications
-- and the approved admin/control-plane workflow.

revoke all on public.public_notification_notices from anon;
revoke all on public.public_notification_notices from authenticated;

grant select on public.public_notification_notices to anon;
grant select on public.public_notification_notices to authenticated;

-- ============================================================
-- SOURCE: app_website_schema_alignment
-- FILE: supabase/sql-editor-updates/015_app_website_settings_schema_alignment.sql
-- ============================================================

-- Karpilo LoadIQ APP + WEBSITE Supabase alignment
-- Purpose:
--   1) audit the APP Supabase project before updates,
--   2) preserve existing APP auth/profile/billing systems,
--   3) add WEBSITE intake/reservation/newsletter/status tables safely.
--
-- IMPORTANT:
--   - Run Block 1 first.
--   - Review missing/conflicting objects before running Blocks 2-4.
--   - This script does not DROP tables, DROP columns, or overwrite app tables.
--   - Service-role server routes are the write path for website submissions.

-- ============================================================
-- BLOCK 1: LOCAL COMPATIBILITY AUDIT
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: NO
-- AFFECTS APP TABLES: NO
-- AFFECTS WEBSITE TABLES: NO
-- ============================================================

with expected_tables(owner_system, table_name, expected_access) as (
  values
    ('APP', 'users', 'authenticated own-row profile'),
    ('APP', 'subscriptions', 'authenticated own-row read; service_role webhook writes'),
    ('APP', 'user_settings', 'authenticated own-row settings'),
    ('APP', 'truck_profiles', 'authenticated own-row vehicle profile'),
    ('APP', 'user_overhead_items', 'authenticated own-row expense settings'),
    ('APP', 'pay_structure_templates', 'authenticated own-row pay templates'),
    ('APP', 'saved_loads', 'authenticated own-row loads'),
    ('APP', 'usage_events', 'authenticated own-row usage'),
    ('APP', 'system_health_notices', 'APP health-notice shape'),
    ('APP', 'active_system_health_notices', 'APP health view'),
    ('WEBSITE', 'website_reservations', 'service_role website reservation writes'),
    ('WEBSITE', 'reservation_events', 'service_role reservation event writes'),
    ('WEBSITE', 'pricing_entitlements', 'service_role pricing lock writes'),
    ('WEBSITE', 'support_intake', 'service_role/public support intake'),
    ('WEBSITE', 'contact_inquiries', 'legacy website contact fallback'),
    ('WEBSITE', 'newsletter_subscribers', 'service_role/public newsletter'),
    ('WEBSITE', 'waitlist', 'legacy website waitlist fallback'),
    ('WEBSITE', 'email_outbox', 'service_role Resend audit queue'),
    ('WEBSITE', 'email_delivery_events', 'service_role Resend delivery audit'),
    ('WEBSITE', 'rollout_phases', 'public rollout status read'),
    ('WEBSITE', 'rollout_waitlist', 'service_role rollout waitlist writes'),
    ('WEBSITE', 'rollout_access_events', 'service_role rollout event writes'),
    ('WEBSITE', 'system_health_events', 'public website status read')
),
objects as (
  select
    n.nspname as schema_name,
    c.relname as object_name,
    case c.relkind
      when 'r' then 'table'
      when 'v' then 'view'
      when 'm' then 'materialized_view'
      else c.relkind::text
    end as object_type
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
)
select
  e.owner_system,
  e.table_name,
  e.expected_access,
  coalesce(o.object_type, 'MISSING') as current_state
from expected_tables e
left join objects o on o.object_name = e.table_name
order by e.owner_system, e.table_name;

with expected_columns(table_name, column_name) as (
  values
    ('subscriptions', 'provider'),
    ('subscriptions', 'provider_customer_id'),
    ('subscriptions', 'provider_subscription_id'),
    ('subscriptions', 'trial_end'),
    ('subscriptions', 'current_period_end'),
    ('subscriptions', 'cancel_at_period_end'),
    ('subscriptions', 'canceled_at'),
    ('user_settings', 'default_mpg'),
    ('truck_profiles', 'default_mpg'),
    ('website_reservations', 'assigned_cohort'),
    ('pricing_entitlements', 'pricing_lock_tier'),
    ('support_intake', 'intake_type'),
    ('contact_inquiries', 'request_type'),
    ('newsletter_subscribers', 'consented_at'),
    ('email_outbox', 'provider_message_id'),
    ('rollout_phases', 'phase_key'),
    ('system_health_events', 'public_visible')
)
select
  e.table_name,
  e.column_name,
  case when c.column_name is null then 'MISSING' else 'present' end as current_state
from expected_columns e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = e.table_name
 and c.column_name = e.column_name
order by e.table_name, e.column_name;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'subscriptions',
    'user_settings',
    'truck_profiles',
    'user_overhead_items',
    'pay_structure_templates',
    'website_reservations',
    'support_intake',
    'newsletter_subscribers',
    'rollout_phases',
    'system_health_events'
  )
order by tablename, policyname;

select
  grantee,
  table_name,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
  and table_name in (
    'subscriptions',
    'website_reservations',
    'support_intake',
    'newsletter_subscribers',
    'email_outbox',
    'rollout_phases',
    'system_health_events'
  )
order by table_name, grantee, privilege_type;

-- ============================================================
-- BLOCK 2: APP SETTINGS/BILLING COMPATIBILITY
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: NO
-- AFFECTS APP TABLES: YES
-- AFFECTS WEBSITE TABLES: NO
-- ============================================================

alter table if exists public.subscriptions
  add column if not exists provider text not null default 'stripe',
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists plan_code text not null default 'free',
  add column if not exists billing_interval text,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists pilot_pricing_locked boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

grant usage on schema public to authenticated, service_role;

do $$
begin
  if to_regclass('public.subscriptions') is not null then
    execute 'alter table public.subscriptions enable row level security';
    execute 'create index if not exists idx_subscriptions_user_status_created on public.subscriptions (user_id, status, created_at desc)';
    execute 'create index if not exists idx_subscriptions_provider_subscription_unique on public.subscriptions (provider, provider_subscription_id) where provider_subscription_id is not null';
    execute 'create index if not exists idx_subscriptions_provider_customer on public.subscriptions (provider, provider_customer_id) where provider_customer_id is not null';
    execute 'revoke all privileges on public.subscriptions from anon, authenticated, service_role';
    execute 'grant select on public.subscriptions to authenticated';
    execute 'grant select, insert, update, delete on public.subscriptions to service_role';
  end if;

  if to_regclass('public.subscriptions') is not null and not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscriptions'
      and policyname = 'Users can view own subscriptions'
  ) then
    create policy "Users can view own subscriptions"
      on public.subscriptions
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;

-- ============================================================
-- BLOCK 3: WEBSITE TABLES ON APP SUPABASE
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: YES
-- AFFECTS APP TABLES: NO
-- AFFECTS WEBSITE TABLES: YES
-- ============================================================

create extension if not exists pgcrypto;

-- Partial-run preflight: if any WEBSITE table already exists from an earlier
-- draft or failed run, add the columns referenced by early indexes/seeds before
-- the rest of Block 3 touches them.
do $$
begin
  if to_regclass('public.website_reservations') is not null then
    alter table public.website_reservations
      add column if not exists email text,
      add column if not exists assigned_cohort text,
      add column if not exists status text default 'submitted',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.pricing_entitlements') is not null then
    alter table public.pricing_entitlements
      add column if not exists reservation_id uuid,
      add column if not exists status text default 'pending_review';
  end if;

  if to_regclass('public.support_intake') is not null then
    alter table public.support_intake
      add column if not exists status text default 'new',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.contact_inquiries') is not null then
    alter table public.contact_inquiries
      add column if not exists status text default 'new',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.newsletter_subscribers') is not null then
    alter table public.newsletter_subscribers
      add column if not exists email text,
      add column if not exists status text default 'subscribed',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.email_outbox') is not null then
    alter table public.email_outbox
      add column if not exists status text default 'queued',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.rollout_phases') is not null then
    alter table public.rollout_phases
      add column if not exists phase_key text,
      add column if not exists status text default 'upcoming',
      add column if not exists public_visible boolean default true,
      add column if not exists starts_at timestamptz default now();
  end if;

  if to_regclass('public.rollout_waitlist') is not null then
    alter table public.rollout_waitlist
      add column if not exists email text,
      add column if not exists phase_key text,
      add column if not exists status text default 'submitted';
  end if;

  if to_regclass('public.system_health_events') is not null then
    alter table public.system_health_events
      add column if not exists status text default 'active',
      add column if not exists public_visible boolean default true,
      add column if not exists starts_at timestamptz default now();
  end if;
end $$;

create table if not exists public.launch_program_state (
  program_key text primary key,
  display_name text not null,
  current_phase text not null default 'waitlist_only',
  opens_at timestamptz,
  closes_at timestamptz,
  slot_limit integer not null default 0 check (slot_limit >= 0),
  slots_reserved integer not null default 0 check (slots_reserved >= 0),
  slots_claimed integer not null default 0 check (slots_claimed >= 0),
  reservation_enabled boolean not null default true,
  billing_enabled boolean not null default false,
  pricing_lock_enabled boolean not null default false,
  waitlist_only_mode boolean not null default true,
  monthly_price numeric(10, 2) not null default 0,
  annual_price numeric(10, 2) not null default 0,
  provider_price_map jsonb not null default '{}'::jsonb,
  public_visible boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.launch_program_state
  add column if not exists current_phase text not null default 'waitlist_only',
  add column if not exists slots_reserved integer not null default 0,
  add column if not exists reservation_enabled boolean not null default true,
  add column if not exists billing_enabled boolean not null default false,
  add column if not exists pricing_lock_enabled boolean not null default false,
  add column if not exists monthly_price numeric(10, 2) not null default 0,
  add column if not exists annual_price numeric(10, 2) not null default 0,
  add column if not exists public_visible boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_by uuid references auth.users(id);

create table if not exists public.website_reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  fleet_size text,
  requested_cohort text not null,
  assigned_cohort text not null,
  intended_billing_provider text not null default 'undecided',
  pricing_lock_tier text not null,
  status text not null default 'submitted',
  source text not null default 'website',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists website_reservations_email_cohort_uidx
on public.website_reservations (lower(email), assigned_cohort);

create table if not exists public.reservation_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.website_reservations(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system',
  actor_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_entitlements (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.website_reservations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  cohort text not null,
  pricing_lock_tier text not null,
  monthly_price numeric(10, 2) not null,
  annual_price numeric(10, 2) not null,
  intended_billing_provider text not null default 'undecided',
  status text not null default 'pending_review',
  active boolean not null default false,
  source text not null default 'website_reservation',
  activated_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pricing_entitlements_reservation_uidx
on public.pricing_entitlements (reservation_id)
where reservation_id is not null;

create table if not exists public.support_intake (
  id uuid primary key default gen_random_uuid(),
  intake_type text not null,
  name text not null,
  email text not null,
  role text,
  message text not null,
  source text not null default 'website',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text,
  message text not null,
  source text not null default 'website',
  request_type text not null default 'support',
  destination_email text,
  priority text not null default 'normal',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  company text,
  source text not null default 'website',
  status text not null default 'subscribed',
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  company text,
  fleet_size text,
  founder_access boolean not null default false,
  program_interest text,
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  channel_key text not null,
  provider text not null default 'resend',
  message_type text not null,
  to_email text not null,
  from_email text not null,
  reply_to_email text,
  subject text not null,
  status text not null default 'queued',
  provider_message_id text,
  related_table text,
  related_id text,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  email_outbox_id uuid references public.email_outbox(id) on delete set null,
  provider text not null default 'resend',
  provider_message_id text,
  event_type text not null,
  event_status text not null,
  recipient_email text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rollout_phases (
  id uuid primary key default gen_random_uuid(),
  phase_key text not null unique,
  sort_order integer not null,
  title text not null,
  short_label text not null,
  capacity integer,
  reserved_slots integer not null default 0,
  accepted_slots integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_days integer,
  status text not null default 'upcoming',
  accepting_reservations boolean not null default false,
  description text not null,
  expectation text not null,
  cta_label text not null,
  target_route text not null default '/contact',
  admin_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.rollout_waitlist (
  id uuid primary key default gen_random_uuid(),
  phase_key text not null references public.rollout_phases(phase_key),
  name text not null,
  email text not null,
  company text,
  fleet_size text,
  intended_billing_provider text not null default 'undecided',
  status text not null default 'submitted',
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists rollout_waitlist_email_phase_uidx
on public.rollout_waitlist (lower(email), phase_key);

create table if not exists public.rollout_access_events (
  id uuid primary key default gen_random_uuid(),
  rollout_waitlist_id uuid references public.rollout_waitlist(id) on delete set null,
  phase_key text not null references public.rollout_phases(phase_key),
  event_type text not null,
  actor_type text not null default 'system',
  actor_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.system_health_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  severity text not null default 'info',
  status text not null default 'active',
  affects_onboarding boolean not null default false,
  public_visible boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Existing WEBSITE tables may already exist from an earlier draft. CREATE TABLE
-- IF NOT EXISTS will not add columns, so this compatibility pass adds every
-- column referenced by the website routes before indexes, triggers, or seeds run.
alter table public.website_reservations
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists fleet_size text,
  add column if not exists requested_cohort text,
  add column if not exists assigned_cohort text,
  add column if not exists intended_billing_provider text default 'undecided',
  add column if not exists pricing_lock_tier text,
  add column if not exists status text default 'submitted',
  add column if not exists source text default 'website',
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.reservation_events
  add column if not exists reservation_id uuid references public.website_reservations(id) on delete cascade,
  add column if not exists event_type text,
  add column if not exists actor_type text default 'system',
  add column if not exists actor_user_id uuid references auth.users(id),
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

alter table public.pricing_entitlements
  add column if not exists reservation_id uuid references public.website_reservations(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists email text,
  add column if not exists cohort text,
  add column if not exists pricing_lock_tier text,
  add column if not exists monthly_price numeric(10, 2),
  add column if not exists annual_price numeric(10, 2),
  add column if not exists intended_billing_provider text default 'undecided',
  add column if not exists status text default 'pending_review',
  add column if not exists active boolean default false,
  add column if not exists source text default 'website_reservation',
  add column if not exists activated_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revocation_reason text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.support_intake
  add column if not exists intake_type text,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists message text,
  add column if not exists source text default 'website',
  add column if not exists status text default 'new',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.contact_inquiries
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists message text,
  add column if not exists source text default 'website',
  add column if not exists request_type text default 'support',
  add column if not exists destination_email text,
  add column if not exists priority text default 'normal',
  add column if not exists status text default 'new',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.newsletter_subscribers
  add column if not exists email text,
  add column if not exists name text,
  add column if not exists company text,
  add column if not exists source text default 'website',
  add column if not exists status text default 'subscribed',
  add column if not exists consented_at timestamptz default now(),
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.waitlist
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists fleet_size text,
  add column if not exists founder_access boolean default false,
  add column if not exists program_interest text,
  add column if not exists source text default 'website',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.email_outbox
  add column if not exists channel_key text,
  add column if not exists provider text default 'resend',
  add column if not exists message_type text,
  add column if not exists to_email text,
  add column if not exists from_email text,
  add column if not exists reply_to_email text,
  add column if not exists subject text,
  add column if not exists status text default 'queued',
  add column if not exists provider_message_id text,
  add column if not exists related_table text,
  add column if not exists related_id text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists error_message text,
  add column if not exists sent_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.email_delivery_events
  add column if not exists email_outbox_id uuid references public.email_outbox(id) on delete set null,
  add column if not exists provider text default 'resend',
  add column if not exists provider_message_id text,
  add column if not exists event_type text,
  add column if not exists event_status text,
  add column if not exists recipient_email text,
  add column if not exists payload jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

alter table public.rollout_phases
  add column if not exists phase_key text,
  add column if not exists sort_order integer default 0,
  add column if not exists title text,
  add column if not exists short_label text,
  add column if not exists capacity integer,
  add column if not exists reserved_slots integer default 0,
  add column if not exists accepted_slots integer default 0,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists duration_days integer,
  add column if not exists status text default 'upcoming',
  add column if not exists accepting_reservations boolean default false,
  add column if not exists description text,
  add column if not exists expectation text,
  add column if not exists cta_label text,
  add column if not exists target_route text default '/contact',
  add column if not exists admin_note text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid references auth.users(id);

alter table public.rollout_waitlist
  add column if not exists phase_key text,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists fleet_size text,
  add column if not exists intended_billing_provider text default 'undecided',
  add column if not exists status text default 'submitted',
  add column if not exists source text default 'website',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.rollout_access_events
  add column if not exists rollout_waitlist_id uuid references public.rollout_waitlist(id) on delete set null,
  add column if not exists phase_key text,
  add column if not exists event_type text,
  add column if not exists actor_type text default 'system',
  add column if not exists actor_user_id uuid references auth.users(id),
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

alter table public.system_health_events
  add column if not exists title text,
  add column if not exists message text,
  add column if not exists severity text default 'info',
  add column if not exists status text default 'active',
  add column if not exists affects_onboarding boolean default false,
  add column if not exists public_visible boolean default true,
  add column if not exists starts_at timestamptz default now(),
  add column if not exists ends_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid references auth.users(id);

create index if not exists idx_website_reservations_email_created
on public.website_reservations (lower(email), created_at desc);

create index if not exists idx_support_intake_created
on public.support_intake (created_at desc);

create index if not exists idx_contact_inquiries_created
on public.contact_inquiries (created_at desc);

create index if not exists idx_newsletter_subscribers_email
on public.newsletter_subscribers (lower(email));

create index if not exists idx_email_outbox_status_created
on public.email_outbox (status, created_at desc);

create index if not exists idx_system_health_events_public_status
on public.system_health_events (public_visible, status, starts_at desc);

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'touch_updated_at'
      and p.pronargs = 0
  ) then
    execute $fn$
      create function public.touch_updated_at()
      returns trigger
      language plpgsql
      set search_path = public
      as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$
    $fn$;
  end if;
end $$;

do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('launch_program_state', 'launch_program_state_touch_updated_at'),
      ('website_reservations', 'website_reservations_touch_updated_at'),
      ('pricing_entitlements', 'pricing_entitlements_touch_updated_at'),
      ('support_intake', 'support_intake_touch_updated_at'),
      ('contact_inquiries', 'contact_inquiries_touch_updated_at'),
      ('newsletter_subscribers', 'newsletter_subscribers_touch_updated_at'),
      ('waitlist', 'waitlist_touch_updated_at'),
      ('email_outbox', 'email_outbox_touch_updated_at'),
      ('rollout_phases', 'rollout_phases_touch_updated_at'),
      ('rollout_waitlist', 'rollout_waitlist_touch_updated_at'),
      ('system_health_events', 'system_health_events_touch_updated_at')
    ) as t(table_name, trigger_name)
  loop
    if to_regclass('public.' || item.table_name) is not null and not exists (
      select 1 from pg_trigger
      where tgname = item.trigger_name
        and tgrelid = to_regclass('public.' || item.table_name)
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
        item.trigger_name,
        item.table_name
      );
    end if;
  end loop;
end $$;

insert into public.launch_program_state (
  program_key,
  display_name,
  current_phase,
  slot_limit,
  monthly_price,
  annual_price,
  reservation_enabled,
  billing_enabled,
  pricing_lock_enabled,
  waitlist_only_mode
)
values
  ('founder_50', 'Founding 50 Pilot Program', 'pre_pilot', 50, 14.99, 129.99, true, false, true, true),
  ('launch_500', 'First 500 Launch Operators', 'queued', 500, 19.99, 149.99, true, false, true, true),
  ('standard_future', 'Standard Public Access', 'standard_active', 2147483647, 24.99, 189.99, true, false, false, true)
on conflict (program_key) do nothing;

insert into public.rollout_phases (
  phase_key,
  sort_order,
  title,
  short_label,
  capacity,
  starts_at,
  ends_at,
  duration_days,
  status,
  accepting_reservations,
  description,
  expectation,
  cta_label,
  target_route
)
values
  ('PRELAUNCH_WAITLIST', 0, 'Prelaunch Waitlist', 'Waitlist', null, '2026-05-13T13:00:00Z', '2026-06-27T13:00:00Z', 45, 'active', true, 'Interest capture and operator expectation setting before founder access opens.', 'No billing is active. Visitors may reserve eligibility and follow deployment updates.', 'Reserve Eligibility', '/pilot-program'),
  ('FOUNDER_PILOT', 1, 'Founder Pilot', 'Founder 50', 50, '2026-06-27T13:00:00Z', '2026-08-11T13:00:00Z', 45, 'upcoming', true, 'First 50 approved users shape the operational pilot while deployment pressure remains controlled.', 'Access is limited, reviewed, and may pause if infrastructure or support load requires it.', 'Join Founder Pilot List', '/pilot-program'),
  ('CONTROLLED_PUBLIC_LAUNCH', 2, 'Controlled Public Launch', 'Launch 250', 250, '2026-08-11T13:00:00Z', '2026-10-10T13:00:00Z', 60, 'upcoming', true, 'A measured public launch cohort expands access after founder pilot learning is incorporated.', 'Launch access remains capacity-limited and may be throttled during operational events.', 'Join Launch Queue', '/launch-promo'),
  ('EXPANSION_ACCESS', 3, 'Expansion Access', 'Expansion 250', 250, '2026-10-10T13:00:00Z', '2027-01-08T14:00:00Z', 90, 'upcoming', true, 'A second controlled expansion cohort validates readiness before open availability.', 'Expansion access remains monitored before general availability.', 'Join Expansion Queue', '/launch-promo'),
  ('GENERAL_AVAILABILITY', 4, 'General Availability', 'GA', null, '2027-01-08T14:00:00Z', null, null, 'upcoming', false, 'Open access begins after controlled rollout readiness is validated.', 'Billing, support, and onboarding systems must remain stable before this phase opens.', 'View Pricing', '/pricing')
on conflict (phase_key) do nothing;

-- ============================================================
-- BLOCK 4: GRANTS, RLS, POLICIES, AND SERVICE-ROLE RPC
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: YES
-- AFFECTS APP TABLES: NO
-- AFFECTS WEBSITE TABLES: YES
-- ============================================================

alter table public.launch_program_state enable row level security;
alter table public.website_reservations enable row level security;
alter table public.reservation_events enable row level security;
alter table public.pricing_entitlements enable row level security;
alter table public.support_intake enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.waitlist enable row level security;
alter table public.email_outbox enable row level security;
alter table public.email_delivery_events enable row level security;
alter table public.rollout_phases enable row level security;
alter table public.rollout_waitlist enable row level security;
alter table public.rollout_access_events enable row level security;
alter table public.system_health_events enable row level security;

grant usage on schema public to anon, authenticated, service_role;

revoke all privileges on
  public.launch_program_state,
  public.website_reservations,
  public.reservation_events,
  public.pricing_entitlements,
  public.support_intake,
  public.contact_inquiries,
  public.newsletter_subscribers,
  public.waitlist,
  public.email_outbox,
  public.email_delivery_events,
  public.rollout_phases,
  public.rollout_waitlist,
  public.rollout_access_events,
  public.system_health_events
from anon, authenticated, service_role;

grant select on public.rollout_phases to anon, authenticated;
grant select on public.system_health_events to anon, authenticated;
grant select on public.launch_program_state to authenticated;

grant insert on
  public.website_reservations,
  public.support_intake,
  public.contact_inquiries,
  public.newsletter_subscribers,
  public.waitlist,
  public.rollout_waitlist
to anon, authenticated;

grant select, insert, update, delete on
  public.launch_program_state,
  public.website_reservations,
  public.reservation_events,
  public.pricing_entitlements,
  public.support_intake,
  public.contact_inquiries,
  public.newsletter_subscribers,
  public.waitlist,
  public.email_outbox,
  public.email_delivery_events,
  public.rollout_phases,
  public.rollout_waitlist,
  public.rollout_access_events,
  public.system_health_events
to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rollout_phases'
      and policyname = 'Public can read rollout phases'
  ) then
    create policy "Public can read rollout phases"
      on public.rollout_phases
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_health_events'
      and policyname = 'Public can read visible system health events'
  ) then
    create policy "Public can read visible system health events"
      on public.system_health_events
      for select
      to anon, authenticated
      using (public_visible = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'website_reservations'
      and policyname = 'Public can submit website reservations'
  ) then
    create policy "Public can submit website reservations"
      on public.website_reservations
      for insert
      to anon, authenticated
      with check (status = 'submitted');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_intake'
      and policyname = 'Public can submit support intake'
  ) then
    create policy "Public can submit support intake"
      on public.support_intake
      for insert
      to anon, authenticated
      with check (status = 'new');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_inquiries'
      and policyname = 'Public can submit contact inquiries'
  ) then
    create policy "Public can submit contact inquiries"
      on public.contact_inquiries
      for insert
      to anon, authenticated
      with check (status = 'new');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'newsletter_subscribers'
      and policyname = 'Public can subscribe to newsletter'
  ) then
    create policy "Public can subscribe to newsletter"
      on public.newsletter_subscribers
      for insert
      to anon, authenticated
      with check (status = 'subscribed');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'waitlist'
      and policyname = 'Public can submit legacy waitlist'
  ) then
    create policy "Public can submit legacy waitlist"
      on public.waitlist
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rollout_waitlist'
      and policyname = 'Public can submit rollout waitlist'
  ) then
    create policy "Public can submit rollout waitlist"
      on public.rollout_waitlist
      for insert
      to anon, authenticated
      with check (status = 'submitted');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'submit_website_reservation'
      and p.pronargs = 7
  ) then
    execute $fn$
      create function public.submit_website_reservation(
        p_name text,
        p_email text,
        p_company text default null,
        p_fleet_size text default null,
        p_requested_cohort text default 'founder_50',
        p_intended_billing_provider text default 'undecided',
        p_source text default 'website'
      )
      returns table (
        reservation_id uuid,
        already_exists boolean,
        assigned_cohort text,
        pricing_lock_tier text
      )
      language plpgsql
      set search_path = public
      as $body$
      declare
        program_row public.launch_program_state%rowtype;
        existing_row public.website_reservations%rowtype;
        normalized_email text;
      begin
        normalized_email := lower(trim(p_email));

        if trim(coalesce(p_name, '')) = '' or normalized_email = '' then
          raise exception 'Name and email are required';
        end if;

        if p_requested_cohort not in ('founder_50', 'launch_500', 'standard_future') then
          p_requested_cohort := 'founder_50';
        end if;

        if p_intended_billing_provider not in ('stripe_web', 'apple_app_store', 'google_play', 'undecided') then
          p_intended_billing_provider := 'undecided';
        end if;

        select *
          into program_row
          from public.launch_program_state
          where program_key = p_requested_cohort
          for update;

        if not found or not program_row.reservation_enabled then
          raise exception 'Reservations are not available for this cohort';
        end if;

        select *
          into existing_row
          from public.website_reservations wr
          where lower(wr.email) = normalized_email
            and wr.assigned_cohort = p_requested_cohort;

        if found then
          insert into public.reservation_events (reservation_id, event_type, actor_type, metadata)
          values (
            existing_row.id,
            'duplicate_submission',
            'public_visitor',
            jsonb_build_object('source', p_source, 'intended_billing_provider', p_intended_billing_provider)
          );

          reservation_id := existing_row.id;
          already_exists := true;
          assigned_cohort := existing_row.assigned_cohort;
          pricing_lock_tier := existing_row.pricing_lock_tier;
          return next;
          return;
        end if;

        if program_row.slots_reserved >= program_row.slot_limit then
          raise exception 'No reservation slots remain for this cohort';
        end if;

        insert into public.website_reservations (
          name,
          email,
          company,
          fleet_size,
          requested_cohort,
          assigned_cohort,
          intended_billing_provider,
          pricing_lock_tier,
          status,
          source
        )
        values (
          trim(p_name),
          normalized_email,
          nullif(trim(coalesce(p_company, '')), ''),
          nullif(trim(coalesce(p_fleet_size, '')), ''),
          p_requested_cohort,
          p_requested_cohort,
          p_intended_billing_provider,
          case
            when p_requested_cohort = 'founder_50' then 'founder_50'
            when p_requested_cohort = 'launch_500' then 'launch_500'
            else 'standard'
          end,
          'submitted',
          p_source
        )
        returning * into existing_row;

        update public.launch_program_state
          set slots_reserved = slots_reserved + 1
          where program_key = p_requested_cohort;

        insert into public.reservation_events (reservation_id, event_type, actor_type, metadata)
        values (
          existing_row.id,
          'reservation_submitted',
          'public_visitor',
          jsonb_build_object('source', p_source, 'intended_billing_provider', p_intended_billing_provider)
        );

        if p_requested_cohort in ('founder_50', 'launch_500') then
          insert into public.pricing_entitlements (
            reservation_id,
            email,
            cohort,
            pricing_lock_tier,
            monthly_price,
            annual_price,
            intended_billing_provider,
            status,
            active,
            source
          )
          values (
            existing_row.id,
            normalized_email,
            p_requested_cohort,
            existing_row.pricing_lock_tier,
            program_row.monthly_price,
            program_row.annual_price,
            p_intended_billing_provider,
            'pending_review',
            false,
            'website_reservation'
          );
        end if;

        reservation_id := existing_row.id;
        already_exists := false;
        assigned_cohort := existing_row.assigned_cohort;
        pricing_lock_tier := existing_row.pricing_lock_tier;
        return next;
      end;
      $body$
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'submit_rollout_waitlist'
      and p.pronargs = 7
  ) then
    execute $fn$
      create function public.submit_rollout_waitlist(
        p_phase_key text,
        p_name text,
        p_email text,
        p_company text default null,
        p_fleet_size text default null,
        p_intended_billing_provider text default 'undecided',
        p_source text default 'website'
      )
      returns table (
        rollout_waitlist_id uuid,
        already_exists boolean,
        phase_key text
      )
      language plpgsql
      set search_path = public
      as $body$
      declare
        phase_row public.rollout_phases%rowtype;
        waitlist_row public.rollout_waitlist%rowtype;
        normalized_email text;
      begin
        normalized_email := lower(trim(p_email));

        if trim(coalesce(p_name, '')) = '' or normalized_email = '' then
          raise exception 'Name and email are required';
        end if;

        select *
          into phase_row
          from public.rollout_phases
          where rollout_phases.phase_key = p_phase_key
          for update;

        if not found or not phase_row.accepting_reservations then
          raise exception 'Rollout phase is not accepting reservations';
        end if;

        select *
          into waitlist_row
          from public.rollout_waitlist rw
          where lower(rw.email) = normalized_email
            and rw.phase_key = p_phase_key;

        if found then
          insert into public.rollout_access_events (rollout_waitlist_id, phase_key, event_type, actor_type, metadata)
          values (
            waitlist_row.id,
            waitlist_row.phase_key,
            'duplicate_submission',
            'public_visitor',
            jsonb_build_object('source', p_source)
          );

          rollout_waitlist_id := waitlist_row.id;
          already_exists := true;
          phase_key := waitlist_row.phase_key;
          return next;
          return;
        end if;

        if phase_row.capacity is not null and phase_row.reserved_slots >= phase_row.capacity then
          raise exception 'No rollout slots remain for this phase';
        end if;

        insert into public.rollout_waitlist (
          phase_key,
          name,
          email,
          company,
          fleet_size,
          intended_billing_provider,
          status,
          source
        )
        values (
          p_phase_key,
          trim(p_name),
          normalized_email,
          nullif(trim(coalesce(p_company, '')), ''),
          nullif(trim(coalesce(p_fleet_size, '')), ''),
          p_intended_billing_provider,
          'submitted',
          p_source
        )
        returning * into waitlist_row;

        update public.rollout_phases
          set reserved_slots = reserved_slots + 1
          where rollout_phases.phase_key = p_phase_key;

        insert into public.rollout_access_events (rollout_waitlist_id, phase_key, event_type, actor_type, metadata)
        values (
          waitlist_row.id,
          waitlist_row.phase_key,
          'waitlist_submitted',
          'public_visitor',
          jsonb_build_object('source', p_source)
        );

        rollout_waitlist_id := waitlist_row.id;
        already_exists := false;
        phase_key := waitlist_row.phase_key;
        return next;
      end;
      $body$
    $fn$;
  end if;
end $$;

revoke all on function public.submit_website_reservation(text, text, text, text, text, text, text)
from public, anon, authenticated;

revoke all on function public.submit_rollout_waitlist(text, text, text, text, text, text, text)
from public, anon, authenticated;

grant execute on function public.submit_website_reservation(text, text, text, text, text, text, text)
to service_role;

grant execute on function public.submit_rollout_waitlist(text, text, text, text, text, text, text)
to service_role;

-- ============================================================
-- SOURCE: subscription_trials_lifetime_entitlements
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260516170113_subscription_trials_and_lifetime_entitlements.sql
-- ============================================================

-- Subscription trials and lifetime entitlement compatibility fields.
--
-- Additive only. This migration does not create payment/card/bank/token fields,
-- does not drop existing columns, and does not backfill assumptions into
-- existing rows.
--
-- Trial semantics:
-- - trial_duration_days stores the intended trial length, currently 7 days.
-- - trial_status is lifecycle metadata such as eligible, active, ended,
--   cancelled, unavailable, or unknown.
-- - billing_starts_at is the expected first-billing marker when known.
--
-- Lifetime/future feature semantics:
-- Pilot/Launch future feature access means future released Karpilo LoadIQ
-- platform features made generally available within the platform ecosystem.
-- It does not mean unlimited custom enterprise development, legal/tax/accounting
-- services, or unrelated future products.

alter table public.subscriptions
  add column if not exists trial_duration_days integer,
  add column if not exists trial_status text,
  add column if not exists billing_starts_at timestamptz,
  add column if not exists lifetime_price_lock boolean,
  add column if not exists future_feature_access_scope text,
  add column if not exists cohort_phase text,
  add column if not exists cohort_cap integer,
  add column if not exists price_subject_to_change boolean,
  add column if not exists entitlement_status text;

alter table if exists public.pricing_entitlements
  add column if not exists trial_duration_days integer,
  add column if not exists lifetime_price_lock boolean,
  add column if not exists future_feature_access_scope text,
  add column if not exists cohort_phase text,
  add column if not exists cohort_cap integer,
  add column if not exists price_subject_to_change boolean,
  add column if not exists entitlement_status text;

alter table if exists public.operator_pricing_locks
  add column if not exists future_feature_access_scope text,
  add column if not exists price_subject_to_change boolean,
  add column if not exists cohort_phase text,
  add column if not exists cohort_cap integer;

alter table if exists public.pricing_lock_status
  add column if not exists future_feature_access_scope text,
  add column if not exists price_subject_to_change boolean,
  add column if not exists cohort_phase text,
  add column if not exists cohort_cap integer;

create index if not exists idx_subscriptions_entitlement_status
  on public.subscriptions (entitlement_status, created_at desc)
  where entitlement_status is not null;

create index if not exists idx_subscriptions_trial_status
  on public.subscriptions (trial_status, trial_end)
  where trial_status is not null;

do $$
begin
  if to_regclass('public.pricing_entitlements') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'entitlement_status'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'created_at'
    )
  then
    execute 'create index if not exists idx_pricing_entitlements_entitlement_status on public.pricing_entitlements (entitlement_status, created_at desc) where entitlement_status is not null';
  end if;

  if to_regclass('public.pricing_entitlements') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'lifetime_price_lock'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'cohort'
    )
  then
    execute 'create index if not exists idx_pricing_entitlements_lifetime_lock on public.pricing_entitlements (lifetime_price_lock, cohort) where lifetime_price_lock is true';
  end if;
end $$;

comment on column public.subscriptions.trial_duration_days is
  'Configured subscription trial duration in days. Current product intent is 7 days for paid tiers where provider rules allow.';

comment on column public.subscriptions.trial_status is
  'Trial lifecycle metadata such as eligible, active, ended, cancelled, unavailable, or unknown.';

comment on column public.subscriptions.billing_starts_at is
  'Expected billing start timestamp when known. This is metadata only; payment processors remain the source of charge timing.';

comment on column public.subscriptions.lifetime_price_lock is
  'True when the subscription is protected by approved Pilot/Launch lifetime pricing lock rules.';

comment on column public.subscriptions.future_feature_access_scope is
  'Scope of future released Karpilo LoadIQ platform features included for a protected tier. Excludes custom enterprise development, legal/tax/accounting services, and unrelated future products.';

comment on column public.subscriptions.cohort_phase is
  'Launch, pilot, legacy, or standard cohort phase metadata used for entitlement reporting and reconciliation.';

comment on column public.subscriptions.cohort_cap is
  'Cohort seat cap metadata, such as 50 Pilot seats or 500 Launch seats, when applicable.';

comment on column public.subscriptions.price_subject_to_change is
  'True when plan pricing may change for future billing periods or future subscribers.';

comment on column public.subscriptions.entitlement_status is
  'Normalized access status used by app entitlement logic, separate from provider-specific subscription status.';

do $$
begin
  if to_regclass('public.pricing_entitlements') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'trial_duration_days') then
      execute 'comment on column public.pricing_entitlements.trial_duration_days is ''Reservation/pricing entitlement trial duration in days when eligibility is known.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'lifetime_price_lock') then
      execute 'comment on column public.pricing_entitlements.lifetime_price_lock is ''True when the reservation or pricing entitlement carries approved Pilot/Launch lifetime pricing protection.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'future_feature_access_scope') then
      execute 'comment on column public.pricing_entitlements.future_feature_access_scope is ''Reservation/pricing-lock scope for future released Karpilo LoadIQ platform features. Excludes custom enterprise development, legal/tax/accounting services, and unrelated future products.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'cohort_phase') then
      execute 'comment on column public.pricing_entitlements.cohort_phase is ''Reservation cohort phase metadata for pilot, launch, legacy, standard, or future rollout classification.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'cohort_cap') then
      execute 'comment on column public.pricing_entitlements.cohort_cap is ''Cohort seat cap metadata tied to reservation or pricing entitlement classification.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'price_subject_to_change') then
      execute 'comment on column public.pricing_entitlements.price_subject_to_change is ''True when pricing may change for future users or future billing periods outside protected entitlement rules.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'entitlement_status') then
      execute 'comment on column public.pricing_entitlements.entitlement_status is ''Normalized entitlement/access status for reservation-to-subscription reconciliation.''';
    end if;
  end if;

  if to_regclass('public.operator_pricing_locks') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'operator_pricing_locks' and column_name = 'future_feature_access_scope') then
      execute 'comment on column public.operator_pricing_locks.future_feature_access_scope is ''Immutable pricing-lock scope for future released Karpilo LoadIQ platform features. Excludes custom enterprise development, legal/tax/accounting services, and unrelated future products.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'operator_pricing_locks' and column_name = 'price_subject_to_change') then
      execute 'comment on column public.operator_pricing_locks.price_subject_to_change is ''True when future pricing may change outside this immutable pricing lock.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'operator_pricing_locks' and column_name = 'cohort_phase') then
      execute 'comment on column public.operator_pricing_locks.cohort_phase is ''Immutable pilot, launch, legacy, standard, or future cohort phase classification for this pricing lock.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'operator_pricing_locks' and column_name = 'cohort_cap') then
      execute 'comment on column public.operator_pricing_locks.cohort_cap is ''Cohort seat cap metadata associated with this immutable pricing lock.''';
    end if;
  end if;

  if to_regclass('public.pricing_lock_status') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_lock_status' and column_name = 'future_feature_access_scope') then
      execute 'comment on column public.pricing_lock_status.future_feature_access_scope is ''Current pricing-lock status scope for future released Karpilo LoadIQ platform features. Excludes custom enterprise development, legal/tax/accounting services, and unrelated future products.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_lock_status' and column_name = 'price_subject_to_change') then
      execute 'comment on column public.pricing_lock_status.price_subject_to_change is ''True when future pricing may change outside this active or historical pricing lock state.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_lock_status' and column_name = 'cohort_phase') then
      execute 'comment on column public.pricing_lock_status.cohort_phase is ''Pilot, launch, legacy, standard, or future cohort phase classification for current pricing-lock status.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_lock_status' and column_name = 'cohort_cap') then
      execute 'comment on column public.pricing_lock_status.cohort_cap is ''Cohort seat cap metadata associated with current pricing-lock status.''';
    end if;
  end if;
end $$;

-- ============================================================
-- VERIFICATION SQL - DO NOT RUN AUTOMATICALLY
-- ============================================================
--
-- with expected(table_name, column_name) as (
--   values
--     ('subscriptions', 'trial_duration_days'),
--     ('subscriptions', 'trial_status'),
--     ('subscriptions', 'billing_starts_at'),
--     ('subscriptions', 'lifetime_price_lock'),
--     ('subscriptions', 'future_feature_access_scope'),
--     ('subscriptions', 'cohort_phase'),
--     ('subscriptions', 'cohort_cap'),
--     ('subscriptions', 'price_subject_to_change'),
--     ('subscriptions', 'entitlement_status'),
--     ('pricing_entitlements', 'trial_duration_days'),
--     ('pricing_entitlements', 'lifetime_price_lock'),
--     ('pricing_entitlements', 'future_feature_access_scope'),
--     ('pricing_entitlements', 'cohort_phase'),
--     ('pricing_entitlements', 'cohort_cap'),
--     ('pricing_entitlements', 'price_subject_to_change'),
--     ('pricing_entitlements', 'entitlement_status'),
--     ('operator_pricing_locks', 'future_feature_access_scope'),
--     ('operator_pricing_locks', 'price_subject_to_change'),
--     ('operator_pricing_locks', 'cohort_phase'),
--     ('operator_pricing_locks', 'cohort_cap'),
--     ('pricing_lock_status', 'future_feature_access_scope'),
--     ('pricing_lock_status', 'price_subject_to_change'),
--     ('pricing_lock_status', 'cohort_phase'),
--     ('pricing_lock_status', 'cohort_cap')
-- )
-- select
--   expected.table_name,
--   expected.column_name,
--   columns.data_type,
--   columns.is_nullable,
--   columns.column_default,
--   columns.column_name is not null as exists_live
-- from expected
-- left join information_schema.columns columns
--   on columns.table_schema = 'public'
--  and columns.table_name = expected.table_name
--  and columns.column_name = expected.column_name
-- order by expected.table_name, expected.column_name;
--
-- select schemaname, tablename, indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and indexname in (
--     'idx_subscriptions_entitlement_status',
--     'idx_subscriptions_trial_status',
--     'idx_pricing_entitlements_entitlement_status',
--     'idx_pricing_entitlements_lifetime_lock'
--   )
-- order by tablename, indexname;
--
-- ============================================================
-- ROLLBACK SQL - REVIEW BEFORE MANUAL USE
-- ============================================================
--
-- drop index if exists public.idx_pricing_entitlements_lifetime_lock;
-- drop index if exists public.idx_pricing_entitlements_entitlement_status;
-- drop index if exists public.idx_subscriptions_trial_status;
-- drop index if exists public.idx_subscriptions_entitlement_status;
--
-- alter table public.pricing_lock_status
--   drop column if exists cohort_cap,
--   drop column if exists cohort_phase,
--   drop column if exists price_subject_to_change,
--   drop column if exists future_feature_access_scope;
--
-- alter table public.operator_pricing_locks
--   drop column if exists cohort_cap,
--   drop column if exists cohort_phase,
--   drop column if exists price_subject_to_change,
--   drop column if exists future_feature_access_scope;
--
-- alter table public.pricing_entitlements
--   drop column if exists entitlement_status,
--   drop column if exists price_subject_to_change,
--   drop column if exists cohort_cap,
--   drop column if exists cohort_phase,
--   drop column if exists future_feature_access_scope,
--   drop column if exists lifetime_price_lock,
--   drop column if exists trial_duration_days;
--
-- alter table public.subscriptions
--   drop column if exists entitlement_status,
--   drop column if exists price_subject_to_change,
--   drop column if exists cohort_cap,
--   drop column if exists cohort_phase,
--   drop column if exists future_feature_access_scope,
--   drop column if exists lifetime_price_lock,
--   drop column if exists billing_starts_at,
--   drop column if exists trial_status,
--   drop column if exists trial_duration_days;

-- ============================================================
-- SOURCE: internal_billing_test_accounts
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260516191850_internal_billing_test_account_parameters.sql
-- ============================================================

-- Internal billing/entitlement test account parameters.
-- Additive-only support for a single authorized dummy account used to validate
-- entitlement display, save-load gating, trial states, and billing UI behavior.
--
-- This table is not production billing authority and must not be treated as
-- proof of Stripe, Apple, Google Play, or manual payment.

create extension if not exists pgcrypto;

create table if not exists public.internal_billing_test_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  enabled boolean not null default false,
  simulated_state text not null,
  entitlement_status text,
  tier text,
  program text,
  trial_status text,
  trial_duration_days integer,
  trial_start timestamptz,
  trial_end timestamptz,
  billing_starts_at timestamptz,
  lifetime_price_lock boolean,
  future_feature_access_scope text,
  cohort_phase text,
  cohort_cap integer,
  price_subject_to_change boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internal_billing_test_accounts_authorized_email_check
    check (lower(email) = 'karpilotrucking@outlook.com'),
  constraint internal_billing_test_accounts_simulated_state_check
    check (
      simulated_state in (
        'no_subscription',
        'gold_trial_active',
        'gold_trial_expired',
        'gold_active',
        'gold_past_due',
        'gold_canceled',
        'pilot_lifetime_full_access',
        'launch_lifetime_full_access',
        'platinum_coming_soon'
      )
    ),
  constraint internal_billing_test_accounts_trial_duration_check
    check (trial_duration_days is null or trial_duration_days >= 0),
  constraint internal_billing_test_accounts_cohort_cap_check
    check (cohort_cap is null or cohort_cap >= 0)
);

create unique index if not exists internal_billing_test_accounts_email_lower_key
  on public.internal_billing_test_accounts (lower(email));

do $$
begin
  if to_regprocedure('app_private.touch_updated_at()') is not null then
    drop trigger if exists internal_billing_test_accounts_touch_updated_at
      on public.internal_billing_test_accounts;

    create trigger internal_billing_test_accounts_touch_updated_at
      before update on public.internal_billing_test_accounts
      for each row execute function app_private.touch_updated_at();
  end if;
end $$;

alter table public.internal_billing_test_accounts enable row level security;

revoke all on public.internal_billing_test_accounts from public;
revoke all on public.internal_billing_test_accounts from anon;
revoke all on public.internal_billing_test_accounts from authenticated;
grant select, insert, update, delete on public.internal_billing_test_accounts to service_role;

comment on table public.internal_billing_test_accounts is
  'Service-controlled internal test account parameters for Karpilo LoadIQ billing and entitlement validation. Not production billing authority or proof of payment.';
comment on column public.internal_billing_test_accounts.email is
  'Restricted by check constraint to the authorized internal dummy account only.';
comment on column public.internal_billing_test_accounts.enabled is
  'Disabled by default. Server-side code must opt in before consuming simulated entitlement state.';
comment on column public.internal_billing_test_accounts.simulated_state is
  'Named internal simulation state for billing UI, trial, save-load gating, and entitlement display testing.';
comment on column public.internal_billing_test_accounts.entitlement_status is
  'Simulated normalized entitlement status for internal testing only.';
comment on column public.internal_billing_test_accounts.tier is
  'Simulated plan tier for internal testing only; does not prove payment or subscription ownership.';
comment on column public.internal_billing_test_accounts.program is
  'Simulated program/cohort code for internal testing only.';
comment on column public.internal_billing_test_accounts.trial_status is
  'Simulated trial lifecycle status for internal testing only.';
comment on column public.internal_billing_test_accounts.trial_duration_days is
  'Simulated trial length in days when the selected state represents trial behavior.';
comment on column public.internal_billing_test_accounts.billing_starts_at is
  'Simulated billing start timestamp for internal UI validation only.';
comment on column public.internal_billing_test_accounts.lifetime_price_lock is
  'Simulated lifetime price-lock flag for internal display validation only.';
comment on column public.internal_billing_test_accounts.future_feature_access_scope is
  'Simulated future-feature access scope. Pilot/Launch scope means future released Karpilo LoadIQ platform features made generally available within the platform ecosystem; it does not mean custom enterprise development, legal/tax/accounting services, or unrelated future products.';
comment on column public.internal_billing_test_accounts.cohort_phase is
  'Simulated cohort phase for Pilot/Launch billing display testing.';
comment on column public.internal_billing_test_accounts.cohort_cap is
  'Simulated cohort cap for Pilot/Launch billing display testing.';
comment on column public.internal_billing_test_accounts.price_subject_to_change is
  'Simulated price-change flag for internal display testing only.';
comment on column public.internal_billing_test_accounts.notes is
  'Internal notes describing the dummy billing/entitlement test record.';

insert into public.internal_billing_test_accounts (
  email,
  enabled,
  simulated_state,
  entitlement_status,
  tier,
  program,
  trial_status,
  trial_duration_days,
  lifetime_price_lock,
  future_feature_access_scope,
  cohort_phase,
  cohort_cap,
  price_subject_to_change,
  notes
)
select
  'Karpilotrucking@outlook.com',
  false,
  'pilot_lifetime_full_access',
  'active',
  'pilot',
  'pilot',
  'not_required',
  null,
  true,
  'lifetime_access_to_future_released_karpilo_loadiq_platform_features',
  'pilot',
  50,
  false,
  'Internal dummy billing/entitlement test account only. Not a real Stripe subscriber.'
where not exists (
  select 1
  from public.internal_billing_test_accounts
  where lower(email) = 'karpilotrucking@outlook.com'
);

-- VERIFICATION SQL - do not run automatically
--
-- select
--   schemaname,
--   tablename,
--   rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename = 'internal_billing_test_accounts';
--
-- select
--   column_name,
--   data_type,
--   is_nullable,
--   column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'internal_billing_test_accounts'
-- order by ordinal_position;
--
-- select
--   indexname,
--   indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'internal_billing_test_accounts'
-- order by indexname;
--
-- select
--   grantee,
--   privilege_type
-- from information_schema.table_privileges
-- where table_schema = 'public'
--   and table_name = 'internal_billing_test_accounts'
-- order by grantee, privilege_type;
--
-- select *
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'internal_billing_test_accounts';
--
-- select
--   email,
--   enabled,
--   simulated_state,
--   entitlement_status,
--   tier,
--   program,
--   trial_status,
--   lifetime_price_lock,
--   future_feature_access_scope,
--   cohort_phase,
--   cohort_cap,
--   price_subject_to_change,
--   notes
-- from public.internal_billing_test_accounts
-- where lower(email) = 'karpilotrucking@outlook.com';

-- ROLLBACK SQL - review before manual use
--
-- begin;
-- drop table if exists public.internal_billing_test_accounts;
-- commit;

-- ============================================================
-- SOURCE: route_intelligence_expansion
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260516214453_route_intelligence_expansion.sql
-- ============================================================

-- Phase 2 route intelligence expansion.
-- Additive only. Do not run destructive drops in this migration.

create extension if not exists "pgcrypto";

-- Route intelligence depends on the core app profile/load tables. Fail loudly
-- instead of silently skipping core work against a broken or wrong project.
do $$
begin
  if to_regclass('public.saved_loads') is null then
    raise exception 'Route intelligence migration requires public.saved_loads to exist. Apply the core app schema before this migration.';
  end if;

  if to_regclass('public.users') is null then
    raise exception 'Route intelligence migration requires public.users to exist. Apply the core app profile schema before this migration.';
  end if;
end
$$;

-- saved_loads route-intelligence snapshots.
alter table public.saved_loads
  add column if not exists deadhead_start_city text,
  add column if not exists deadhead_start_state text,
  add column if not exists deadhead_start_zip text,
  add column if not exists estimated_load_weight_lbs integer,
  add column if not exists route_stop_count integer,
  add column if not exists route_model_version text,
  add column if not exists reserve_allocation_mode text,
  add column if not exists reserve_allocation_cpm numeric,
  add column if not exists reserve_allocation_percent numeric,
  add column if not exists target_true_rpm_snapshot numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_estimated_load_weight_lbs_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_estimated_load_weight_lbs_nonnegative
      check (estimated_load_weight_lbs is null or estimated_load_weight_lbs >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_route_stop_count_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_route_stop_count_nonnegative
      check (route_stop_count is null or route_stop_count >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_reserve_allocation_mode_valid'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_reserve_allocation_mode_valid
      check (
        reserve_allocation_mode is null
        or reserve_allocation_mode in ('flat', 'cpm', 'percent')
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_reserve_allocation_cpm_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_reserve_allocation_cpm_nonnegative
      check (reserve_allocation_cpm is null or reserve_allocation_cpm >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_reserve_allocation_percent_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_reserve_allocation_percent_nonnegative
      check (
        reserve_allocation_percent is null
        or reserve_allocation_percent >= 0
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_target_true_rpm_snapshot_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_target_true_rpm_snapshot_nonnegative
      check (target_true_rpm_snapshot is null or target_true_rpm_snapshot >= 0)
      not valid;
  end if;
end
$$;

comment on column public.saved_loads.deadhead_start_city is
  'Optional deadhead origin city used for operational pre-pickup cost modeling.';
comment on column public.saved_loads.deadhead_start_state is
  'Optional deadhead origin state used for operational pre-pickup cost modeling.';
comment on column public.saved_loads.deadhead_start_zip is
  'Optional deadhead origin ZIP used for operational pre-pickup cost modeling.';
comment on column public.saved_loads.estimated_load_weight_lbs is
  'Estimated or speculative load weight in pounds; not scale-certified unless verified elsewhere.';
comment on column public.saved_loads.route_stop_count is
  'Snapshot count of modeled route stops for historical route-intelligence consistency.';
comment on column public.saved_loads.route_model_version is
  'Version label for the operational route model used when the load was calculated.';
comment on column public.saved_loads.reserve_allocation_mode is
  'Historical reserve allocation mode snapshot: flat, cpm, or percent.';
comment on column public.saved_loads.reserve_allocation_cpm is
  'Historical reserve allocation CPM snapshot used to protect saved-load math consistency.';
comment on column public.saved_loads.reserve_allocation_percent is
  'Historical reserve allocation percent snapshot used to protect saved-load math consistency.';
comment on column public.saved_loads.target_true_rpm_snapshot is
  'Historical user target true RPM baseline used when the load was calculated.';

-- Route stops are operational modeling records, not routing API truth.
create table if not exists public.saved_load_stops (
  id uuid primary key default gen_random_uuid(),
  saved_load_id uuid not null references public.saved_loads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  stop_sequence integer not null,
  stop_type text not null,
  city text,
  state text,
  zip text,
  miles_from_previous numeric,
  stop_revenue numeric,
  stop_expense numeric,
  notes text,
  created_at timestamptz default now(),
  constraint saved_load_stops_stop_sequence_positive
    check (stop_sequence >= 1),
  constraint saved_load_stops_stop_type_valid
    check (stop_type in ('pickup', 'stop_off', 'delivery')),
  constraint saved_load_stops_miles_from_previous_nonnegative
    check (miles_from_previous is null or miles_from_previous >= 0),
  constraint saved_load_stops_stop_revenue_nonnegative
    check (stop_revenue is null or stop_revenue >= 0),
  constraint saved_load_stops_stop_expense_nonnegative
    check (stop_expense is null or stop_expense >= 0),
  constraint saved_load_stops_saved_load_sequence_unique
    unique (saved_load_id, stop_sequence)
);

comment on table public.saved_load_stops is
  'Operational route-stop modeling table for pickup, stop-off, and delivery sequences. These rows are user-modeled and are not routing API truth.';
comment on column public.saved_load_stops.saved_load_id is
  'Parent saved load for this modeled route stop.';
comment on column public.saved_load_stops.user_id is
  'Owner user id used for RLS and service-side validation.';
comment on column public.saved_load_stops.stop_sequence is
  'One-based route stop sequence within the saved load.';
comment on column public.saved_load_stops.stop_type is
  'Operational stop type: pickup, stop_off, or delivery.';
comment on column public.saved_load_stops.miles_from_previous is
  'Estimated operational miles from the previous modeled stop.';
comment on column public.saved_load_stops.stop_revenue is
  'Optional estimated stop-level revenue or accessorial amount.';
comment on column public.saved_load_stops.stop_expense is
  'Optional estimated stop-level expense.';

alter table public.saved_load_stops enable row level security;

revoke all on public.saved_load_stops from public;
revoke all on public.saved_load_stops from anon;
revoke all on public.saved_load_stops from authenticated;

grant select, insert, update, delete on public.saved_load_stops to authenticated;
grant all on public.saved_load_stops to service_role;

create index if not exists idx_saved_load_stops_user_load_sequence
on public.saved_load_stops (user_id, saved_load_id, stop_sequence);

-- Recreate mutation policies so future runs cannot preserve an older policy
-- that only checked saved_load_stops.user_id without validating parent load
-- ownership.
drop policy if exists "Users can insert own saved load stops"
on public.saved_load_stops;

drop policy if exists "Users can update own saved load stops"
on public.saved_load_stops;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_load_stops'
      and policyname = 'Users can view own saved load stops'
  ) then
    create policy "Users can view own saved load stops"
    on public.saved_load_stops
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_load_stops'
      and policyname = 'Users can insert own saved load stops'
  ) then
    create policy "Users can insert own saved load stops"
    on public.saved_load_stops
    for insert
    to authenticated
    with check (
      auth.uid() = user_id
      and exists (
        select 1
        from public.saved_loads sl
        where sl.id = saved_load_id
          and sl.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_load_stops'
      and policyname = 'Users can update own saved load stops'
  ) then
    create policy "Users can update own saved load stops"
    on public.saved_load_stops
    for update
    to authenticated
    using (
      auth.uid() = user_id
      and exists (
        select 1
        from public.saved_loads sl
        where sl.id = saved_load_id
          and sl.user_id = auth.uid()
      )
    )
    with check (
      auth.uid() = user_id
      and exists (
        select 1
        from public.saved_loads sl
        where sl.id = saved_load_id
          and sl.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_load_stops'
      and policyname = 'Users can delete own saved load stops'
  ) then
    create policy "Users can delete own saved load stops"
    on public.saved_load_stops
    for delete
    to authenticated
    using (auth.uid() = user_id);
  end if;
end
$$;

-- Optional vehicle intelligence expansion. Guarded because older/live projects
-- may not have truck_profiles yet.
alter table if exists public.truck_profiles
  add column if not exists trailer_division_type text,
  add column if not exists trailer_type text,
  add column if not exists vehicle_tare_weight_lbs integer,
  add column if not exists estimated_max_gross_lbs integer,
  add column if not exists operational_classification text;

do $$
begin
  if to_regclass('public.truck_profiles') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.truck_profiles'::regclass
        and conname = 'truck_profiles_vehicle_tare_weight_lbs_nonnegative'
    ) then
      alter table public.truck_profiles
        add constraint truck_profiles_vehicle_tare_weight_lbs_nonnegative
        check (
          vehicle_tare_weight_lbs is null
          or vehicle_tare_weight_lbs >= 0
        )
        not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.truck_profiles'::regclass
        and conname = 'truck_profiles_estimated_max_gross_lbs_nonnegative'
    ) then
      alter table public.truck_profiles
        add constraint truck_profiles_estimated_max_gross_lbs_nonnegative
        check (
          estimated_max_gross_lbs is null
          or estimated_max_gross_lbs >= 0
        )
        not valid;
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.truck_profiles') is not null then
    execute 'comment on column public.truck_profiles.trailer_division_type is ''Optional trailer/division category for future operational analytics.''';
    execute 'comment on column public.truck_profiles.trailer_type is ''Optional trailer type for future equipment-aware profitability modeling.''';
    execute 'comment on column public.truck_profiles.vehicle_tare_weight_lbs is ''Estimated vehicle tare weight in pounds for operational modeling; not certified scale data unless verified elsewhere.''';
    execute 'comment on column public.truck_profiles.estimated_max_gross_lbs is ''Optional estimated maximum gross weight for future equipment and load-weight analytics.''';
    execute 'comment on column public.truck_profiles.operational_classification is ''Optional operational classification for future vehicle intelligence.''';
  end if;
end
$$;

-- Optional user default reserve mode expansion. Guarded because older/live
-- projects may not have user_settings yet.
alter table if exists public.user_settings
  add column if not exists reserve_allocation_mode text,
  add column if not exists reserve_allocation_cpm numeric,
  add column if not exists reserve_allocation_percent numeric;

do $$
begin
  if to_regclass('public.user_settings') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.user_settings'::regclass
        and conname = 'user_settings_reserve_allocation_mode_valid'
    ) then
      alter table public.user_settings
        add constraint user_settings_reserve_allocation_mode_valid
        check (
          reserve_allocation_mode is null
          or reserve_allocation_mode in ('flat', 'cpm', 'percent')
        )
        not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.user_settings'::regclass
        and conname = 'user_settings_reserve_allocation_cpm_nonnegative'
    ) then
      alter table public.user_settings
        add constraint user_settings_reserve_allocation_cpm_nonnegative
        check (reserve_allocation_cpm is null or reserve_allocation_cpm >= 0)
        not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.user_settings'::regclass
        and conname = 'user_settings_reserve_allocation_percent_nonnegative'
    ) then
      alter table public.user_settings
        add constraint user_settings_reserve_allocation_percent_nonnegative
        check (
          reserve_allocation_percent is null
          or reserve_allocation_percent >= 0
        )
        not valid;
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_settings') is not null then
    execute 'comment on column public.user_settings.reserve_allocation_mode is ''Default reserve allocation mode for future calculations: flat, cpm, or percent.''';
    execute 'comment on column public.user_settings.reserve_allocation_cpm is ''Default reserve allocation CPM for CPM-based reserve modeling.''';
    execute 'comment on column public.user_settings.reserve_allocation_percent is ''Default reserve allocation percent for percent-based reserve modeling.''';
  end if;
end
$$;

-- Verification SQL - run manually after applying in Supabase SQL Editor.
--
-- select to_regclass('public.users') as users_table;
-- select to_regclass('public.saved_loads') as saved_loads_table;
--
-- select table_schema, table_name, column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and (
--     (table_name = 'saved_loads' and column_name in (
--       'deadhead_start_city',
--       'deadhead_start_state',
--       'deadhead_start_zip',
--       'estimated_load_weight_lbs',
--       'route_stop_count',
--       'route_model_version',
--       'reserve_allocation_mode',
--       'reserve_allocation_cpm',
--       'reserve_allocation_percent',
--       'target_true_rpm_snapshot'
--     ))
--     or (table_name = 'saved_load_stops' and column_name in (
--       'id',
--       'saved_load_id',
--       'user_id',
--       'stop_sequence',
--       'stop_type',
--       'city',
--       'state',
--       'zip',
--       'miles_from_previous',
--       'stop_revenue',
--       'stop_expense',
--       'notes',
--       'created_at'
--     ))
--     or (table_name = 'truck_profiles' and column_name in (
--       'trailer_division_type',
--       'trailer_type',
--       'vehicle_tare_weight_lbs',
--       'estimated_max_gross_lbs',
--       'operational_classification'
--     ))
--     or (table_name = 'user_settings' and column_name in (
--       'reserve_allocation_mode',
--       'reserve_allocation_cpm',
--       'reserve_allocation_percent'
--     ))
--   )
-- order by table_name, column_name;
--
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename = 'saved_load_stops';
--
-- select schemaname, tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'saved_load_stops'
-- order by policyname;
--
-- select policyname, cmd, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'saved_load_stops'
--   and policyname in (
--     'Users can insert own saved load stops',
--     'Users can update own saved load stops'
--   );
-- Confirm both insert/update with_check expressions include parent
-- public.saved_loads ownership:
--   exists (
--     select 1
--     from public.saved_loads sl
--     where sl.id = saved_load_id
--       and sl.user_id = auth.uid()
--   )
--
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'saved_load_stops'
-- order by grantee, privilege_type;
--
-- select conname, contype, convalidated
-- from pg_constraint
-- where conrelid in (
--   'public.saved_loads'::regclass,
--   'public.saved_load_stops'::regclass
-- )
-- order by conrelid::regclass::text, conname;

-- Rollback SQL - review before manual use. This removes only the route
-- intelligence expansion created by this migration.
--
-- drop table if exists public.saved_load_stops;
--
-- alter table if exists public.saved_loads
--   drop constraint if exists saved_loads_estimated_load_weight_lbs_nonnegative,
--   drop constraint if exists saved_loads_route_stop_count_nonnegative,
--   drop constraint if exists saved_loads_reserve_allocation_mode_valid,
--   drop constraint if exists saved_loads_reserve_allocation_cpm_nonnegative,
--   drop constraint if exists saved_loads_reserve_allocation_percent_nonnegative,
--   drop constraint if exists saved_loads_target_true_rpm_snapshot_nonnegative,
--   drop column if exists deadhead_start_city,
--   drop column if exists deadhead_start_state,
--   drop column if exists deadhead_start_zip,
--   drop column if exists estimated_load_weight_lbs,
--   drop column if exists route_stop_count,
--   drop column if exists route_model_version,
--   drop column if exists reserve_allocation_mode,
--   drop column if exists reserve_allocation_cpm,
--   drop column if exists reserve_allocation_percent,
--   drop column if exists target_true_rpm_snapshot;
--
-- alter table if exists public.truck_profiles
--   drop constraint if exists truck_profiles_vehicle_tare_weight_lbs_nonnegative,
--   drop constraint if exists truck_profiles_estimated_max_gross_lbs_nonnegative,
--   drop column if exists trailer_division_type,
--   drop column if exists trailer_type,
--   drop column if exists vehicle_tare_weight_lbs,
--   drop column if exists estimated_max_gross_lbs,
--   drop column if exists operational_classification;
--
-- alter table if exists public.user_settings
--   drop constraint if exists user_settings_reserve_allocation_mode_valid,
--   drop constraint if exists user_settings_reserve_allocation_cpm_nonnegative,
--   drop constraint if exists user_settings_reserve_allocation_percent_nonnegative,
--   drop column if exists reserve_allocation_mode,
--   drop column if exists reserve_allocation_cpm,
--   drop column if exists reserve_allocation_percent;

-- ============================================================
-- SOURCE: subscription_entitlement_refinement
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260517010921_refine_subscription_entitlement_architecture.sql
-- ============================================================

-- Subscription entitlement architecture refinement.
--
-- Additive only. This migration does not delete data, does not mutate Stripe,
-- Apple, Google Play, or manual billing records, and does not remove Pilot or
-- Launch pricing-lock records.
--
-- Business semantics:
-- - Pilot and Launch users keep perpetual Karpilo LoadIQ platform access for
--   future released LoadIQ features made generally available in the platform.
-- - Pilot and Launch protection does not include future Karpilo FleetOS Pro,
--   per-truck fleet scaling, enterprise fleet operations, custom development,
--   legal/tax/accounting services, or unrelated future products.
-- - Future Pro is a reserved FleetOS-capable architecture tier after Platinum,
--   but it is not active, sold, or exposed by this migration.

alter table public.subscriptions
  add column if not exists subscription_tier text,
  add column if not exists feature_access text,
  add column if not exists grandfathered_access boolean,
  add column if not exists lifetime_access boolean,
  add column if not exists full_loadiq_access boolean,
  add column if not exists fleet_enabled boolean,
  add column if not exists fleetos_pro_access boolean,
  add column if not exists truck_capacity_limit integer;

alter table if exists public.pricing_entitlements
  add column if not exists subscription_tier text,
  add column if not exists feature_access text,
  add column if not exists grandfathered_access boolean,
  add column if not exists lifetime_access boolean,
  add column if not exists full_loadiq_access boolean,
  add column if not exists fleet_enabled boolean,
  add column if not exists fleetos_pro_access boolean,
  add column if not exists truck_capacity_limit integer;

alter table if exists public.operator_pricing_locks
  add column if not exists feature_access text,
  add column if not exists grandfathered_access boolean,
  add column if not exists lifetime_access boolean,
  add column if not exists full_loadiq_access boolean,
  add column if not exists fleet_enabled boolean,
  add column if not exists fleetos_pro_access boolean,
  add column if not exists truck_capacity_limit integer;

alter table if exists public.pricing_lock_status
  add column if not exists feature_access text,
  add column if not exists grandfathered_access boolean,
  add column if not exists lifetime_access boolean,
  add column if not exists full_loadiq_access boolean,
  add column if not exists fleet_enabled boolean,
  add column if not exists fleetos_pro_access boolean,
  add column if not exists truck_capacity_limit integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_subscription_tier_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_subscription_tier_check
      check (
        subscription_tier is null
        or subscription_tier in ('pilot', 'launch', 'gold', 'platinum', 'pro')
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_feature_access_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_feature_access_check
      check (
        feature_access is null
        or feature_access in ('standard', 'premium', 'platinum', 'fleet')
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_truck_capacity_limit_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_truck_capacity_limit_check
      check (truck_capacity_limit is null or truck_capacity_limit > 0)
      not valid;
  end if;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'pricing_entitlements',
    'operator_pricing_locks',
    'pricing_lock_status'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      if not exists (
        select 1
        from pg_constraint
        where conname = table_name || '_feature_access_check'
          and conrelid = format('public.%I', table_name)::regclass
      ) then
        execute format(
          'alter table public.%I add constraint %I check (feature_access is null or feature_access in (''standard'', ''premium'', ''platinum'', ''fleet'')) not valid',
          table_name,
          table_name || '_feature_access_check'
        );
      end if;

      if not exists (
        select 1
        from pg_constraint
        where conname = table_name || '_truck_capacity_limit_check'
          and conrelid = format('public.%I', table_name)::regclass
      ) then
        execute format(
          'alter table public.%I add constraint %I check (truck_capacity_limit is null or truck_capacity_limit > 0) not valid',
          table_name,
          table_name || '_truck_capacity_limit_check'
        );
      end if;
    end if;
  end loop;
end
$$;

update public.subscriptions
set
  subscription_tier = case
    when tier = 'pilot' then 'pilot'
    when tier in ('launch500', 'founder') then 'launch'
    when tier = 'platinum' then 'platinum'
    when tier = 'gold' then 'gold'
    when tier = 'pro' then 'pro'
    else subscription_tier
  end,
  feature_access = case
    when tier in ('pilot', 'launch500', 'founder', 'platinum') then 'platinum'
    when tier = 'gold' then 'premium'
    when tier = 'pro' then null
    else feature_access
  end,
  grandfathered_access = case
    when tier in ('pilot', 'launch500', 'founder') then true
    else coalesce(grandfathered_access, false)
  end,
  lifetime_access = case
    when tier in ('pilot', 'launch500', 'founder') then true
    else coalesce(lifetime_access, false)
  end,
  full_loadiq_access = case
    when tier in ('pilot', 'launch500', 'founder', 'gold', 'platinum') then true
    when tier = 'pro' then false
    else coalesce(full_loadiq_access, false)
  end,
  fleet_enabled = coalesce(fleet_enabled, false),
  fleetos_pro_access = coalesce(fleetos_pro_access, false)
where subscription_tier is null
   or feature_access is null
   or grandfathered_access is null
   or lifetime_access is null
   or full_loadiq_access is null
   or fleet_enabled is null
   or fleetos_pro_access is null;

update public.subscriptions
set
  subscription_tier = 'pro',
  feature_access = null,
  fleet_enabled = false,
  fleetos_pro_access = false,
  full_loadiq_access = false,
  truck_capacity_limit = null
where subscription_tier = 'pro';

do $$
begin
  if to_regclass('public.pricing_entitlements') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'cohort_phase'
    )
  then
    update public.pricing_entitlements
    set
      subscription_tier = case
        when cohort_phase in ('pilot', 'pilot50') then 'pilot'
        when cohort_phase in ('launch', 'launch500', 'legacy') then 'launch'
        else subscription_tier
      end,
      feature_access = case
        when cohort_phase in ('pilot', 'pilot50', 'launch', 'launch500', 'legacy') then 'platinum'
        else feature_access
      end,
      grandfathered_access = case
        when cohort_phase in ('pilot', 'pilot50', 'launch', 'launch500', 'legacy') then true
        else coalesce(grandfathered_access, false)
      end,
      lifetime_access = case
        when cohort_phase in ('pilot', 'pilot50', 'launch', 'launch500', 'legacy') then true
        else coalesce(lifetime_access, false)
      end,
      full_loadiq_access = case
        when cohort_phase in ('pilot', 'pilot50', 'launch', 'launch500', 'legacy') then true
        else coalesce(full_loadiq_access, false)
      end,
      fleet_enabled = coalesce(fleet_enabled, false),
      fleetos_pro_access = coalesce(fleetos_pro_access, false)
    where subscription_tier is null
       or feature_access is null
       or grandfathered_access is null
       or lifetime_access is null
       or full_loadiq_access is null
       or fleet_enabled is null
       or fleetos_pro_access is null;
  end if;

  if to_regclass('public.operator_pricing_locks') is not null then
    update public.operator_pricing_locks
    set
      feature_access = coalesce(feature_access, 'platinum'),
      grandfathered_access = coalesce(grandfathered_access, true),
      lifetime_access = coalesce(lifetime_access, true),
      full_loadiq_access = coalesce(full_loadiq_access, true),
      fleet_enabled = coalesce(fleet_enabled, false),
      fleetos_pro_access = coalesce(fleetos_pro_access, false)
    where program in ('pilot50', 'launch500');
  end if;

  if to_regclass('public.pricing_lock_status') is not null then
    update public.pricing_lock_status
    set
      feature_access = coalesce(feature_access, 'platinum'),
      grandfathered_access = coalesce(grandfathered_access, true),
      lifetime_access = coalesce(lifetime_access, true),
      full_loadiq_access = coalesce(full_loadiq_access, true),
      fleet_enabled = coalesce(fleet_enabled, false),
      fleetos_pro_access = coalesce(fleetos_pro_access, false)
    where cohort in ('pilot50', 'launch500');
  end if;
end
$$;

create index if not exists idx_subscriptions_tier_feature_access
  on public.subscriptions (subscription_tier, feature_access);

create index if not exists idx_subscriptions_grandfathered_lifetime
  on public.subscriptions (grandfathered_access, lifetime_access)
  where grandfathered_access is true or lifetime_access is true;

create index if not exists idx_subscriptions_fleet_enabled
  on public.subscriptions (fleet_enabled, truck_capacity_limit)
  where fleet_enabled is true;

comment on column public.subscriptions.subscription_tier is
  'Canonical entitlement tier: pilot, launch, gold, platinum, or reserved future pro. Pro is recognized but inactive unless explicitly activated later.';

comment on column public.subscriptions.feature_access is
  'Feature-access level: standard, premium, platinum, or fleet. Fleet is reserved for future Karpilo FleetOS-capable Pro.';

comment on column public.subscriptions.grandfathered_access is
  'True when the account has protected grandfathered Karpilo LoadIQ access, such as Pilot or Launch.';

comment on column public.subscriptions.lifetime_access is
  'True when protected Karpilo LoadIQ access should persist across future LoadIQ feature additions.';

comment on column public.subscriptions.full_loadiq_access is
  'True when the account can access the complete Karpilo LoadIQ platform surface for its non-FleetOS scope.';

comment on column public.subscriptions.fleet_enabled is
  'Future FleetOS/Pro capability flag. Pilot and Launch protection does not set this automatically.';

comment on column public.subscriptions.fleetos_pro_access is
  'Future Karpilo FleetOS Pro access flag, separate from Pilot/Launch LoadIQ lifetime access.';

comment on column public.subscriptions.truck_capacity_limit is
  'Future FleetOS/Pro truck-capacity parameter. Null means not assigned.';

-- VERIFICATION SQL (manual, do not run automatically):
--
-- with expected(table_name, column_name) as (
--   values
--     ('subscriptions', 'subscription_tier'),
--     ('subscriptions', 'feature_access'),
--     ('subscriptions', 'grandfathered_access'),
--     ('subscriptions', 'lifetime_access'),
--     ('subscriptions', 'full_loadiq_access'),
--     ('subscriptions', 'fleet_enabled'),
--     ('subscriptions', 'fleetos_pro_access'),
--     ('subscriptions', 'truck_capacity_limit'),
--     ('pricing_entitlements', 'subscription_tier'),
--     ('pricing_entitlements', 'feature_access'),
--     ('operator_pricing_locks', 'feature_access'),
--     ('pricing_lock_status', 'feature_access')
-- )
-- select expected.table_name, expected.column_name, columns.data_type, columns.column_name is not null as exists_live
-- from expected
-- left join information_schema.columns columns
--   on columns.table_schema = 'public'
--  and columns.table_name = expected.table_name
--  and columns.column_name = expected.column_name
-- order by expected.table_name, expected.column_name;
--
-- select tier, subscription_tier, feature_access, grandfathered_access, lifetime_access,
--        full_loadiq_access, fleet_enabled, fleetos_pro_access, count(*)
-- from public.subscriptions
-- group by tier, subscription_tier, feature_access, grandfathered_access, lifetime_access,
--          full_loadiq_access, fleet_enabled, fleetos_pro_access
-- order by tier, subscription_tier;
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'subscriptions'
--   and indexname in (
--     'idx_subscriptions_tier_feature_access',
--     'idx_subscriptions_grandfathered_lifetime',
--     'idx_subscriptions_fleet_enabled'
--   )
-- order by indexname;
--
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.subscriptions'::regclass
--   and conname in (
--     'subscriptions_subscription_tier_check',
--     'subscriptions_feature_access_check',
--     'subscriptions_truck_capacity_limit_check'
--   );

-- ROLLBACK SQL (manual only; review before use):
--
-- drop index if exists public.idx_subscriptions_fleet_enabled;
-- drop index if exists public.idx_subscriptions_grandfathered_lifetime;
-- drop index if exists public.idx_subscriptions_tier_feature_access;
-- alter table public.subscriptions drop constraint if exists subscriptions_truck_capacity_limit_check;
-- alter table public.subscriptions drop constraint if exists subscriptions_feature_access_check;
-- alter table public.subscriptions drop constraint if exists subscriptions_subscription_tier_check;
-- alter table if exists public.pricing_lock_status
--   drop column if exists truck_capacity_limit,
--   drop column if exists fleetos_pro_access,
--   drop column if exists fleet_enabled,
--   drop column if exists full_loadiq_access,
--   drop column if exists lifetime_access,
--   drop column if exists grandfathered_access,
--   drop column if exists feature_access;
-- alter table if exists public.operator_pricing_locks
--   drop column if exists truck_capacity_limit,
--   drop column if exists fleetos_pro_access,
--   drop column if exists fleet_enabled,
--   drop column if exists full_loadiq_access,
--   drop column if exists lifetime_access,
--   drop column if exists grandfathered_access,
--   drop column if exists feature_access;
-- alter table if exists public.pricing_entitlements
--   drop column if exists truck_capacity_limit,
--   drop column if exists fleetos_pro_access,
--   drop column if exists fleet_enabled,
--   drop column if exists full_loadiq_access,
--   drop column if exists lifetime_access,
--   drop column if exists grandfathered_access,
--   drop column if exists feature_access,
--   drop column if exists subscription_tier;
-- alter table public.subscriptions
--   drop column if exists truck_capacity_limit,
--   drop column if exists fleetos_pro_access,
--   drop column if exists fleet_enabled,
--   drop column if exists full_loadiq_access,
--   drop column if exists lifetime_access,
--   drop column if exists grandfathered_access,
--   drop column if exists feature_access,
--   drop column if exists subscription_tier;

-- ============================================================
-- SOURCE: reserve_future_pro_entitlement
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260517012513_reserve_future_pro_entitlement.sql
-- ============================================================

-- Reserve Future Pro / Karpilo FleetOS entitlement state.
--
-- Safe correction:
-- - Gold and Platinum are the only active paid tiers.
-- - Pilot and Launch remain protected lifetime Karpilo LoadIQ programs.
-- - Pro is recognized as a reserved future FleetOS-capable tier after Platinum.
-- - This migration does not activate, sell, expose, or grant Pro/FleetOS access.

update public.subscriptions
set
  subscription_tier = 'pro',
  feature_access = null,
  full_loadiq_access = false,
  fleet_enabled = false,
  fleetos_pro_access = false,
  truck_capacity_limit = null,
  price_subject_to_change = coalesce(price_subject_to_change, true),
  updated_at = now()
where tier = 'pro'
   or subscription_tier = 'pro';

do $$
begin
  if to_regclass('public.pricing_entitlements') is not null then
    update public.pricing_entitlements
    set
      subscription_tier = 'pro',
      feature_access = null,
      full_loadiq_access = false,
      fleet_enabled = false,
      fleetos_pro_access = false,
      truck_capacity_limit = null,
      price_subject_to_change = coalesce(price_subject_to_change, true)
    where subscription_tier = 'pro';
  end if;
end
$$;

comment on column public.subscriptions.subscription_tier is
  'Canonical entitlement tier: pilot, launch, gold, platinum, or reserved future pro. Pro is recognized but inactive unless explicitly activated later.';

comment on column public.subscriptions.fleet_enabled is
  'Future FleetOS/Pro capability flag. Must remain false unless Pro/FleetOS access is explicitly activated later.';

comment on column public.subscriptions.fleetos_pro_access is
  'Future Karpilo FleetOS Pro access flag. Must remain false unless Pro/FleetOS access is explicitly activated later.';

-- VERIFICATION SQL (manual, do not run automatically):
--
-- select
--   id,
--   tier,
--   subscription_tier,
--   feature_access,
--   full_loadiq_access,
--   fleet_enabled,
--   fleetos_pro_access,
--   truck_capacity_limit,
--   entitlement_status,
--   status
-- from public.subscriptions
-- where tier = 'pro'
--    or subscription_tier = 'pro'
-- order by updated_at desc nulls last;
--
-- select count(*) as active_pro_access_rows
-- from public.subscriptions
-- where subscription_tier = 'pro'
--   and (
--     feature_access = 'fleet'
--     or full_loadiq_access is true
--     or fleet_enabled is true
--     or fleetos_pro_access is true
--   );

-- ROLLBACK SQL (manual only; review before use):
--
-- update public.subscriptions
-- set
--   feature_access = 'fleet',
--   full_loadiq_access = true,
--   fleet_enabled = true,
--   fleetos_pro_access = true
-- where subscription_tier = 'pro';

-- ============================================================
-- SOURCE: account_soft_delete_status
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260517120000_account_soft_delete_status.sql
-- ============================================================

-- Account soft-delete/deletion-request status foundation.
--
-- Safe-to-run-now:
-- - Additive only.
-- - Does not delete auth.users.
-- - Does not delete billing, subscription, pricing lock, saved load,
--   reservation, or operational records.
-- - Supports self-service deletion requests while preserving records that may
--   be needed for billing, fraud prevention, disputes, security, or legal
--   retention.

alter table public.users
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_status text not null default 'active',
  add column if not exists account_status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_deletion_status_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_deletion_status_check
      check (deletion_status in ('active', 'deletion_requested', 'deleted', 'suspended'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_account_status_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_account_status_check
      check (account_status in ('active', 'deletion_requested', 'deleted', 'suspended'))
      not valid;
  end if;
end
$$;

create index if not exists idx_users_account_status
  on public.users (account_status);

create index if not exists idx_users_deletion_status_requested_at
  on public.users (deletion_status, deletion_requested_at);

create index if not exists idx_users_deleted_at
  on public.users (deleted_at)
  where deleted_at is not null;

comment on column public.users.deleted_at is
  'Soft-delete completion timestamp. Does not imply auth.users or billing records were hard-deleted.';

comment on column public.users.deletion_requested_at is
  'Timestamp when the user requested account/data deletion review.';

comment on column public.users.deletion_status is
  'Soft deletion lifecycle: active, deletion_requested, deleted, or suspended.';

comment on column public.users.account_status is
  'Account access lifecycle: active, deletion_requested, deleted, or suspended.';

-- VERIFICATION SQL (manual, do not run automatically):
--
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'users'
--   and column_name in (
--     'deleted_at',
--     'deletion_requested_at',
--     'deletion_status',
--     'account_status'
--   )
-- order by column_name;
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'users'
--   and indexname in (
--     'idx_users_account_status',
--     'idx_users_deletion_status_requested_at',
--     'idx_users_deleted_at'
--   )
-- order by indexname;
--
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.users'::regclass
--   and conname in (
--     'users_deletion_status_check',
--     'users_account_status_check'
--   );

-- ROLLBACK SQL (manual only; review before use):
--
-- drop index if exists public.idx_users_deleted_at;
-- drop index if exists public.idx_users_deletion_status_requested_at;
-- drop index if exists public.idx_users_account_status;
-- alter table public.users drop constraint if exists users_account_status_check;
-- alter table public.users drop constraint if exists users_deletion_status_check;
-- alter table public.users drop column if exists account_status;
-- alter table public.users drop column if exists deletion_status;
-- alter table public.users drop column if exists deletion_requested_at;
-- alter table public.users drop column if exists deleted_at;

-- ============================================================
-- SOURCE: ai_governance_foundation
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260519124422_ai_governance_foundation.sql
-- ============================================================

-- Atlas AI governance foundation.
--
-- Scope:
-- - usage ledger for every AI attempt
-- - per-tier budget defaults
-- - provider-call cache/deduplication
-- - user report pathway for generated output
-- - server-side system flags / kill switches
--
-- This migration does not alter calculator math, entitlement tables,
-- subscription pricing, billing logic, or existing saved-load behavior.

create extension if not exists "pgcrypto";

create table if not exists public.ai_system_flags (
  key text primary key,
  enabled boolean not null default true,
  value jsonb not null default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id) on delete set null
);

create table if not exists public.ai_budget_limits (
  id uuid primary key default gen_random_uuid(),
  plan_tier text not null,
  feature_key text not null default 'load_analysis',
  daily_call_limit integer not null default 0,
  monthly_call_limit integer not null default 0,
  cooldown_seconds integer not null default 60,
  monthly_token_cap integer,
  monthly_cost_cap_cents integer,
  model_tier text not null default 'mini',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_budget_limits_plan_feature_unique unique (plan_tier, feature_key),
  constraint ai_budget_limits_plan_check check (
    plan_tier in (
      'free',
      'no_access',
      'gold',
      'platinum',
      'pilot',
      'launch500',
      'admin',
      'pro'
    )
  ),
  constraint ai_budget_limits_nonnegative_check check (
    daily_call_limit >= 0
    and monthly_call_limit >= 0
    and cooldown_seconds >= 0
  ),
  constraint ai_budget_limits_model_tier_check check (
    model_tier in ('nano', 'mini', 'premium')
  )
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  feature_key text not null,
  request_hash text,
  cache_key text,
  model text,
  model_tier text,
  plan_tier text,
  status text not null,
  block_reason text,
  error_code text,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost_micros integer,
  cache_hit boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_usage_events_status_check check (
    status in ('requested', 'blocked', 'cache_hit', 'completed', 'failed')
  ),
  constraint ai_usage_events_nonnegative_tokens_check check (
    coalesce(input_tokens, 0) >= 0
    and coalesce(output_tokens, 0) >= 0
    and coalesce(total_tokens, 0) >= 0
  )
);

create table if not exists public.ai_request_cache (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null,
  cache_key text not null unique,
  request_hash text not null,
  model text not null,
  model_tier text,
  response_json jsonb not null,
  expires_at timestamptz not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_hit_at timestamptz,
  hit_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  constraint ai_request_cache_hit_count_check check (hit_count >= 0)
);

create table if not exists public.ai_output_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature_key text not null,
  usage_event_id uuid references public.ai_usage_events(id) on delete set null,
  cache_key text,
  reason text not null,
  details text,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_output_reports_reason_check check (
    reason in ('incorrect', 'unsafe', 'offensive', 'privacy', 'other')
  ),
  constraint ai_output_reports_status_check check (
    status in ('new', 'reviewing', 'resolved', 'dismissed')
  ),
  constraint ai_output_reports_details_length_check check (
    details is null or char_length(details) <= 1200
  )
);

insert into public.ai_system_flags (key, enabled, value, reason)
values
  ('atlas_ai_enabled', true, '{}'::jsonb, 'Global Atlas AI kill switch.'),
  ('load_analysis_enabled', true, '{}'::jsonb, 'Atlas load-analysis feature switch.')
on conflict (key) do nothing;

insert into public.ai_budget_limits (
  plan_tier,
  feature_key,
  daily_call_limit,
  monthly_call_limit,
  cooldown_seconds,
  model_tier,
  enabled
)
values
  ('free', 'load_analysis', 0, 0, 300, 'mini', false),
  ('no_access', 'load_analysis', 0, 0, 300, 'mini', false),
  ('gold', 'load_analysis', 5, 100, 90, 'mini', true),
  ('platinum', 'load_analysis', 20, 500, 45, 'mini', true),
  ('pilot', 'load_analysis', 5, 100, 90, 'mini', true),
  ('launch500', 'load_analysis', 5, 100, 90, 'mini', true),
  ('pro', 'load_analysis', 0, 0, 300, 'mini', false),
  ('admin', 'load_analysis', 10, 100, 30, 'premium', true)
on conflict (plan_tier, feature_key) do nothing;

create index if not exists ai_usage_events_user_feature_created_idx
  on public.ai_usage_events (user_id, feature_key, created_at desc);

create index if not exists ai_usage_events_budget_count_idx
  on public.ai_usage_events (user_id, feature_key, status, created_at desc)
  where status in ('cache_hit', 'completed');

create index if not exists ai_usage_events_request_hash_idx
  on public.ai_usage_events (feature_key, request_hash, created_at desc);

create index if not exists ai_request_cache_feature_expires_idx
  on public.ai_request_cache (feature_key, expires_at desc);

create index if not exists ai_output_reports_user_created_idx
  on public.ai_output_reports (user_id, created_at desc);

create index if not exists ai_output_reports_status_created_idx
  on public.ai_output_reports (status, created_at desc);

alter table public.ai_system_flags enable row level security;
alter table public.ai_budget_limits enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.ai_request_cache enable row level security;
alter table public.ai_output_reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_usage_events'
      and policyname = 'Users can view own AI usage events'
  ) then
    create policy "Users can view own AI usage events"
    on public.ai_usage_events for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_output_reports'
      and policyname = 'Users can view own AI output reports'
  ) then
    create policy "Users can view own AI output reports"
    on public.ai_output_reports for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_output_reports'
      and policyname = 'Users can insert own AI output reports'
  ) then
    create policy "Users can insert own AI output reports"
    on public.ai_output_reports for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

comment on table public.ai_usage_events is
  'Server-side Atlas AI governance ledger. Records requested, blocked, cache_hit, completed, and failed attempts.';

comment on table public.ai_budget_limits is
  'Server-side Atlas AI budget defaults by entitlement tier and feature. Does not replace subscription entitlement logic.';

comment on table public.ai_request_cache is
  'Atlas AI response cache keyed by sanitized request hash. Avoids storing raw user notes or full prompt text.';

comment on table public.ai_output_reports is
  'User-submitted reports for Atlas AI output quality, safety, privacy, or correctness review.';

comment on table public.ai_system_flags is
  'Server-side Atlas AI feature and kill-switch flags evaluated before provider calls.';

-- ============================================================
-- SOURCE: diagnostics_foundation
-- FILE: supabase/archive/migrations-pre-new-account-20260611/20260531120000_diagnostics_foundation.sql
-- ============================================================

-- LoadIQ internal diagnostics foundation.
-- Phase 1 scope:
-- - durable diagnostic event capture
-- - service-role-only table access
-- - no direct anon/authenticated table writes
-- - no third-party observability integration

create extension if not exists pgcrypto;

create table if not exists public.diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null default 'app_error'
    check (event_type in ('app_error')),
  severity text not null
    check (severity in ('debug', 'info', 'warning', 'error', 'critical')),
  source text not null
    check (source in ('app', 'dashboard', 'admin', 'api', 'server', 'client')),
  environment text not null,
  route text,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  release_version text,
  message text not null,
  stack text,
  digest text,
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text
);

create index if not exists idx_diagnostic_events_created
on public.diagnostic_events (created_at desc);

create index if not exists idx_diagnostic_events_severity_created
on public.diagnostic_events (severity, created_at desc);

create index if not exists idx_diagnostic_events_source_created
on public.diagnostic_events (source, created_at desc);

create index if not exists idx_diagnostic_events_user_created
on public.diagnostic_events (user_id, created_at desc);

create index if not exists idx_diagnostic_events_digest_created
on public.diagnostic_events (digest, created_at desc)
where digest is not null;

alter table public.diagnostic_events enable row level security;

grant usage on schema public to service_role;
revoke all on public.diagnostic_events from anon, authenticated;
grant select, insert, update on public.diagnostic_events to service_role;

-- No anon/authenticated policies are intentionally created. Diagnostic writes
-- must go through server routes that sanitize payloads and insert with the
-- service role.

-- ============================================================
-- SOURCE: auth_password_reset_events
-- FILE: supabase/sql/auth_password_reset_events.sql
-- ============================================================

-- Optional password reset audit metadata for Karpilo LoadIQ.
-- Manual Supabase SQL Editor file.
--
-- Security notes:
-- - Do not store reset tokens.
-- - Do not store passwords.
-- - Do not store raw IP addresses unless the privacy policy and support
--   workflow explicitly support it. Use a coarse/contextual string only.

create table if not exists public.auth_password_reset_events (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  event_type text not null
    check (event_type in ('request_submitted', 'request_failed', 'password_updated', 'password_update_failed')),
  status text not null
    check (status in ('accepted', 'failed', 'completed')),
  user_agent text,
  ip_context text,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_password_reset_events_created_at
on public.auth_password_reset_events (created_at desc);

create index if not exists idx_auth_password_reset_events_user_email_created_at
on public.auth_password_reset_events (lower(user_email), created_at desc)
where user_email is not null;

alter table public.auth_password_reset_events enable row level security;

revoke all on public.auth_password_reset_events from anon;
revoke all on public.auth_password_reset_events from authenticated;

grant select, insert, update, delete on public.auth_password_reset_events to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'auth_password_reset_events'
      and policyname = 'Service role can manage password reset audit events'
  ) then
    create policy "Service role can manage password reset audit events"
    on public.auth_password_reset_events
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

-- Verification:
-- select relname, relrowsecurity
-- from pg_class
-- where relname = 'auth_password_reset_events';
--
-- select policyname, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'auth_password_reset_events';

-- Rollback:
-- drop table if exists public.auth_password_reset_events;
