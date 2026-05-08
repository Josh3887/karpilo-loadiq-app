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
  total_miles numeric not null,
  fuel_cost numeric not null,
  operational_cost numeric not null,
  estimated_net numeric not null,
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
  target_true_rpm numeric default 2.00,
  default_mpg numeric default 6.50,
  default_fuel_price numeric default 4.00,
  default_dispatch_percent numeric default 0,
  default_factoring_percent numeric default 0,
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

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.saved_loads enable row level security;
alter table public.trip_history enable row level security;
alter table public.user_settings enable row level security;
alter table public.analytics_events enable row level security;

create policy "Users can view own profile"
on public.users for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id);

create policy "Users can view own subscriptions"
on public.subscriptions for select
using (auth.uid() = user_id);

create policy "Users can view own saved loads"
on public.saved_loads for select
using (auth.uid() = user_id);

create policy "Users can insert own saved loads"
on public.saved_loads for insert
with check (auth.uid() = user_id);

create policy "Users can update own saved loads"
on public.saved_loads for update
using (auth.uid() = user_id);

create policy "Users can delete own saved loads"
on public.saved_loads for delete
using (auth.uid() = user_id);

create policy "Users can view own trip history"
on public.trip_history for select
using (auth.uid() = user_id);

create policy "Users can insert own trip history"
on public.trip_history for insert
with check (auth.uid() = user_id);

create policy "Users can view own settings"
on public.user_settings for select
using (auth.uid() = user_id);

create policy "Users can update own settings"
on public.user_settings for update
using (auth.uid() = user_id);

create policy "Users can insert own settings"
on public.user_settings for insert
with check (auth.uid() = user_id);

create policy "Users can insert own analytics events"
on public.analytics_events for insert
with check (auth.uid() = user_id or user_id is null);