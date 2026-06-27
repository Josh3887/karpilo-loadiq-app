-- Normalize public-role table/view privileges after the new-account baseline.
--
-- RLS is the row-level authority, but table grants should still express the
-- intended Data API surface. This removes broad inherited/default privileges
-- such as TRUNCATE, TRIGGER, and REFERENCES from anon/authenticated, then
-- restores only SELECT/INSERT/UPDATE/DELETE permissions backed by current RLS
-- policies. SECURITY INVOKER views get explicit SELECT grants.

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all tables in schema public from authenticated;

grant usage on schema public to anon, authenticated;

do $$
declare
  policy_record record;
  grant_privileges text;
begin
  for policy_record in
    select
      tablename,
      roles,
      cmd,
      qual,
      with_check
    from pg_policies
    where schemaname = 'public'
      and tablename <> 'notification_publications'
  loop
    if policy_record.cmd = 'SELECT' and policy_record.qual = 'false' then
      continue;
    end if;

    if policy_record.cmd = 'INSERT' and policy_record.with_check = 'false' then
      continue;
    end if;

    if policy_record.cmd in ('UPDATE', 'ALL') and (
      policy_record.qual = 'false'
      or policy_record.with_check = 'false'
    ) then
      continue;
    end if;

    grant_privileges := case policy_record.cmd
      when 'ALL' then 'select, insert, update, delete'
      when 'SELECT' then 'select'
      when 'INSERT' then 'insert'
      when 'UPDATE' then 'update'
      when 'DELETE' then 'delete'
      else null
    end;

    if grant_privileges is null then
      continue;
    end if;

    if policy_record.roles::text like '%anon%'
      or policy_record.roles::text like '%public%'
    then
      execute format(
        'grant %s on table public.%I to anon',
        grant_privileges,
        policy_record.tablename
      );
    end if;

    if policy_record.roles::text like '%authenticated%'
      or policy_record.roles::text like '%public%'
    then
      execute format(
        'grant %s on table public.%I to authenticated',
        grant_privileges,
        policy_record.tablename
      );
    end if;
  end loop;
end $$;

grant select (
  id,
  title,
  channel,
  severity,
  rendered_subject,
  rendered_body_text,
  cta_label,
  cta_href,
  starts_at,
  ends_at,
  published_at,
  public_metadata,
  public_visible,
  status
) on public.notification_publications to anon, authenticated;

grant select on public.public_notification_notices to anon, authenticated;
grant select on public.active_system_health_notices to authenticated;
