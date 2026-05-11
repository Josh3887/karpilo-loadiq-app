-- Karpilo LoadIQ schema reference.
-- Apply migrations in src/database/migrations for database changes.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tier text not null default 'free',
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.saved_loads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'estimated',
  pickup_zip text not null,
  delivery_zip text not null,
  loaded_miles numeric not null,
  deadhead_miles numeric not null,
  rate_per_mile numeric not null,
  gross_revenue numeric not null,
  total_miles numeric not null,
  fuel_cost numeric not null,
  operational_cost numeric not null,
  estimated_net numeric not null,
  actual_net numeric,
  true_rpm numeric not null,
  profitability_score integer not null,
  profitability_band text not null,
  warnings jsonb default '[]'::jsonb,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  actuals_snapshot jsonb not null default '{}'::jsonb,
  pay_structure_snapshot jsonb not null default '{}'::jsonb,
  calculation_version text not null default 'loadiq-v1',
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

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  target_true_rpm numeric default 2.00,
  default_mpg numeric default 6.50,
  default_fuel_price numeric default 4.00,
  default_dispatch_percent numeric default 0,
  default_factoring_percent numeric default 0,
  default_overhead numeric default 0,
  default_reserve_allocation numeric default 0,
  target_profit_margin numeric default 20,
  toll_handling_mode text default 'trip_specific',
  lumper_handling_mode text default 'trip_specific',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_overhead_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  category text not null default 'fixed_operations',
  amount numeric not null default 0,
  amount_type text not null default 'flat',
  frequency text not null default 'monthly',
  responsibility text not null default 'driver',
  is_active boolean not null default true,
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

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
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
