-- PHASE 3B CONTROL PLANE FOUNDATION
-- SAFE-TO-RUN-NOW SECTION ONLY.
--
-- DRAFTED FOR REVIEW. DO NOT APPLY TO SUPABASE UNTIL APPROVED.
--
-- Includes:
-- - pgcrypto extension
-- - app_private schema
-- - app_private.touch_updated_at()
-- - user_roles
-- - app_private.has_role_for(uuid, text[])
-- - admin_audit_events hardening
-- - append-only audit trigger
-- - admin_auth_challenges
-- - notification_templates
-- - notification_publications
-- - publication_audiences
-- - public_notification_notices view
-- - RLS enables/revokes/grants for control-plane tables
--
-- Excludes:
-- - user_badges
-- - user_milestones
-- - later-lifecycle optional sections
--
-- Security model:
-- - no payment details
-- - no plaintext challenge/token values
-- - no authenticated writes to admin/control-plane tables
-- - no anon/authenticated direct access to admin_auth_challenges
-- - public notices exposed through a safe view only
-- - admin portal writes must go through server/service-role paths

create extension if not exists pgcrypto;

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;
grant usage on schema app_private to service_role;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function app_private.touch_updated_at() from public;
grant execute on function app_private.touch_updated_at() to service_role;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'support', 'admin', 'developer', 'owner')),
  scope text not null default 'global' check (scope in ('global', 'app', 'website')),
  status text not null default 'active' check (status in ('active', 'revoked', 'suspended', 'expired')),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  expires_at timestamptz,
  reason text,
  source text not null default 'server',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_roles_active_uidx
on public.user_roles (user_id, role, scope)
where status = 'active';

create index if not exists idx_user_roles_user_status
on public.user_roles (user_id, status);

create index if not exists idx_user_roles_role_status
on public.user_roles (role, status);

drop trigger if exists user_roles_touch_updated_at on public.user_roles;
create trigger user_roles_touch_updated_at
before update on public.user_roles
for each row execute function app_private.touch_updated_at();

create or replace function app_private.has_role_for(
  check_user_id uuid,
  required_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and status = 'active'
      and role = any(required_roles)
      and (expires_at is null or expires_at > now())
  );
$$;

revoke all on function app_private.has_role_for(uuid, text[]) from public;
revoke all on function app_private.has_role_for(uuid, text[]) from anon;
revoke all on function app_private.has_role_for(uuid, text[]) from authenticated;
grant execute on function app_private.has_role_for(uuid, text[]) to service_role;

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  actor_email text,
  actor_role text,
  action text not null,
  event_type text not null default 'admin_action',
  status text not null default 'success'
    check (status in ('attempt', 'success', 'failure', 'blocked', 'expired')),
  subject_table text,
  subject_id uuid,
  target_user_id uuid references auth.users(id),
  request_ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_events
  add column if not exists actor_email text,
  add column if not exists actor_role text,
  add column if not exists event_type text not null default 'admin_action',
  add column if not exists status text not null default 'success',
  add column if not exists target_user_id uuid references auth.users(id),
  add column if not exists request_ip_hash text,
  add column if not exists user_agent_hash text;

create index if not exists idx_admin_audit_events_created
on public.admin_audit_events (created_at desc);

create index if not exists idx_admin_audit_events_actor_created
on public.admin_audit_events (actor_user_id, created_at desc);

create or replace function app_private.prevent_admin_audit_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'admin_audit_events is append-only';
end;
$$;

revoke all on function app_private.prevent_admin_audit_mutation() from public;
grant execute on function app_private.prevent_admin_audit_mutation() to service_role;

drop trigger if exists prevent_admin_audit_update_delete on public.admin_audit_events;
create trigger prevent_admin_audit_update_delete
before update or delete on public.admin_audit_events
for each row execute function app_private.prevent_admin_audit_mutation();

create table if not exists public.admin_auth_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  identity_email text not null,
  challenge_hash text not null,
  challenge_hash_algorithm text not null default 'sha256',
  challenge_sent_to text not null,
  challenge_sent_at timestamptz not null default now(),
  challenge_expires_at timestamptz not null,
  challenge_verified_at timestamptz,
  token_hash text,
  token_hash_algorithm text default 'sha256',
  token_sent_at timestamptz,
  token_expires_at timestamptz,
  token_verified_at timestamptz,
  elevated_session_expires_at timestamptz,
  status text not null default 'challenge_sent'
    check (status in (
      'challenge_sent',
      'challenge_verified',
      'token_sent',
      'token_verified',
      'expired',
      'failed',
      'revoked'
    )),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts > 0),
  request_ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_auth_challenges_user_status
on public.admin_auth_challenges (user_id, status, created_at desc);

create index if not exists idx_admin_auth_challenges_email_status
on public.admin_auth_challenges (lower(identity_email), status, created_at desc);

create index if not exists idx_admin_auth_challenges_expiry
on public.admin_auth_challenges (challenge_expires_at, token_expires_at);

drop trigger if exists admin_auth_challenges_touch_updated_at on public.admin_auth_challenges;
create trigger admin_auth_challenges_touch_updated_at
before update on public.admin_auth_challenges
for each row execute function app_private.touch_updated_at();

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  channel text not null check (channel in (
    'noreply',
    'updates',
    'newsletter',
    'in_app',
    'web',
    'push_placeholder',
    'outage_banner',
    'release_notice',
    'fix_notice',
    'bug_notice'
  )),
  name text not null,
  subject text,
  body_text text not null,
  body_html text,
  variables_schema jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft', 'review', 'approved', 'archived')),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_publications (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.notification_templates(id) on delete set null,
  title text not null,
  channel text not null check (channel in (
    'noreply',
    'updates',
    'newsletter',
    'in_app',
    'web',
    'push_placeholder',
    'outage_banner',
    'release_notice',
    'fix_notice',
    'bug_notice'
  )),
  status text not null default 'draft'
    check (status in ('draft', 'review', 'approved', 'scheduled', 'published', 'cancelled', 'failed')),
  public_visible boolean not null default false,
  severity text not null default 'info'
    check (severity in ('info', 'degraded', 'maintenance', 'incident')),
  rendered_subject text,
  rendered_body_text text,
  rendered_body_html text,
  cta_label text,
  cta_href text,
  starts_at timestamptz,
  ends_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,
  cancelled_at timestamptz,
  author_user_id uuid references auth.users(id),
  submitted_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  published_by uuid references auth.users(id),
  cancelled_by uuid references auth.users(id),
  approval_notes text,
  public_metadata jsonb not null default '{}'::jsonb,
  private_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.publication_audiences (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.notification_publications(id) on delete cascade,
  audience_type text not null check (audience_type in (
    'all_users',
    'tier',
    'role',
    'cohort',
    'newsletter',
    'waitlist',
    'specific_users',
    'manual_filter'
  )),
  filter jsonb not null default '{}'::jsonb,
  estimated_recipient_count integer,
  approved_recipient_count integer,
  created_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notification_templates_channel_status
on public.notification_templates (channel, status);

create index if not exists idx_notification_publications_status_channel
on public.notification_publications (status, channel, scheduled_at);

create index if not exists idx_publication_audiences_publication
on public.publication_audiences (publication_id);

drop trigger if exists notification_templates_touch_updated_at on public.notification_templates;
create trigger notification_templates_touch_updated_at
before update on public.notification_templates
for each row execute function app_private.touch_updated_at();

drop trigger if exists notification_publications_touch_updated_at on public.notification_publications;
create trigger notification_publications_touch_updated_at
before update on public.notification_publications
for each row execute function app_private.touch_updated_at();

create or replace view public.public_notification_notices
with (security_barrier = true)
as
select
  id,
  title,
  channel,
  severity,
  rendered_subject,
  rendered_body_text,
  cta_label,
  cta_href,
  starts_at,
  ends_at,
  published_at,
  public_metadata
from public.notification_publications
where public_visible = true
  and status = 'published'
  and channel in ('web', 'outage_banner', 'release_notice', 'fix_notice', 'bug_notice')
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now());

alter table public.user_roles enable row level security;
alter table public.admin_audit_events enable row level security;
alter table public.admin_auth_challenges enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_publications enable row level security;
alter table public.publication_audiences enable row level security;

revoke all on public.user_roles from anon, authenticated;
revoke all on public.admin_audit_events from anon, authenticated;
revoke all on public.admin_auth_challenges from anon, authenticated;
revoke all on public.notification_templates from anon, authenticated;
revoke all on public.notification_publications from anon, authenticated;
revoke all on public.publication_audiences from anon, authenticated;

grant select, insert, update on public.user_roles to service_role;
grant select, insert on public.admin_audit_events to service_role;
grant select, insert, update on public.admin_auth_challenges to service_role;
grant select, insert, update on public.notification_templates to service_role;
grant select, insert, update on public.notification_publications to service_role;
grant select, insert, update on public.publication_audiences to service_role;

revoke all on public.public_notification_notices from public;
grant select on public.public_notification_notices to anon, authenticated;

-- No anon/authenticated table policies are intentionally created for the
-- admin/control-plane tables above. All admin reads/writes go through
-- server/service-role routes after backend role verification.
