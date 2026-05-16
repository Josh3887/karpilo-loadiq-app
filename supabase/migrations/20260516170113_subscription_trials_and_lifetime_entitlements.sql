-- Subscription trials and lifetime entitlement compatibility fields.
--
-- Additive only. This migration does not create payment/card/bank/token fields,
-- does not drop existing columns, and does not backfill assumptions into
-- existing rows.
--
-- Trial semantics:
-- - trial_duration_days stores the intended trial length, currently 7 days.
-- - trial_status is lifecycle metadata such as eligible, active, ended,
--   cancelled, unavailable, or unknown.
-- - billing_starts_at is the expected first-billing marker when known.
--
-- Lifetime/future feature semantics:
-- Pilot/Launch future feature access means future released Karpilo LoadIQ
-- platform features made generally available within the platform ecosystem.
-- It does not mean unlimited custom enterprise development, legal/tax/accounting
-- services, or unrelated future products.

alter table public.subscriptions
  add column if not exists trial_duration_days integer,
  add column if not exists trial_status text,
  add column if not exists billing_starts_at timestamptz,
  add column if not exists lifetime_price_lock boolean,
  add column if not exists future_feature_access_scope text,
  add column if not exists cohort_phase text,
  add column if not exists cohort_cap integer,
  add column if not exists price_subject_to_change boolean,
  add column if not exists entitlement_status text;

alter table if exists public.pricing_entitlements
  add column if not exists trial_duration_days integer,
  add column if not exists lifetime_price_lock boolean,
  add column if not exists future_feature_access_scope text,
  add column if not exists cohort_phase text,
  add column if not exists cohort_cap integer,
  add column if not exists price_subject_to_change boolean,
  add column if not exists entitlement_status text;

alter table if exists public.operator_pricing_locks
  add column if not exists future_feature_access_scope text,
  add column if not exists price_subject_to_change boolean,
  add column if not exists cohort_phase text,
  add column if not exists cohort_cap integer;

alter table if exists public.pricing_lock_status
  add column if not exists future_feature_access_scope text,
  add column if not exists price_subject_to_change boolean,
  add column if not exists cohort_phase text,
  add column if not exists cohort_cap integer;

create index if not exists idx_subscriptions_entitlement_status
  on public.subscriptions (entitlement_status, created_at desc)
  where entitlement_status is not null;

create index if not exists idx_subscriptions_trial_status
  on public.subscriptions (trial_status, trial_end)
  where trial_status is not null;

do $$
begin
  if to_regclass('public.pricing_entitlements') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'entitlement_status'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'created_at'
    )
  then
    execute 'create index if not exists idx_pricing_entitlements_entitlement_status on public.pricing_entitlements (entitlement_status, created_at desc) where entitlement_status is not null';
  end if;

  if to_regclass('public.pricing_entitlements') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'lifetime_price_lock'
    )
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'cohort'
    )
  then
    execute 'create index if not exists idx_pricing_entitlements_lifetime_lock on public.pricing_entitlements (lifetime_price_lock, cohort) where lifetime_price_lock is true';
  end if;
end $$;

comment on column public.subscriptions.trial_duration_days is
  'Configured subscription trial duration in days. Current product intent is 7 days for paid tiers where provider rules allow.';

comment on column public.subscriptions.trial_status is
  'Trial lifecycle metadata such as eligible, active, ended, cancelled, unavailable, or unknown.';

comment on column public.subscriptions.billing_starts_at is
  'Expected billing start timestamp when known. This is metadata only; payment processors remain the source of charge timing.';

comment on column public.subscriptions.lifetime_price_lock is
  'True when the subscription is protected by approved Pilot/Launch lifetime pricing lock rules.';

comment on column public.subscriptions.future_feature_access_scope is
  'Scope of future released Karpilo LoadIQ platform features included for a protected tier. Excludes custom enterprise development, legal/tax/accounting services, and unrelated future products.';

comment on column public.subscriptions.cohort_phase is
  'Launch, pilot, legacy, or standard cohort phase metadata used for entitlement reporting and reconciliation.';

comment on column public.subscriptions.cohort_cap is
  'Cohort seat cap metadata, such as 50 Pilot seats or 500 Launch seats, when applicable.';

comment on column public.subscriptions.price_subject_to_change is
  'True when plan pricing may change for future billing periods or future subscribers.';

comment on column public.subscriptions.entitlement_status is
  'Normalized access status used by app entitlement logic, separate from provider-specific subscription status.';

do $$
begin
  if to_regclass('public.pricing_entitlements') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'trial_duration_days') then
      execute 'comment on column public.pricing_entitlements.trial_duration_days is ''Reservation/pricing entitlement trial duration in days when eligibility is known.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'lifetime_price_lock') then
      execute 'comment on column public.pricing_entitlements.lifetime_price_lock is ''True when the reservation or pricing entitlement carries approved Pilot/Launch lifetime pricing protection.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'future_feature_access_scope') then
      execute 'comment on column public.pricing_entitlements.future_feature_access_scope is ''Reservation/pricing-lock scope for future released Karpilo LoadIQ platform features. Excludes custom enterprise development, legal/tax/accounting services, and unrelated future products.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'cohort_phase') then
      execute 'comment on column public.pricing_entitlements.cohort_phase is ''Reservation cohort phase metadata for pilot, launch, legacy, standard, or future rollout classification.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'cohort_cap') then
      execute 'comment on column public.pricing_entitlements.cohort_cap is ''Cohort seat cap metadata tied to reservation or pricing entitlement classification.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'price_subject_to_change') then
      execute 'comment on column public.pricing_entitlements.price_subject_to_change is ''True when pricing may change for future users or future billing periods outside protected entitlement rules.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_entitlements' and column_name = 'entitlement_status') then
      execute 'comment on column public.pricing_entitlements.entitlement_status is ''Normalized entitlement/access status for reservation-to-subscription reconciliation.''';
    end if;
  end if;

  if to_regclass('public.operator_pricing_locks') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'operator_pricing_locks' and column_name = 'future_feature_access_scope') then
      execute 'comment on column public.operator_pricing_locks.future_feature_access_scope is ''Immutable pricing-lock scope for future released Karpilo LoadIQ platform features. Excludes custom enterprise development, legal/tax/accounting services, and unrelated future products.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'operator_pricing_locks' and column_name = 'price_subject_to_change') then
      execute 'comment on column public.operator_pricing_locks.price_subject_to_change is ''True when future pricing may change outside this immutable pricing lock.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'operator_pricing_locks' and column_name = 'cohort_phase') then
      execute 'comment on column public.operator_pricing_locks.cohort_phase is ''Immutable pilot, launch, legacy, standard, or future cohort phase classification for this pricing lock.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'operator_pricing_locks' and column_name = 'cohort_cap') then
      execute 'comment on column public.operator_pricing_locks.cohort_cap is ''Cohort seat cap metadata associated with this immutable pricing lock.''';
    end if;
  end if;

  if to_regclass('public.pricing_lock_status') is not null then
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_lock_status' and column_name = 'future_feature_access_scope') then
      execute 'comment on column public.pricing_lock_status.future_feature_access_scope is ''Current pricing-lock status scope for future released Karpilo LoadIQ platform features. Excludes custom enterprise development, legal/tax/accounting services, and unrelated future products.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_lock_status' and column_name = 'price_subject_to_change') then
      execute 'comment on column public.pricing_lock_status.price_subject_to_change is ''True when future pricing may change outside this active or historical pricing lock state.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_lock_status' and column_name = 'cohort_phase') then
      execute 'comment on column public.pricing_lock_status.cohort_phase is ''Pilot, launch, legacy, standard, or future cohort phase classification for current pricing-lock status.''';
    end if;
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'pricing_lock_status' and column_name = 'cohort_cap') then
      execute 'comment on column public.pricing_lock_status.cohort_cap is ''Cohort seat cap metadata associated with current pricing-lock status.''';
    end if;
  end if;
end $$;

-- ============================================================
-- VERIFICATION SQL - DO NOT RUN AUTOMATICALLY
-- ============================================================
--
-- with expected(table_name, column_name) as (
--   values
--     ('subscriptions', 'trial_duration_days'),
--     ('subscriptions', 'trial_status'),
--     ('subscriptions', 'billing_starts_at'),
--     ('subscriptions', 'lifetime_price_lock'),
--     ('subscriptions', 'future_feature_access_scope'),
--     ('subscriptions', 'cohort_phase'),
--     ('subscriptions', 'cohort_cap'),
--     ('subscriptions', 'price_subject_to_change'),
--     ('subscriptions', 'entitlement_status'),
--     ('pricing_entitlements', 'trial_duration_days'),
--     ('pricing_entitlements', 'lifetime_price_lock'),
--     ('pricing_entitlements', 'future_feature_access_scope'),
--     ('pricing_entitlements', 'cohort_phase'),
--     ('pricing_entitlements', 'cohort_cap'),
--     ('pricing_entitlements', 'price_subject_to_change'),
--     ('pricing_entitlements', 'entitlement_status'),
--     ('operator_pricing_locks', 'future_feature_access_scope'),
--     ('operator_pricing_locks', 'price_subject_to_change'),
--     ('operator_pricing_locks', 'cohort_phase'),
--     ('operator_pricing_locks', 'cohort_cap'),
--     ('pricing_lock_status', 'future_feature_access_scope'),
--     ('pricing_lock_status', 'price_subject_to_change'),
--     ('pricing_lock_status', 'cohort_phase'),
--     ('pricing_lock_status', 'cohort_cap')
-- )
-- select
--   expected.table_name,
--   expected.column_name,
--   columns.data_type,
--   columns.is_nullable,
--   columns.column_default,
--   columns.column_name is not null as exists_live
-- from expected
-- left join information_schema.columns columns
--   on columns.table_schema = 'public'
--  and columns.table_name = expected.table_name
--  and columns.column_name = expected.column_name
-- order by expected.table_name, expected.column_name;
--
-- select schemaname, tablename, indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and indexname in (
--     'idx_subscriptions_entitlement_status',
--     'idx_subscriptions_trial_status',
--     'idx_pricing_entitlements_entitlement_status',
--     'idx_pricing_entitlements_lifetime_lock'
--   )
-- order by tablename, indexname;
--
-- ============================================================
-- ROLLBACK SQL - REVIEW BEFORE MANUAL USE
-- ============================================================
--
-- drop index if exists public.idx_pricing_entitlements_lifetime_lock;
-- drop index if exists public.idx_pricing_entitlements_entitlement_status;
-- drop index if exists public.idx_subscriptions_trial_status;
-- drop index if exists public.idx_subscriptions_entitlement_status;
--
-- alter table public.pricing_lock_status
--   drop column if exists cohort_cap,
--   drop column if exists cohort_phase,
--   drop column if exists price_subject_to_change,
--   drop column if exists future_feature_access_scope;
--
-- alter table public.operator_pricing_locks
--   drop column if exists cohort_cap,
--   drop column if exists cohort_phase,
--   drop column if exists price_subject_to_change,
--   drop column if exists future_feature_access_scope;
--
-- alter table public.pricing_entitlements
--   drop column if exists entitlement_status,
--   drop column if exists price_subject_to_change,
--   drop column if exists cohort_cap,
--   drop column if exists cohort_phase,
--   drop column if exists future_feature_access_scope,
--   drop column if exists lifetime_price_lock,
--   drop column if exists trial_duration_days;
--
-- alter table public.subscriptions
--   drop column if exists entitlement_status,
--   drop column if exists price_subject_to_change,
--   drop column if exists cohort_cap,
--   drop column if exists cohort_phase,
--   drop column if exists future_feature_access_scope,
--   drop column if exists lifetime_price_lock,
--   drop column if exists billing_starts_at,
--   drop column if exists trial_status,
--   drop column if exists trial_duration_days;
