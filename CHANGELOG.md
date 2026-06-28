# Changelog

## 2026-06-27

### Added

- Added a Google-backed route intelligence foundation for address validation,
  mileage estimates, and drive-time estimates through server-side API routes.
- Added a disabled Trimble truck-routing provider scaffold for future
  truck-specific routing inputs without requiring Trimble keys or live calls.
- Added calculator route estimate UI that keeps paid loaded miles separate from
  Google estimated route miles and only copies an estimate into paid miles by
  explicit user action.
- Added Route Intelligence feature and API contract documentation for mileage
  terms, provider boundaries, API shapes, persistence, security, and future
  tracking/odometer concepts.
- Restored the newer authenticated app surface on top of the route-intelligence
  foundation, including dashboard routes, Fit Check, settings/profile sections,
  expense and vehicle intelligence surfaces, saved-load/report support,
  portal/account bridge pages, legal/support pages, admin/internal diagnostics,
  billing/entitlement scaffolding, Atlas/AI surfaces, weather/fuel support, and
  related product, architecture, and operations docs.

### Fixed

- Restored calculator revenue basis controls for RPM versus load gross,
  FSC-in-gross handling, linehaul derivation, EIA fuel context, and deterministic
  LoadIQ intelligence output while preserving route mileage separation.
- Reconciled package manifests for recovered runtime imports used by Sentry,
  Upstash Redis, OpenAI, Stripe, and server-only module guards.

### Notes

- `GOOGLE_MAPS_API_KEY` is required for live Google Address Validation and
  Routes API calls.
- No Supabase migrations, billing changes, or environment files were changed.
- No Supabase files, native iOS/Android files, public assets, or marketing
  assets were restored in this recovery pass.
