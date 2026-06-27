-- Close legacy anonymous insert surfaces that are not part of the active
-- app/website contract.
--
-- Website waitlist submissions currently go through server-side service-role
-- routes/RPCs. demo_calculations is retained as an additive roadmap table, but
-- no active code writes it directly. Keep both tables non-readable and
-- non-writable from public clients until an explicit public capture flow is
-- designed.

drop policy if exists "Anyone can insert demo calculations"
on public.demo_calculations;

drop policy if exists "No direct public demo calculation writes"
on public.demo_calculations;

create policy "No direct public demo calculation writes"
on public.demo_calculations
for insert
to anon, authenticated
with check (false);

revoke insert on public.demo_calculations from anon, authenticated;

drop policy if exists "Public can submit legacy waitlist"
on public.waitlist;

drop policy if exists "No direct public legacy waitlist writes"
on public.waitlist;

create policy "No direct public legacy waitlist writes"
on public.waitlist
for insert
to anon, authenticated
with check (false);

revoke insert on public.waitlist from anon, authenticated;
