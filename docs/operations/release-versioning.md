# Release Versioning Governance

This document defines LoadIQ release/versioning policy. It does not bump versions, tag a release, run native builds, or claim public release readiness.

Actual version bumps must happen only in release-specific tasks.

## Versioning Surfaces

### Git Branches

Git branches are working lines of development. They organize task scope, review, and integration.

Branches are not release records and do not define public version numbers.

### Git Commits

Git commits are source-control history. They record exact repository changes.

Git is the source-control history for LoadIQ.

### Git Tags

Git tags may be used later to mark immutable release points such as `v0.5.0-beta` or `v1.0.0`.

Tags should point to reviewed release commits and should not be reused for different code.

### GitHub Releases

GitHub releases, if used later, are distribution and communication records tied to Git tags.

GitHub release notes should be derived from `CHANGELOG.md`, not invented separately.

### CHANGELOG.md

`CHANGELOG.md` is the human-readable change history.

It should record meaningful changes in factual language. It must not include secrets, private tokens, internal credentials, sensitive operational data, or marketing claims unsupported by repository evidence.

App Store Connect and Google Play Console release notes should be derived from `CHANGELOG.md`.

### package.json Version

`package.json` version is the web/project package version.

It is not automatically the iOS user-visible version, iOS build number, Android user-visible version, Android build number, Git tag, or app-store release record.

Do not change `package.json` version during general feature, documentation, API, billing, or UI work. Change it only in an explicit release/version bump task.

### Capacitor Mobile Bridge

Capacitor bridges web code into native shells.

Capacitor does not replace native store version metadata. A Capacitor sync or native build may move web assets into native projects, but iOS and Android still need platform-specific version/build metadata.

Do not run Capacitor sync/build commands unless a task explicitly requests them.

### iOS Version And Build Metadata

iOS user-visible version maps to `CFBundleShortVersionString`, usually controlled by Xcode `MARKETING_VERSION`.

iOS build number maps to `CFBundleVersion`, usually controlled by Xcode `CURRENT_PROJECT_VERSION`.

Repository evidence currently shows:

- `ios/App/App/Info.plist` uses `$(MARKETING_VERSION)` for `CFBundleShortVersionString`.
- `ios/App/App/Info.plist` uses `$(CURRENT_PROJECT_VERSION)` for `CFBundleVersion`.
- `ios/App/App.xcodeproj/project.pbxproj` contains `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`.

iOS build numbers must increase and should not be reused.

Do not modify iOS project files unless the task explicitly requests an iOS release/version bump or native-platform change.

### Android Version And Build Metadata

Android user-visible version maps to `versionName`.

Android internal build number maps to `versionCode`.

Android build numbers must increase and should not be reused.

Repository evidence currently shows no `android/` directory. Android is absent/planned/future, not implemented. Do not create Android scaffold or Android version metadata during docs-only work.

### App Store Connect Release Records

App Store Connect release records are Apple's distribution records for iOS releases.

They should reference the reviewed iOS version/build and use release notes derived from `CHANGELOG.md`.

Do not claim App Store readiness without platform-specific validation.

### Google Play Console Release Records

Google Play Console release records are Google's distribution records for Android releases.

They should reference the reviewed Android `versionName`/`versionCode` and use release notes derived from `CHANGELOG.md`.

Do not claim Play Console readiness while Android is absent or before platform-specific validation.

## Recommended Pre-Release Lifecycle

This lifecycle is a planning model, not a public claim:

- `0.1.0-alpha`: early internal foundation and governance alignment
- `0.2.0-alpha`: early app workflow stabilization
- `0.5.0-beta`: broader beta readiness after core workflows are validated
- `0.9.0-rc.1`: release-candidate validation before first stable release
- `1.0.0`: first stable public release after governance, product, billing, API, Supabase, security, and platform gates are satisfied

Do not publish, tag, announce, or imply these milestones until a release-specific task confirms the actual state.

## Release Bump Rule

A release/version bump task must explicitly state which surfaces change:

- `CHANGELOG.md`
- `package.json`
- Git tag
- GitHub release
- Capacitor sync/build outputs
- iOS `MARKETING_VERSION`
- iOS `CURRENT_PROJECT_VERSION`
- Android `versionName`
- Android `versionCode`
- App Store Connect record
- Google Play Console record

If a surface is not named, do not change it.
