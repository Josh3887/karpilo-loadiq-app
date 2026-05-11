-- Founder access, promo codes, disclaimer audit history, and accessorial item readiness.
-- Manual Supabase SQL editor compatible.

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

alter table public.user_settings
  add column if not exists minimum_hourly_profitability numeric default 50;

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

create index if not exists idx_promo_codes_code_active
on public.promo_codes (code, is_active);

create index if not exists idx_founder_pricing_access_active
on public.founder_pricing_access (is_active, redeemed_at);

create index if not exists idx_disclaimer_acceptances_user_created
on public.disclaimer_acceptances (user_id, created_at desc);

create index if not exists idx_accessorial_items_load
on public.accessorial_items (saved_load_id, created_at desc);

drop index if exists public.idx_fuel_price_cache_cache_key;

alter table public.promo_codes enable row level security;
alter table public.disclaimer_acceptances enable row level security;
alter table public.accessorial_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'promo_codes'
      and policyname = 'Authenticated users can view active promo codes'
  ) then
    create policy "Authenticated users can view active promo codes"
    on public.promo_codes for select
    using (auth.role() = 'authenticated' and is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'disclaimer_acceptances'
      and policyname = 'Users can manage own disclaimer acceptances'
  ) then
    create policy "Users can manage own disclaimer acceptances"
    on public.disclaimer_acceptances for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'accessorial_items'
      and policyname = 'Users can manage own accessorial items'
  ) then
    create policy "Users can manage own accessorial items"
    on public.accessorial_items for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;
end
$$;
