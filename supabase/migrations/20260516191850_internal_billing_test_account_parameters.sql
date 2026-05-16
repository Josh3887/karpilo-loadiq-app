-- Internal billing/entitlement test account parameters.
-- Additive-only support for a single authorized dummy account used to validate
-- entitlement display, save-load gating, trial states, and billing UI behavior.
--
-- This table is not production billing authority and must not be treated as
-- proof of Stripe, Apple, Google Play, or manual payment.

create extension if not exists pgcrypto;

create table if not exists public.internal_billing_test_accounts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  enabled boolean not null default false,
  simulated_state text not null,
  entitlement_status text,
  tier text,
  program text,
  trial_status text,
  trial_duration_days integer,
  trial_start timestamptz,
  trial_end timestamptz,
  billing_starts_at timestamptz,
  lifetime_price_lock boolean,
  future_feature_access_scope text,
  cohort_phase text,
  cohort_cap integer,
  price_subject_to_change boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint internal_billing_test_accounts_authorized_email_check
    check (lower(email) = 'karpilotrucking@outlook.com'),
  constraint internal_billing_test_accounts_simulated_state_check
    check (
      simulated_state in (
        'no_subscription',
        'gold_trial_active',
        'gold_trial_expired',
        'gold_active',
        'gold_past_due',
        'gold_canceled',
        'pilot_lifetime_full_access',
        'launch_lifetime_full_access',
        'platinum_coming_soon'
      )
    ),
  constraint internal_billing_test_accounts_trial_duration_check
    check (trial_duration_days is null or trial_duration_days >= 0),
  constraint internal_billing_test_accounts_cohort_cap_check
    check (cohort_cap is null or cohort_cap >= 0)
);

create unique index if not exists internal_billing_test_accounts_email_lower_key
  on public.internal_billing_test_accounts (lower(email));

do $$
begin
  if to_regprocedure('app_private.touch_updated_at()') is not null then
    drop trigger if exists internal_billing_test_accounts_touch_updated_at
      on public.internal_billing_test_accounts;

    create trigger internal_billing_test_accounts_touch_updated_at
      before update on public.internal_billing_test_accounts
      for each row execute function app_private.touch_updated_at();
  end if;
end $$;

alter table public.internal_billing_test_accounts enable row level security;

revoke all on public.internal_billing_test_accounts from public;
revoke all on public.internal_billing_test_accounts from anon;
revoke all on public.internal_billing_test_accounts from authenticated;
grant select, insert, update, delete on public.internal_billing_test_accounts to service_role;

comment on table public.internal_billing_test_accounts is
  'Service-controlled internal test account parameters for Karpilo LoadIQ billing and entitlement validation. Not production billing authority or proof of payment.';
comment on column public.internal_billing_test_accounts.email is
  'Restricted by check constraint to the authorized internal dummy account only.';
comment on column public.internal_billing_test_accounts.enabled is
  'Disabled by default. Server-side code must opt in before consuming simulated entitlement state.';
comment on column public.internal_billing_test_accounts.simulated_state is
  'Named internal simulation state for billing UI, trial, save-load gating, and entitlement display testing.';
comment on column public.internal_billing_test_accounts.entitlement_status is
  'Simulated normalized entitlement status for internal testing only.';
comment on column public.internal_billing_test_accounts.tier is
  'Simulated plan tier for internal testing only; does not prove payment or subscription ownership.';
comment on column public.internal_billing_test_accounts.program is
  'Simulated program/cohort code for internal testing only.';
comment on column public.internal_billing_test_accounts.trial_status is
  'Simulated trial lifecycle status for internal testing only.';
comment on column public.internal_billing_test_accounts.trial_duration_days is
  'Simulated trial length in days when the selected state represents trial behavior.';
comment on column public.internal_billing_test_accounts.billing_starts_at is
  'Simulated billing start timestamp for internal UI validation only.';
comment on column public.internal_billing_test_accounts.lifetime_price_lock is
  'Simulated lifetime price-lock flag for internal display validation only.';
comment on column public.internal_billing_test_accounts.future_feature_access_scope is
  'Simulated future-feature access scope. Pilot/Launch scope means future released Karpilo LoadIQ platform features made generally available within the platform ecosystem; it does not mean custom enterprise development, legal/tax/accounting services, or unrelated future products.';
comment on column public.internal_billing_test_accounts.cohort_phase is
  'Simulated cohort phase for Pilot/Launch billing display testing.';
comment on column public.internal_billing_test_accounts.cohort_cap is
  'Simulated cohort cap for Pilot/Launch billing display testing.';
comment on column public.internal_billing_test_accounts.price_subject_to_change is
  'Simulated price-change flag for internal display testing only.';
comment on column public.internal_billing_test_accounts.notes is
  'Internal notes describing the dummy billing/entitlement test record.';

insert into public.internal_billing_test_accounts (
  email,
  enabled,
  simulated_state,
  entitlement_status,
  tier,
  program,
  trial_status,
  trial_duration_days,
  lifetime_price_lock,
  future_feature_access_scope,
  cohort_phase,
  cohort_cap,
  price_subject_to_change,
  notes
)
select
  'Karpilotrucking@outlook.com',
  false,
  'pilot_lifetime_full_access',
  'active',
  'pilot',
  'pilot',
  'not_required',
  null,
  true,
  'lifetime_access_to_future_released_karpilo_loadiq_platform_features',
  'pilot',
  50,
  false,
  'Internal dummy billing/entitlement test account only. Not a real Stripe subscriber.'
where not exists (
  select 1
  from public.internal_billing_test_accounts
  where lower(email) = 'karpilotrucking@outlook.com'
);

-- VERIFICATION SQL - do not run automatically
--
-- select
--   schemaname,
--   tablename,
--   rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename = 'internal_billing_test_accounts';
--
-- select
--   column_name,
--   data_type,
--   is_nullable,
--   column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'internal_billing_test_accounts'
-- order by ordinal_position;
--
-- select
--   indexname,
--   indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'internal_billing_test_accounts'
-- order by indexname;
--
-- select
--   grantee,
--   privilege_type
-- from information_schema.table_privileges
-- where table_schema = 'public'
--   and table_name = 'internal_billing_test_accounts'
-- order by grantee, privilege_type;
--
-- select *
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'internal_billing_test_accounts';
--
-- select
--   email,
--   enabled,
--   simulated_state,
--   entitlement_status,
--   tier,
--   program,
--   trial_status,
--   lifetime_price_lock,
--   future_feature_access_scope,
--   cohort_phase,
--   cohort_cap,
--   price_subject_to_change,
--   notes
-- from public.internal_billing_test_accounts
-- where lower(email) = 'karpilotrucking@outlook.com';

-- ROLLBACK SQL - review before manual use
--
-- begin;
-- drop table if exists public.internal_billing_test_accounts;
-- commit;
