do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'usage_events'
      and policyname = 'Users can view own usage events'
  ) then
    create policy "Users can view own usage events"
    on public.usage_events for select
    using (auth.uid() = user_id);
  end if;
end
$$;
