-- 008_subscriptions_and_billing.sql
-- Safe to rerun.
-- Purpose: public pricing, founder/pilot access, Stripe/Apple/Google-ready subscription shape.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  plan_code text not null default 'free',
  tier text not null default 'free',
  status text not null default 'inactive',
  billing_interval text,
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  pilot_pricing_locked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions
  add column if not exists provider text not null default 'stripe',
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists plan_code text not null default 'free',
  add column if not exists tier text not null default 'free',
  add column if not exists status text not null default 'inactive',
  add column if not exists billing_interval text,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists pilot_pricing_locked boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

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

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  promotion_name text not null default 'Founding Operator Access',
  tier text not null default 'founder',
  monthly_price numeric(10,2) default 19.99,
  annual_price numeric(10,2) default 149.99,
  max_redemptions integer default 500,
  redeemed_count integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.founder_pricing_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  code text unique,
  promotion_name text not null default 'Founding Operator Access',
  promo_code_id uuid references public.promo_codes(id) on delete set null,
  is_active boolean not null default true,
  discount_percent numeric(8,2) default 0,
  monthly_price numeric(10,2) default 19.99,
  annual_price numeric(10,2) default 149.99,
  seat_number integer,
  assigned_by text,
  created_at timestamptz default now(),
  redeemed_at timestamptz,
  updated_at timestamptz default now()
);

alter table public.founder_pricing_access
  add column if not exists promotion_name text not null default 'Founding Operator Access',
  add column if not exists promo_code_id uuid references public.promo_codes(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists discount_percent numeric(8,2) default 0,
  add column if not exists monthly_price numeric(10,2) default 19.99,
  add column if not exists annual_price numeric(10,2) default 149.99,
  add column if not exists seat_number integer,
  add column if not exists assigned_by text,
  add column if not exists redeemed_at timestamptz,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.pilot_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  invite_code text unique,
  is_active boolean not null default true,
  monthly_price numeric(10,2) not null default 14.99,
  max_days integer not null default 45,
  seat_number integer,
  starts_at timestamptz,
  ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
