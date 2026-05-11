-- 013_legal_compliance_account_deletion.sql
-- Safe to rerun.
-- Purpose: legal/support categories and in-app account deletion request tracking.

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.support_tickets'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%category%'
  loop
    execute format('alter table public.support_tickets drop constraint if exists %I', constraint_name);
  end loop;
end
$$;

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

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  contact_email text,
  requested_scope text not null default 'account_and_data'
    check (requested_scope in ('account_and_data', 'data_only')),
  reason text,
  status text not null default 'open'
    check (status in ('open', 'in_review', 'completed', 'rejected', 'canceled')),
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz default now()
);

create index if not exists idx_account_deletion_requests_user_status
on public.account_deletion_requests (user_id, status, requested_at desc);

alter table public.account_deletion_requests enable row level security;

grant select, insert on public.account_deletion_requests to authenticated;
grant select, insert, update, delete on public.account_deletion_requests to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'account_deletion_requests'
      and policyname = 'Users can view own account deletion requests'
  ) then
    create policy "Users can view own account deletion requests"
    on public.account_deletion_requests
    for select to authenticated
    using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'account_deletion_requests'
      and policyname = 'Users can insert own account deletion requests'
  ) then
    create policy "Users can insert own account deletion requests"
    on public.account_deletion_requests
    for insert to authenticated
    with check ((select auth.uid()) = user_id);
  end if;
end
$$;
