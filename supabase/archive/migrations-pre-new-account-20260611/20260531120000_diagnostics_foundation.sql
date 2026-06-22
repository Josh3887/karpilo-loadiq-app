-- LoadIQ internal diagnostics foundation.
-- Phase 1 scope:
-- - durable diagnostic event capture
-- - service-role-only table access
-- - no direct anon/authenticated table writes
-- - no third-party observability integration

create extension if not exists pgcrypto;

create table if not exists public.diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null default 'app_error'
    check (event_type in ('app_error')),
  severity text not null
    check (severity in ('debug', 'info', 'warning', 'error', 'critical')),
  source text not null
    check (source in ('app', 'dashboard', 'admin', 'api', 'server', 'client')),
  environment text not null,
  route text,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  release_version text,
  message text not null,
  stack text,
  digest text,
  metadata jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_note text
);

create index if not exists idx_diagnostic_events_created
on public.diagnostic_events (created_at desc);

create index if not exists idx_diagnostic_events_severity_created
on public.diagnostic_events (severity, created_at desc);

create index if not exists idx_diagnostic_events_source_created
on public.diagnostic_events (source, created_at desc);

create index if not exists idx_diagnostic_events_user_created
on public.diagnostic_events (user_id, created_at desc);

create index if not exists idx_diagnostic_events_digest_created
on public.diagnostic_events (digest, created_at desc)
where digest is not null;

alter table public.diagnostic_events enable row level security;

grant usage on schema public to service_role;
revoke all on public.diagnostic_events from anon, authenticated;
grant select, insert, update on public.diagnostic_events to service_role;

-- No anon/authenticated policies are intentionally created. Diagnostic writes
-- must go through server routes that sanitize payloads and insert with the
-- service role.
