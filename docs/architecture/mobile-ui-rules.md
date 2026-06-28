# Mobile UI Rules

LoadIQ is mobile-first.

The app must remain usable on iPhone-sized screens. Mobile support is not a decorative afterthought.

## Required Rules

- Do not overload mobile pages.
- Prefer cards, accordions, tabs, segmented controls, and progressive disclosure for dense workflows.
- Keep primary actions reachable without excessive scrolling.
- Keep forms scannable and grouped by decision context.
- Avoid crowding charts, tables, and operational fields into layouts that only work on desktop.
- Do not hide required operational context behind unclear labels.
- Do not claim a UI works unless it was verified in a rendered app.

## Protected Mobile Workflows

These workflows must remain usable on iPhone-sized screens:

- Calculator
- Settings/profile
- Fit Check
- Expense Intelligence
- Vehicle Intelligence
- Billing
- Dashboard
- Saved loads
- Reports/history
- Support/legal surfaces

## Web Versus Capacitor/Mobile/iOS/Android Support

Web-only features must be clearly distinguished from Capacitor/mobile/iOS/Android-supported features.

Do not imply Apple App Store, Google Play, native iOS, native Android, push notification, background location, GPS, file upload, receipt scanning, or mobile sensor support unless the implementation has been verified and the support boundary is documented.
