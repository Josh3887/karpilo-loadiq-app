-- 006_demo_calculations.sql
-- Safe to rerun.
-- Purpose: optional public demo/event capture table. No app auth dependency.

create table if not exists public.demo_calculations (
  id uuid primary key default gen_random_uuid(),
  anonymous_session_id text,
  scenario_name text,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  conversion_event text,
  created_at timestamptz default now()
);

alter table public.demo_calculations
  add column if not exists anonymous_session_id text,
  add column if not exists scenario_name text,
  add column if not exists inputs jsonb not null default '{}'::jsonb,
  add column if not exists outputs jsonb not null default '{}'::jsonb,
  add column if not exists conversion_event text,
  add column if not exists created_at timestamptz default now();
