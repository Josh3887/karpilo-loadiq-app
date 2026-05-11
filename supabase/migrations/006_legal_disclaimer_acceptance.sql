-- Versioned first-launch legal disclaimer acknowledgement.
-- Run in Supabase SQL editor for cloud projects without local Docker.

alter table public.users
  add column if not exists disclaimer_accepted_at timestamptz,
  add column if not exists disclaimer_version text,
  add column if not exists disclaimer_last_updated text;
