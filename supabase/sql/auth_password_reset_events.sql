-- Optional password reset audit metadata for Karpilo LoadIQ.
-- Manual Supabase SQL Editor file.
--
-- Security notes:
-- - Do not store reset tokens.
-- - Do not store passwords.
-- - Do not store raw IP addresses unless the privacy policy and support
--   workflow explicitly support it. Use a coarse/contextual string only.

create table if not exists public.auth_password_reset_events (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  event_type text not null
    check (event_type in ('request_submitted', 'request_failed', 'password_updated', 'password_update_failed')),
  status text not null
    check (status in ('accepted', 'failed', 'completed')),
  user_agent text,
  ip_context text,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_password_reset_events_created_at
on public.auth_password_reset_events (created_at desc);

create index if not exists idx_auth_password_reset_events_user_email_created_at
on public.auth_password_reset_events (lower(user_email), created_at desc)
where user_email is not null;

alter table public.auth_password_reset_events enable row level security;

revoke all on public.auth_password_reset_events from anon;
revoke all on public.auth_password_reset_events from authenticated;

grant select, insert, update, delete on public.auth_password_reset_events to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'auth_password_reset_events'
      and policyname = 'Service role can manage password reset audit events'
  ) then
    create policy "Service role can manage password reset audit events"
    on public.auth_password_reset_events
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

-- Verification:
-- select relname, relrowsecurity
-- from pg_class
-- where relname = 'auth_password_reset_events';
--
-- select policyname, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'auth_password_reset_events';

-- Rollback:
-- drop table if exists public.auth_password_reset_events;
