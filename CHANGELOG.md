# Changelog

## Unreleased

### Fixed

- Clarified Karpilo Atlas readout labels and AI boundaries so Karpilo Atlas
  keeps its AI/intelligence identity while deterministic LoadIQ outputs,
  provider context, and generated AI-assisted explanations are labeled
  accurately.
- Reordered the calculator workflow around EIA fuel baseline, deadhead, pickup,
  stops, delivery, load weight, financial inputs, and the operational
  disclaimer while enforcing 24-hour schedule times.
- Consolidated overlapping load-analysis panels into a single Karpilo Atlas
  Intelligence Readout while preserving detailed calculation and gated
  intelligence sections.
- Fixed calculator appointment-window time inputs to use valid 24-hour values
  and clarified open-ended windows as start/end date context.

### Documentation

- Added provider-aligned API contract documentation and governance for external
  integrations, including official documentation links, request/response
  boundaries, auth, privacy/security, error handling, cost controls, and
  drift-risk tracking.
- Added the Karpilo Atlas Intelligence Systems feature contract covering
  architecture, naming, tier gating, source libraries, user-owned intelligence,
  DAT/load-board exclusion, and the future single-readout doctrine.
- Added the first Karpilo Atlas Libraries source registry scaffold covering
  source authority, allowed/prohibited use, source-library categories,
  DAT/load-board exclusion, and industry association perspective
  classification.
- Added the first Karpilo Atlas Core entitlement and module-contract scaffold
  for tier-governed Core, Freight, Route, Education, and User-Owned
  Intelligence outputs.

## 2026-06-28

### Added

- Added calculator schedule/time planning inputs for deadhead origin, pickup,
  delivery, stop appointment windows, open-ended windows, 2.00-hour dwell
  defaults, user-editable planning hours/days, visible cargo weight, Google
  duration formatting, 0.25-hour planning suggestions, and 50 mph / 10-hour-day
  benchmark context through snapshot-backed fields.

### Documentation

- Added the Karpilo LoadIQ Calculator feature contract covering required
  revenue, mileage, date/time/window, load-weight, Route Intelligence duration,
  50 mph planning benchmark, 10-hour planning-day, dwell default, and user
  override rules.
- Updated the data propagation map to record the calculator time/window/load
  weight contract and its snapshot-backed implementation boundary.
- Updated calculator, Route Intelligence, and data propagation documentation to
  reflect the snapshot-backed time/window/load-weight implementation and the
  remaining first-class schema boundary.

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

- Made base Route Intelligence an all-tier authenticated app capability for
  address validation, Google estimated deadhead miles, Google estimated loaded
  miles, total Google route estimates, P/U and DEL stops, and paid-vs-estimated
  mileage variance while preserving separate saved-load, report/export,
  weather, Atlas/AI, and future truck-specific routing gates.
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
- Wired recovered calculator result intelligence surfaces so ResultsPanel now
  renders the existing Atlas freight intelligence surface and entitlement-gated
  weather profitability risk panel, with disabled/unavailable states and no fuel
  gauge, load weight, provider expansion, or static asset changes.
- Reconciled package manifests for recovered runtime imports used by Sentry,
  Upstash Redis, OpenAI, Stripe, and server-only module guards.

### Notes

- `GOOGLE_MAPS_API_KEY` is required for live Google Address Validation and
  Routes API calls.
- No Supabase migrations, billing changes, or environment files were changed.
- No Supabase files, native iOS/Android files, public assets, or marketing
  assets were restored in this recovery pass.
