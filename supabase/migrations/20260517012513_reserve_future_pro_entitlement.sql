-- Reserve Future Pro / Karpilo FleetOS entitlement state.
--
-- Safe correction:
-- - Gold and Platinum are the only active paid tiers.
-- - Pilot and Launch remain protected lifetime Karpilo LoadIQ programs.
-- - Pro is recognized as a reserved future FleetOS-capable tier after Platinum.
-- - This migration does not activate, sell, expose, or grant Pro/FleetOS access.

update public.subscriptions
set
  subscription_tier = 'pro',
  feature_access = null,
  full_loadiq_access = false,
  fleet_enabled = false,
  fleetos_pro_access = false,
  truck_capacity_limit = null,
  price_subject_to_change = coalesce(price_subject_to_change, true),
  updated_at = now()
where tier = 'pro'
   or subscription_tier = 'pro';

do $$
begin
  if to_regclass('public.pricing_entitlements') is not null then
    update public.pricing_entitlements
    set
      subscription_tier = 'pro',
      feature_access = null,
      full_loadiq_access = false,
      fleet_enabled = false,
      fleetos_pro_access = false,
      truck_capacity_limit = null,
      price_subject_to_change = coalesce(price_subject_to_change, true)
    where subscription_tier = 'pro';
  end if;
end
$$;

comment on column public.subscriptions.subscription_tier is
  'Canonical entitlement tier: pilot, launch, gold, platinum, or reserved future pro. Pro is recognized but inactive unless explicitly activated later.';

comment on column public.subscriptions.fleet_enabled is
  'Future FleetOS/Pro capability flag. Must remain false unless Pro/FleetOS access is explicitly activated later.';

comment on column public.subscriptions.fleetos_pro_access is
  'Future Karpilo FleetOS Pro access flag. Must remain false unless Pro/FleetOS access is explicitly activated later.';

-- VERIFICATION SQL (manual, do not run automatically):
--
-- select
--   id,
--   tier,
--   subscription_tier,
--   feature_access,
--   full_loadiq_access,
--   fleet_enabled,
--   fleetos_pro_access,
--   truck_capacity_limit,
--   entitlement_status,
--   status
-- from public.subscriptions
-- where tier = 'pro'
--    or subscription_tier = 'pro'
-- order by updated_at desc nulls last;
--
-- select count(*) as active_pro_access_rows
-- from public.subscriptions
-- where subscription_tier = 'pro'
--   and (
--     feature_access = 'fleet'
--     or full_loadiq_access is true
--     or fleet_enabled is true
--     or fleetos_pro_access is true
--   );

-- ROLLBACK SQL (manual only; review before use):
--
-- update public.subscriptions
-- set
--   feature_access = 'fleet',
--   full_loadiq_access = true,
--   fleet_enabled = true,
--   fleetos_pro_access = true
-- where subscription_tier = 'pro';
