# Rollback Plan

Use this plan before and after risky changes.

## Before Change

- Confirm branch with `git branch --show-current`.
- Confirm dirty state with `git status --short`.
- Identify touched surfaces: app logic, billing, Supabase, API providers, Capacitor/mobile/iOS/Android, analytics, AI, legal copy, or docs only.
- Record validation planned for the change.
- Do not run destructive external commands unless Joshua explicitly approved them.

## If A Docs Change Needs Rollback

- Revert or amend only the affected docs.
- Do not touch app code, migrations, provider config, or generated files.
- Re-run `git diff --check`.

## If A Code Change Needs Rollback

- Prefer a targeted revert of the specific commit or file.
- Do not use broad reset commands in a dirty worktree.
- Preserve unrelated user changes.
- Re-run the validation set that originally covered the change.

## External Systems

Supabase, Stripe, Vercel, Resend, Redis, Sentry, PostHog, OpenAI, Google, EIA, and mobile store changes require separate explicit approval and rollback notes.
