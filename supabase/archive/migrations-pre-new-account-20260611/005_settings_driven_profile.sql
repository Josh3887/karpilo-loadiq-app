-- Settings-driven LoadIQ additions.

alter table public.users
  add column if not exists profile_name text,
  add column if not exists operation_type text default 'otr';

alter table public.user_settings
  add column if not exists income_target_amount numeric default 60000,
  add column if not exists income_target_period text default 'yearly',
  add column if not exists default_pay_template_id uuid,
  add column if not exists default_maintenance_reserve numeric default 0,
  add column if not exists default_tire_reserve numeric default 0,
  add column if not exists default_trailer_fee numeric default 0,
  add column if not exists default_insurance_allocation numeric default 0,
  add column if not exists default_variable_cost_per_mile numeric default 0,
  add column if not exists default_fixed_cost_allocation numeric default 0;

alter table public.saved_loads
  add column if not exists pickup_city text,
  add column if not exists pickup_state text,
  add column if not exists delivery_city text,
  add column if not exists delivery_state text;

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

alter table public.truck_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'truck_profiles'
      and policyname = 'Users can manage own truck profile'
  ) then
    create policy "Users can manage own truck profile"
    on public.truck_profiles for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;
