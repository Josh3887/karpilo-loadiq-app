-- Account soft-delete/deletion-request status foundation.
--
-- Safe-to-run-now:
-- - Additive only.
-- - Does not delete auth.users.
-- - Does not delete billing, subscription, pricing lock, saved load,
--   reservation, or operational records.
-- - Supports self-service deletion requests while preserving records that may
--   be needed for billing, fraud prevention, disputes, security, or legal
--   retention.

alter table public.users
  add column if not exists deleted_at timestamptz,
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_status text not null default 'active',
  add column if not exists account_status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_deletion_status_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_deletion_status_check
      check (deletion_status in ('active', 'deletion_requested', 'deleted', 'suspended'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_account_status_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_account_status_check
      check (account_status in ('active', 'deletion_requested', 'deleted', 'suspended'))
      not valid;
  end if;
end
$$;

create index if not exists idx_users_account_status
  on public.users (account_status);

create index if not exists idx_users_deletion_status_requested_at
  on public.users (deletion_status, deletion_requested_at);

create index if not exists idx_users_deleted_at
  on public.users (deleted_at)
  where deleted_at is not null;

comment on column public.users.deleted_at is
  'Soft-delete completion timestamp. Does not imply auth.users or billing records were hard-deleted.';

comment on column public.users.deletion_requested_at is
  'Timestamp when the user requested account/data deletion review.';

comment on column public.users.deletion_status is
  'Soft deletion lifecycle: active, deletion_requested, deleted, or suspended.';

comment on column public.users.account_status is
  'Account access lifecycle: active, deletion_requested, deleted, or suspended.';

-- VERIFICATION SQL (manual, do not run automatically):
--
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'users'
--   and column_name in (
--     'deleted_at',
--     'deletion_requested_at',
--     'deletion_status',
--     'account_status'
--   )
-- order by column_name;
--
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'users'
--   and indexname in (
--     'idx_users_account_status',
--     'idx_users_deletion_status_requested_at',
--     'idx_users_deleted_at'
--   )
-- order by indexname;
--
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.users'::regclass
--   and conname in (
--     'users_deletion_status_check',
--     'users_account_status_check'
--   );

-- ROLLBACK SQL (manual only; review before use):
--
-- drop index if exists public.idx_users_deleted_at;
-- drop index if exists public.idx_users_deletion_status_requested_at;
-- drop index if exists public.idx_users_account_status;
-- alter table public.users drop constraint if exists users_account_status_check;
-- alter table public.users drop constraint if exists users_deletion_status_check;
-- alter table public.users drop column if exists account_status;
-- alter table public.users drop column if exists deletion_status;
-- alter table public.users drop column if exists deletion_requested_at;
-- alter table public.users drop column if exists deleted_at;
