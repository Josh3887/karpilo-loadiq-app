-- 016_app_load_identity_entitlement_alignment.sql
-- Safe review script. Do not run until the APP deployment using load_id,
-- trip_number, Gold, and Platinum labels is ready.
-- Purpose:
-- - Add APP-owned system Load ID and user-facing Trip Number support.
-- - Add Gold/Platinum usage tiers without deleting legacy rows.
-- - Stop new placeholder Stripe customer records from defaulting to "free".

create sequence if not exists public.saved_load_id_seq
  as integer
  minvalue 1
  maxvalue 9999999
  no cycle;

alter table public.saved_loads
  add column if not exists load_id integer,
  add column if not exists trip_number text;

with numbered_loads as (
  select
    id,
    row_number() over (order by created_at asc, id asc)::integer as next_load_id
  from public.saved_loads
  where load_id is null
)
update public.saved_loads saved
set load_id = numbered_loads.next_load_id
from numbered_loads
where saved.id = numbered_loads.id;

select setval(
  'public.saved_load_id_seq',
  greatest(coalesce((select max(load_id) from public.saved_loads), 0), 1),
  (select max(load_id) is not null from public.saved_loads)
);

alter table public.saved_loads
  alter column load_id set default nextval('public.saved_load_id_seq');

create unique index if not exists saved_loads_load_id_uidx
on public.saved_loads (load_id)
where load_id is not null;

update public.saved_loads
set trip_number = coalesce(
  nullif(trip_number, ''),
  nullif(driver_load_number, ''),
  nullif(carrier_load_id, ''),
  nullif(dispatcher_reference, ''),
  'AUTO-' || load_id::text
)
where trip_number is null
  or trip_number = '';

create or replace function public.assign_saved_load_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.load_id is null then
    new.load_id = nextval('public.saved_load_id_seq');
  end if;

  if new.trip_number is null or btrim(new.trip_number) = '' then
    new.trip_number = coalesce(
      nullif(btrim(new.driver_load_number), ''),
      nullif(btrim(new.carrier_load_id), ''),
      nullif(btrim(new.dispatcher_reference), ''),
      'AUTO-' || new.load_id::text
    );
  end if;

  return new;
end;
$$;

drop trigger if exists assign_saved_load_identity_before_insert
on public.saved_loads;

create trigger assign_saved_load_identity_before_insert
before insert on public.saved_loads
for each row
execute function public.assign_saved_load_identity();

insert into public.usage_limits (
  tier,
  monthly_calculations,
  saved_loads,
  exports_allowed,
  advanced_analytics_allowed,
  comparisons_allowed,
  templates_allowed
)
values
  ('gold', null, null, true, true, true, true),
  ('platinum', null, null, true, true, true, true)
on conflict (tier) do update set
  monthly_calculations = excluded.monthly_calculations,
  saved_loads = excluded.saved_loads,
  exports_allowed = excluded.exports_allowed,
  advanced_analytics_allowed = excluded.advanced_analytics_allowed,
  comparisons_allowed = excluded.comparisons_allowed,
  templates_allowed = excluded.templates_allowed;

alter table public.subscriptions
  alter column plan_code set default 'pending',
  alter column tier set default 'unknown';

comment on column public.saved_loads.load_id is
  'System-generated Karpilo LoadIQ load identifier, 1 through 9999999.';

comment on column public.saved_loads.trip_number is
  'Driver-facing trip/reference number. May be broker, dispatcher, carrier, customer, or AUTO-load_id.';
