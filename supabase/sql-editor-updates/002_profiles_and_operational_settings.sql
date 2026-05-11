-- 002_profiles_and_operational_settings.sql
-- Safe to rerun.
-- Purpose: app compatibility profile tables plus future-ready operator profile structure.

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  profile_name text,
  company_name text,
  operation_type text default 'otr',
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

create table if not exists public.operator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text,
  company_name text,
  operation_type text not null default 'otr',
  account_type text not null default 'leased_owner_operator',
  leased_owner_operator boolean not null default false,
  independent_owner_operator boolean not null default false,
  default_mpg numeric(8,2) default 6.50,
  default_fuel_price numeric(10,3) default 4.00,
  target_income numeric(12,2) default 60000,
  target_income_period text default 'yearly',
  target_true_rpm numeric(10,3) default 2.00,
  target_profit_margin numeric(8,2) default 20,
  minimum_hourly_profitability numeric(10,2) default 50,
  operating_days_per_week numeric(8,2) default 5.5,
  operating_days_per_month numeric(8,2) default 23.8,
  fixed_overhead_monthly numeric(12,2) default 0,
  fixed_overhead_weekly numeric(12,2) default 0,
  fixed_overhead_daily numeric(12,2) default 0,
  dispatch_percentage numeric(8,3) default 0,
  factoring_percentage numeric(8,3) default 0,
  lease_percentage numeric(8,3) default 0,
  maintenance_reserve_rate numeric(10,3) default 0,
  settings_completed boolean not null default false,
  onboarding_completed boolean not null default false,
  profile_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.operator_profiles
  add column if not exists display_name text,
  add column if not exists company_name text,
  add column if not exists operation_type text not null default 'otr',
  add column if not exists account_type text not null default 'leased_owner_operator',
  add column if not exists default_mpg numeric(8,2) default 6.50,
  add column if not exists default_fuel_price numeric(10,3) default 4.00,
  add column if not exists target_income numeric(12,2) default 60000,
  add column if not exists target_true_rpm numeric(10,3) default 2.00,
  add column if not exists operating_days_per_week numeric(8,2) default 5.5,
  add column if not exists operating_days_per_month numeric(8,2) default 23.8,
  add column if not exists fixed_overhead_monthly numeric(12,2) default 0,
  add column if not exists fixed_overhead_weekly numeric(12,2) default 0,
  add column if not exists fixed_overhead_daily numeric(12,2) default 0,
  add column if not exists profile_snapshot jsonb not null default '{}'::jsonb;

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  target_true_rpm numeric(10,3) default 2.00,
  default_mpg numeric(8,2) default 6.50,
  default_fuel_price numeric(10,3) default 4.00,
  default_dispatch_percent numeric(8,3) default 0,
  default_factoring_percent numeric(8,3) default 0,
  default_lease_percent numeric(8,3) default 0,
  default_overhead numeric(12,2) default 0,
  default_reserve_allocation numeric(12,2) default 0,
  default_maintenance_reserve numeric(12,2) default 0,
  default_tire_reserve numeric(12,2) default 0,
  default_trailer_fee numeric(12,2) default 0,
  default_insurance_allocation numeric(12,2) default 0,
  default_variable_cost_per_mile numeric(10,3) default 0,
  default_fixed_cost_allocation numeric(12,2) default 0,
  target_profit_margin numeric(8,2) default 20,
  minimum_hourly_profitability numeric(10,2) default 50,
  operating_days_per_week numeric(8,2) default 5.5,
  operating_days_per_month numeric(8,2) default 23.8,
  income_target_amount numeric(12,2) default 60000,
  income_target_period text default 'yearly',
  toll_handling_mode text default 'trip_specific',
  lumper_handling_mode text default 'trip_specific',
  default_pay_template_id uuid,
  default_deadhead_miles numeric(10,2) default 0,
  default_tolls numeric(12,2) default 0,
  default_accessorial_allowance numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings
  add column if not exists target_true_rpm numeric(10,3) default 2.00,
  add column if not exists default_mpg numeric(8,2) default 6.50,
  add column if not exists default_fuel_price numeric(10,3) default 4.00,
  add column if not exists default_dispatch_percent numeric(8,3) default 0,
  add column if not exists default_factoring_percent numeric(8,3) default 0,
  add column if not exists default_lease_percent numeric(8,3) default 0,
  add column if not exists default_overhead numeric(12,2) default 0,
  add column if not exists default_reserve_allocation numeric(12,2) default 0,
  add column if not exists default_maintenance_reserve numeric(12,2) default 0,
  add column if not exists default_tire_reserve numeric(12,2) default 0,
  add column if not exists default_trailer_fee numeric(12,2) default 0,
  add column if not exists default_insurance_allocation numeric(12,2) default 0,
  add column if not exists default_variable_cost_per_mile numeric(10,3) default 0,
  add column if not exists default_fixed_cost_allocation numeric(12,2) default 0,
  add column if not exists target_profit_margin numeric(8,2) default 20,
  add column if not exists minimum_hourly_profitability numeric(10,2) default 50,
  add column if not exists operating_days_per_week numeric(8,2) default 5.5,
  add column if not exists operating_days_per_month numeric(8,2) default 23.8,
  add column if not exists income_target_amount numeric(12,2) default 60000,
  add column if not exists income_target_period text default 'yearly',
  add column if not exists toll_handling_mode text default 'trip_specific',
  add column if not exists lumper_handling_mode text default 'trip_specific',
  add column if not exists default_pay_template_id uuid,
  add column if not exists default_deadhead_miles numeric(10,2) default 0,
  add column if not exists default_tolls numeric(12,2) default 0,
  add column if not exists default_accessorial_allowance numeric(12,2) default 0,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.truck_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  make text,
  model text,
  year integer,
  engine text,
  odometer numeric(12,1),
  default_mpg numeric(8,2) default 6.50,
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
