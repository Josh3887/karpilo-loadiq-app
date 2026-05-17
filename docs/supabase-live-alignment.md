# Supabase Live Alignment

Last verified: May 17, 2026

Project: `karpilo-loadiq`

This note records the current live Supabase alignment state for Karpilo LoadIQ.
It exists to prevent future schema work from relying only on local migration
history, because several production schema updates were applied manually through
Supabase SQL Editor.

## Current Status

The live Supabase schema was audited through the authenticated local Supabase
CLI from the APP repository.

Live schema is aligned for the recent app and website work:

- Account deletion request support is present.
- Subscription entitlement, trial, lifetime, and feature-access fields are present.
- Route intelligence tables and saved-load route fields are present.
- Vehicle intelligence fields are present.
- Internal billing test account support is present.
- Saved-load identity fields are present.
- Website intake, reservation, newsletter, email, rollout, and status tables are present.

## Migration History Caveat

Remote Supabase migration history currently records only:

```text
001
002
003
```

Local migration files and SQL editor update files after `003` should not be
blindly pushed or replayed. Much of their schema is already present live because
it was applied manually through SQL Editor.

Do not run:

```bash
supabase db push
```

until migration history has been intentionally reconciled.

## Product Boundaries

The APP remains the operational product owner.

APP-owned or APP-authoritative areas include:

- Authenticated dashboard
- Users and profiles
- Subscriptions and entitlements
- Billing portal and webhook reconciliation
- Saved loads and saved load stops
- Calculator history and reports
- User settings
- Truck profiles
- Account deletion requests
- Internal billing test harness
- Atlas runtime behavior

The WEBSITE remains a marketing, legal, support, and intake surface.

WEBSITE-owned or WEBSITE-facing areas include:

- Website reservations
- Reservation events
- Support intake
- Contact inquiries
- Newsletter subscribers
- Waitlist and rollout waitlist
- Email outbox and delivery events
- Public rollout phase/status reads
- Public system health status reads

The WEBSITE must not become the APP and should not expose operational user data
such as saved loads, calculator history, user settings, truck profiles, or
billing internals.

## Verified Live Schema Areas

The read-only audit confirmed these key items live:

- `public.account_deletion_requests`
- `public.users.deleted_at`
- `public.users.deletion_requested_at`
- `public.users.deletion_status`
- `public.users.account_status`
- `public.saved_load_stops`
- `public.saved_loads.load_id`
- `public.saved_loads.trip_number`
- `public.saved_load_id_seq`
- `public.assign_saved_load_identity()`
- `assign_saved_load_identity_before_insert`
- `public.internal_billing_test_accounts`
- subscription entitlement and feature-access fields
- route intelligence saved-load fields
- reserve allocation fields
- vehicle intelligence fields
- website intake/status tables with RLS enabled

Saved-load identity data checks showed:

- Missing `load_id`: `0`
- Missing `trip_number`: `0`

## Supabase Advisor Backlog

The Supabase advisors reported non-blocking cleanup items:

- `public.public_notification_notices` is a security-definer view.
- `public.rls_auto_enable()` is executable by `anon` and `authenticated`.
- `public.get_operator_program_counts()` is executable by authenticated users.
- `account_deletion_requests` has broader authenticated table privileges than ideal, though RLS limits visible rows.
- Some duplicate RLS policies exist from manual schema evolution.
- Some duplicate indexes exist from manual schema evolution.
- Supabase Auth leaked password protection is disabled.

These should be handled in a dedicated hardening pass, not casually mixed into
feature work.

## Safe Future Workflow

For future schema work:

1. Start from the APP repo.
2. Use the authenticated local Supabase CLI for read-only live audits.
3. Compare actual live tables, columns, policies, grants, functions, and triggers.
4. Do not rely only on `supabase_migrations.schema_migrations`.
5. Prefer additive SQL.
6. Do not run broad migration replay commands.
7. Keep APP and WEBSITE ownership boundaries explicit.
8. Commit schema notes or migrations in the APP repo only.

Use SQL Editor or CLI execution only after the exact SQL has been reviewed.
