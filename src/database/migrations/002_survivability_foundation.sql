alter table public.users enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
    on public.users for insert
    with check (auth.uid() = id);
  end if;
end
$$;

alter table public.saved_loads
  add column if not exists status text not null default 'estimated',
  add column if not exists actual_net numeric,
  add column if not exists input_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists result_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists actuals_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists pay_structure_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists calculation_version text not null default 'loadiq-v1';

alter table public.user_settings
  add column if not exists default_overhead numeric default 0,
  add column if not exists default_reserve_allocation numeric default 0,
  add column if not exists target_profit_margin numeric default 20,
  add column if not exists toll_handling_mode text default 'trip_specific',
  add column if not exists lumper_handling_mode text default 'trip_specific';

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

alter table public.user_overhead_items enable row level security;
alter table public.usage_events enable row level security;
alter table public.pay_structure_templates enable row level security;
alter table public.lane_templates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_overhead_items'
      and policyname = 'Users can view own overhead items'
  ) then
    create policy "Users can view own overhead items"
    on public.user_overhead_items for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_overhead_items'
      and policyname = 'Users can insert own overhead items'
  ) then
    create policy "Users can insert own overhead items"
    on public.user_overhead_items for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_overhead_items'
      and policyname = 'Users can update own overhead items'
  ) then
    create policy "Users can update own overhead items"
    on public.user_overhead_items for update
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_overhead_items'
      and policyname = 'Users can delete own overhead items'
  ) then
    create policy "Users can delete own overhead items"
    on public.user_overhead_items for delete
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'usage_events'
      and policyname = 'Users can insert own usage events'
  ) then
    create policy "Users can insert own usage events"
    on public.usage_events for insert
    with check (auth.uid() = user_id or user_id is null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pay_structure_templates'
      and policyname = 'Users can manage own pay templates'
  ) then
    create policy "Users can manage own pay templates"
    on public.pay_structure_templates for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lane_templates'
      and policyname = 'Users can manage own lane templates'
  ) then
    create policy "Users can manage own lane templates"
    on public.lane_templates for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;
