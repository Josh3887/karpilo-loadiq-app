# Karpilo LoadIQ Sentry Monitoring

Sentry is an internal developer monitoring tool for crashes, traces, release
health, and production regression detection. It is not a client-facing product
feature and must not replace PostHog product analytics, Supabase governance,
Stripe billing, Resend email routing, or admin diagnostics.

## Configuration

Required Vercel variables:

```text
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_ENVIRONMENT=
SENTRY_RELEASE=
```

`SENTRY_RELEASE` should be set by deployment automation when available. The app
also falls back to `VERCEL_GIT_COMMIT_SHA`.

Optional sampling controls:

```text
SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0
NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=0.25
```

Development uses trace sampling `1.0` by default. Production uses `0.1` by
default. Broad session replay is disabled by default.

## Privacy Rules

`src/lib/sentry-config.ts` defines the shared `beforeSend` scrubber. It filters:

- email
- cookies
- authorization headers
- pickup or delivery addresses
- gross or net revenue
- RPM
- fuel cost
- customer or load identifiers
- billing or payment-sensitive fields

Keep `sendDefaultPii` set to `false` in client, server, and edge config.

## Source Maps And Releases

`next.config.ts` wraps the app config with `withSentryConfig`, uploads source
maps when Sentry credentials are present, deletes generated source maps after
upload, and pins release names to `SENTRY_RELEASE` or `VERCEL_GIT_COMMIT_SHA`.

## Feature Tags

Route error boundaries and test captures add feature tags such as:

```text
feature:calculator
feature:billing
feature:auth
feature:maps
feature:settings
feature:fitcheck
feature:admin
```

## Development Test

Development-only route:

```text
/admin/sentry-test
```

The route requires elevated admin access and returns 404 outside development.

## Manual Sentry Alert Rules

Create alert rules in Sentry for:

- New issue in production
- Regression on resolved issue
- Error rate spike by release
- Slow transaction or high p95 latency on dashboard and billing routes
- Increased errors tagged `feature:calculator`, `feature:billing`, or `feature:admin`
