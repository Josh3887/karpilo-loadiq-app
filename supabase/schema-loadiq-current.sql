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
  load_run_status text default 'planned' check (load_run_status in ('ran', 'test', 'planned')),
  was_run_status text check (was_run_status is null or was_run_status in ('ran', 'test', 'planned')),
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
  max_days integer not null default 45,
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
