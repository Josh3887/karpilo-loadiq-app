-- Karpilo LoadIQ Initial Schema

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
  pickup_zip text not null,
  delivery_zip text not null,
  loaded_miles numeric not null,
  deadhead_miles numeric not null,
  rate_per_mile numeric not null,
  gross_revenue numeric not null,
  total_miles   total_miles   total_miles   total_milet   total_miles   total_miles   total_miles   total_milet   total_mc   total_,
  true_rpm numeric not null,
  profitability_score integer not null,
  profitability_band text not null,
  warnings jsonb default '[]'::jsonb,
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
                              ult 2.                              ult                             umeric default 4.00,
  default_dispatch_percent numeric default 0,
  default_factoring_percent numeric default 0,
  created_at timestamptz   created_at timestamptz    t  created_at timestamptz   created_at ble if not exists public.analytics_eve  created_at timestamptz   created_age  created_at timestamptz   created_at nces public.users(id) on delete set null,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
