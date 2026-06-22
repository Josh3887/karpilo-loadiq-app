-- Atlas AI governance foundation.
--
-- Scope:
-- - usage ledger for every AI attempt
-- - per-tier budget defaults
-- - provider-call cache/deduplication
-- - user report pathway for generated output
-- - server-side system flags / kill switches
--
-- This migration does not alter calculator math, entitlement tables,
-- subscription pricing, billing logic, or existing saved-load behavior.

create extension if not exists "pgcrypto";

create table if not exists public.ai_system_flags (
  key text primary key,
  enabled boolean not null default true,
  value jsonb not null default '{}'::jsonb,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.users(id) on delete set null
);

create table if not exists public.ai_budget_limits (
  id uuid primary key default gen_random_uuid(),
  plan_tier text not null,
  feature_key text not null default 'load_analysis',
  daily_call_limit integer not null default 0,
  monthly_call_limit integer not null default 0,
  cooldown_seconds integer not null default 60,
  monthly_token_cap integer,
  monthly_cost_cap_cents integer,
  model_tier text not null default 'mini',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_budget_limits_plan_feature_unique unique (plan_tier, feature_key),
  constraint ai_budget_limits_plan_check check (
    plan_tier in (
      'free',
      'no_access',
      'gold',
      'platinum',
      'pilot',
      'launch500',
      'admin',
      'pro'
    )
  ),
  constraint ai_budget_limits_nonnegative_check check (
    daily_call_limit >= 0
    and monthly_call_limit >= 0
    and cooldown_seconds >= 0
  ),
  constraint ai_budget_limits_model_tier_check check (
    model_tier in ('nano', 'mini', 'premium')
  )
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  feature_key text not null,
  request_hash text,
  cache_key text,
  model text,
  model_tier text,
  plan_tier text,
  status text not null,
  block_reason text,
  error_code text,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost_micros integer,
  cache_hit boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_usage_events_status_check check (
    status in ('requested', 'blocked', 'cache_hit', 'completed', 'failed')
  ),
  constraint ai_usage_events_nonnegative_tokens_check check (
    coalesce(input_tokens, 0) >= 0
    and coalesce(output_tokens, 0) >= 0
    and coalesce(total_tokens, 0) >= 0
  )
);

create table if not exists public.ai_request_cache (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null,
  cache_key text not null unique,
  request_hash text not null,
  model text not null,
  model_tier text,
  response_json jsonb not null,
  expires_at timestamptz not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_hit_at timestamptz,
  hit_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  constraint ai_request_cache_hit_count_check check (hit_count >= 0)
);

create table if not exists public.ai_output_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature_key text not null,
  usage_event_id uuid references public.ai_usage_events(id) on delete set null,
  cache_key text,
  reason text not null,
  details text,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_output_reports_reason_check check (
    reason in ('incorrect', 'unsafe', 'offensive', 'privacy', 'other')
  ),
  constraint ai_output_reports_status_check check (
    status in ('new', 'reviewing', 'resolved', 'dismissed')
  ),
  constraint ai_output_reports_details_length_check check (
    details is null or char_length(details) <= 1200
  )
);

insert into public.ai_system_flags (key, enabled, value, reason)
values
  ('atlas_ai_enabled', true, '{}'::jsonb, 'Global Atlas AI kill switch.'),
  ('load_analysis_enabled', true, '{}'::jsonb, 'Atlas load-analysis feature switch.')
on conflict (key) do nothing;

insert into public.ai_budget_limits (
  plan_tier,
  feature_key,
  daily_call_limit,
  monthly_call_limit,
  cooldown_seconds,
  model_tier,
  enabled
)
values
  ('free', 'load_analysis', 0, 0, 300, 'mini', false),
  ('no_access', 'load_analysis', 0, 0, 300, 'mini', false),
  ('gold', 'load_analysis', 5, 100, 90, 'mini', true),
  ('platinum', 'load_analysis', 20, 500, 45, 'mini', true),
  ('pilot', 'load_analysis', 5, 100, 90, 'mini', true),
  ('launch500', 'load_analysis', 5, 100, 90, 'mini', true),
  ('pro', 'load_analysis', 0, 0, 300, 'mini', false),
  ('admin', 'load_analysis', 10, 100, 30, 'premium', true)
on conflict (plan_tier, feature_key) do nothing;

create index if not exists ai_usage_events_user_feature_created_idx
  on public.ai_usage_events (user_id, feature_key, created_at desc);

create index if not exists ai_usage_events_budget_count_idx
  on public.ai_usage_events (user_id, feature_key, status, created_at desc)
  where status in ('cache_hit', 'completed');

create index if not exists ai_usage_events_request_hash_idx
  on public.ai_usage_events (feature_key, request_hash, created_at desc);

create index if not exists ai_request_cache_feature_expires_idx
  on public.ai_request_cache (feature_key, expires_at desc);

create index if not exists ai_output_reports_user_created_idx
  on public.ai_output_reports (user_id, created_at desc);

create index if not exists ai_output_reports_status_created_idx
  on public.ai_output_reports (status, created_at desc);

alter table public.ai_system_flags enable row level security;
alter table public.ai_budget_limits enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.ai_request_cache enable row level security;
alter table public.ai_output_reports enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_usage_events'
      and policyname = 'Users can view own AI usage events'
  ) then
    create policy "Users can view own AI usage events"
    on public.ai_usage_events for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_output_reports'
      and policyname = 'Users can view own AI output reports'
  ) then
    create policy "Users can view own AI output reports"
    on public.ai_output_reports for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_output_reports'
      and policyname = 'Users can insert own AI output reports'
  ) then
    create policy "Users can insert own AI output reports"
    on public.ai_output_reports for insert
    with check (auth.uid() = user_id);
  end if;
end
$$;

comment on table public.ai_usage_events is
  'Server-side Atlas AI governance ledger. Records requested, blocked, cache_hit, completed, and failed attempts.';

comment on table public.ai_budget_limits is
  'Server-side Atlas AI budget defaults by entitlement tier and feature. Does not replace subscription entitlement logic.';

comment on table public.ai_request_cache is
  'Atlas AI response cache keyed by sanitized request hash. Avoids storing raw user notes or full prompt text.';

comment on table public.ai_output_reports is
  'User-submitted reports for Atlas AI output quality, safety, privacy, or correctness review.';

comment on table public.ai_system_flags is
  'Server-side Atlas AI feature and kill-switch flags evaluated before provider calls.';
