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

### Notes

- `GOOGLE_MAPS_API_KEY` is required for live Google Address Validation and
  Routes API calls.
- No Supabase migrations, billing changes, or environment files were changed.
