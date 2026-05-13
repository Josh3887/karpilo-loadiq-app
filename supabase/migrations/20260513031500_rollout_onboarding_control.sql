-- Karpilo LoadIQ phased rollout and onboarding telemetry controls.
-- Additive, SQL-editor compatible, and safe to rerun.

alter table public.operator_program_status
  drop constraint if exists operator_program_status_phase_check;

alter table public.operator_program_status
  add constraint operator_program_status_phase_check
  check (phase in (
    'prelaunch',
    'pilot_active',
    'official_launch',
    'FOUNDER_PILOT',
    'CONTROLLED_PUBLIC_LAUNCH',
    'EXPANSION_ACCESS',
    'GENERAL_AVAILABILITY'
  ));

create table if not exists public.rollout_phase_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  rollout_phase text not null
    check (rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  cohort text not null default 'standard'
    check (cohort in ('pilot50', 'launch500', 'standard')),
  seat_number integer check (seat_number is null or seat_number > 0),
  assignment_source text not null default 'admin',
  is_active boolean not null default true,
  assigned_by text,
  assigned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.onboarding_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  event_name text not null,
  rollout_phase text
    check (rollout_phase is null or rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.disclaimer_acceptance_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text,
  policy_version text not null,
  rollout_phase text
    check (rollout_phase is null or rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  source text not null default 'app_access_gate',
  event_payload jsonb not null default '{}'::jsonb,
  accepted_at timestamptz not null default now(),
  created_at timestamptz default now()
);

create table if not exists public.welcome_message_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  rollout_phase text not null
    check (rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  message_key text not null,
  source text not null default 'founder_welcome',
  event_payload jsonb not null default '{}'::jsonb,
  viewed_at timestamptz not null default now(),
  created_at timestamptz default now()
);

create table if not exists public.onboarding_feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text,
  category text not null default 'onboarding'
    check (category in (
      'bug',
      'feature',
      'onboarding_confusion',
      'support',
      'billing',
      'onboarding'
    )),
  message text not null,
  rollout_phase text
    check (rollout_phase is null or rollout_phase in (
      'FOUNDER_PILOT',
      'CONTROLLED_PUBLIC_LAUNCH',
      'EXPANSION_ACCESS',
      'GENERAL_AVAILABILITY'
    )),
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create unique index if not exists idx_rollout_phase_assignments_active_seat
on public.rollout_phase_assignments (rollout_phase, seat_number)
where is_active = true and seat_number is not null;

create index if not exists idx_rollout_phase_assignments_user_active
on public.rollout_phase_assignments (user_id, is_active);

create index if not exists idx_onboarding_events_user_created
on public.onboarding_events (user_id, created_at desc);

create index if not exists idx_disclaimer_acceptance_events_user_created
on public.disclaimer_acceptance_events (user_id, accepted_at desc);

create index if not exists idx_welcome_message_views_user_phase
on public.welcome_message_views (user_id, rollout_phase, viewed_at desc);

create index if not exists idx_onboarding_feedback_events_user_created
on public.onboarding_feedback_events (user_id, created_at desc);

alter table public.rollout_phase_assignments enable row level security;
alter table public.onboarding_events enable row level security;
alter table public.disclaimer_acceptance_events enable row level security;
alter table public.welcome_message_views enable row level security;
alter table public.onboarding_feedback_events enable row level security;

grant select on public.rollout_phase_assignments to authenticated;
grant select, insert on public.onboarding_events to authenticated;
grant select, insert on public.disclaimer_acceptance_events to authenticated;
grant select, insert on public.welcome_message_views to authenticated;
grant select, insert on public.onboarding_feedback_events to authenticated;

grant select, insert, update, delete on
  public.rollout_phase_assignments,
  public.onboarding_events,
  public.disclaimer_acceptance_events,
  public.welcome_message_views,
  public.onboarding_feedback_events
to service_role;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'rollout_phase_assignments' and policyname = 'Users can view own rollout assignment') then
    create policy "Users can view own rollout assignment"
    on public.rollout_phase_assignments
    for select to authenticated
    using ((select auth.uid()) = user_id and is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_events' and policyname = 'Users can create and view own onboarding events') then
    create policy "Users can create and view own onboarding events"
    on public.onboarding_events
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own onboarding events"
    on public.onboarding_events
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'disclaimer_acceptance_events' and policyname = 'Users can create and view own disclaimer acceptance events') then
    create policy "Users can create and view own disclaimer acceptance events"
    on public.disclaimer_acceptance_events
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own disclaimer acceptance events"
    on public.disclaimer_acceptance_events
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'welcome_message_views' and policyname = 'Users can create and view own welcome message views') then
    create policy "Users can create and view own welcome message views"
    on public.welcome_message_views
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own welcome message views"
    on public.welcome_message_views
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_feedback_events' and policyname = 'Users can create and view own onboarding feedback events') then
    create policy "Users can create and view own onboarding feedback events"
    on public.onboarding_feedback_events
    for select to authenticated
    using ((select auth.uid()) = user_id);

    create policy "Users can insert own onboarding feedback events"
    on public.onboarding_feedback_events
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;
end
$$;
