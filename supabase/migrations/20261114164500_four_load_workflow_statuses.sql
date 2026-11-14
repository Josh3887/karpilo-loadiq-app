-- Four-state user-facing load lifecycle; retain legacy values for existing records until reviewed backfill.
-- No destructive data conversion. Historical source statuses remain readable.
alter table if exists public.saved_loads
  drop constraint if exists saved_loads_load_run_status_check,
  drop constraint if exists saved_loads_was_run_status_check,
  add constraint saved_loads_load_run_status_check check (load_run_status is null or load_run_status in ('planned','running','completed','rejected','booked','dispatched','pulled','ran','test')),
  add constraint saved_loads_was_run_status_check check (was_run_status is null or was_run_status in ('planned','running','completed','rejected','booked','dispatched','pulled','ran','test'));
