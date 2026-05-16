-- Harden public_notification_notices grants.
--
-- public.public_notification_notices is a public-facing view over
-- notification_publications. Because the underlying publication table is the
-- server-controlled write path, anon/authenticated clients should only be able
-- to read the view.
--
-- Write access must remain server-side through public.notification_publications
-- and the approved admin/control-plane workflow.

revoke all on public.public_notification_notices from anon;
revoke all on public.public_notification_notices from authenticated;

grant select on public.public_notification_notices to anon;
grant select on public.public_notification_notices to authenticated;
