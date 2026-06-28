# Release Checklist

Use this checklist for release/versioning tasks. It does not authorize version bumps or native builds by itself.

## Scope And Git

- Confirm branch with `git branch --show-current`.
- Confirm status with `git status --short --untracked-files=all`.
- Confirm the branch is the intended release or release-prep branch.
- Confirm the worktree is clean before starting release execution.
- Review rollback and tag strategy before changing version metadata.

## Changelog

- Confirm `CHANGELOG.md` is updated.
- Confirm entries are factual and tied to repository changes.
- Confirm entries do not include secrets, private tokens, internal credentials, sensitive operational data, or unsupported marketing claims.
- Confirm release notes for App Store Connect or Google Play Console are derived from `CHANGELOG.md`.

## Web/Project Version

- Review `package.json` version.
- Change `package.json` version only when the task explicitly requests a web/project version bump.
- Confirm package version semantics match the intended release lifecycle.

## Capacitor

- Document any required Capacitor sync/build steps.
- Do not run Capacitor sync/build steps unless explicitly requested.
- Confirm generated or native output files are reviewed before commit if a release task intentionally runs Capacitor commands.

## iOS

- Review iOS version/build only when an iOS release is involved.
- Confirm `CFBundleShortVersionString` / Xcode `MARKETING_VERSION`.
- Confirm `CFBundleVersion` / Xcode `CURRENT_PROJECT_VERSION`.
- Confirm iOS build number increases and is not reused.
- Do not modify iOS project files unless explicitly requested for the release.

## Android

- Review Android version/build only when Android exists and an Android release is involved.
- Confirm `versionName`.
- Confirm `versionCode`.
- Confirm Android build number increases and is not reused.
- Do not create Android scaffold unless explicitly requested.

## Validation

- Run `git diff --check`.
- Run lint, typecheck, and build when appropriate for the release scope.
- Run platform-specific validation before claiming App Store or Play Console readiness.
- Do not claim validation passed unless it was executed.

## Store Records

- Prepare App Store Connect notes from `CHANGELOG.md` when iOS release is involved.
- Prepare Google Play Console notes from `CHANGELOG.md` when Android release is involved.
- Confirm store notes do not invent capabilities, pricing, compliance status, provider support, or platform support.

## Final Review

- Confirm no unrelated files are staged.
- Confirm generated artifacts are either intentionally committed or explicitly excluded.
- Confirm tag strategy before creating Git tags.
- Confirm rollback notes are documented.
