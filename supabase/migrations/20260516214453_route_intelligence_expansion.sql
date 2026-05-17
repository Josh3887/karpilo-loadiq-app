-- Phase 2 route intelligence expansion.
-- Additive only. Do not run destructive drops in this migration.

create extension if not exists "pgcrypto";

-- Route intelligence depends on the core app profile/load tables. Fail loudly
-- instead of silently skipping core work against a broken or wrong project.
do $$
begin
  if to_regclass('public.saved_loads') is null then
    raise exception 'Route intelligence migration requires public.saved_loads to exist. Apply the core app schema before this migration.';
  end if;

  if to_regclass('public.users') is null then
    raise exception 'Route intelligence migration requires public.users to exist. Apply the core app profile schema before this migration.';
  end if;
end
$$;

-- saved_loads route-intelligence snapshots.
alter table public.saved_loads
  add column if not exists deadhead_start_city text,
  add column if not exists deadhead_start_state text,
  add column if not exists deadhead_start_zip text,
  add column if not exists estimated_load_weight_lbs integer,
  add column if not exists route_stop_count integer,
  add column if not exists route_model_version text,
  add column if not exists reserve_allocation_mode text,
  add column if not exists reserve_allocation_cpm numeric,
  add column if not exists reserve_allocation_percent numeric,
  add column if not exists target_true_rpm_snapshot numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_estimated_load_weight_lbs_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_estimated_load_weight_lbs_nonnegative
      check (estimated_load_weight_lbs is null or estimated_load_weight_lbs >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_route_stop_count_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_route_stop_count_nonnegative
      check (route_stop_count is null or route_stop_count >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_reserve_allocation_mode_valid'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_reserve_allocation_mode_valid
      check (
        reserve_allocation_mode is null
        or reserve_allocation_mode in ('flat', 'cpm', 'percent')
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_reserve_allocation_cpm_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_reserve_allocation_cpm_nonnegative
      check (reserve_allocation_cpm is null or reserve_allocation_cpm >= 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_reserve_allocation_percent_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_reserve_allocation_percent_nonnegative
      check (
        reserve_allocation_percent is null
        or reserve_allocation_percent >= 0
      )
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.saved_loads'::regclass
      and conname = 'saved_loads_target_true_rpm_snapshot_nonnegative'
  ) then
    alter table public.saved_loads
      add constraint saved_loads_target_true_rpm_snapshot_nonnegative
      check (target_true_rpm_snapshot is null or target_true_rpm_snapshot >= 0)
      not valid;
  end if;
end
$$;

comment on column public.saved_loads.deadhead_start_city is
  'Optional deadhead origin city used for operational pre-pickup cost modeling.';
comment on column public.saved_loads.deadhead_start_state is
  'Optional deadhead origin state used for operational pre-pickup cost modeling.';
comment on column public.saved_loads.deadhead_start_zip is
  'Optional deadhead origin ZIP used for operational pre-pickup cost modeling.';
comment on column public.saved_loads.estimated_load_weight_lbs is
  'Estimated or speculative load weight in pounds; not scale-certified unless verified elsewhere.';
comment on column public.saved_loads.route_stop_count is
  'Snapshot count of modeled route stops for historical route-intelligence consistency.';
comment on column public.saved_loads.route_model_version is
  'Version label for the operational route model used when the load was calculated.';
comment on column public.saved_loads.reserve_allocation_mode is
  'Historical reserve allocation mode snapshot: flat, cpm, or percent.';
comment on column public.saved_loads.reserve_allocation_cpm is
  'Historical reserve allocation CPM snapshot used to protect saved-load math consistency.';
comment on column public.saved_loads.reserve_allocation_percent is
  'Historical reserve allocation percent snapshot used to protect saved-load math consistency.';
comment on column public.saved_loads.target_true_rpm_snapshot is
  'Historical user target true RPM baseline used when the load was calculated.';

-- Route stops are operational modeling records, not routing API truth.
create table if not exists public.saved_load_stops (
  id uuid primary key default gen_random_uuid(),
  saved_load_id uuid not null references public.saved_loads(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  stop_sequence integer not null,
  stop_type text not null,
  city text,
  state text,
  zip text,
  miles_from_previous numeric,
  stop_revenue numeric,
  stop_expense numeric,
  notes text,
  created_at timestamptz default now(),
  constraint saved_load_stops_stop_sequence_positive
    check (stop_sequence >= 1),
  constraint saved_load_stops_stop_type_valid
    check (stop_type in ('pickup', 'stop_off', 'delivery')),
  constraint saved_load_stops_miles_from_previous_nonnegative
    check (miles_from_previous is null or miles_from_previous >= 0),
  constraint saved_load_stops_stop_revenue_nonnegative
    check (stop_revenue is null or stop_revenue >= 0),
  constraint saved_load_stops_stop_expense_nonnegative
    check (stop_expense is null or stop_expense >= 0),
  constraint saved_load_stops_saved_load_sequence_unique
    unique (saved_load_id, stop_sequence)
);

comment on table public.saved_load_stops is
  'Operational route-stop modeling table for pickup, stop-off, and delivery sequences. These rows are user-modeled and are not routing API truth.';
comment on column public.saved_load_stops.saved_load_id is
  'Parent saved load for this modeled route stop.';
comment on column public.saved_load_stops.user_id is
  'Owner user id used for RLS and service-side validation.';
comment on column public.saved_load_stops.stop_sequence is
  'One-based route stop sequence within the saved load.';
comment on column public.saved_load_stops.stop_type is
  'Operational stop type: pickup, stop_off, or delivery.';
comment on column public.saved_load_stops.miles_from_previous is
  'Estimated operational miles from the previous modeled stop.';
comment on column public.saved_load_stops.stop_revenue is
  'Optional estimated stop-level revenue or accessorial amount.';
comment on column public.saved_load_stops.stop_expense is
  'Optional estimated stop-level expense.';

alter table public.saved_load_stops enable row level security;

revoke all on public.saved_load_stops from public;
revoke all on public.saved_load_stops from anon;
revoke all on public.saved_load_stops from authenticated;

grant select, insert, update, delete on public.saved_load_stops to authenticated;
grant all on public.saved_load_stops to service_role;

create index if not exists idx_saved_load_stops_user_load_sequence
on public.saved_load_stops (user_id, saved_load_id, stop_sequence);

-- Recreate mutation policies so future runs cannot preserve an older policy
-- that only checked saved_load_stops.user_id without validating parent load
-- ownership.
drop policy if exists "Users can insert own saved load stops"
on public.saved_load_stops;

drop policy if exists "Users can update own saved load stops"
on public.saved_load_stops;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_load_stops'
      and policyname = 'Users can view own saved load stops'
  ) then
    create policy "Users can view own saved load stops"
    on public.saved_load_stops
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_load_stops'
      and policyname = 'Users can insert own saved load stops'
  ) then
    create policy "Users can insert own saved load stops"
    on public.saved_load_stops
    for insert
    to authenticated
    with check (
      auth.uid() = user_id
      and exists (
        select 1
        from public.saved_loads sl
        where sl.id = saved_load_id
          and sl.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_load_stops'
      and policyname = 'Users can update own saved load stops'
  ) then
    create policy "Users can update own saved load stops"
    on public.saved_load_stops
    for update
    to authenticated
    using (
      auth.uid() = user_id
      and exists (
        select 1
        from public.saved_loads sl
        where sl.id = saved_load_id
          and sl.user_id = auth.uid()
      )
    )
    with check (
      auth.uid() = user_id
      and exists (
        select 1
        from public.saved_loads sl
        where sl.id = saved_load_id
          and sl.user_id = auth.uid()
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_load_stops'
      and policyname = 'Users can delete own saved load stops'
  ) then
    create policy "Users can delete own saved load stops"
    on public.saved_load_stops
    for delete
    to authenticated
    using (auth.uid() = user_id);
  end if;
end
$$;

-- Optional vehicle intelligence expansion. Guarded because older/live projects
-- may not have truck_profiles yet.
alter table if exists public.truck_profiles
  add column if not exists trailer_division_type text,
  add column if not exists trailer_type text,
  add column if not exists vehicle_tare_weight_lbs integer,
  add column if not exists estimated_max_gross_lbs integer,
  add column if not exists operational_classification text;

do $$
begin
  if to_regclass('public.truck_profiles') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.truck_profiles'::regclass
        and conname = 'truck_profiles_vehicle_tare_weight_lbs_nonnegative'
    ) then
      alter table public.truck_profiles
        add constraint truck_profiles_vehicle_tare_weight_lbs_nonnegative
        check (
          vehicle_tare_weight_lbs is null
          or vehicle_tare_weight_lbs >= 0
        )
        not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.truck_profiles'::regclass
        and conname = 'truck_profiles_estimated_max_gross_lbs_nonnegative'
    ) then
      alter table public.truck_profiles
        add constraint truck_profiles_estimated_max_gross_lbs_nonnegative
        check (
          estimated_max_gross_lbs is null
          or estimated_max_gross_lbs >= 0
        )
        not valid;
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.truck_profiles') is not null then
    execute 'comment on column public.truck_profiles.trailer_division_type is ''Optional trailer/division category for future operational analytics.''';
    execute 'comment on column public.truck_profiles.trailer_type is ''Optional trailer type for future equipment-aware profitability modeling.''';
    execute 'comment on column public.truck_profiles.vehicle_tare_weight_lbs is ''Estimated vehicle tare weight in pounds for operational modeling; not certified scale data unless verified elsewhere.''';
    execute 'comment on column public.truck_profiles.estimated_max_gross_lbs is ''Optional estimated maximum gross weight for future equipment and load-weight analytics.''';
    execute 'comment on column public.truck_profiles.operational_classification is ''Optional operational classification for future vehicle intelligence.''';
  end if;
end
$$;

-- Optional user default reserve mode expansion. Guarded because older/live
-- projects may not have user_settings yet.
alter table if exists public.user_settings
  add column if not exists reserve_allocation_mode text,
  add column if not exists reserve_allocation_cpm numeric,
  add column if not exists reserve_allocation_percent numeric;

do $$
begin
  if to_regclass('public.user_settings') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.user_settings'::regclass
        and conname = 'user_settings_reserve_allocation_mode_valid'
    ) then
      alter table public.user_settings
        add constraint user_settings_reserve_allocation_mode_valid
        check (
          reserve_allocation_mode is null
          or reserve_allocation_mode in ('flat', 'cpm', 'percent')
        )
        not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.user_settings'::regclass
        and conname = 'user_settings_reserve_allocation_cpm_nonnegative'
    ) then
      alter table public.user_settings
        add constraint user_settings_reserve_allocation_cpm_nonnegative
        check (reserve_allocation_cpm is null or reserve_allocation_cpm >= 0)
        not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.user_settings'::regclass
        and conname = 'user_settings_reserve_allocation_percent_nonnegative'
    ) then
      alter table public.user_settings
        add constraint user_settings_reserve_allocation_percent_nonnegative
        check (
          reserve_allocation_percent is null
          or reserve_allocation_percent >= 0
        )
        not valid;
    end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.user_settings') is not null then
    execute 'comment on column public.user_settings.reserve_allocation_mode is ''Default reserve allocation mode for future calculations: flat, cpm, or percent.''';
    execute 'comment on column public.user_settings.reserve_allocation_cpm is ''Default reserve allocation CPM for CPM-based reserve modeling.''';
    execute 'comment on column public.user_settings.reserve_allocation_percent is ''Default reserve allocation percent for percent-based reserve modeling.''';
  end if;
end
$$;

-- Verification SQL - run manually after applying in Supabase SQL Editor.
--
-- select to_regclass('public.users') as users_table;
-- select to_regclass('public.saved_loads') as saved_loads_table;
--
-- select table_schema, table_name, column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and (
--     (table_name = 'saved_loads' and column_name in (
--       'deadhead_start_city',
--       'deadhead_start_state',
--       'deadhead_start_zip',
--       'estimated_load_weight_lbs',
--       'route_stop_count',
--       'route_model_version',
--       'reserve_allocation_mode',
--       'reserve_allocation_cpm',
--       'reserve_allocation_percent',
--       'target_true_rpm_snapshot'
--     ))
--     or (table_name = 'saved_load_stops' and column_name in (
--       'id',
--       'saved_load_id',
--       'user_id',
--       'stop_sequence',
--       'stop_type',
--       'city',
--       'state',
--       'zip',
--       'miles_from_previous',
--       'stop_revenue',
--       'stop_expense',
--       'notes',
--       'created_at'
--     ))
--     or (table_name = 'truck_profiles' and column_name in (
--       'trailer_division_type',
--       'trailer_type',
--       'vehicle_tare_weight_lbs',
--       'estimated_max_gross_lbs',
--       'operational_classification'
--     ))
--     or (table_name = 'user_settings' and column_name in (
--       'reserve_allocation_mode',
--       'reserve_allocation_cpm',
--       'reserve_allocation_percent'
--     ))
--   )
-- order by table_name, column_name;
--
-- select schemaname, tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
--   and tablename = 'saved_load_stops';
--
-- select schemaname, tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'saved_load_stops'
-- order by policyname;
--
-- select policyname, cmd, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'saved_load_stops'
--   and policyname in (
--     'Users can insert own saved load stops',
--     'Users can update own saved load stops'
--   );
-- Confirm both insert/update with_check expressions include parent
-- public.saved_loads ownership:
--   exists (
--     select 1
--     from public.saved_loads sl
--     where sl.id = saved_load_id
--       and sl.user_id = auth.uid()
--   )
--
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'saved_load_stops'
-- order by grantee, privilege_type;
--
-- select conname, contype, convalidated
-- from pg_constraint
-- where conrelid in (
--   'public.saved_loads'::regclass,
--   'public.saved_load_stops'::regclass
-- )
-- order by conrelid::regclass::text, conname;

-- Rollback SQL - review before manual use. This removes only the route
-- intelligence expansion created by this migration.
--
-- drop table if exists public.saved_load_stops;
--
-- alter table if exists public.saved_loads
--   drop constraint if exists saved_loads_estimated_load_weight_lbs_nonnegative,
--   drop constraint if exists saved_loads_route_stop_count_nonnegative,
--   drop constraint if exists saved_loads_reserve_allocation_mode_valid,
--   drop constraint if exists saved_loads_reserve_allocation_cpm_nonnegative,
--   drop constraint if exists saved_loads_reserve_allocation_percent_nonnegative,
--   drop constraint if exists saved_loads_target_true_rpm_snapshot_nonnegative,
--   drop column if exists deadhead_start_city,
--   drop column if exists deadhead_start_state,
--   drop column if exists deadhead_start_zip,
--   drop column if exists estimated_load_weight_lbs,
--   drop column if exists route_stop_count,
--   drop column if exists route_model_version,
--   drop column if exists reserve_allocation_mode,
--   drop column if exists reserve_allocation_cpm,
--   drop column if exists reserve_allocation_percent,
--   drop column if exists target_true_rpm_snapshot;
--
-- alter table if exists public.truck_profiles
--   drop constraint if exists truck_profiles_vehicle_tare_weight_lbs_nonnegative,
--   drop constraint if exists truck_profiles_estimated_max_gross_lbs_nonnegative,
--   drop column if exists trailer_division_type,
--   drop column if exists trailer_type,
--   drop column if exists vehicle_tare_weight_lbs,
--   drop column if exists estimated_max_gross_lbs,
--   drop column if exists operational_classification;
--
-- alter table if exists public.user_settings
--   drop constraint if exists user_settings_reserve_allocation_mode_valid,
--   drop constraint if exists user_settings_reserve_allocation_cpm_nonnegative,
--   drop constraint if exists user_settings_reserve_allocation_percent_nonnegative,
--   drop column if exists reserve_allocation_mode,
--   drop column if exists reserve_allocation_cpm,
--   drop column if exists reserve_allocation_percent;
