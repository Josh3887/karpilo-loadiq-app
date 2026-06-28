# Auth And Permissions

This document defines high-level access concepts. It is not a replacement for Supabase RLS, server authorization, billing entitlement checks, or route guards.

## Access Concepts

### Public Visitor

Can view public legal, marketing, unavailable, request-access, and preview surfaces where available.

Must not access operational app data, admin diagnostics, billing internals, saved loads, or protected dashboard data.

### Unauthenticated User

Can reach login, registration/request-access redirects, password reset, and auth callback flows.

Must not access authenticated dashboard, portal account data, billing portal data, admin diagnostics, or protected APIs.

### Authenticated User

Can access user-owned app or portal surfaces allowed by auth, RLS, route guards, and entitlement checks.

Authentication alone is not enough for billing features, admin tools, or entitlement-gated capabilities.

### Subscriber

Can access capabilities allowed by active subscription state and product entitlements.

Subscription state must not be conflated with governance state or rollout phase.

### Admin/Internal Developer

Can access approved admin/internal surfaces only through explicit admin and elevated-access checks.

Admin routes, Sentry tooling, PostHog tooling, diagnostics, audit events, and internal billing test harnesses must not leak to normal users.

### Beta/Launch Access

Beta, pilot, launch, founder, and legacy launch states are adoption-control or testing states where applicable.

They must not be treated as commercial tiers unless a billing/tier audit explicitly defines that mapping.

## Required Rule

Every protected action needs the correct combination of route protection, server-side authorization, Supabase RLS where database rows are involved, and billing/entitlement checks where product capability is involved.
