-- Forward-only live schema reconciliation migration for Karpilo LoadIQ.
-- This supersedes missing additive schema pieces from unapplied local
-- migrations 20260612041136, 20260612051426, and 20260621213322.
-- It intentionally excludes the launch pricing mutation from 20260621045851.
-- It intentionally excludes AI budget row value upserts from 20260612051426.
-- Review this migration before any remote application. Do not apply it blindly
-- with unrelated pending migrations.

do $$
begin
  if to_regclass('public.truck_profiles') is null then
    raise exception 'Forward reconciliation requires public.truck_profiles from the 2026 baseline.';
  end if;

  if to_regclass('public.saved_loads') is null then
    raise exception 'Forward reconciliation requires public.saved_loads from the 2026 baseline.';
  end if;

  if to_regclass('public.users') is null then
    raise exception 'Forward reconciliation requires public.users from the 2026 baseline.';
  end if;

  if to_regclass('public.ai_budget_limits') is null then
    raise exception 'Forward reconciliation requires public.ai_budget_limits from the 2026 baseline.';
  end if;
end
$$;

-- Fuel gauge profile and saved-load snapshot schema.

alter table if exists public.truck_profiles
  add column if not exists fuel_tank_count integer,
  add column if not exists fuel_tank_capacity_gallons numeric(8,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.truck_profiles'::regclass
      and conname = 'truck_profiles_fuel_tank_count_nonnegative'
  ) then
    alter table public.truck_profiles
      add constraint truck_profiles_fuel_tank_count_nonnegative
      check (fuel_tank_count is null or fuel_tank_count >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.truck_profiles'::regclass
      and conname = 'truck_profiles_fuel_tank_capacity_gallons_nonnegative'
  ) then
    alter table public.truck_profiles
      add constraint truck_profiles_fuel_tank_capacity_gallons_nonnegative
      check (
        fuel_tank_capacity_gallons is null
        or fuel_tank_capacity_gallons >= 0
      )
      not valid;
  end if;
end
$$;

alter table if exists public.saved_loads
  add column if not exists fuel_gauge_snapshot jsonb not null default '{}'::jsonb;

comment on column public.truck_profiles.fuel_tank_count is
  'User-provided fuel tank count for active-load fuel gauge range estimates.';
comment on column public.truck_profiles.fuel_tank_capacity_gallons is
  'User-provided gallons per fuel tank for active-load fuel gauge range estimates.';
comment on column public.saved_loads.fuel_gauge_snapshot is
  'Deterministic fuel gauge output captured from load miles, MPG, fuel price, starting fuel, and vehicle tank profile.';

-- Atlas equipment context and AI add-on schema. This section adds columns and
-- tables only; it does not change AI budget row values.

alter table if exists public.truck_profiles
  add column if not exists atlas_equipment_pack text,
  add column if not exists equipment_type text,
  add column if not exists combination_type text,
  add column if not exists trailer_length_feet numeric(8,2),
  add column if not exists trailer_width_inches numeric(8,2),
  add column if not exists trailer_height_inches numeric(8,2),
  add column if not exists max_payload_lbs numeric(12,2),
  add column if not exists gross_vehicle_weight_rating_lbs numeric(12,2),
  add column if not exists axle_count integer,
  add column if not exists hazmat_capable boolean not null default false,
  add column if not exists tanker_capable boolean not null default false,
  add column if not exists refrigerated_capable boolean not null default false,
  add column if not exists specialized_capabilities text[] not null default '{}'::text[],
  add column if not exists securement_equipment text[] not null default '{}'::text[],
  add column if not exists route_restriction_notes text;

alter table if exists public.saved_loads
  add column if not exists equipment_context_snapshot jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.truck_profiles'::regclass
      and conname = 'truck_profiles_atlas_equipment_pack_valid'
  ) then
    alter table public.truck_profiles
      add constraint truck_profiles_atlas_equipment_pack_valid
      check (
        atlas_equipment_pack is null
        or atlas_equipment_pack in (
          'dry_van',
          'reefer',
          'flatbed',
          'step_deck',
          'lowboy_rgn',
          'conestoga',
          'hot_shot',
          'tanker',
          'bulk_hopper',
          'container_chassis',
          'car_hauler',
          'livestock',
          'dump',
          'power_only',
          'specialized_oversize'
        )
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.truck_profiles'::regclass
      and conname = 'truck_profiles_equipment_dimensions_nonnegative'
  ) then
    alter table public.truck_profiles
      add constraint truck_profiles_equipment_dimensions_nonnegative
      check (
        coalesce(trailer_length_feet, 0) >= 0
        and coalesce(trailer_width_inches, 0) >= 0
        and coalesce(trailer_height_inches, 0) >= 0
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.truck_profiles'::regclass
      and conname = 'truck_profiles_equipment_weights_nonnegative'
  ) then
    alter table public.truck_profiles
      add constraint truck_profiles_equipment_weights_nonnegative
      check (
        coalesce(max_payload_lbs, 0) >= 0
        and coalesce(gross_vehicle_weight_rating_lbs, 0) >= 0
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.truck_profiles'::regclass
      and conname = 'truck_profiles_axle_count_nonnegative'
  ) then
    alter table public.truck_profiles
      add constraint truck_profiles_axle_count_nonnegative
      check (coalesce(axle_count, 0) >= 0)
      not valid;
  end if;
end
$$;

alter table if exists public.ai_budget_limits
  add column if not exists premium_addon_allowed boolean not null default false,
  add column if not exists addon_token_block_size integer,
  add column if not exists addon_token_price_cents integer,
  add column if not exists overage_surcharge_multiplier numeric(6,2) not null default 1.00;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.ai_budget_limits'::regclass
      and conname = 'ai_budget_limits_token_controls_nonnegative'
  ) then
    alter table public.ai_budget_limits
      add constraint ai_budget_limits_token_controls_nonnegative
      check (
        coalesce(monthly_token_cap, 0) >= 0
        and coalesce(monthly_cost_cap_cents, 0) >= 0
        and coalesce(addon_token_block_size, 0) >= 0
        and coalesce(addon_token_price_cents, 0) >= 0
        and overage_surcharge_multiplier >= 1.00
      )
      not valid;
  end if;
end
$$;

create table if not exists public.ai_token_addons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature_key text not null default 'load_analysis',
  plan_tier text not null,
  tokens_granted integer not null,
  tokens_used integer not null default 0,
  status text not null default 'active',
  provider text,
  purchase_reference text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_token_addons_status_check check (
    status in ('active', 'exhausted', 'expired', 'refunded', 'void')
  ),
  constraint ai_token_addons_plan_check check (
    plan_tier in (
      'gold',
      'platinum',
      'pilot',
      'launch500',
      'admin',
      'pro'
    )
  ),
  constraint ai_token_addons_nonnegative_check check (
    tokens_granted >= 0
    and tokens_used >= 0
    and tokens_used <= tokens_granted
  )
);

create index if not exists ai_token_addons_user_feature_status_idx
  on public.ai_token_addons (user_id, feature_key, status, expires_at);

create index if not exists ai_token_addons_purchase_reference_idx
  on public.ai_token_addons (purchase_reference)
  where purchase_reference is not null;

alter table public.ai_token_addons enable row level security;

revoke all on public.ai_token_addons from anon;
grant select on public.ai_token_addons to authenticated;
grant select, insert, update, delete on public.ai_token_addons to service_role;

drop policy if exists ai_token_addons_select_own on public.ai_token_addons;
create policy ai_token_addons_select_own
  on public.ai_token_addons
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    drop trigger if exists set_ai_token_addons_updated_at on public.ai_token_addons;
    create trigger set_ai_token_addons_updated_at
      before update on public.ai_token_addons
      for each row execute function public.set_updated_at();
  end if;
end
$$;

comment on column public.truck_profiles.atlas_equipment_pack is
  'Karpilo Atlas equipment intelligence pack key derived from user-entered equipment type.';
comment on column public.truck_profiles.equipment_type is
  'Primary transport equipment category such as dry van, reefer, flatbed, tanker, hot-shot, or specialized.';
comment on column public.truck_profiles.combination_type is
  'Vehicle combination context such as single tractor-trailer, doubles, triples, straight truck, or hot-shot pickup and trailer.';
comment on column public.truck_profiles.route_restriction_notes is
  'User-entered vehicle or trailer restriction context for planning. Not certified route, permit, hazmat, securement, or compliance data.';
comment on column public.saved_loads.equipment_context_snapshot is
  'Saved user-entered equipment context used by Atlas Core, Atlas Route, Atlas Freight, FitCheck, and operational review. Not certified compliance data.';
comment on table public.ai_token_addons is
  'Premium Atlas AI token add-on ledger. Entitlement and payment processors should create rows through service-role paths only.';

-- Primitive app portal compatibility schema.

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_plan_interest_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_interest_check
      check (plan_interest is null or plan_interest in ('silver', 'gold', 'platinum', 'pro'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.portal_access'::regclass
      and conname = 'portal_access_status_check'
  ) then
    alter table public.portal_access
      add constraint portal_access_status_check
      check (status in ('pending', 'approved', 'suspended', 'disabled'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.portal_access'::regclass
      and conname = 'portal_access_launch_phase_check'
  ) then
    alter table public.portal_access
      add constraint portal_access_launch_phase_check
      check (launch_phase in (
        'beta',
        'legacy_launch',
        'founding_operator_phase_1',
        'founding_operator_phase_2',
        'open_market'
      ))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.portal_access'::regclass
      and conname = 'portal_access_plan_interest_check'
  ) then
    alter table public.portal_access
      add constraint portal_access_plan_interest_check
      check (plan_interest is null or plan_interest in ('silver', 'gold', 'platinum', 'pro'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.billing_accounts'::regclass
      and conname = 'billing_accounts_plan_key_check'
  ) then
    alter table public.billing_accounts
      add constraint billing_accounts_plan_key_check
      check (plan_key is null or plan_key in ('silver', 'gold', 'platinum', 'pro'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.fit_checks'::regclass
      and conname = 'fit_checks_truck_count_check'
  ) then
    alter table public.fit_checks
      add constraint fit_checks_truck_count_check
      check (truck_count is null or truck_count >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.fit_checks'::regclass
      and conname = 'fit_checks_average_monthly_gross_check'
  ) then
    alter table public.fit_checks
      add constraint fit_checks_average_monthly_gross_check
      check (average_monthly_gross is null or average_monthly_gross >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.fit_checks'::regclass
      and conname = 'fit_checks_recommended_plan_check'
  ) then
    alter table public.fit_checks
      add constraint fit_checks_recommended_plan_check
      check (recommended_plan is null or recommended_plan in ('silver', 'gold', 'platinum', 'pro'))
      not valid;
  end if;
end
$$;

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

grant usage on schema public to authenticated, service_role;

revoke all on public.profiles from anon;
revoke all on public.portal_access from anon;
revoke all on public.billing_accounts from anon;
revoke all on public.fit_checks from anon;
revoke all on public.legal_acceptances from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.portal_access to authenticated;
grant select on public.billing_accounts to authenticated;
grant select, insert on public.fit_checks to authenticated;
grant select, insert on public.legal_acceptances to authenticated;

grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.portal_access to service_role;
grant select, insert, update, delete on public.billing_accounts to service_role;
grant select, insert, update, delete on public.fit_checks to service_role;
grant select, insert, update, delete on public.legal_acceptances to service_role;

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
end
$$;

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
