-- Pilot launch, support, entity notes, review prompts, onboarding, and load outcome readiness.
-- Manual Supabase SQL editor compatible.

alter table public.saved_loads
  alter column status set default 'saved',
  add column if not exists loadiq_load_number text,
  add column if not exists driver_load_number text,
  add column if not exists load_outcome text not null default 'unknown';

create index if not exists idx_saved_loads_user_loadiq_number
on public.saved_loads (user_id, loadiq_load_number);

create table if not exists public.onboarding_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  current_step text not null default 'profile',
  completed_steps jsonb not null default '[]'::jsonb,
  is_complete boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category text not null default 'support',
  subject text not null,
  message text not null,
  related_load_id uuid references public.saved_loads(id) on delete set null,
  status text not null default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.entity_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  saved_load_id uuid references public.saved_loads(id) on delete set null,
  entity_type text not null default 'facility',
  company_name text not null,
  address text,
  rating integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.review_prompt_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  last_prompted_at timestamptz,
  prompt_count integer not null default 0,
  last_response text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pilot_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  invite_code text unique,
  is_active boolean not null default true,
  monthly_price numeric not null default 14.99,
  max_days integer not null default 45,
  seat_number integer,
  starts_at timestamptz,
  ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_onboarding_states_user_complete
on public.onboarding_states (user_id, is_complete);

create index if not exists idx_support_tickets_user_created
on public.support_tickets (user_id, created_at desc);

create index if not exists idx_entity_notes_user_entity
on public.entity_notes (user_id, entity_type, created_at desc);

create index if not exists idx_review_prompt_tracking_user
on public.review_prompt_tracking (user_id);

create index if not exists idx_pilot_access_active
on public.pilot_access (is_active, seat_number);

alter table public.onboarding_states enable row level security;
alter table public.support_tickets enable row level security;
alter table public.entity_notes enable row level security;
alter table public.review_prompt_tracking enable row level security;
alter table public.pilot_access enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='onboarding_states' and policyname='Users can manage own onboarding state') then
    create policy "Users can manage own onboarding state" on public.onboarding_states for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='support_tickets' and policyname='Users can manage own support tickets') then
    create policy "Users can manage own support tickets" on public.support_tickets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='entity_notes' and policyname='Users can manage own entity notes') then
    create policy "Users can manage own entity notes" on public.entity_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='review_prompt_tracking' and policyname='Users can manage own review prompt tracking') then
    create policy "Users can manage own review prompt tracking" on public.review_prompt_tracking for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pilot_access' and policyname='Users can view own pilot access') then
    create policy "Users can view own pilot access" on public.pilot_access for select using (auth.uid() = user_id);
  end if;
end
$$;
