-- 003_overhead_categories.sql
-- Safe to rerun.
-- Purpose: app overhead items and future-ready normalized overhead categories.

create table if not exists public.user_overhead_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  category text not null default 'fixed_operations',
  amount numeric(12,2) not null default 0,
  amount_type text not null default 'flat',
  frequency text not null default 'monthly',
  responsibility text not null default 'driver',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_overhead_items
  add column if not exists label text,
  add column if not exists category text not null default 'fixed_operations',
  add column if not exists amount numeric(12,2) not null default 0,
  add column if not exists amount_type text not null default 'flat',
  add column if not exists frequency text not null default 'monthly',
  add column if not exists responsibility text not null default 'driver',
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.overhead_categories (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.operator_profiles(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  category_name text not null,
  amount numeric(12,2) not null default 0,
  frequency text not null default 'monthly',
  monthly_equivalent numeric(12,2) default 0,
  daily_equivalent numeric(12,2) default 0,
  included_in_overhead boolean not null default true,
  notes text,
  source_overhead_item_id uuid references public.user_overhead_items(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.overhead_categories
  add column if not exists profile_id uuid references public.operator_profiles(id) on delete cascade,
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists category_name text,
  add column if not exists amount numeric(12,2) not null default 0,
  add column if not exists frequency text not null default 'monthly',
  add column if not exists monthly_equivalent numeric(12,2) default 0,
  add column if not exists daily_equivalent numeric(12,2) default 0,
  add column if not exists included_in_overhead boolean not null default true,
  add column if not exists notes text,
  add column if not exists source_overhead_item_id uuid references public.user_overhead_items(id) on delete set null,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();
