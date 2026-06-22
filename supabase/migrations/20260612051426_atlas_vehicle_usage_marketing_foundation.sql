-- Atlas vehicle context, token-budget add-ons, and saved-load review snapshots.
-- Additive migration for the new-account baseline. Does not grant anon access.

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
  if to_regclass('public.truck_profiles') is not null then
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
  if to_regclass('public.ai_budget_limits') is not null then
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

insert into public.ai_budget_limits (
  plan_tier,
  feature_key,
  daily_call_limit,
  monthly_call_limit,
  cooldown_seconds,
  monthly_token_cap,
  monthly_cost_cap_cents,
  premium_addon_allowed,
  addon_token_block_size,
  addon_token_price_cents,
  overage_surcharge_multiplier,
  model_tier,
  enabled
)
values
  ('free', 'load_analysis', 0, 0, 300, 0, 0, false, null, null, 1.00, 'mini', false),
  ('no_access', 'load_analysis', 0, 0, 300, 0, 0, false, null, null, 1.00, 'mini', false),
  ('gold', 'load_analysis', 3, 50, 120, 120000, 1000, false, null, null, 1.00, 'mini', true),
  ('platinum', 'load_analysis', 15, 300, 60, 750000, 5000, true, 100000, 2900, 1.75, 'mini', true),
  ('pilot', 'load_analysis', 5, 100, 90, 200000, 1500, false, null, null, 1.00, 'mini', true),
  ('launch500', 'load_analysis', 5, 100, 90, 200000, 1500, false, null, null, 1.00, 'mini', true),
  ('pro', 'load_analysis', 35, 1000, 30, 2500000, 15000, true, 100000, 2400, 1.50, 'premium', true),
  ('admin', 'load_analysis', 100, 5000, 5, 10000000, 0, true, 100000, 0, 1.00, 'premium', true)
on conflict (plan_tier, feature_key) do update set
  daily_call_limit = excluded.daily_call_limit,
  monthly_call_limit = excluded.monthly_call_limit,
  cooldown_seconds = excluded.cooldown_seconds,
  monthly_token_cap = excluded.monthly_token_cap,
  monthly_cost_cap_cents = excluded.monthly_cost_cap_cents,
  premium_addon_allowed = excluded.premium_addon_allowed,
  addon_token_block_size = excluded.addon_token_block_size,
  addon_token_price_cents = excluded.addon_token_price_cents,
  overage_surcharge_multiplier = excluded.overage_surcharge_multiplier,
  model_tier = excluded.model_tier,
  enabled = excluded.enabled,
  updated_at = now();

create index if not exists ai_token_addons_user_feature_status_idx
  on public.ai_token_addons (user_id, feature_key, status, expires_at);

create index if not exists ai_token_addons_purchase_reference_idx
  on public.ai_token_addons (purchase_reference)
  where purchase_reference is not null;

alter table public.ai_token_addons enable row level security;

grant select on public.ai_token_addons to authenticated;
grant select, insert, update, delete on public.ai_token_addons to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_token_addons'
      and policyname = 'Users can view own AI token add-ons'
  ) then
    create policy "Users can view own AI token add-ons"
      on public.ai_token_addons for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;
end
$$;

drop trigger if exists set_ai_token_addons_updated_at on public.ai_token_addons;
create trigger set_ai_token_addons_updated_at
before update on public.ai_token_addons
for each row execute function public.set_updated_at();

do $$
begin
  if to_regclass('public.truck_profiles') is not null then
    execute 'comment on column public.truck_profiles.atlas_equipment_pack is ''Karpilo Atlas equipment intelligence pack key derived from user-entered equipment type.''';
    execute 'comment on column public.truck_profiles.equipment_type is ''Primary transport equipment category such as dry van, reefer, flatbed, tanker, hot-shot, or specialized.''';
    execute 'comment on column public.truck_profiles.combination_type is ''Vehicle combination context such as single tractor-trailer, doubles, triples, straight truck, or hot-shot pickup and trailer.''';
    execute 'comment on column public.truck_profiles.route_restriction_notes is ''User-entered vehicle or trailer restriction context for planning. Not certified route, permit, hazmat, securement, or compliance data.''';
  end if;

  if to_regclass('public.saved_loads') is not null then
    execute 'comment on column public.saved_loads.equipment_context_snapshot is ''Saved user-entered equipment context used by Atlas Core, Atlas Route, Atlas Freight, FitCheck, and operational review. Not certified compliance data.''';
  end if;
end
$$;

comment on table public.ai_token_addons is
  'Premium Atlas AI token add-on ledger. Entitlement and payment processors should create rows through service-role paths only.';
