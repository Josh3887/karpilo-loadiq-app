-- Karpilo LoadIQ RLS Policies

alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.saved_loads enable row level security;
alter table public.trip_history enable row level security;
alter table public.user_settings enable row level security;
alter table public.analytics_events enable row level security;

create policy "Users can view own profile"
on public.users for select
using (auth.uid() = id);

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
create policy "Users can update own saved loads"
v =v =v =v =v =v =v =v =v =v "Usersv =v =v =v =v =v =v =v =v =v "Usersv =v =v =v =v = fv =v =v =v =v =v =v =v =v =v "Usersv =v =v =v =v =v =v =v erv =v =v =v =v =v =v =v =v =v "Usersv =v =v =v =v =v =v =select
using (auth.uid() = user_id);

create policy "Users cacreate policy "Users cacreate policy "Users cacreate policrt
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

create policy "Users can insert own analytics events"
on public.analytics_events for insert
with check (auth.uid() = user_id or user_id is null);
