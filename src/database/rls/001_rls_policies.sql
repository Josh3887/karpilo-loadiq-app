-- Karpilo LoadIQ RLS policy reference.
-- Apply migrations in src/database/migrations for database changes.

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.saved_loads enable row level security;
alter table public.trip_history enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_overhead_items enable row level security;
alter table public.analytics_events enable row level security;
alter table public.usage_events enable row level security;
alter table public.pay_structure_templates enable row level security;
alter table public.lane_templates enable row level security;

create policy "Users can view own profile"
on public.users for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.users for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id);

create policy "Users can view own subscriptions"
on public.subscriptions for select
using (auth.uid() = user_id);

create policy "Users can view own saved loads"
on public.saved_loads for select
using (auth.uid() = user_id);

create policy "Users can insert own saved loads"
on public.saved_loads for insert
with check (auth.uid() = user_id);

create policy "Users can update own saved loads"
on public.saved_loads for update
using (auth.uid() = user_id);

create policy "Users can delete own saved loads"
on public.saved_loads for delete
using (auth.uid() = user_id);

create policy "Users can view own trip history"
on public.trip_history for select
using (auth.uid() = user_id);

create policy "Users can insert own trip history"
on public.trip_history for insert
with check (auth.uid() = user_id);

create policy "Users can view own settings"
on public.user_settings for select
using (auth.uid() = user_id);

create policy "Users can update own settings"
on public.user_settings for update
using (auth.uid() = user_id);

create policy "Users can insert own settings"
on public.user_settings for insert
with check (auth.uid() = user_id);

create policy "Users can manage own overhead items"
on public.user_overhead_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can insert own analytics events"
on public.analytics_events for insert
with check (auth.uid() = user_id or user_id is null);

create policy "Users can insert own usage events"
on public.usage_events for insert
with check (auth.uid() = user_id or user_id is null);

create policy "Users can view own usage events"
on public.usage_events for select
using (auth.uid() = user_id);

create policy "Users can manage own pay templates"
on public.pay_structure_templates for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own lane templates"
on public.lane_templates for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
