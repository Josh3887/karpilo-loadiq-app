-- Harden post-baseline public API exposure for the new LoadIQ Supabase project.
--
-- Scope:
-- - Keep the public notification notice view usable without SECURITY DEFINER
--   behavior.
-- - Remove default PUBLIC/anon execution from privileged helper RPCs.
-- - Pin helper function search paths so they do not inherit caller search_path.

create or replace view public.public_notification_notices
with (security_invoker = true, security_barrier = true)
as
select
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
  public_metadata
from public.notification_publications
where public_visible = true
  and status = 'published'
  and channel in ('web', 'outage_banner', 'release_notice', 'fix_notice', 'bug_notice')
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now());

drop policy if exists "Public can read published notification notices"
on public.notification_publications;

create policy "Public can read published notification notices"
on public.notification_publications
for select
to anon, authenticated
using (
  public_visible = true
  and status = 'published'
  and channel in ('web', 'outage_banner', 'release_notice', 'fix_notice', 'bug_notice')
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

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

revoke execute on function public.get_operator_program_counts() from public;
revoke execute on function public.get_operator_program_counts() from anon;
revoke execute on function public.get_operator_program_counts() from authenticated;
grant execute on function public.get_operator_program_counts() to service_role;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public;
    revoke execute on function public.rls_auto_enable() from anon;
    revoke execute on function public.rls_auto_enable() from authenticated;
    grant execute on function public.rls_auto_enable() to service_role;
  end if;
end $$;

alter function public.set_updated_at()
set search_path = public, pg_temp;

alter function public.prevent_operator_pricing_lock_mutation()
set search_path = public, pg_temp;
