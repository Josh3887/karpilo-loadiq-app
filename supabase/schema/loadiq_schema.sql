-- Karpilo LoadIQ full cloud-safe schema.
-- Manual Supabase SQL editor compatible.

create extension if not exists "pgcrypto";

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
  add column if not exists profile_name text,
  add column if not exists operation_type text default 'otr',
  add column if not exists disclaimer_accepted_at timestamptz,
  add column if not exists disclaimer_version text,
  add column if not exists disclaimer_last_updated text;

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
  default_maintenance_reserve numeric default 0,
  default_tire_reserve numeric default 0,
  default_trailer_fee numeric default 0,
  default_insurance_allocation numeric default 0,
  default_variable_cost_per_mile numeric default 0,
  default_fixed_cost_allocation numeric default 0,
  target_profit_margin numeric default 20,
  minimum_hourly_profitability numeric default 50,
  income_target_amount numeric default 60000,
  income_target_period text default 'yearly',
  toll_handling_mode text default 'trip_specific',
  lumper_handling_mode text default 'trip_specific',
  default_pay_template_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings
  add column if not exists minimum_hourly_profitability numeric default 50;

create table if not exists public.truck_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  make text,
  model text,
  year integer,
  engine text,
  odometer numeric,
  default_mpg numeric default 6.50,
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

create table if not exists public.saved_loads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'estimated',
  pickup_zip text not null,
  pickup_city text,
  pickup_state text,
  delivery_zip text not null,
  delivery_city text,
  delivery_state text,
  loaded_miles numeric not null,
  deadhead_miles numeric not null,
  rate_per_mile numeric not null,
  gross_revenue numeric not null,
  total_miles numeric not null,
  fuel_cost numeric not null,
  fuel_estimate_source text,
  estimated_fuel_price numeric,
  actual_fuel_price numeric,
  fuel_override boolean not null default false,
  eia_period text,
  fuel_fetched_at timestamptz,
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
  calculation_version text not null default 'loadiq-v2',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.saved_loads
  add column if not exists pickup_city text,
  add column if not exists pickup_state text,
  add column if not exists delivery_city text,
  add column if not exists delivery_state text,
  add column if not exists status text not null default 'estimated',
  add column if not exists actual_net numeric,
  add column if not exists fuel_estimate_source text,
  add column if not exists estimated_fuel_price numeric,
  add column if not exists actual_fuel_price numeric,
  add column if not exists fuel_override boolean not null default false,
  add column if not exists eia_period text,
  add column if not exists fuel_fetched_at timestamptz,
  add column if not exists input_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists result_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists actuals_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists pay_structure_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists calculation_version text not null default 'loadiq-v2';

create table if not exists public.load_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid references public.saved_loads(id) on delete cascade,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  calculation_version text not null default 'loadiq-v2',
  created_at timestamptz default now()
);

create table if not exists public.post_trip_actuals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid not null references public.saved_loads(id) on delete cascade,
  actuals_snapshot jsonb not null default '{}'::jsonb,
  actual_net numeric,
  actual_fuel_price numeric,
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

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

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
  ('free', 10, 5, false, false, false, false),
  ('pro', null, null, true, true, true, true),
  ('founder', null, null, true, true, true, true)
on conflict (tier) do update set
  monthly_calculations = excluded.monthly_calculations,
  saved_loads = excluded.saved_loads,
  exports_allowed = excluded.exports_allowed,
  advanced_analytics_allowed = excluded.advanced_analytics_allowed,
  comparisons_allowed = excluded.comparisons_allowed,
  templates_allowed = excluded.templates_allowed;

create table if not exists public.founder_pricing_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  code text unique,
  promotion_name text not null default 'Founding Operator Access',
  promo_code_id uuid,
  is_active boolean not null default true,
  discount_percent numeric default 0,
  monthly_price numeric default 19.99,
  annual_price numeric default 149.99,
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
  monthly_price numeric default 19.99,
  annual_price numeric default 149.99,
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
  add column if not exists monthly_price numeric default 19.99,
  add column if not exists annual_price numeric default 149.99,
  add column if not exists seat_number integer,
  add column if not exists assigned_by text,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.disclaimer_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  disclaimer_version text not null,
  disclaimer_last_updated text,
  accepted_at timestamptz not null default now(),
  created_at timestamptz default now()
);

create table if not exists public.fuel_price_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique,
  source text not null default 'eia',
  fuel_type text not null default 'ULSD Diesel',
  region text not null default 'U.S. National Average',
  diesel_price numeric not null,
  price_per_gallon numeric,
  source_label text default 'U.S. Energy Information Administration',
  source_period text,
  is_estimate boolean not null default true,
  fetched_at timestamptz default now(),
  expires_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.fuel_price_cache
  add column if not exists cache_key text,
  add column if not exists fuel_type text not null default 'ULSD Diesel',
  add column if not exists price_per_gallon numeric,
  add column if not exists source_label text default 'U.S. Energy Information Administration',
  add column if not exists is_estimate boolean not null default true,
  add column if not exists expires_at timestamptz,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.accessorial_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid references public.saved_loads(id) on delete cascade,
  category text not null default 'misc',
  direction text not null default 'expense',
  amount numeric not null default 0,
  is_reimbursed boolean not null default false,
  notes text,
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

create index if not exists idx_saved_loads_user_created
on public.saved_loads (user_id, created_at desc);

create index if not exists idx_usage_events_user_event_created
on public.usage_events (user_id, event_name, created_at desc);

create index if not exists idx_lane_templates_user_created
on public.lane_templates (user_id, created_at desc);

create index if not exists idx_fuel_price_cache_source_updated
on public.fuel_price_cache (source, updated_at desc);

create index if not exists idx_promo_codes_code_active
on public.promo_codes (code, is_active);

create index if not exists idx_founder_pricing_access_active
on public.founder_pricing_access (is_active, redeemed_at);

create index if not exists idx_disclaimer_acceptances_user_created
on public.disclaimer_acceptances (user_id, created_at desc);

create index if not exists idx_accessorial_items_load
on public.accessorial_items (saved_load_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_saved_loads_updated_at on public.saved_loads;
create trigger set_saved_loads_updated_at
before update on public.saved_loads
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.user_settings enable row level security;
alter table public.truck_profiles enable row level security;
alter table public.pay_structure_templates enable row level security;
alter table public.user_overhead_items enable row level security;
alter table public.saved_loads enable row level security;
alter table public.load_estimates enable row level security;
alter table public.post_trip_actuals enable row level security;
alter table public.lane_templates enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;
alter table public.usage_limits enable row level security;
alter table public.founder_pricing_access enable row level security;
alter table public.promo_codes enable row level security;
alter table public.fuel_price_cache enable row level security;
alter table public.analytics_events enable row level security;
alter table public.trip_history enable row level security;
alter table public.disclaimer_acceptances enable row level security;
alter table public.accessorial_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='users' and policyname='Users can manage own profile') then
    create policy "Users can manage own profile" on public.users for all using (auth.uid() = id) with check (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_settings' and policyname='Users can manage own settings') then
    create policy "Users can manage own settings" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='truck_profiles' and policyname='Users can manage own truck profile') then
    create policy "Users can manage own truck profile" on public.truck_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pay_structure_templates' and policyname='Users can manage own pay templates') then
    create policy "Users can manage own pay templates" on public.pay_structure_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='user_overhead_items' and policyname='Users can manage own overhead items') then
    create policy "Users can manage own overhead items" on public.user_overhead_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='saved_loads' and policyname='Users can manage own saved loads') then
    create policy "Users can manage own saved loads" on public.saved_loads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='load_estimates' and policyname='Users can manage own load estimates') then
    create policy "Users can manage own load estimates" on public.load_estimates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='post_trip_actuals' and policyname='Users can manage own post trip actuals') then
    create policy "Users can manage own post trip actuals" on public.post_trip_actuals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='lane_templates' and policyname='Users can manage own lane templates') then
    create policy "Users can manage own lane templates" on public.lane_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='subscriptions' and policyname='Users can view own subscriptions') then
    create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='usage_events' and policyname='Users can manage own usage events') then
    create policy "Users can manage own usage events" on public.usage_events for all using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='usage_limits' and policyname='Anyone authenticated can view usage limits') then
    create policy "Anyone authenticated can view usage limits" on public.usage_limits for select using (auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='founder_pricing_access' and policyname='Users can view own founder access') then
    create policy "Users can view own founder access" on public.founder_pricing_access for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='promo_codes' and policyname='Authenticated users can view active promo codes') then
    create policy "Authenticated users can view active promo codes" on public.promo_codes for select using (auth.role() = 'authenticated' and is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='fuel_price_cache' and policyname='Authenticated users can view fuel cache') then
    create policy "Authenticated users can view fuel cache" on public.fuel_price_cache for select using (auth.role() = 'authenticated');
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='analytics_events' and policyname='Users can insert own analytics events') then
    create policy "Users can insert own analytics events" on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='trip_history' and policyname='Users can manage own trip history') then
    create policy "Users can manage own trip history" on public.trip_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='disclaimer_acceptances' and policyname='Users can manage own disclaimer acceptances') then
    create policy "Users can manage own disclaimer acceptances" on public.disclaimer_acceptances for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='accessorial_items' and policyname='Users can manage own accessorial items') then
    create policy "Users can manage own accessorial items" on public.accessorial_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end
$$;
