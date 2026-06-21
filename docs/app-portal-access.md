# LoadIQ App Portal Access

## Scope

`app.karpilo-liq.com` is the authenticated Karpilo LoadIQ app portal. The public website at `karpilo-liq.com` should route users here for login, access requests, billing status, settings, and Fit Check.

The primitive portal is intentionally limited. It does not expose the full calculator, reports, maps, AI insights, fleet tools, dispatch workflows, admin tooling, or developer observability surfaces.

## Routes

- `/` introduces the controlled app portal and routes to `/login`, `/request-access`, or `/portal`.
- `/login` is the canonical app login route.
- `/auth/login` redirects to `/login` for legacy compatibility.
- `/request-access` explains that public signup is not available.
- `/auth/register` redirects to `/request-access`.
- `/portal` is protected and shows access status, launch phase, plan interest, billing status, Fit Check status, and locked feature cards.
- `/portal/billing` is protected and shows billing status only. Public checkout stays unavailable.
- `/portal/settings` is protected and saves primitive profile, plan interest, and legal acknowledgement state.
- `/portal/fit-check` is protected and saves primitive Fit Check intake and recommendation snapshots.
- `/not-available` is the public unavailable-status page for blocked or unfinished surfaces.

## Access Model

Plans are entitlement keys only:

- `silver`
- `gold`
- `platinum`
- `pro`

Launch phases are adoption-control state only:

- `beta`
- `legacy_launch`
- `founding_operator_phase_1`
- `founding_operator_phase_2`
- `open_market`

The primitive portal access module lives in `src/lib/portal/access.ts`. It allows billing, settings, and Fit Check in the primitive portal and keeps calculator, reports, maps, AI insights, and fleet tools locked.

## Supabase Tables

Migration `supabase/migrations/20260621213322_app_portal_access_foundation.sql` adds the portal compatibility tables:

- `profiles`
- `portal_access`
- `billing_accounts`
- `fit_checks`
- `legal_acceptances`

The migration is additive. It enables RLS on each table and grants authenticated access only. User profile, portal access, Fit Check, and legal acknowledgement rows are own-row scoped. Billing accounts are read-only to authenticated users because subscription status should not be client-writable.

## Product Boundaries

Karpilo LoadIQ remains transportation profitability intelligence and decision support. The app must not present itself as a dispatch service, broker, carrier, ELD, tax advisor, legal advisor, compliance authority, insurance advisor, or guaranteed-profit system.

Sentry, PostHog, diagnostics, and developer tools are internal operational surfaces, not customer-facing product features.
