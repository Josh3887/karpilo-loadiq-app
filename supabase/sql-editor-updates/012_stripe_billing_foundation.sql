-- 012_stripe_billing_foundation.sql
-- Safe to rerun.
-- Purpose: Stripe Checkout/Billing Portal foundation and LoadIQ plan limits.

alter table public.subscriptions
  add column if not exists provider text not null default 'stripe',
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists plan_code text not null default 'free',
  add column if not exists tier text not null default 'free',
  add column if not exists status text not null default 'inactive',
  add column if not exists billing_interval text,
  add column if not exists trial_start timestamptz,
  add column if not exists trial_end timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists pilot_pricing_locked boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_subscriptions_provider_subscription_unique
on public.subscriptions (provider, provider_subscription_id)
where provider_subscription_id is not null;

create index if not exists idx_subscriptions_provider_customer
on public.subscriptions (provider, provider_customer_id)
where provider_customer_id is not null;

insert into public.usage_limits (
  tier,
  monthly_calculations,
  saved_loads,
  exports_allowed,
  advanced_analytics_allowed,
  comparisons_allowed,
  templates_allowed
)
values
  ('free', 10, 0, false, false, false, false),
  ('pro', null, null, true, true, true, true),
  ('founder', null, null, true, true, true, true),
  ('pilot', null, null, true, true, true, true)
on conflict (tier) do update set
  monthly_calculations = excluded.monthly_calculations,
  saved_loads = excluded.saved_loads,
  exports_allowed = excluded.exports_allowed,
  advanced_analytics_allowed = excluded.advanced_analytics_allowed,
  comparisons_allowed = excluded.comparisons_allowed,
  templates_allowed = excluded.templates_allowed;

grant select on public.usage_limits to authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on public.subscriptions to service_role;

-- Webhooks and server routes use SUPABASE_SERVICE_ROLE_KEY for subscription
-- mutations. Keep client-side subscription policies read-only.
