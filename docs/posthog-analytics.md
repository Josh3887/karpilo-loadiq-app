# Karpilo LoadIQ PostHog Analytics

PostHog is used as an internal developer/operator analytics tool for launch
testing. It is not a customer-facing LoadIQ feature, marketing claim, billing
system, entitlement system, support system, calculator system, or AI governance
system.

## Admin Route

The internal status page lives at:

```text
/admin/posthog
```

Access is restricted to `admin`, `developer`, and `owner` roles and still uses
the existing elevated admin session guard.

## Environment Variables

Client-side tracking is disabled unless this is enabled:

```text
NEXT_PUBLIC_POSTHOG_ENABLED=true
```

Server-side capture requires a project token:

```text
POSTHOG_ENABLED=true
POSTHOG_PROJECT_TOKEN=...
POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_DASHBOARD_URL=https://...
```

`POSTHOG_DASHBOARD_URL` is optional and only powers the admin status link.

## Approved Events

The approved event names are centralized in `src/lib/analytics.ts`:

```text
app_loaded
user_signed_in
user_signed_out
settings_viewed
billing_viewed
fit_check_started
fit_check_completed
calculator_started
calculation_completed
calculation_saved
feature_gate_viewed
upgrade_clicked
checkout_started
checkout_completed
admin_accessed
admin_developer_tools_viewed
posthog_status_viewed
ai_scaffold_viewed
maps_scaffold_viewed
mileage_scaffold_viewed
scaffold_cta_clicked
```

## Approved Properties

Only these property keys should be sent:

```text
plan_tier
launch_phase
account_role
device_type
route
feature_key
scaffold_key
scaffold_status
gross_revenue_bucket
deadhead_bucket
mileage_bucket
app_version
environment
```

Use bucket helpers instead of exact values:

```ts
bucketGrossRevenue(value)
bucketDeadheadMiles(value)
bucketMileage(value)
```

## Prohibited Data

Do not send:

- Raw addresses
- Exact coordinates
- Exact revenue values
- Exact truck or business financials
- ELD or compliance records
- Tax data
- Bank data
- Insurance data
- Full AI prompts
- Private notes
- Personally sensitive operational details

## Verification

1. Set `NEXT_PUBLIC_POSTHOG_ENABLED=true`.
2. Set `POSTHOG_ENABLED=true` and `POSTHOG_PROJECT_TOKEN`.
3. Start the app.
4. Visit `/admin/posthog` as an elevated admin/developer/owner.
5. Navigate through login, settings, billing, Fit Check, dashboard calculator,
   locked portal feature cards, and checkout success return state.
6. Confirm events appear in the configured PostHog project.

The app routes events through `/api/analytics/events`; client components should
not import or call PostHog directly.
