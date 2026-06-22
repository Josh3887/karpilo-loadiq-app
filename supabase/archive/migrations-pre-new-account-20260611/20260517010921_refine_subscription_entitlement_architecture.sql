-- Subscription entitlement architecture refinement.
--
-- Additive only. This migration does not delete data, does not mutate Stripe,
-- Apple, Google Play, or manual billing records, and does not remove Pilot or
-- Launch pricing-lock records.
--
-- Business semantics:
-- - Pilot and Launch users keep perpetual Karpilo LoadIQ platform access for
--   future released LoadIQ features made generally available in the platform.
-- - Pilot and Launch protection does not include future Karpilo FleetOS Pro,
--   per-truck fleet scaling, enterprise fleet operations, custom development,
--   legal/tax/accounting services, or unrelated future products.
-- - Future Pro is a reserved FleetOS-capable architecture tier after Platinum,
--   but it is not active, sold, or exposed by this migration.

alter table public.subscriptions
  add column if not exists subscription_tier text,
  add column if not exists feature_access text,
  add column if not exists grandfathered_access boolean,
  add column if not exists lifetime_access boolean,
  add column if not exists full_loadiq_access boolean,
  add column if not exists fleet_enabled boolean,
  add column if not exists fleetos_pro_access boolean,
  add column if not exists truck_capacity_limit integer;

alter table if exists public.pricing_entitlements
  add column if not exists subscription_tier text,
  add column if not exists feature_access text,
  add column if not exists grandfathered_access boolean,
  add column if not exists lifetime_access boolean,
  add column if not exists full_loadiq_access boolean,
  add column if not exists fleet_enabled boolean,
  add column if not exists fleetos_pro_access boolean,
  add column if not exists truck_capacity_limit integer;

alter table if exists public.operator_pricing_locks
  add column if not exists feature_access text,
  add column if not exists grandfathered_access boolean,
  add column if not exists lifetime_access boolean,
  add column if not exists full_loadiq_access boolean,
  add column if not exists fleet_enabled boolean,
  add column if not exists fleetos_pro_access boolean,
  add column if not exists truck_capacity_limit integer;

alter table if exists public.pricing_lock_status
  add column if not exists feature_access text,
  add column if not exists grandfathered_access boolean,
  add column if not exists lifetime_access boolean,
  add column if not exists full_loadiq_access boolean,
  add column if not exists fleet_enabled boolean,
  add column if not exists fleetos_pro_access boolean,
  add column if not exists truck_capacity_limit integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_subscription_tier_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_subscription_tier_check
      check (
        subscription_tier is null
        or subscription_tier in ('pilot', 'launch', 'gold', 'platinum', 'pro')
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_feature_access_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_feature_access_check
      check (
        feature_access is null
        or feature_access in ('standard', 'premium', 'platinum', 'fleet')
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'subscriptions_truck_capacity_limit_check'
      and conrelid = 'public.subscriptions'::regclass
  ) then
    alter table public.subscriptions
      add constraint subscriptions_truck_capacity_limit_check
      check (truck_capacity_limit is null or truck_capacity_limit > 0)
      not valid;
  end if;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'pricing_entitlements',
    'operator_pricing_locks',
    'pricing_lock_status'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      if not exists (
        select 1
        from pg_constraint
        where conname = table_name || '_feature_access_check'
          and conrelid = format('public.%I', table_name)::regclass
      ) then
        execute format(
          'alter table public.%I add constraint %I check (feature_access is null or feature_access in (''standard'', ''premium'', ''platinum'', ''fleet'')) not valid',
          table_name,
          table_name || '_feature_access_check'
        );
      end if;

      if not exists (
        select 1
        from pg_constraint
        where conname = table_name || '_truck_capacity_limit_check'
          and conrelid = format('public.%I', table_name)::regclass
      ) then
        execute format(
          'alter table public.%I add constraint %I check (truck_capacity_limit is null or truck_capacity_limit > 0) not valid',
          table_name,
          table_name || '_truck_capacity_limit_check'
        );
      end if;
    end if;
  end loop;
end
$$;

update public.subscriptions
set
  subscription_tier = case
    when tier = 'pilot' then 'pilot'
    when tier in ('launch500', 'founder') then 'launch'
    when tier = 'platinum' then 'platinum'
    when tier = 'gold' then 'gold'
    when tier = 'pro' then 'pro'
    else subscription_tier
  end,
  feature_access = case
    when tier in ('pilot', 'launch500', 'founder', 'platinum') then 'platinum'
    when tier = 'gold' then 'premium'
    when tier = 'pro' then null
    else feature_access
  end,
  grandfathered_access = case
    when tier in ('pilot', 'launch500', 'founder') then true
    else coalesce(grandfathered_access, false)
  end,
  lifetime_access = case
    when tier in ('pilot', 'launch500', 'founder') then true
    else coalesce(lifetime_access, false)
  end,
  full_loadiq_access = case
    when tier in ('pilot', 'launch500', 'founder', 'gold', 'platinum') then true
    when tier = 'pro' then false
    else coalesce(full_loadiq_access, false)
  end,
  fleet_enabled = coalesce(fleet_enabled, false),
  fleetos_pro_access = coalesce(fleetos_pro_access, false)
where subscription_tier is null
   or feature_access is null
   or grandfathered_access is null
   or lifetime_access is null
   or full_loadiq_access is null
   or fleet_enabled is null
   or fleetos_pro_access is null;

update public.subscriptions
set
  subscription_tier = 'pro',
  feature_access = null,
  fleet_enabled = false,
  fleetos_pro_access = false,
  full_loadiq_access = false,
  truck_capacity_limit = null
where subscription_tier = 'pro';

do $$
begin
  if to_regclass('public.pricing_entitlements') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'pricing_entitlements'
        and column_name = 'cohort_phase'
    )
  then
    update public.pricing_entitlements
    set
      subscription_tier = case
        when cohort_phase in ('pilot', 'pilot50') then 'pilot'
        when cohort_phase in ('launch', 'launch500', 'legacy') then 'launch'
        else subscription_tier
      end,
      feature_access = case
        when cohort_phase in ('pilot', 'pilot50', 'launch', 'launch500', 'legacy') then 'platinum'
        else feature_access
      end,
      grandfathered_access = case
        when cohort_phase in ('pilot', 'pilot50', 'launch', 'launch500', 'legacy') then true
        else coalesce(grandfathered_access, false)
      end,
      lifetime_access = case
        when cohort_phase in ('pilot', 'pilot50', 'launch', 'launch500', 'legacy') then true
        else coalesce(lifetime_access, false)
      end,
      full_loadiq_access = case
        when cohort_phase in ('pilot', 'pilot50', 'launch', 'launch500', 'legacy') then true
        else coalesce(full_loadiq_access, false)
      end,
      fleet_enabled = coalesce(fleet_enabled, false),
      fleetos_pro_access = coalesce(fleetos_pro_access, false)
    where subscription_tier is null
       or feature_access is null
       or grandfathered_access is null
       or lifetime_access is null
       or full_loadiq_access is null
       or fleet_enabled is null
       or fleetos_pro_access is null;
  end if;

  if to_regclass('public.operator_pricing_locks') is not null then
    update public.operator_pricing_locks
    set
      feature_access = coalesce(feature_access, 'platinum'),
      grandfathered_access = coalesce(grandfathered_access, true),
      lifetime_access = coalesce(lifetime_access, true),
      full_loadiq_access = coalesce(full_loadiq_access, true),
      fleet_enabled = coalesce(fleet_enabled, false),
      fleetos_pro_access = coalesce(fleetos_pro_access, false)
    where program in ('pilot50', 'launch500');
  end if;

  if to_regclass('public.pricing_lock_status') is not null then
    update public.pricing_lock_status
    set
      feature_access = coalesce(feature_access, 'platinum'),
      grandfathered_access = coalesce(grandfathered_access, true),
      lifetime_access = coalesce(lifetime_access, true),
      full_loadiq_access = coalesce(full_loadiq_access, true),
      fleet_enabled = coalesce(fleet_enabled, false),
      fleetos_pro_access = coalesce(fleetos_pro_access, false)
    where cohort in ('pilot50', 'launch500');
  end if;
end
$$;

create index if not exists idx_subscriptions_tier_feature_access
  on public.subscriptions (subscription_tier, feature_access);

create index if not exists idx_subscriptions_grandfathered_lifetime
  on public.subscriptions (grandfathered_access, lifetime_access)
  where grandfathered_access is true or lifetime_access is true;

create index if not exists idx_subscriptions_fleet_enabled
  on public.subscriptions (fleet_enabled, truck_capacity_limit)
  where fleet_enabled is true;

comment on column public.subscriptions.subscription_tier is
  'Canonical entitlement tier: pilot, launch, gold, platinum, or reserved future pro. Pro is recognized but inactive unless explicitly activated later.';

comment on column public.subscriptions.feature_access is
  'Feature-access level: standard, premium, platinum, or fleet. Fleet is reserved for future Karpilo FleetOS-capable Pro.';

comment on column public.subscriptions.grandfathered_access is
  'True when the account has protected grandfathered Karpilo LoadIQ access, such as Pilot or Launch.';

comment on column public.subscriptions.lifetime_access is
  'True when protected Karpilo LoadIQ access should persist across future LoadIQ feature additions.';

comment on column public.subscriptions.full_loadiq_access is
  'True when the account can access the complete Karpilo LoadIQ platform surface for its non-FleetOS scope.';

comment on column public.subscriptions.fleet_enabled is
  'Future FleetOS/Pro capability flag. Pilot and Launch protection does not set this automatically.';

comment on column public.subscriptions.fleetos_pro_access is
  'Future Karpilo FleetOS Pro access flag, separate from Pilot/Launch LoadIQ lifetime access.';

comment on column public.subscriptions.truck_capacity_limit is
  'Future FleetOS/Pro truck-capacity parameter. Null means not assigned.';

-- VERIFICATION SQL (manual, do not run automatically):
--
-- with expected(table_name, column_name) as (
--   values
--     ('subscriptions', 'subscription_tier'),
--     ('subscriptions', 'feature_access'),
--     ('subscriptions', 'grandfathered_access'),
--     ('subscriptions', 'lifetime_access'),
--     ('subscriptions', 'full_loadiq_access'),
--     ('subscriptions', 'fleet_enabled'),
--     ('subscriptions', 'fleetos_pro_access'),
--     ('subscriptions', 'truck_capacity_limit'),
--     ('pricing_entitlements', 'subscription_tier'),
--     ('pricing_entitlements', 'feature_access'),
--     ('operator_pricing_locks', 'feature_access'),
--     ('pricing_lock_status', 'feature_access')
-- )
-- select expected.table_name, expected.column_name, columns.data_type, columns.column_name is not null as exists_live
-- from expected
-- left join information_schema.columns columns
--   on columns.table_schema = 'public'
--  and columns.table_name = expected.table_name
--  and columns.column_name = expected.column_name
-- order by expected.table_name, expected.column_name;
--
-- select tier, subscription_tier, feature_access, grandfathered_access, lifetime_access,
--        full_loadiq_access, fleet_enabled, fleetos_pro_access, count(*)
-- from public.subscriptions
-- group by tier, subscription_tier, feature_access, grandfathered_access, lifetime_access,
--          full_loadiq_access, fleet_enabled, fleetos_pro_access
-- order by tier, subscription_tier;
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'subscriptions'
--   and indexname in (
--     'idx_subscriptions_tier_feature_access',
--     'idx_subscriptions_grandfathered_lifetime',
--     'idx_subscriptions_fleet_enabled'
--   )
-- order by indexname;
--
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.subscriptions'::regclass
--   and conname in (
--     'subscriptions_subscription_tier_check',
--     'subscriptions_feature_access_check',
--     'subscriptions_truck_capacity_limit_check'
--   );

-- ROLLBACK SQL (manual only; review before use):
--
-- drop index if exists public.idx_subscriptions_fleet_enabled;
-- drop index if exists public.idx_subscriptions_grandfathered_lifetime;
-- drop index if exists public.idx_subscriptions_tier_feature_access;
-- alter table public.subscriptions drop constraint if exists subscriptions_truck_capacity_limit_check;
-- alter table public.subscriptions drop constraint if exists subscriptions_feature_access_check;
-- alter table public.subscriptions drop constraint if exists subscriptions_subscription_tier_check;
-- alter table if exists public.pricing_lock_status
--   drop column if exists truck_capacity_limit,
--   drop column if exists fleetos_pro_access,
--   drop column if exists fleet_enabled,
--   drop column if exists full_loadiq_access,
--   drop column if exists lifetime_access,
--   drop column if exists grandfathered_access,
--   drop column if exists feature_access;
-- alter table if exists public.operator_pricing_locks
--   drop column if exists truck_capacity_limit,
--   drop column if exists fleetos_pro_access,
--   drop column if exists fleet_enabled,
--   drop column if exists full_loadiq_access,
--   drop column if exists lifetime_access,
--   drop column if exists grandfathered_access,
--   drop column if exists feature_access;
-- alter table if exists public.pricing_entitlements
--   drop column if exists truck_capacity_limit,
--   drop column if exists fleetos_pro_access,
--   drop column if exists fleet_enabled,
--   drop column if exists full_loadiq_access,
--   drop column if exists lifetime_access,
--   drop column if exists grandfathered_access,
--   drop column if exists feature_access,
--   drop column if exists subscription_tier;
-- alter table public.subscriptions
--   drop column if exists truck_capacity_limit,
--   drop column if exists fleetos_pro_access,
--   drop column if exists fleet_enabled,
--   drop column if exists full_loadiq_access,
--   drop column if exists lifetime_access,
--   drop column if exists grandfathered_access,
--   drop column if exists feature_access,
--   drop column if exists subscription_tier;
