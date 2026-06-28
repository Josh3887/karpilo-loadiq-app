# Mobile Platform Boundaries

This document records mobile platform scope from repository evidence. It does not create mobile support, scaffold native projects, or approve public mobile claims.

## Repository Evidence

- `capacitor.config.ts` exists.
- `ios/` exists and includes iOS project files such as `ios/App/App.xcodeproj/project.pbxproj`, `ios/App/App/AppDelegate.swift`, and `ios/App/App/Info.plist`.
- `android/` does not exist in the repository evidence reviewed for this document.

## Web App Behavior

The web app is the primary LoadIQ application surface. Dashboard, calculator, settings/profile, Fit Check, billing, saved loads, reports, legal, support, and admin/internal routes are implemented through the Next.js app route tree.

Web app behavior must not assume native iOS or Android APIs unless a specific mobile bridge capability is implemented, documented, and verified.

## Mobile Browser Behavior

Mobile browser behavior means the web app running in Safari, Chrome, or another mobile browser.

The app should remain usable on iPhone-sized screens and other common mobile browser sizes. Mobile browser support does not automatically mean native app-store support, native push notifications, native background execution, native file APIs, GPS behavior, or store billing behavior.

## Capacitor Mobile Bridge Behavior

Capacitor is present as the mobile bridge layer. The bridge may package the web app into native shells where configured.

Do not assume a Capacitor plugin, native permission, app-store entitlement, push notification feature, geolocation behavior, background task, native billing, file upload, camera access, or sensor capability exists unless repository evidence shows the implementation and the behavior has been verified on the target platform.

Capacitor bridges the web build into native shells. It does not replace native store version metadata, App Store Connect records, Google Play Console records, or platform-specific build number rules.

## iOS-Supported Behavior

iOS project files are present. Document iOS as present or partially implemented until platform-specific support is verified.

Do not claim App Store readiness, iOS production support, native iOS feature coverage, Apple in-app purchase support, push notification support, background location support, camera support, document scanning, or native file handling unless those capabilities are separately implemented, documented, and verified.

iOS version metadata is present in `ios/App/App/Info.plist` through:

- `CFBundleShortVersionString`, populated from Xcode `MARKETING_VERSION`
- `CFBundleVersion`, populated from Xcode `CURRENT_PROJECT_VERSION`

The current Xcode project evidence stores `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` in `ios/App/App.xcodeproj/project.pbxproj`. Do not change those values outside an explicit release/version bump task.

## Android-Supported Behavior

Android is absent in the repository evidence reviewed for this document. There is no `android/` directory.

Document Android as absent, planned, or future unless a later branch intentionally scaffolds Android and verifies the resulting project. Do not create Android files during docs-only work.

When Android exists, Android user-visible versioning should map to `versionName`, and Android internal build numbering should map to `versionCode`. Until an Android project exists, Android version metadata is absent and must not be invented.

## Versioning Boundaries

Web app versioning is represented by the project/package version in `package.json`.

Mobile browser behavior follows the deployed web app and does not have native store metadata.

Capacitor mobile shell behavior may package web code into native shells, but native stores still require platform-specific version/build metadata.

Release/versioning policy belongs in `docs/operations/release-versioning.md`. Release execution should use `docs/operations/release-checklist.md`.

## Future Or Not-Yet-Supported Mobile Behavior

These capabilities are future or unsupported unless explicitly implemented and verified:

- Android native project support
- App Store or Play Store release readiness
- Native push notifications
- Native background tasks
- Native geolocation or GPS behavior
- Camera, receipt scanning, or document upload
- Native file system access
- Native Apple or Google billing
- Mobile sensor integrations
- Offline-first native persistence

Any future mobile platform change must update this document, `docs/api/README.md`, `docs/testing/regression-checklist.md`, and `CHANGELOG.md`.
