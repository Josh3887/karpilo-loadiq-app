-- Cloud-safe repair/setup script for projects where some LoadIQ tables
-- already exist. This file is intentionally idempotent.

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

alter table public.saved_loads
  add column if not exists status text not null default 'estimated',
  add column if not exists actual_net numeric,
  add column if not exists input_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists result_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists actuals_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists pay_structure_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists calculation_version text not null default 'loadiq-v2';

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

alter table public.user_settings
  add column if not exists default_overhead numeric default 0,
  add column if not exists default_reserve_allocation numeric default 0,
  add column if not exists target_profit_margin numeric default 20,
  add column if not exists toll_handling_mode text default 'trip_specific',
  add column if not exists lumper_handling_mode text default 'trip_specific';

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
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

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.saved_loads enable row level security;
alter table public.trip_history enable row level security;
alter table public.user_settings enable row level security;
alter table public.analytics_events enable row level security;
alter table public.user_overhead_items enable row level security;
alter table public.usage_events enable row level security;
alter table public.pay_structure_templates enable row level security;
alter table public.lane_templates enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can insert own profile') then
    create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'subscriptions' and policyname = 'Users can view own subscriptions') then
    create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_loads' and policyname = 'Users can view own saved loads') then
    create policy "Users can view own saved loads" on public.saved_loads for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_loads' and policyname = 'Users can insert own saved loads') then
    create policy "Users can insert own saved loads" on public.saved_loads for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_loads' and policyname = 'Users can update own saved loads') then
    create policy "Users can update own saved loads" on public.saved_loads for update using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_loads' and policyname = 'Users can delete own saved loads') then
    create policy "Users can delete own saved loads" on public.saved_loads for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_history' and policyname = 'Users can view own trip history') then
    create policy "Users can view own trip history" on public.trip_history for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_history' and policyname = 'Users can insert own trip history') then
    create policy "Users can insert own trip history" on public.trip_history for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users can view own settings') then
    create policy "Users can view own settings" on public.user_settings for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users can update own settings') then
    create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users can insert own settings') then
    create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_events' and policyname = 'Users can insert own analytics events') then
    create policy "Users can insert own analytics events" on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_overhead_items' and policyname = 'Users can manage own overhead items') then
    create policy "Users can manage own overhead items" on public.user_overhead_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usage_events' and policyname = 'Users can insert own usage events') then
    create policy "Users can insert own usage events" on public.usage_events for insert with check (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usage_events' and policyname = 'Users can view own usage events') then
    create policy "Users can view own usage events" on public.usage_events for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pay_structure_templates' and policyname = 'Users can manage own pay templates') then
    create policy "Users can manage own pay templates" on public.pay_structure_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lane_templates' and policyname = 'Users can manage own lane templates') then
    create policy "Users can manage own lane templates" on public.lane_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;
