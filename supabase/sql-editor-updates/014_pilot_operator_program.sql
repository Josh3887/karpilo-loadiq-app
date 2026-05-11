-- Karpilo LoadIQ pilot / legacy launch operator program layer.
-- Safe to run in the Supabase SQL Editor after the consolidated schema.

create table if not exists public.operator_program_status (
  user_id uuid primary key references public.users(id) on delete cascade,
  pilot_user boolean not null default false,
  founding_operator boolean not null default false,
  launch500_user boolean not null default false,
  legacy_price_locked boolean not null default false,
  subscription_grandfathered boolean not null default false,
  program text not null default 'standard'
    check (program in ('standard', 'pilot50', 'launch500')),
  phase text not null default 'prelaunch'
    check (phase in ('prelaunch', 'pilot_active', 'official_launch')),
  assigned_by text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_experience_state (
  user_id uuid primary key references public.users(id) on delete cascade,
  founder_welcome_completed_at timestamptz,
  pilot_status_card_dismissed_at timestamptz,
  pilot_status_card_minimized_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.operator_pricing_locks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  program text not null check (program in ('pilot50', 'launch500')),
  tier text not null check (tier in ('pilot', 'launch500', 'founder')),
  monthly_price numeric(10,2) not null check (monthly_price >= 0),
  annual_price numeric(10,2) not null check (annual_price >= 0),
  billing_provider text not null default 'stripe'
    check (billing_provider in ('stripe', 'apple', 'google', 'manual')),
  provider_price_id text,
  provider_subscription_id text,
  lifetime_lock boolean not null default true,
  locked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, program)
);

create index if not exists idx_operator_program_status_phase
on public.operator_program_status (phase, program);

create index if not exists idx_operator_pricing_locks_program
on public.operator_pricing_locks (program, locked_at);

create or replace function public.prevent_operator_pricing_lock_mutation()
returns trigger as $$
begin
  raise exception 'operator_pricing_locks are immutable; insert a new administrative record instead of updating or deleting';
end;
$$ language plpgsql;

drop trigger if exists prevent_operator_pricing_lock_update on public.operator_pricing_locks;
create trigger prevent_operator_pricing_lock_update
before update on public.operator_pricing_locks
for each row execute function public.prevent_operator_pricing_lock_mutation();

drop trigger if exists prevent_operator_pricing_lock_delete on public.operator_pricing_locks;
create trigger prevent_operator_pricing_lock_delete
before delete on public.operator_pricing_locks
for each row execute function public.prevent_operator_pricing_lock_mutation();

drop trigger if exists set_operator_program_status_updated_at on public.operator_program_status;
create trigger set_operator_program_status_updated_at
before update on public.operator_program_status
for each row execute function public.set_updated_at();

drop trigger if exists set_user_experience_state_updated_at on public.user_experience_state;
create trigger set_user_experience_state_updated_at
before update on public.user_experience_state
for each row execute function public.set_updated_at();

create or replace function public.get_operator_program_counts()
returns table (program text, claimed_count bigint)
security definer
set search_path = public
as $$
  select operator_pricing_locks.program, count(*)::bigint
  from public.operator_pricing_locks
  group by operator_pricing_locks.program;
$$ language sql stable;

alter table public.operator_program_status enable row level security;
alter table public.user_experience_state enable row level security;
alter table public.operator_pricing_locks enable row level security;

grant select on public.operator_program_status to authenticated;
grant select, insert, update on public.user_experience_state to authenticated;
grant execute on function public.get_operator_program_counts() to authenticated;
grant select, insert on public.operator_program_status to service_role;
grant select, insert on public.operator_pricing_locks to service_role;
grant select, insert, update on public.user_experience_state to service_role;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operator_program_status' and policyname = 'Users can view own operator program status') then
    create policy "Users can view own operator program status"
    on public.operator_program_status
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_experience_state' and policyname = 'Users can manage own app experience state') then
    create policy "Users can manage own app experience state"
    on public.user_experience_state
    for all to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operator_pricing_locks' and policyname = 'Users can view own immutable pricing locks') then
    create policy "Users can view own immutable pricing locks"
    on public.operator_pricing_locks
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end
$$;

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
  ('launch500', null, null, true, true, true, true)
on conflict (tier) do update set
  monthly_calculations = excluded.monthly_calculations,
  saved_loads = excluded.saved_loads,
  exports_allowed = excluded.exports_allowed,
  advanced_analytics_allowed = excluded.advanced_analytics_allowed,
  comparisons_allowed = excluded.comparisons_allowed,
  templates_allowed = excluded.templates_allowed;

alter table public.support_tickets
  drop constraint if exists support_tickets_category_check;

alter table public.support_tickets
  add constraint support_tickets_category_check
  check (category in (
    'support',
    'bug',
    'refund',
    'billing',
    'feature',
    'privacy',
    'account_deletion'
  ));
