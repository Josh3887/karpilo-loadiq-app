-- Align saved-load lifecycle constraints with the app's active-load states.
-- This affects load history only; it does not touch Stripe, subscriptions, or
-- entitlement records.

alter table if exists public.saved_loads
  add column if not exists load_status_reason text,
  drop constraint if exists saved_loads_load_run_status_check,
  drop constraint if exists saved_loads_was_run_status_check,
  add constraint saved_loads_load_run_status_check
    check (
      load_run_status is null
      or load_run_status in (
        'planned',
        'booked',
        'dispatched',
        'running',
        'rejected',
        'pulled',
        'ran',
        'test'
      )
    ),
  add constraint saved_loads_was_run_status_check
    check (
      was_run_status is null
      or was_run_status in (
        'planned',
        'booked',
        'dispatched',
        'running',
        'rejected',
        'pulled',
        'ran',
        'test'
      )
    );
