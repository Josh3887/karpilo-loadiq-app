-- EIA fuel baseline cache and saved-load fuel provenance.
-- Manual Supabase SQL editor compatible.

create table if not exists public.fuel_price_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text,
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

update public.fuel_price_cache
set
  cache_key = coalesce(cache_key, 'eia-us-national-ulsd-weekly'),
  fuel_type = coalesce(fuel_type, 'ULSD Diesel'),
  region = coalesce(region, 'U.S. National Average'),
  price_per_gallon = coalesce(price_per_gallon, diesel_price),
  source_label = coalesce(source_label, 'U.S. Energy Information Administration'),
  is_estimate = coalesce(is_estimate, true),
  expires_at = coalesce(expires_at, fetched_at + interval '12 hours'),
  updated_at = coalesce(updated_at, now());

create unique index if not exists idx_fuel_price_cache_cache_key
on public.fuel_price_cache (cache_key);

create index if not exists idx_fuel_price_cache_source_updated
on public.fuel_price_cache (source, updated_at desc);

alter table public.saved_loads
  add column if not exists fuel_estimate_source text,
  add column if not exists estimated_fuel_price numeric,
  add column if not exists actual_fuel_price numeric,
  add column if not exists fuel_override boolean not null default false,
  add column if not exists eia_period text,
  add column if not exists fuel_fetched_at timestamptz;

alter table public.post_trip_actuals
  add column if not exists actual_fuel_price numeric;

alter table public.fuel_price_cache enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'fuel_price_cache'
      and policyname = 'Authenticated users can view fuel cache'
  ) then
    create policy "Authenticated users can view fuel cache"
    on public.fuel_price_cache for select
    using (auth.role() = 'authenticated');
  end if;
end
$$;
