# LoadIQ Supabase Reconciliation Plan

Last updated: June 23, 2026

This plan documents the read-only live Supabase reconciliation audit and the
required forward path before the LoadIQ app/platform baseline can be treated as
deployable.

## Scope

This is a planning document only. It does not create migrations, apply SQL,
repair migration history, or mutate the live Supabase project.

Do not run blind `supabase db push`.

## Live Project Evidence

The read-only audit inspected live metadata through:

- `npx supabase migration list`
- `npx supabase db query --linked` with a catalog-only SQL query

No user/customer table data was queried.

## Remote Applied Migrations

The remote migration table currently records:

```text
20260611141000
20260611192122
20260611193403
20260611194259
20260611194739
20260616031812
```

These applied migrations mean the live project has the 2026 baseline, security
hardening passes, legacy public insert tightening, public-role grant
normalization, AI anonymous-access tightening, and the saved-load status repair.

## Missing Local Migrations

The current local migration directory contains these unapplied migrations:

```text
20260612041136_load_fuel_gauge_status_profile.sql
20260612051426_atlas_vehicle_usage_marketing_foundation.sql
20260621045851_align_launch_pricing_phase_prices.sql
20260621213322_app_portal_access_foundation.sql
```

The catalog audit confirmed that the missing migrations are not merely missing
from migration history. Their schema effects are also absent live in the areas
checked below.

## Live Schema Findings

Confirmed present:

- `saved_loads.load_status_reason`
- `launch_program_state`
- Website intake/status tables
- User operational tables from the 2026 baseline
- RLS enabled on all 75 inspected public base tables
- `active_system_health_notices` with `security_invoker=true`
- `public_notification_notices` with `security_invoker=true` and
  `security_barrier=true`

Confirmed absent:

- Portal tables: `profiles`, `portal_access`, `billing_accounts`,
  `fit_checks`, `legal_acceptances`
- Fuel gauge fields: `truck_profiles.fuel_tank_count`,
  `truck_profiles.fuel_tank_capacity_gallons`,
  `saved_loads.fuel_gauge_snapshot`
- Atlas/vehicle fields on `truck_profiles`, including `atlas_equipment_pack`,
  `equipment_type`, and `route_restriction_notes`
- `saved_loads.equipment_context_snapshot`
- AI add-on table: `ai_token_addons`
- AI add-on budget fields on `ai_budget_limits`, including
  `premium_addon_allowed`, `addon_token_block_size`,
  `addon_token_price_cents`, and `overage_surcharge_multiplier`

## RLS, Policy, And Grant Findings

RLS is enabled on all inspected live public base tables.

Authenticated user operational grants exist on tables such as `saved_loads`,
`truck_profiles`, `user_settings`, and related user-owned data tables. The
observed policies use ownership predicates based on `auth.uid()`.

Anonymous SELECT is limited to public/reference surfaces:

- `legal_documents`
- `public_notification_notices`
- `rollout_phases`
- `system_health_events`

Anonymous INSERT is allowed on public intake surfaces:

- `contact_inquiries`
- `newsletter_subscribers`
- `rollout_waitlist`
- `support_intake`
- `website_reservations`

Legacy public insert surfaces are closed:

- `waitlist` has no anonymous/authenticated table grant and its direct insert
  policy checks `false`.
- `demo_calculations` has no anonymous/authenticated table grant and its direct
  insert policy checks `false`.

## Public Intake Spam And Abuse Surface

The public intake tables remain intentional anonymous write surfaces. RLS limits
read exposure, but RLS does not solve spam, abuse, bot traffic, duplicate
submissions, or operational noise.

Before deployment, verify that public intake writes are protected by
server-side validation, rate limiting, duplicate handling, logging, and abuse
monitoring appropriate to the website/app boundary.

## Service-Role Findings

Existing live tables have broad `service_role` grants where expected for server
and admin paths.

Portal tables do not exist remotely. After the portal reconciliation schema is
created, verify service-role grants for:

- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`

Do not assume earlier broad grants cover tables created later.

## Pricing Mutation Risk

The local migration
`20260621045851_align_launch_pricing_phase_prices.sql` mutates
`launch_program_state` data. It updates public pricing/launch state and should
not be bundled into an additive schema reconciliation pass.

Keep pricing alignment separate and require product/legal approval before any
production replay.

## Deployment And Database Push Blockers

Supabase currently blocks deployment readiness for the app/platform baseline.

Blocked actions:

- Blind `supabase db push`
- Production deployment that assumes portal tables exist
- Production deployment that assumes fuel gauge fields exist
- Production deployment that assumes Atlas/vehicle/AI add-on schema exists
- Pricing state replay without product/legal approval

## Recommended Forward-Only Strategy

1. Create a new forward-only reconciliation migration for missing additive
   schema pieces:
   - fuel gauge profile fields
   - Atlas/vehicle fields
   - AI token add-on schema and budget fields
   - primitive portal tables
2. Keep `launch_program_state` pricing mutation out of that schema migration.
3. Create a separate pricing migration only after product/legal approval.
4. Review RLS, grants, and service-role expectations before applying either
   migration.
5. Verify public intake anti-abuse controls before deployment.
6. Run read-only migration list and catalog checks again after any approved
   migration.
7. Keep `supabase db push` blocked until the reviewed migration plan is
   accepted.

## Not In Scope For This Plan

- Creating the reconciliation migration
- Applying SQL to Supabase
- Repairing migration history
- Querying user/customer data
- Changing app code
- Changing billing behavior
- Changing launch pricing
