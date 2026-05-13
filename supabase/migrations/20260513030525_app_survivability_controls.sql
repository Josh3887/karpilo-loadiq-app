-- Karpilo LoadIQ app survivability controls.
-- Additive, SQL-editor compatible, and safe to rerun.
-- Covers required app policy acceptance, driver safety reminders, public-safe
-- health notices, reservation codes, and live pricing lock state.

create table if not exists public.app_policy_documents (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null,
  title text not null,
  version text not null,
  is_required boolean not null default true,
  is_active boolean not null default true,
  effective_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (policy_key, version)
);

create table if not exists public.app_policy_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  policy_key text not null,
  policy_version text not null,
  email text,
  app_version text,
  platform text not null default 'web',
  acceptance_source text not null default 'app_gate',
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (user_id, policy_key, policy_version)
);

create table if not exists public.driver_safety_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  policy_version text not null,
  acknowledged_at timestamptz not null default now(),
  source text not null default 'monthly_safety_reminder',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.system_health_notices (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'info'
    check (status in ('info', 'degraded', 'maintenance', 'warning', 'critical', 'resolved')),
  title text not null,
  public_message text not null,
  internal_notes text,
  is_active boolean not null default true,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reservation_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  cohort text not null check (cohort in ('pilot50', 'launch500')),
  status text not null default 'reserved'
    check (status in ('available', 'reserved', 'redeemed', 'lapsed', 'revoked')),
  user_id uuid references public.users(id) on delete set null,
  email text,
  seat_number integer,
  monthly_price numeric(10,2) not null,
  annual_price numeric(10,2) not null,
  billing_provider text check (billing_provider is null or billing_provider in ('stripe', 'apple', 'google', 'manual')),
  reserved_at timestamptz,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pricing_lock_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  cohort text not null check (cohort in ('pilot50', 'launch500')),
  lock_status text not null default 'active'
    check (lock_status in ('active', 'past_due', 'lapsed', 'revoked')),
  billing_provider text not null check (billing_provider in ('stripe', 'apple', 'google', 'manual')),
  provider_subscription_id text,
  monthly_price numeric(10,2) not null,
  annual_price numeric(10,2) not null,
  active_since timestamptz not null default now(),
  lapsed_at timestamptz,
  revoked_at timestamptz,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, cohort)
);

create index if not exists idx_app_policy_acceptances_user_policy
on public.app_policy_acceptances (user_id, policy_key, policy_version);

create index if not exists idx_driver_safety_ack_user_ack
on public.driver_safety_acknowledgments (user_id, acknowledged_at desc);

create index if not exists idx_system_health_notices_active
on public.system_health_notices (is_active, status, starts_at, ends_at);

create index if not exists idx_reservation_codes_user_cohort
on public.reservation_codes (user_id, cohort, status);

create index if not exists idx_pricing_lock_status_user_status
on public.pricing_lock_status (user_id, cohort, lock_status);

create or replace view public.active_system_health_notices
with (security_invoker = true)
as
select
  id,
  status,
  title,
  public_message,
  starts_at,
  ends_at,
  resolved_at,
  created_at,
  updated_at
from public.system_health_notices
where is_active = true
  and status <> 'resolved'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now());

alter table public.app_policy_documents enable row level security;
alter table public.app_policy_acceptances enable row level security;
alter table public.driver_safety_acknowledgments enable row level security;
alter table public.system_health_notices enable row level security;
alter table public.reservation_codes enable row level security;
alter table public.pricing_lock_status enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select on public.app_policy_documents to authenticated;
grant select, insert on public.app_policy_acceptances to authenticated;
grant select, insert on public.driver_safety_acknowledgments to authenticated;
grant select on public.active_system_health_notices to authenticated;
grant select on public.reservation_codes to authenticated;
grant select on public.pricing_lock_status to authenticated;

grant select, insert, update, delete on
  public.app_policy_documents,
  public.app_policy_acceptances,
  public.driver_safety_acknowledgments,
  public.system_health_notices,
  public.reservation_codes,
  public.pricing_lock_status
to service_role;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_policy_documents' and policyname = 'Authenticated users can view active required app policies') then
    create policy "Authenticated users can view active required app policies"
    on public.app_policy_documents
    for select to authenticated
    using (is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'app_policy_acceptances' and policyname = 'Users can create and view own app policy acceptances') then
    create policy "Users can create and view own app policy acceptances"
    on public.app_policy_acceptances
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own app policy acceptances"
    on public.app_policy_acceptances
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'driver_safety_acknowledgments' and policyname = 'Users can create and view own safety acknowledgments') then
    create policy "Users can create and view own safety acknowledgments"
    on public.driver_safety_acknowledgments
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own safety acknowledgments"
    on public.driver_safety_acknowledgments
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'system_health_notices' and policyname = 'Authenticated users can view public active health notices') then
    create policy "Authenticated users can view public active health notices"
    on public.system_health_notices
    for select to authenticated
    using (
      is_active = true
      and status <> 'resolved'
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at > now())
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'reservation_codes' and policyname = 'Users can view own reservation codes') then
    create policy "Users can view own reservation codes"
    on public.reservation_codes
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pricing_lock_status' and policyname = 'Users can view own pricing lock status') then
    create policy "Users can view own pricing lock status"
    on public.pricing_lock_status
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end
$$;

insert into public.app_policy_documents (policy_key, title, version, is_required, is_active)
values
  ('terms_conditions', 'Terms & Conditions', '2026-05-13', true, true),
  ('privacy_policy', 'Privacy Policy', '2026-05-13', true, true),
  ('refund_policy', 'Refund Policy', '2026-05-13', true, true),
  ('subscription_terms', 'Subscription Terms', '2026-05-13', true, true),
  ('acceptable_use_policy', 'Acceptable Use Policy', '2026-05-13', true, true),
  ('driver_safety_disclosure', 'Hands-Free & Driver Safety Disclosure', '2026-05-13', true, true),
  ('billing_policy', 'Billing Policy', '2026-05-13', true, true),
  ('pricing_lock_policy', 'Pricing Lock Policy', '2026-05-13', true, true),
  ('data_usage_disclosure', 'Data Usage Disclosure', '2026-05-13', true, true),
  ('informational_use_disclaimer', 'Informational Use Disclaimer', '2026-05-13', true, true),
  ('limitation_of_liability', 'Limitation of Liability', '2026-05-13', true, true)
on conflict (policy_key, version) do update set
  title = excluded.title,
  is_required = excluded.is_required,
  is_active = excluded.is_active,
  updated_at = now();
