-- 005_fuel_price_cache_eia.sql
-- Safe to rerun.
-- Purpose: EIA diesel fuel cache used by server-side fuel routes.

create table if not exists public.fuel_price_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique,
  provider text not null default 'eia',
  source text not null default 'eia',
  fuel_type text not null default 'ULSD Diesel',
  region text not null default 'U.S. National Average',
  series_id text default 'EPD2DXL0',
  diesel_price numeric(10,3),
  price numeric(10,3),
  price_per_gallon numeric(10,3),
  unit text default 'dollars per gallon',
  source_label text default 'U.S. Energy Information Administration',
  source_period text,
  period text,
  effective_date date,
  is_estimate boolean not null default true,
  fetched_at timestamptz default now(),
  expires_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.fuel_price_cache
  add column if not exists cache_key text,
  add column if not exists provider text not null default 'eia',
  add column if not exists source text not null default 'eia',
  add column if not exists fuel_type text not null default 'ULSD Diesel',
  add column if not exists region text not null default 'U.S. National Average',
  add column if not exists series_id text default 'EPD2DXL0',
  add column if not exists diesel_price numeric(10,3),
  add column if not exists price numeric(10,3),
  add column if not exists price_per_gallon numeric(10,3),
  add column if not exists unit text default 'dollars per gallon',
  add column if not exists source_label text default 'U.S. Energy Information Administration',
  add column if not exists source_period text,
  add column if not exists period text,
  add column if not exists effective_date date,
  add column if not exists is_estimate boolean not null default true,
  add column if not exists fetched_at timestamptz default now(),
  add column if not exists expires_at timestamptz,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_fuel_price_cache_cache_key
on public.fuel_price_cache (cache_key);
