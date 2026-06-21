-- Karpilo LoadIQ primitive app portal access foundation.
-- Additive only: these tables support app.karpilo-liq.com login, settings,
-- billing status display, Fit Check intake, and legal acknowledgement state.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  phone text,
  operator_type text,
  plan_interest text,
  legal_acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_plan_interest_check
    check (plan_interest is null or plan_interest in ('silver', 'gold', 'platinum', 'pro'))
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists company_name text,
  add column if not exists phone text,
  add column if not exists operator_type text,
  add column if not exists plan_interest text,
  add column if not exists legal_acknowledged_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.portal_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending',
  launch_phase text not null default 'beta',
  plan_interest text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_access_status_check
    check (status in ('pending', 'approved', 'suspended', 'disabled')),
  constraint portal_access_launch_phase_check
    check (launch_phase in (
      'beta',
      'legacy_launch',
      'founding_operator_phase_1',
      'founding_operator_phase_2',
      'open_market'
    )),
  constraint portal_access_plan_interest_check
    check (plan_interest is null or plan_interest in ('silver', 'gold', 'platinum', 'pro'))
);

alter table public.portal_access
  add column if not exists status text not null default 'pending',
  add column if not exists launch_phase text not null default 'beta',
  add column if not exists plan_interest text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_key text,
  subscription_status text not null default 'none',
  billing_provider text,
  stripe_customer_id text,
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_accounts_plan_key_check
    check (plan_key is null or plan_key in ('silver', 'gold', 'platinum', 'pro'))
);

alter table public.billing_accounts
  add column if not exists plan_key text,
  add column if not exists subscription_status text not null default 'none',
  add column if not exists billing_provider text,
  add column if not exists stripe_customer_id text,
  add column if not exists current_period_end timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.fit_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  operator_type text,
  authority_status text,
  truck_count integer,
  average_monthly_gross numeric(12,2),
  biggest_operating_problem text,
  primary_goal text,
  recommended_plan text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint fit_checks_truck_count_check
    check (truck_count is null or truck_count >= 0),
  constraint fit_checks_average_monthly_gross_check
    check (average_monthly_gross is null or average_monthly_gross >= 0),
  constraint fit_checks_recommended_plan_check
    check (recommended_plan is null or recommended_plan in ('silver', 'gold', 'platinum', 'pro'))
);

alter table public.fit_checks
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists operator_type text,
  add column if not exists authority_status text,
  add column if not exists truck_count integer,
  add column if not exists average_monthly_gross numeric(12,2),
  add column if not exists biggest_operating_problem text,
  add column if not exists primary_goal text,
  add column if not exists recommended_plan text,
  add column if not exists result jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_key text not null,
  version text,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.legal_acceptances
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists document_key text,
  add column if not exists version text,
  add column if not exists accepted_at timestamptz not null default now(),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists portal_access_status_idx
  on public.portal_access (status);

create index if not exists portal_access_launch_phase_idx
  on public.portal_access (launch_phase);

create index if not exists fit_checks_user_created_at_idx
  on public.fit_checks (user_id, created_at desc);

create index if not exists legal_acceptances_user_accepted_at_idx
  on public.legal_acceptances (user_id, accepted_at desc);

alter table public.profiles enable row level security;
alter table public.portal_access enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.fit_checks enable row level security;
alter table public.legal_acceptances enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.portal_access to authenticated;
grant select on public.billing_accounts to authenticated;
grant select, insert on public.fit_checks to authenticated;
grant select, insert on public.legal_acceptances to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists portal_access_select_own on public.portal_access;
create policy portal_access_select_own
  on public.portal_access
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists portal_access_insert_own on public.portal_access;
create policy portal_access_insert_own
  on public.portal_access
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists portal_access_update_own on public.portal_access;
create policy portal_access_update_own
  on public.portal_access
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists billing_accounts_select_own on public.billing_accounts;
create policy billing_accounts_select_own
  on public.billing_accounts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists fit_checks_select_own on public.fit_checks;
create policy fit_checks_select_own
  on public.fit_checks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists fit_checks_insert_own on public.fit_checks;
create policy fit_checks_insert_own
  on public.fit_checks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists legal_acceptances_select_own on public.legal_acceptances;
create policy legal_acceptances_select_own
  on public.legal_acceptances
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists legal_acceptances_insert_own on public.legal_acceptances;
create policy legal_acceptances_insert_own
  on public.legal_acceptances
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    drop trigger if exists profiles_set_updated_at on public.profiles;
    create trigger profiles_set_updated_at
      before update on public.profiles
      for each row execute function public.set_updated_at();

    drop trigger if exists portal_access_set_updated_at on public.portal_access;
    create trigger portal_access_set_updated_at
      before update on public.portal_access
      for each row execute function public.set_updated_at();

    drop trigger if exists billing_accounts_set_updated_at on public.billing_accounts;
    create trigger billing_accounts_set_updated_at
      before update on public.billing_accounts
      for each row execute function public.set_updated_at();
  end if;
end $$;

comment on table public.profiles is
  'Primitive app portal profile fields for controlled LoadIQ access.';
comment on table public.portal_access is
  'Controlled launch access state for app.karpilo-liq.com.';
comment on table public.billing_accounts is
  'Read-only user-visible billing status bridge for the primitive app portal.';
comment on table public.fit_checks is
  'Primitive app portal Fit Check intake and recommendation snapshots.';
comment on table public.legal_acceptances is
  'User acknowledgement records for controlled app portal access.';
