# Provider Contract: Stripe API

## Provider Name
Stripe API.

## Karpilo Module Owner
Billing and entitlements.

## Purpose
Checkout, customer portal, subscriptions, webhook verification, and billing
state reconciliation.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://docs.stripe.com/api | verified 2026-06-28 |
| Endpoint documentation URL | https://docs.stripe.com/api/checkout/sessions/create, https://docs.stripe.com/api/customer_portal/sessions/create, https://docs.stripe.com/webhooks/signature | verified 2026-06-28 |
| Authentication documentation URL | https://docs.stripe.com/keys | verified 2026-06-28 |
| Rate limit/quota documentation URL | https://docs.stripe.com/rate-limits | verified 2026-06-28 |

## Required Environment Variables
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe price ID variables documented in `docs/operations/env-contracts.md`

## Forbidden Environment Usage
- `NEXT_PUBLIC_STRIPE_SECRET_KEY`
- Stripe secrets in client bundles, snapshots, Sentry, PostHog, or logs.

## Endpoints Used
- Checkout Session create.
- Customer Portal Session create.
- Webhook signature verification and subscription event handling.

## Normalized Internal Output
Stripe data must resolve into LoadIQ billing and entitlement state. Stripe state
must not directly replace product entitlement logic without billing-domain
translation.

## Required Mock Files
- `test-fixtures/api/payments/stripe/checkoutSession.success.json`
- `test-fixtures/api/payments/stripe/customerPortal.success.json`
- `test-fixtures/api/payments/stripe/webhook.subscription.updated.json`
- `test-fixtures/api/payments/stripe/errors/unauthorized-401.json`
- `test-fixtures/api/payments/stripe/errors/forbidden-403.json`
- `test-fixtures/api/payments/stripe/errors/not-found-404.json`
- `test-fixtures/api/payments/stripe/errors/rate-limited-429.json`
- `test-fixtures/api/payments/stripe/errors/server-error-500.json`
- `test-fixtures/api/payments/stripe/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint/object
not found, 408/timeout, 429 rate limited, 500+ provider unavailable, malformed
JSON, empty response, network failure, and invalid webhook signature.

## Drift Rules
- Webhook signature verification must not be bypassed.
- Billing provider behavior must stay separate from product entitlement and
  rollout/governance state.
- Price ID changes require explicit billing review.

## Last Verified Date
2026-06-28.

