-- Karpilo LoadIQ APP + WEBSITE Supabase alignment
-- Purpose:
--   1) audit the APP Supabase project before updates,
--   2) preserve existing APP auth/profile/billing systems,
--   3) add WEBSITE intake/reservation/newsletter/status tables safely.
--
-- IMPORTANT:
--   - Run Block 1 first.
--   - Review missing/conflicting objects before running Blocks 2-4.
--   - This script does not DROP tables, DROP columns, or overwrite app tables.
--   - Service-role server routes are the write path for website submissions.

-- ============================================================
-- BLOCK 1: LOCAL COMPATIBILITY AUDIT
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: NO
-- AFFECTS APP TABLES: NO
-- AFFECTS WEBSITE TABLES: NO
-- ============================================================

with expected_tables(owner_system, table_name, expected_access) as (
  values
    ('APP', 'users', 'authenticated own-row profile'),
    ('APP', 'subscriptions', 'authenticated own-row read; service_role webhook writes'),
    ('APP', 'user_settings', 'authenticated own-row settings'),
    ('APP', 'truck_profiles', 'authenticated own-row vehicle profile'),
    ('APP', 'user_overhead_items', 'authenticated own-row expense settings'),
    ('APP', 'pay_structure_templates', 'authenticated own-row pay templates'),
    ('APP', 'saved_loads', 'authenticated own-row loads'),
    ('APP', 'usage_events', 'authenticated own-row usage'),
    ('APP', 'system_health_notices', 'APP health-notice shape'),
    ('APP', 'active_system_health_notices', 'APP health view'),
    ('WEBSITE', 'website_reservations', 'service_role website reservation writes'),
    ('WEBSITE', 'reservation_events', 'service_role reservation event writes'),
    ('WEBSITE', 'pricing_entitlements', 'service_role pricing lock writes'),
    ('WEBSITE', 'support_intake', 'service_role/public support intake'),
    ('WEBSITE', 'contact_inquiries', 'legacy website contact fallback'),
    ('WEBSITE', 'newsletter_subscribers', 'service_role/public newsletter'),
    ('WEBSITE', 'waitlist', 'legacy website waitlist fallback'),
    ('WEBSITE', 'email_outbox', 'service_role Resend audit queue'),
    ('WEBSITE', 'email_delivery_events', 'service_role Resend delivery audit'),
    ('WEBSITE', 'rollout_phases', 'public rollout status read'),
    ('WEBSITE', 'rollout_waitlist', 'service_role rollout waitlist writes'),
    ('WEBSITE', 'rollout_access_events', 'service_role rollout event writes'),
    ('WEBSITE', 'system_health_events', 'public website status read')
),
objects as (
  select
    n.nspname as schema_name,
    c.relname as object_name,
    case c.relkind
      when 'r' then 'table'
      when 'v' then 'view'
      when 'm' then 'materialized_view'
      else c.relkind::text
    end as object_type
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
)
select
  e.owner_system,
  e.table_name,
  e.expected_access,
  coalesce(o.object_type, 'MISSING') as current_state
from expected_tables e
left join objects o on o.object_name = e.table_name
order by e.owner_system, e.table_name;

with expected_columns(table_name, column_name) as (
  values
    ('subscriptions', 'provider'),
    ('subscriptions', 'provider_customer_id'),
    ('subscriptions', 'provider_subscription_id'),
    ('subscriptions', 'trial_end'),
    ('subscriptions', 'current_period_end'),
    ('subscriptions', 'cancel_at_period_end'),
    ('subscriptions', 'canceled_at'),
    ('user_settings', 'default_mpg'),
    ('truck_profiles', 'default_mpg'),
    ('website_reservations', 'assigned_cohort'),
    ('pricing_entitlements', 'pricing_lock_tier'),
    ('support_intake', 'intake_type'),
    ('contact_inquiries', 'request_type'),
    ('newsletter_subscribers', 'consented_at'),
    ('email_outbox', 'provider_message_id'),
    ('rollout_phases', 'phase_key'),
    ('system_health_events', 'public_visible')
)
select
  e.table_name,
  e.column_name,
  case when c.column_name is null then 'MISSING' else 'present' end as current_state
from expected_columns e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = e.table_name
 and c.column_name = e.column_name
order by e.table_name, e.column_name;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'subscriptions',
    'user_settings',
    'truck_profiles',
    'user_overhead_items',
    'pay_structure_templates',
    'website_reservations',
    'support_intake',
    'newsletter_subscribers',
    'rollout_phases',
    'system_health_events'
  )
order by tablename, policyname;

select
  grantee,
  table_name,
  privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
  and table_name in (
    'subscriptions',
    'website_reservations',
    'support_intake',
    'newsletter_subscribers',
    'email_outbox',
    'rollout_phases',
    'system_health_events'
  )
order by table_name, grantee, privilege_type;

-- ============================================================
-- BLOCK 2: APP SETTINGS/BILLING COMPATIBILITY
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: NO
-- AFFECTS APP TABLES: YES
-- AFFECTS WEBSITE TABLES: NO
-- ============================================================

alter table if exists public.subscriptions
  add column if not exists provider text not null default 'stripe',
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists plan_code text not null default 'free',
  add column if not exists billing_interval text,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists pilot_pricing_locked boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

grant usage on schema public to authenticated, service_role;

do $$
begin
  if to_regclass('public.subscriptions') is not null then
    execute 'alter table public.subscriptions enable row level security';
    execute 'create index if not exists idx_subscriptions_user_status_created on public.subscriptions (user_id, status, created_at desc)';
    execute 'create index if not exists idx_subscriptions_provider_subscription_unique on public.subscriptions (provider, provider_subscription_id) where provider_subscription_id is not null';
    execute 'create index if not exists idx_subscriptions_provider_customer on public.subscriptions (provider, provider_customer_id) where provider_customer_id is not null';
    execute 'revoke all privileges on public.subscriptions from anon, authenticated, service_role';
    execute 'grant select on public.subscriptions to authenticated';
    execute 'grant select, insert, update, delete on public.subscriptions to service_role';
  end if;

  if to_regclass('public.subscriptions') is not null and not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscriptions'
      and policyname = 'Users can view own subscriptions'
  ) then
    create policy "Users can view own subscriptions"
      on public.subscriptions
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end $$;

-- ============================================================
-- BLOCK 3: WEBSITE TABLES ON APP SUPABASE
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: YES
-- AFFECTS APP TABLES: NO
-- AFFECTS WEBSITE TABLES: YES
-- ============================================================

create extension if not exists pgcrypto;

-- Partial-run preflight: if any WEBSITE table already exists from an earlier
-- draft or failed run, add the columns referenced by early indexes/seeds before
-- the rest of Block 3 touches them.
do $$
begin
  if to_regclass('public.website_reservations') is not null then
    alter table public.website_reservations
      add column if not exists email text,
      add column if not exists assigned_cohort text,
      add column if not exists status text default 'submitted',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.pricing_entitlements') is not null then
    alter table public.pricing_entitlements
      add column if not exists reservation_id uuid,
      add column if not exists status text default 'pending_review';
  end if;

  if to_regclass('public.support_intake') is not null then
    alter table public.support_intake
      add column if not exists status text default 'new',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.contact_inquiries') is not null then
    alter table public.contact_inquiries
      add column if not exists status text default 'new',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.newsletter_subscribers') is not null then
    alter table public.newsletter_subscribers
      add column if not exists email text,
      add column if not exists status text default 'subscribed',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.email_outbox') is not null then
    alter table public.email_outbox
      add column if not exists status text default 'queued',
      add column if not exists created_at timestamptz default now();
  end if;

  if to_regclass('public.rollout_phases') is not null then
    alter table public.rollout_phases
      add column if not exists phase_key text,
      add column if not exists status text default 'upcoming',
      add column if not exists public_visible boolean default true,
      add column if not exists starts_at timestamptz default now();
  end if;

  if to_regclass('public.rollout_waitlist') is not null then
    alter table public.rollout_waitlist
      add column if not exists email text,
      add column if not exists phase_key text,
      add column if not exists status text default 'submitted';
  end if;

  if to_regclass('public.system_health_events') is not null then
    alter table public.system_health_events
      add column if not exists status text default 'active',
      add column if not exists public_visible boolean default true,
      add column if not exists starts_at timestamptz default now();
  end if;
end $$;

create table if not exists public.launch_program_state (
  program_key text primary key,
  display_name text not null,
  current_phase text not null default 'waitlist_only',
  opens_at timestamptz,
  closes_at timestamptz,
  slot_limit integer not null default 0 check (slot_limit >= 0),
  slots_reserved integer not null default 0 check (slots_reserved >= 0),
  slots_claimed integer not null default 0 check (slots_claimed >= 0),
  reservation_enabled boolean not null default true,
  billing_enabled boolean not null default false,
  pricing_lock_enabled boolean not null default false,
  waitlist_only_mode boolean not null default true,
  monthly_price numeric(10, 2) not null default 0,
  annual_price numeric(10, 2) not null default 0,
  provider_price_map jsonb not null default '{}'::jsonb,
  public_visible boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.launch_program_state
  add column if not exists current_phase text not null default 'waitlist_only',
  add column if not exists slots_reserved integer not null default 0,
  add column if not exists reservation_enabled boolean not null default true,
  add column if not exists billing_enabled boolean not null default false,
  add column if not exists pricing_lock_enabled boolean not null default false,
  add column if not exists monthly_price numeric(10, 2) not null default 0,
  add column if not exists annual_price numeric(10, 2) not null default 0,
  add column if not exists public_visible boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_by uuid references auth.users(id);

create table if not exists public.website_reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  fleet_size text,
  requested_cohort text not null,
  assigned_cohort text not null,
  intended_billing_provider text not null default 'undecided',
  pricing_lock_tier text not null,
  status text not null default 'submitted',
  source text not null default 'website',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists website_reservations_email_cohort_uidx
on public.website_reservations (lower(email), assigned_cohort);

create table if not exists public.reservation_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.website_reservations(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system',
  actor_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_entitlements (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid references public.website_reservations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  cohort text not null,
  pricing_lock_tier text not null,
  monthly_price numeric(10, 2) not null,
  annual_price numeric(10, 2) not null,
  intended_billing_provider text not null default 'undecided',
  status text not null default 'pending_review',
  active boolean not null default false,
  source text not null default 'website_reservation',
  activated_at timestamptz,
  revoked_at timestamptz,
  revocation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pricing_entitlements_reservation_uidx
on public.pricing_entitlements (reservation_id)
where reservation_id is not null;

create table if not exists public.support_intake (
  id uuid primary key default gen_random_uuid(),
  intake_type text not null,
  name text not null,
  email text not null,
  role text,
  message text not null,
  source text not null default 'website',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text,
  message text not null,
  source text not null default 'website',
  request_type text not null default 'support',
  destination_email text,
  priority text not null default 'normal',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  company text,
  source text not null default 'website',
  status text not null default 'subscribed',
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  company text,
  fleet_size text,
  founder_access boolean not null default false,
  program_interest text,
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  channel_key text not null,
  provider text not null default 'resend',
  message_type text not null,
  to_email text not null,
  from_email text not null,
  reply_to_email text,
  subject text not null,
  status text not null default 'queued',
  provider_message_id text,
  related_table text,
  related_id text,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  email_outbox_id uuid references public.email_outbox(id) on delete set null,
  provider text not null default 'resend',
  provider_message_id text,
  event_type text not null,
  event_status text not null,
  recipient_email text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.rollout_phases (
  id uuid primary key default gen_random_uuid(),
  phase_key text not null unique,
  sort_order integer not null,
  title text not null,
  short_label text not null,
  capacity integer,
  reserved_slots integer not null default 0,
  accepted_slots integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  duration_days integer,
  status text not null default 'upcoming',
  accepting_reservations boolean not null default false,
  description text not null,
  expectation text not null,
  cta_label text not null,
  target_route text not null default '/contact',
  admin_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.rollout_waitlist (
  id uuid primary key default gen_random_uuid(),
  phase_key text not null references public.rollout_phases(phase_key),
  name text not null,
  email text not null,
  company text,
  fleet_size text,
  intended_billing_provider text not null default 'undecided',
  status text not null default 'submitted',
  source text not null default 'website',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists rollout_waitlist_email_phase_uidx
on public.rollout_waitlist (lower(email), phase_key);

create table if not exists public.rollout_access_events (
  id uuid primary key default gen_random_uuid(),
  rollout_waitlist_id uuid references public.rollout_waitlist(id) on delete set null,
  phase_key text not null references public.rollout_phases(phase_key),
  event_type text not null,
  actor_type text not null default 'system',
  actor_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.system_health_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  severity text not null default 'info',
  status text not null default 'active',
  affects_onboarding boolean not null default false,
  public_visible boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Existing WEBSITE tables may already exist from an earlier draft. CREATE TABLE
-- IF NOT EXISTS will not add columns, so this compatibility pass adds every
-- column referenced by the website routes before indexes, triggers, or seeds run.
alter table public.website_reservations
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists fleet_size text,
  add column if not exists requested_cohort text,
  add column if not exists assigned_cohort text,
  add column if not exists intended_billing_provider text default 'undecided',
  add column if not exists pricing_lock_tier text,
  add column if not exists status text default 'submitted',
  add column if not exists source text default 'website',
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz,
  add column if not exists review_notes text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.reservation_events
  add column if not exists reservation_id uuid references public.website_reservations(id) on delete cascade,
  add column if not exists event_type text,
  add column if not exists actor_type text default 'system',
  add column if not exists actor_user_id uuid references auth.users(id),
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

alter table public.pricing_entitlements
  add column if not exists reservation_id uuid references public.website_reservations(id) on delete set null,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists email text,
  add column if not exists cohort text,
  add column if not exists pricing_lock_tier text,
  add column if not exists monthly_price numeric(10, 2),
  add column if not exists annual_price numeric(10, 2),
  add column if not exists intended_billing_provider text default 'undecided',
  add column if not exists status text default 'pending_review',
  add column if not exists active boolean default false,
  add column if not exists source text default 'website_reservation',
  add column if not exists activated_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revocation_reason text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.support_intake
  add column if not exists intake_type text,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists message text,
  add column if not exists source text default 'website',
  add column if not exists status text default 'new',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.contact_inquiries
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists message text,
  add column if not exists source text default 'website',
  add column if not exists request_type text default 'support',
  add column if not exists destination_email text,
  add column if not exists priority text default 'normal',
  add column if not exists status text default 'new',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.newsletter_subscribers
  add column if not exists email text,
  add column if not exists name text,
  add column if not exists company text,
  add column if not exists source text default 'website',
  add column if not exists status text default 'subscribed',
  add column if not exists consented_at timestamptz default now(),
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.waitlist
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists fleet_size text,
  add column if not exists founder_access boolean default false,
  add column if not exists program_interest text,
  add column if not exists source text default 'website',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.email_outbox
  add column if not exists channel_key text,
  add column if not exists provider text default 'resend',
  add column if not exists message_type text,
  add column if not exists to_email text,
  add column if not exists from_email text,
  add column if not exists reply_to_email text,
  add column if not exists subject text,
  add column if not exists status text default 'queued',
  add column if not exists provider_message_id text,
  add column if not exists related_table text,
  add column if not exists related_id text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists error_message text,
  add column if not exists sent_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.email_delivery_events
  add column if not exists email_outbox_id uuid references public.email_outbox(id) on delete set null,
  add column if not exists provider text default 'resend',
  add column if not exists provider_message_id text,
  add column if not exists event_type text,
  add column if not exists event_status text,
  add column if not exists recipient_email text,
  add column if not exists payload jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

alter table public.rollout_phases
  add column if not exists phase_key text,
  add column if not exists sort_order integer default 0,
  add column if not exists title text,
  add column if not exists short_label text,
  add column if not exists capacity integer,
  add column if not exists reserved_slots integer default 0,
  add column if not exists accepted_slots integer default 0,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists duration_days integer,
  add column if not exists status text default 'upcoming',
  add column if not exists accepting_reservations boolean default false,
  add column if not exists description text,
  add column if not exists expectation text,
  add column if not exists cta_label text,
  add column if not exists target_route text default '/contact',
  add column if not exists admin_note text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid references auth.users(id);

alter table public.rollout_waitlist
  add column if not exists phase_key text,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists company text,
  add column if not exists fleet_size text,
  add column if not exists intended_billing_provider text default 'undecided',
  add column if not exists status text default 'submitted',
  add column if not exists source text default 'website',
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table public.rollout_access_events
  add column if not exists rollout_waitlist_id uuid references public.rollout_waitlist(id) on delete set null,
  add column if not exists phase_key text,
  add column if not exists event_type text,
  add column if not exists actor_type text default 'system',
  add column if not exists actor_user_id uuid references auth.users(id),
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

alter table public.system_health_events
  add column if not exists title text,
  add column if not exists message text,
  add column if not exists severity text default 'info',
  add column if not exists status text default 'active',
  add column if not exists affects_onboarding boolean default false,
  add column if not exists public_visible boolean default true,
  add column if not exists starts_at timestamptz default now(),
  add column if not exists ends_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now(),
  add column if not exists updated_by uuid references auth.users(id);

create index if not exists idx_website_reservations_email_created
on public.website_reservations (lower(email), created_at desc);

create index if not exists idx_support_intake_created
on public.support_intake (created_at desc);

create index if not exists idx_contact_inquiries_created
on public.contact_inquiries (created_at desc);

create index if not exists idx_newsletter_subscribers_email
on public.newsletter_subscribers (lower(email));

create index if not exists idx_email_outbox_status_created
on public.email_outbox (status, created_at desc);

create index if not exists idx_system_health_events_public_status
on public.system_health_events (public_visible, status, starts_at desc);

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'touch_updated_at'
      and p.pronargs = 0
  ) then
    execute $fn$
      create function public.touch_updated_at()
      returns trigger
      language plpgsql
      set search_path = public
      as $body$
      begin
        new.updated_at = now();
        return new;
      end;
      $body$
    $fn$;
  end if;
end $$;

do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('launch_program_state', 'launch_program_state_touch_updated_at'),
      ('website_reservations', 'website_reservations_touch_updated_at'),
      ('pricing_entitlements', 'pricing_entitlements_touch_updated_at'),
      ('support_intake', 'support_intake_touch_updated_at'),
      ('contact_inquiries', 'contact_inquiries_touch_updated_at'),
      ('newsletter_subscribers', 'newsletter_subscribers_touch_updated_at'),
      ('waitlist', 'waitlist_touch_updated_at'),
      ('email_outbox', 'email_outbox_touch_updated_at'),
      ('rollout_phases', 'rollout_phases_touch_updated_at'),
      ('rollout_waitlist', 'rollout_waitlist_touch_updated_at'),
      ('system_health_events', 'system_health_events_touch_updated_at')
    ) as t(table_name, trigger_name)
  loop
    if to_regclass('public.' || item.table_name) is not null and not exists (
      select 1 from pg_trigger
      where tgname = item.trigger_name
        and tgrelid = to_regclass('public.' || item.table_name)
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
        item.trigger_name,
        item.table_name
      );
    end if;
  end loop;
end $$;

insert into public.launch_program_state (
  program_key,
  display_name,
  current_phase,
  slot_limit,
  monthly_price,
  annual_price,
  reservation_enabled,
  billing_enabled,
  pricing_lock_enabled,
  waitlist_only_mode
)
values
  ('founder_50', 'Founding 50 Pilot Program', 'pre_pilot', 50, 14.99, 129.99, true, false, true, true),
  ('launch_500', 'First 500 Launch Operators', 'queued', 500, 19.99, 149.99, true, false, true, true),
  ('standard_future', 'Standard Future Users', 'future_standard', 2147483647, 29.99, 299.99, true, false, false, true)
on conflict (program_key) do nothing;

insert into public.rollout_phases (
  phase_key,
  sort_order,
  title,
  short_label,
  capacity,
  starts_at,
  ends_at,
  duration_days,
  status,
  accepting_reservations,
  description,
  expectation,
  cta_label,
  target_route
)
values
  ('PRELAUNCH_WAITLIST', 0, 'Prelaunch Waitlist', 'Waitlist', null, '2026-05-13T13:00:00Z', '2026-06-27T13:00:00Z', 45, 'active', true, 'Interest capture and operator expectation setting before founder access opens.', 'No billing is active. Visitors may reserve eligibility and follow deployment updates.', 'Reserve Eligibility', '/pilot-program'),
  ('FOUNDER_PILOT', 1, 'Founder Pilot', 'Founder 50', 50, '2026-06-27T13:00:00Z', '2026-08-11T13:00:00Z', 45, 'upcoming', true, 'First 50 approved users shape the operational pilot while deployment pressure remains controlled.', 'Access is limited, reviewed, and may pause if infrastructure or support load requires it.', 'Join Founder Pilot List', '/pilot-program'),
  ('CONTROLLED_PUBLIC_LAUNCH', 2, 'Controlled Public Launch', 'Launch 250', 250, '2026-08-11T13:00:00Z', '2026-10-10T13:00:00Z', 60, 'upcoming', true, 'A measured public launch cohort expands access after founder pilot learning is incorporated.', 'Launch access remains capacity-limited and may be throttled during operational events.', 'Join Launch Queue', '/launch-promo'),
  ('EXPANSION_ACCESS', 3, 'Expansion Access', 'Expansion 250', 250, '2026-10-10T13:00:00Z', '2027-01-08T14:00:00Z', 90, 'upcoming', true, 'A second controlled expansion cohort validates readiness before open availability.', 'Expansion access remains monitored before general availability.', 'Join Expansion Queue', '/launch-promo'),
  ('GENERAL_AVAILABILITY', 4, 'General Availability', 'GA', null, '2027-01-08T14:00:00Z', null, null, 'upcoming', false, 'Open access begins after controlled rollout readiness is validated.', 'Billing, support, and onboarding systems must remain stable before this phase opens.', 'View Pricing', '/pricing')
on conflict (phase_key) do nothing;

-- ============================================================
-- BLOCK 4: GRANTS, RLS, POLICIES, AND SERVICE-ROLE RPC
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: YES
-- AFFECTS APP TABLES: NO
-- AFFECTS WEBSITE TABLES: YES
-- ============================================================

alter table public.launch_program_state enable row level security;
alter table public.website_reservations enable row level security;
alter table public.reservation_events enable row level security;
alter table public.pricing_entitlements enable row level security;
alter table public.support_intake enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.waitlist enable row level security;
alter table public.email_outbox enable row level security;
alter table public.email_delivery_events enable row level security;
alter table public.rollout_phases enable row level security;
alter table public.rollout_waitlist enable row level security;
alter table public.rollout_access_events enable row level security;
alter table public.system_health_events enable row level security;

grant usage on schema public to anon, authenticated, service_role;

revoke all privileges on
  public.launch_program_state,
  public.website_reservations,
  public.reservation_events,
  public.pricing_entitlements,
  public.support_intake,
  public.contact_inquiries,
  public.newsletter_subscribers,
  public.waitlist,
  public.email_outbox,
  public.email_delivery_events,
  public.rollout_phases,
  public.rollout_waitlist,
  public.rollout_access_events,
  public.system_health_events
from anon, authenticated, service_role;

grant select on public.rollout_phases to anon, authenticated;
grant select on public.system_health_events to anon, authenticated;
grant select on public.launch_program_state to authenticated;

grant insert on
  public.website_reservations,
  public.support_intake,
  public.contact_inquiries,
  public.newsletter_subscribers,
  public.waitlist,
  public.rollout_waitlist
to anon, authenticated;

grant select, insert, update, delete on
  public.launch_program_state,
  public.website_reservations,
  public.reservation_events,
  public.pricing_entitlements,
  public.support_intake,
  public.contact_inquiries,
  public.newsletter_subscribers,
  public.waitlist,
  public.email_outbox,
  public.email_delivery_events,
  public.rollout_phases,
  public.rollout_waitlist,
  public.rollout_access_events,
  public.system_health_events
to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rollout_phases'
      and policyname = 'Public can read rollout phases'
  ) then
    create policy "Public can read rollout phases"
      on public.rollout_phases
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_health_events'
      and policyname = 'Public can read visible system health events'
  ) then
    create policy "Public can read visible system health events"
      on public.system_health_events
      for select
      to anon, authenticated
      using (public_visible = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'website_reservations'
      and policyname = 'Public can submit website reservations'
  ) then
    create policy "Public can submit website reservations"
      on public.website_reservations
      for insert
      to anon, authenticated
      with check (status = 'submitted');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'support_intake'
      and policyname = 'Public can submit support intake'
  ) then
    create policy "Public can submit support intake"
      on public.support_intake
      for insert
      to anon, authenticated
      with check (status = 'new');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_inquiries'
      and policyname = 'Public can submit contact inquiries'
  ) then
    create policy "Public can submit contact inquiries"
      on public.contact_inquiries
      for insert
      to anon, authenticated
      with check (status = 'new');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'newsletter_subscribers'
      and policyname = 'Public can subscribe to newsletter'
  ) then
    create policy "Public can subscribe to newsletter"
      on public.newsletter_subscribers
      for insert
      to anon, authenticated
      with check (status = 'subscribed');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'waitlist'
      and policyname = 'Public can submit legacy waitlist'
  ) then
    create policy "Public can submit legacy waitlist"
      on public.waitlist
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'rollout_waitlist'
      and policyname = 'Public can submit rollout waitlist'
  ) then
    create policy "Public can submit rollout waitlist"
      on public.rollout_waitlist
      for insert
      to anon, authenticated
      with check (status = 'submitted');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'submit_website_reservation'
      and p.pronargs = 7
  ) then
    execute $fn$
      create function public.submit_website_reservation(
        p_name text,
        p_email text,
        p_company text default null,
        p_fleet_size text default null,
        p_requested_cohort text default 'founder_50',
        p_intended_billing_provider text default 'undecided',
        p_source text default 'website'
      )
      returns table (
        reservation_id uuid,
        already_exists boolean,
        assigned_cohort text,
        pricing_lock_tier text
      )
      language plpgsql
      set search_path = public
      as $body$
      declare
        program_row public.launch_program_state%rowtype;
        existing_row public.website_reservations%rowtype;
        normalized_email text;
      begin
        normalized_email := lower(trim(p_email));

        if trim(coalesce(p_name, '')) = '' or normalized_email = '' then
          raise exception 'Name and email are required';
        end if;

        if p_requested_cohort not in ('founder_50', 'launch_500', 'standard_future') then
          p_requested_cohort := 'founder_50';
        end if;

        if p_intended_billing_provider not in ('stripe_web', 'apple_app_store', 'google_play', 'undecided') then
          p_intended_billing_provider := 'undecided';
        end if;

        select *
          into program_row
          from public.launch_program_state
          where program_key = p_requested_cohort
          for update;

        if not found or not program_row.reservation_enabled then
          raise exception 'Reservations are not available for this cohort';
        end if;

        select *
          into existing_row
          from public.website_reservations wr
          where lower(wr.email) = normalized_email
            and wr.assigned_cohort = p_requested_cohort;

        if found then
          insert into public.reservation_events (reservation_id, event_type, actor_type, metadata)
          values (
            existing_row.id,
            'duplicate_submission',
            'public_visitor',
            jsonb_build_object('source', p_source, 'intended_billing_provider', p_intended_billing_provider)
          );

          reservation_id := existing_row.id;
          already_exists := true;
          assigned_cohort := existing_row.assigned_cohort;
          pricing_lock_tier := existing_row.pricing_lock_tier;
          return next;
          return;
        end if;

        if program_row.slots_reserved >= program_row.slot_limit then
          raise exception 'No reservation slots remain for this cohort';
        end if;

        insert into public.website_reservations (
          name,
          email,
          company,
          fleet_size,
          requested_cohort,
          assigned_cohort,
          intended_billing_provider,
          pricing_lock_tier,
          status,
          source
        )
        values (
          trim(p_name),
          normalized_email,
          nullif(trim(coalesce(p_company, '')), ''),
          nullif(trim(coalesce(p_fleet_size, '')), ''),
          p_requested_cohort,
          p_requested_cohort,
          p_intended_billing_provider,
          case
            when p_requested_cohort = 'founder_50' then 'founder_50'
            when p_requested_cohort = 'launch_500' then 'launch_500'
            else 'standard'
          end,
          'submitted',
          p_source
        )
        returning * into existing_row;

        update public.launch_program_state
          set slots_reserved = slots_reserved + 1
          where program_key = p_requested_cohort;

        insert into public.reservation_events (reservation_id, event_type, actor_type, metadata)
        values (
          existing_row.id,
          'reservation_submitted',
          'public_visitor',
          jsonb_build_object('source', p_source, 'intended_billing_provider', p_intended_billing_provider)
        );

        if p_requested_cohort in ('founder_50', 'launch_500') then
          insert into public.pricing_entitlements (
            reservation_id,
            email,
            cohort,
            pricing_lock_tier,
            monthly_price,
            annual_price,
            intended_billing_provider,
            status,
            active,
            source
          )
          values (
            existing_row.id,
            normalized_email,
            p_requested_cohort,
            existing_row.pricing_lock_tier,
            program_row.monthly_price,
            program_row.annual_price,
            p_intended_billing_provider,
            'pending_review',
            false,
            'website_reservation'
          );
        end if;

        reservation_id := existing_row.id;
        already_exists := false;
        assigned_cohort := existing_row.assigned_cohort;
        pricing_lock_tier := existing_row.pricing_lock_tier;
        return next;
      end;
      $body$
    $fn$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'submit_rollout_waitlist'
      and p.pronargs = 7
  ) then
    execute $fn$
      create function public.submit_rollout_waitlist(
        p_phase_key text,
        p_name text,
        p_email text,
        p_company text default null,
        p_fleet_size text default null,
        p_intended_billing_provider text default 'undecided',
        p_source text default 'website'
      )
      returns table (
        rollout_waitlist_id uuid,
        already_exists boolean,
        phase_key text
      )
      language plpgsql
      set search_path = public
      as $body$
      declare
        phase_row public.rollout_phases%rowtype;
        waitlist_row public.rollout_waitlist%rowtype;
        normalized_email text;
      begin
        normalized_email := lower(trim(p_email));

        if trim(coalesce(p_name, '')) = '' or normalized_email = '' then
          raise exception 'Name and email are required';
        end if;

        select *
          into phase_row
          from public.rollout_phases
          where rollout_phases.phase_key = p_phase_key
          for update;

        if not found or not phase_row.accepting_reservations then
          raise exception 'Rollout phase is not accepting reservations';
        end if;

        select *
          into waitlist_row
          from public.rollout_waitlist rw
          where lower(rw.email) = normalized_email
            and rw.phase_key = p_phase_key;

        if found then
          insert into public.rollout_access_events (rollout_waitlist_id, phase_key, event_type, actor_type, metadata)
          values (
            waitlist_row.id,
            waitlist_row.phase_key,
            'duplicate_submission',
            'public_visitor',
            jsonb_build_object('source', p_source)
          );

          rollout_waitlist_id := waitlist_row.id;
          already_exists := true;
          phase_key := waitlist_row.phase_key;
          return next;
          return;
        end if;

        if phase_row.capacity is not null and phase_row.reserved_slots >= phase_row.capacity then
          raise exception 'No rollout slots remain for this phase';
        end if;

        insert into public.rollout_waitlist (
          phase_key,
          name,
          email,
          company,
          fleet_size,
          intended_billing_provider,
          status,
          source
        )
        values (
          p_phase_key,
          trim(p_name),
          normalized_email,
          nullif(trim(coalesce(p_company, '')), ''),
          nullif(trim(coalesce(p_fleet_size, '')), ''),
          p_intended_billing_provider,
          'submitted',
          p_source
        )
        returning * into waitlist_row;

        update public.rollout_phases
          set reserved_slots = reserved_slots + 1
          where rollout_phases.phase_key = p_phase_key;

        insert into public.rollout_access_events (rollout_waitlist_id, phase_key, event_type, actor_type, metadata)
        values (
          waitlist_row.id,
          waitlist_row.phase_key,
          'waitlist_submitted',
          'public_visitor',
          jsonb_build_object('source', p_source)
        );

        rollout_waitlist_id := waitlist_row.id;
        already_exists := false;
        phase_key := waitlist_row.phase_key;
        return next;
      end;
      $body$
    $fn$;
  end if;
end $$;

revoke all on function public.submit_website_reservation(text, text, text, text, text, text, text)
from public, anon, authenticated;

revoke all on function public.submit_rollout_waitlist(text, text, text, text, text, text, text)
from public, anon, authenticated;

grant execute on function public.submit_website_reservation(text, text, text, text, text, text, text)
to service_role;

grant execute on function public.submit_rollout_waitlist(text, text, text, text, text, text, text)
to service_role;

-- ============================================================
-- BLOCK 5: POST-RUN SMOKE CHECKS
-- SAFE TO RUN IN SQL EDITOR: YES
-- DESTRUCTIVE: NO
-- REQUIRES BACKUP FIRST: NO
-- AFFECTS APP TABLES: NO
-- AFFECTS WEBSITE TABLES: NO
-- ============================================================

select
  'website_reservations' as check_name,
  to_regclass('public.website_reservations') is not null as ok
union all
select 'newsletter_subscribers', to_regclass('public.newsletter_subscribers') is not null
union all
select 'email_outbox', to_regclass('public.email_outbox') is not null
union all
select 'rollout_phases', to_regclass('public.rollout_phases') is not null
union all
select 'system_health_events', to_regclass('public.system_health_events') is not null
union all
select 'subscriptions_provider_columns',
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'subscriptions'
      and column_name = 'provider_subscription_id'
  );

select
  routine_schema,
  routine_name,
  security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('submit_website_reservation', 'submit_rollout_waitlist')
order by routine_name;
