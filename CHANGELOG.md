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
- Added Route Intelligence support for deadhead origin, previous-delivery
  deadhead suggestions, ordered intermediate stops, Google estimated deadhead
  miles, Google estimated loaded miles, total Google estimated route miles, and
  route leg details while preserving paid loaded miles as user-entered.
- Added running-load odometer validation fields and saved-load actuals support
  for diesel fuel and DEF purchase entries through existing snapshot
  structures, without adding Supabase migrations or fuel gauge recovery work.
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

- Corrected Route Intelligence stop handling so optional stops are freight-only
  P/U or DEL stops, with stop labels and fuel/DEF stop types removed from the
  calculator/API workflow.
- Moved end odometer, accessorials, tolls, and lumpers out of calculator
  planning inputs and into the saved-load/load-actuals workflow while keeping
  running-load origin odometer capture.
- Formatted EIA fuel price entry/display to a two-decimal fuel-price value and
  kept paid loaded miles separate from Google estimated route miles.
- Added server-only owner/admin build access through `LOADIQ_OWNER_EMAILS`
  without removing normal subscription and entitlement gates for regular users.
- Centralized the owner/admin build-access override across billing, report,
  admin, internal harness, AI/Atlas, and route-intelligence gate paths while
  keeping normal subscription gates intact for regular users.
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
