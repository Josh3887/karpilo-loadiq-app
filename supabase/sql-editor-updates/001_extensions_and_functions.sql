-- 001_extensions_and_functions.sql
-- Safe to rerun.
-- Purpose: extensions and shared updated_at trigger function.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
