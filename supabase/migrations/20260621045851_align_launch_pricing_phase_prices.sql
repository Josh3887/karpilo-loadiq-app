-- Align the live launch pricing authority with the website pricing architecture.
-- Source: karpilo-loadiq-website/docs/pilot-launch-pricing-architecture.md

update public.launch_program_state
set
  display_name = 'Standard Public Access',
  current_phase = 'standard_active',
  monthly_price = 24.99,
  annual_price = 189.99,
  pricing_lock_enabled = false,
  waitlist_only_mode = true,
  updated_at = now()
where program_key = 'standard_future';

insert into public.launch_program_state (
  program_key,
  display_name,
  current_phase,
  slot_limit,
  monthly_price,
  annual_price,
  reservation_enabled,
  billing_enabled,
  pricing_lock_enabled,
  waitlist_only_mode
)
select
  'standard_future',
  'Standard Public Access',
  'standard_active',
  2147483647,
  24.99,
  189.99,
  true,
  false,
  false,
  true
where not exists (
  select 1
  from public.launch_program_state
  where program_key = 'standard_future'
);
