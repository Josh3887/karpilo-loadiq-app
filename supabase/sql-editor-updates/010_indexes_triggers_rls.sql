-- 010_indexes_triggers_rls.sql
-- Safe to rerun.
-- Purpose: indexes, updated_at triggers, grants, RLS enablement, and non-duplicating RLS policies.

create index if not exists idx_operator_profiles_user on public.operator_profiles (user_id);
create index if not exists idx_user_settings_user on public.user_settings (user_id);
create index if not exists idx_truck_profiles_user on public.truck_profiles (user_id);
create index if not exists idx_pay_templates_user_created on public.pay_structure_templates (user_id, created_at desc);
create index if not exists idx_user_overhead_items_user_active on public.user_overhead_items (user_id, is_active);
create index if not exists idx_overhead_categories_user on public.overhead_categories (user_id, created_at desc);
create index if not exists idx_saved_loads_user_created on public.saved_loads (user_id, created_at desc);
create index if not exists idx_saved_loads_user_loadiq_number on public.saved_loads (user_id, loadiq_load_number);
create index if not exists idx_saved_loads_user_run_status on public.saved_loads (user_id, load_run_status, created_at desc);
create index if not exists idx_saved_loads_user_calculated on public.saved_loads (user_id, calculated_at desc);
create index if not exists idx_calculation_overrides_load on public.calculation_overrides (saved_load_id, created_at desc);
create index if not exists idx_load_estimates_user_created on public.load_estimates (user_id, created_at desc);
create index if not exists idx_post_trip_actuals_load on public.post_trip_actuals (saved_load_id, created_at desc);
create index if not exists idx_accessorial_items_load on public.accessorial_items (saved_load_id, created_at desc);
create index if not exists idx_lane_templates_user_created on public.lane_templates (user_id, created_at desc);
create index if not exists idx_fuel_price_cache_provider_updated on public.fuel_price_cache (provider, updated_at desc);
create index if not exists idx_demo_calculations_session_created on public.demo_calculations (anonymous_session_id, created_at desc);
create index if not exists idx_legal_documents_type_active on public.legal_documents (document_type, is_active);
create index if not exists idx_user_legal_ack_user_created on public.user_legal_acknowledgments (user_id, created_at desc);
create index if not exists idx_disclaimer_acceptances_user_created on public.disclaimer_acceptances (user_id, created_at desc);
create index if not exists idx_subscriptions_user_status on public.subscriptions (user_id, status, created_at desc);
create index if not exists idx_subscriptions_provider_subscription on public.subscriptions (provider, provider_subscription_id);
create index if not exists idx_usage_events_user_event_created on public.usage_events (user_id, event_name, created_at desc);
create index if not exists idx_promo_codes_code_active on public.promo_codes (code, is_active);
create index if not exists idx_founder_pricing_access_active on public.founder_pricing_access (is_active, redeemed_at);
create index if not exists idx_pilot_access_active on public.pilot_access (is_active, seat_number);
create index if not exists idx_feedback_user_created on public.feedback (user_id, created_at desc);
create index if not exists idx_review_prompt_tracking_user on public.review_prompt_tracking (user_id);
create index if not exists idx_support_tickets_user_created on public.support_tickets (user_id, created_at desc);
create index if not exists idx_onboarding_states_user_complete on public.onboarding_states (user_id, is_complete);
create index if not exists idx_entity_notes_user_entity on public.entity_notes (user_id, entity_type, created_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_users_updated_at') then
    create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_operator_profiles_updated_at') then
    create trigger set_operator_profiles_updated_at before update on public.operator_profiles for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_user_settings_updated_at') then
    create trigger set_user_settings_updated_at before update on public.user_settings for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_truck_profiles_updated_at') then
    create trigger set_truck_profiles_updated_at before update on public.truck_profiles for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_saved_loads_updated_at') then
    create trigger set_saved_loads_updated_at before update on public.saved_loads for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_fuel_price_cache_updated_at') then
    create trigger set_fuel_price_cache_updated_at before update on public.fuel_price_cache for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_subscriptions_updated_at') then
    create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.users enable row level security;
alter table public.operator_profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.truck_profiles enable row level security;
alter table public.pay_structure_templates enable row level security;
alter table public.user_overhead_items enable row level security;
alter table public.overhead_categories enable row level security;
alter table public.saved_loads enable row level security;
alter table public.calculation_overrides enable row level security;
alter table public.load_estimates enable row level security;
alter table public.post_trip_actuals enable row level security;
alter table public.accessorial_items enable row level security;
alter table public.lane_templates enable row level security;
alter table public.trip_history enable row level security;
alter table public.fuel_price_cache enable row level security;
alter table public.demo_calculations enable row level security;
alter table public.legal_documents enable row level security;
alter table public.user_legal_acknowledgments enable row level security;
alter table public.disclaimer_acceptances enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_limits enable row level security;
alter table public.usage_events enable row level security;
alter table public.founder_pricing_access enable row level security;
alter table public.promo_codes enable row level security;
alter table public.pilot_access enable row level security;
alter table public.feedback enable row level security;
alter table public.review_prompt_tracking enable row level security;
alter table public.support_tickets enable row level security;
alter table public.onboarding_states enable row level security;
alter table public.entity_notes enable row level security;
alter table public.analytics_events enable row level security;

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on
  public.users,
  public.operator_profiles,
  public.user_settings,
  public.truck_profiles,
  public.pay_structure_templates,
  public.user_overhead_items,
  public.overhead_categories,
  public.saved_loads,
  public.calculation_overrides,
  public.load_estimates,
  public.post_trip_actuals,
  public.accessorial_items,
  public.lane_templates,
  public.trip_history,
  public.user_legal_acknowledgments,
  public.disclaimer_acceptances,
  public.usage_events,
  public.feedback,
  public.review_prompt_tracking,
  public.support_tickets,
  public.onboarding_states,
  public.entity_notes,
  public.analytics_events
to authenticated;

grant select on
  public.subscriptions,
  public.fuel_price_cache,
  public.legal_documents,
  public.usage_limits,
  public.founder_pricing_access,
  public.promo_codes,
  public.pilot_access
to authenticated;

grant insert on public.demo_calculations to anon, authenticated;
grant select on public.legal_documents to anon;
grant select, insert, update, delete on all tables in schema public to service_role;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'Users can manage own profile') then
    create policy "Users can manage own profile" on public.users for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'operator_profiles' and policyname = 'Users can manage own operator profile') then
    create policy "Users can manage own operator profile" on public.operator_profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_settings' and policyname = 'Users can manage own settings') then
    create policy "Users can manage own settings" on public.user_settings for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'truck_profiles' and policyname = 'Users can manage own truck profile') then
    create policy "Users can manage own truck profile" on public.truck_profiles for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pay_structure_templates' and policyname = 'Users can manage own pay templates') then
    create policy "Users can manage own pay templates" on public.pay_structure_templates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_overhead_items' and policyname = 'Users can manage own overhead items') then
    create policy "Users can manage own overhead items" on public.user_overhead_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'overhead_categories' and policyname = 'Users can manage own overhead categories') then
    create policy "Users can manage own overhead categories" on public.overhead_categories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'saved_loads' and policyname = 'Users can manage own saved loads') then
    create policy "Users can manage own saved loads" on public.saved_loads for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'calculation_overrides' and policyname = 'Users can manage own calculation overrides') then
    create policy "Users can manage own calculation overrides" on public.calculation_overrides for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'load_estimates' and policyname = 'Users can manage own load estimates') then
    create policy "Users can manage own load estimates" on public.load_estimates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'post_trip_actuals' and policyname = 'Users can manage own post trip actuals') then
    create policy "Users can manage own post trip actuals" on public.post_trip_actuals for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'accessorial_items' and policyname = 'Users can manage own accessorial items') then
    create policy "Users can manage own accessorial items" on public.accessorial_items for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lane_templates' and policyname = 'Users can manage own lane templates') then
    create policy "Users can manage own lane templates" on public.lane_templates for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'trip_history' and policyname = 'Users can manage own trip history') then
    create policy "Users can manage own trip history" on public.trip_history for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_legal_acknowledgments' and policyname = 'Users can manage own legal acknowledgments') then
    create policy "Users can manage own legal acknowledgments" on public.user_legal_acknowledgments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'disclaimer_acceptances' and policyname = 'Users can manage own disclaimer acceptances') then
    create policy "Users can manage own disclaimer acceptances" on public.disclaimer_acceptances for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'subscriptions' and policyname = 'Users can view own subscriptions') then
    create policy "Users can view own subscriptions" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usage_events' and policyname = 'Users can manage own usage events') then
    create policy "Users can manage own usage events" on public.usage_events for all to authenticated using ((select auth.uid()) = user_id or user_id is null) with check ((select auth.uid()) = user_id or user_id is null);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'feedback' and policyname = 'Users can manage own feedback') then
    create policy "Users can manage own feedback" on public.feedback for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'review_prompt_tracking' and policyname = 'Users can manage own review prompt tracking') then
    create policy "Users can manage own review prompt tracking" on public.review_prompt_tracking for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'support_tickets' and policyname = 'Users can manage own support tickets') then
    create policy "Users can manage own support tickets" on public.support_tickets for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'onboarding_states' and policyname = 'Users can manage own onboarding state') then
    create policy "Users can manage own onboarding state" on public.onboarding_states for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'entity_notes' and policyname = 'Users can manage own entity notes') then
    create policy "Users can manage own entity notes" on public.entity_notes for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'fuel_price_cache' and policyname = 'Authenticated users can view fuel cache') then
    create policy "Authenticated users can view fuel cache" on public.fuel_price_cache for select to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'demo_calculations' and policyname = 'Anyone can insert demo calculations') then
    create policy "Anyone can insert demo calculations" on public.demo_calculations for insert to anon, authenticated with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'legal_documents' and policyname = 'Anyone can view active legal documents') then
    create policy "Anyone can view active legal documents" on public.legal_documents for select to anon, authenticated using (is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'usage_limits' and policyname = 'Authenticated users can view usage limits') then
    create policy "Authenticated users can view usage limits" on public.usage_limits for select to authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'promo_codes' and policyname = 'Authenticated users can view active promo codes') then
    create policy "Authenticated users can view active promo codes" on public.promo_codes for select to authenticated using (is_active = true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'founder_pricing_access' and policyname = 'Users can view own founder access') then
    create policy "Users can view own founder access" on public.founder_pricing_access for select to authenticated using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'pilot_access' and policyname = 'Users can view own pilot access') then
    create policy "Users can view own pilot access" on public.pilot_access for select to authenticated using ((select auth.uid()) = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_events' and policyname = 'Users can insert own analytics events') then
    create policy "Users can insert own analytics events" on public.analytics_events for insert to authenticated with check ((select auth.uid()) = user_id or user_id is null);
  end if;
end
$$;
