-- 009_feedback_and_reviews.sql
-- Safe to rerun.
-- Purpose: support, feedback, onboarding, notes, and review prompt tracking.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  rating integer,
  feedback text,
  triggered_after_load_count integer default 0,
  source text default 'app',
  created_at timestamptz default now()
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

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  event_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
