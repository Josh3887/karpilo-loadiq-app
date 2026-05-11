-- Profile-driven calculator defaults and dispatch-day overhead allocation.
-- Manual Supabase SQL editor compatible.

alter table public.user_settings
  add column if not exists operating_days_per_week numeric default 5.5,
  add column if not exists operating_days_per_month numeric default 23.8,
  add column if not exists default_lease_percent numeric default 0,
  add column if not exists default_deadhead_miles numeric default 0,
  add column if not exists default_tolls numeric default 0,
  add column if not exists default_accessorial_allowance numeric default 0;

alter table public.saved_loads
  add column if not exists dispatch_days numeric,
  add column if not exists overhead_applied numeric,
  add column if not exists was_run_status text,
  add column if not exists used_profile_values jsonb not null default '{}'::jsonb,
  add column if not exists used_temporary_overrides jsonb not null default '{}'::jsonb,
  add column if not exists calculated_at timestamptz;

update public.saved_loads
set
  dispatch_days = coalesce(dispatch_days, (input_snapshot->>'dispatchDays')::numeric),
  overhead_applied = coalesce(
    overhead_applied,
    (result_snapshot->>'loadOverheadApplied')::numeric,
    operational_cost
  ),
  was_run_status = coalesce(
    was_run_status,
    case
      when load_outcome = 'ran' then 'ran'
      when load_outcome = 'test_calculation' then 'test'
      when load_outcome = 'planned' then 'planned'
      else null
    end
  ),
  used_profile_values = coalesce(
    nullif(input_snapshot->'profileDerivedValues', 'null'::jsonb),
    used_profile_values,
    '{}'::jsonb
  ),
  used_temporary_overrides = coalesce(
    nullif(input_snapshot->'temporaryOverrides', 'null'::jsonb),
    used_temporary_overrides,
    '{}'::jsonb
  ),
  calculated_at = coalesce(calculated_at, created_at)
where dispatch_days is null
   or overhead_applied is null
   or was_run_status is null
   or used_profile_values = '{}'::jsonb
   or used_temporary_overrides = '{}'::jsonb
   or calculated_at is null;

create index if not exists idx_saved_loads_user_was_run_status
on public.saved_loads (user_id, was_run_status, created_at desc);

create index if not exists idx_saved_loads_user_calculated
on public.saved_loads (user_id, calculated_at desc);
