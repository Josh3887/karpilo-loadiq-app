-- Tighten AI governance table grants and remove a duplicate subscription index.
--
-- The AI user-facing policies were originally created for the PostgreSQL
-- pseudo-role public while relying on auth.uid() to deny anonymous callers.
-- Make the role boundary explicit so anon has no table grants on these user
-- ledgers. Keep service-role/server paths unchanged.

drop policy if exists "Users can view own AI usage events"
on public.ai_usage_events;

create policy "Users can view own AI usage events"
on public.ai_usage_events
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view own AI output reports"
on public.ai_output_reports;

create policy "Users can view own AI output reports"
on public.ai_output_reports
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI output reports"
on public.ai_output_reports;

create policy "Users can insert own AI output reports"
on public.ai_output_reports
for insert
to authenticated
with check (auth.uid() = user_id);

revoke all privileges on public.ai_usage_events from anon;
revoke all privileges on public.ai_output_reports from anon;

grant select on public.ai_usage_events to authenticated;
grant select, insert on public.ai_output_reports to authenticated;

drop index if exists public.idx_subscriptions_user_status;
