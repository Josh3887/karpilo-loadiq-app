-- Fuel gauge readiness for active loads.
-- This migration is additive except for widening saved_loads status checks.

alter table if exists public.truck_profiles
  add column if not exists fuel_tank_count integer,
  add column if not exists fuel_tank_capacity_gallons numeric(8,2);

do $$
begin
  if to_regclass('public.truck_profiles') is not null then
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
  end if;
end
$$;

alter table if exists public.saved_loads
  add column if not exists load_status_reason text,
  add column if not exists fuel_gauge_snapshot jsonb not null default '{}'::jsonb;

alter table if exists public.saved_loads
  drop constraint if exists saved_loads_load_run_status_check,
  drop constraint if exists saved_loads_was_run_status_check;

do $$
begin
  if to_regclass('public.saved_loads') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.saved_loads'::regclass
        and conname = 'saved_loads_load_run_status_valid'
    ) then
      alter table public.saved_loads
        add constraint saved_loads_load_run_status_valid
        check (
          load_run_status is null
          or load_run_status in (
            'planned',
            'booked',
            'dispatched',
            'running',
            'rejected',
            'pulled',
            'ran',
            'test'
          )
        )
        not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.saved_loads'::regclass
        and conname = 'saved_loads_was_run_status_valid'
    ) then
      alter table public.saved_loads
        add constraint saved_loads_was_run_status_valid
        check (
          was_run_status is null
          or was_run_status in (
            'planned',
            'booked',
            'dispatched',
            'running',
            'rejected',
            'pulled',
            'ran',
            'test'
          )
        )
        not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.saved_loads'::regclass
        and conname = 'saved_loads_load_status_reason_valid'
    ) then
      alter table public.saved_loads
        add constraint saved_loads_load_status_reason_valid
        check (
          load_status_reason is null
          or load_status_reason in ('breach', 'accident', 'breakdown', 'other')
        )
        not valid;
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.truck_profiles') is not null then
    execute 'comment on column public.truck_profiles.fuel_tank_count is ''User-provided fuel tank count for active-load fuel gauge range estimates.''';
    execute 'comment on column public.truck_profiles.fuel_tank_capacity_gallons is ''User-provided gallons per fuel tank for active-load fuel gauge range estimates.''';
  end if;

  if to_regclass('public.saved_loads') is not null then
    execute 'comment on column public.saved_loads.load_status_reason is ''Reason for pulled active loads such as breach, accident, breakdown, or other.''';
    execute 'comment on column public.saved_loads.fuel_gauge_snapshot is ''Deterministic fuel gauge output captured from load miles, MPG, fuel price, starting fuel, and vehicle tank profile.''';
  end if;
end
$$;
