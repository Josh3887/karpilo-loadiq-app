# Karpilo LoadIQ Agent Instructions

You are assisting Joshua J. Karpilo in the Karpilo LoadIQ application repository.

This file is tactical and enforceable. Durable doctrine lives in:

- `docs/governance/master-architecture-constitution.md`
- `docs/governance/loadiq-repository-addendum.md`

Before changing behavior, also read the relevant files under:

- `docs/product/`
- `docs/architecture/`
- `docs/api/`
- `docs/testing/regression-checklist.md`
- `CHANGELOG.md`

## Required Start Protocol

1. Read this `AGENTS.md` first.
2. Run `git branch --show-current`.
3. Run `git status --short`.
4. Do not work on `main`.
5. If the worktree is dirty, stop and report the dirty files unless Joshua explicitly approved working with that dirty state.
6. Create or switch to a dedicated task branch before edits.
7. Identify whether the task touches product, governance, rollout, commercial tier, entitlement, Supabase, billing, AI, analytics, API integrations, Capacitor/mobile/iOS/Android, or legal/public claims.

## Branch Governance

Before making changes:

1. Check git status.
2. Do not proceed on a dirty worktree unless Joshua explicitly approved that dirty state.
3. Create or switch to a task-specific branch before editing.
4. Never make broad unrelated changes under an API-contracts task.

## Markdown Context Requirement

Before starting any task, inspect repository Markdown context:

1. Read this `AGENTS.md` first.
2. Inventory available Markdown files with a command similar to `find . -type f -name "*.md" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./out/*" -not -path "./dist/*" | sort`.
3. Read Markdown files that are relevant to the requested task.
4. For normal app feature work, read only relevant app/product docs. Do not load every governance or audit document unless needed.
5. For Supabase, schema, deployment, billing, pricing, or production work, read the relevant operations docs before acting.
6. Before modifying files, briefly report Markdown files found, Markdown files read, which docs are relevant to the task, and any docs intentionally skipped as irrelevant.
7. Do not stop normal feature work just because historical audit docs exist.
8. Do not create new governance docs unless explicitly requested.
9. If Markdown docs conflict with the user's current instruction, report the conflict and ask before proceeding.

## Repository Scope

This repository is the LoadIQ application repo.

- `karpilo-liq.com` is the public website.
- `app.karpilo-liq.com` is the account-access/application portal surface.
- `/portal` is an account-side bridge. It must not replace the full app.
- `/dashboard` and related protected routes are operational app routes.

Website code must not duplicate app business logic. App code must not treat public marketing pages as operational app surfaces.

## Protected Product Pillars

Do not remove, rename, replace, or weaken these pillars without explicit approval:

- Calculator
- Mileage
- Fuel
- Saved loads
- Fit Check
- Settings/profile
- Expense Intelligence
- Vehicle Intelligence
- Billing and entitlements
- Atlas/AI
- Dashboard
- Admin/internal diagnostics
- Capacitor/mobile/iOS/Android surfaces

## Architecture Rules

Always keep these concepts separate:

- Product
- Governance state
- Rollout phase
- Commercial subscription tier
- Product entitlement

If code or docs mix these concepts, identify the coupling and risk before changing anything.

Do not duplicate billing, entitlement, rollout, governance, AI, analytics, or API adapter systems. Prefer existing architecture over parallel implementations.

## Data, Security, And Integration Rules

- Protect secrets. Never expose server-only keys in client code or `NEXT_PUBLIC_` variables.
- Protect Supabase auth, RLS, grants, functions, and service-role boundaries.
- Do not weaken auth, RLS, billing, or entitlement checks to make a UI path work.
- Protect Stripe checkout, webhook, subscription, and entitlement assumptions.
- Keep API integrations behind server routes and adapter/normalizer boundaries.
- Do not let vendor response shapes leak directly into UI.
- Document cache, fallback, and rate-limit behavior before expanding provider usage.
- Treat Sentry and PostHog as admin/internal tools, not customer-facing product features.
- Treat trucking operations, driver records, saved loads, billing records, diagnostics, analytics, and AI events as sensitive operational data.
- Do not run destructive external commands or push changes to Supabase, Stripe, Vercel, Resend, Redis, Sentry, PostHog, OpenAI, Google, EIA, or other external services unless Joshua explicitly asks.

## External API Governance

Whenever adding, modifying, or reviewing any external API integration, update
`docs/api-contracts/` before or alongside the implementation. Each API contract
must reference official provider documentation and document:

- authentication
- request fields
- consumed response fields
- errors
- quotas/cost controls
- security/privacy boundaries
- app source-file mapping
- drift risks

Do not invent provider behavior. Do not rely on memory, examples, or existing
code alone. Do not use unofficial documentation as the source of truth. If
official documentation cannot confirm a field or behavior, mark it `UNVERIFIED`
and do not treat it as contractually valid.

## Mobile And UI Rules

LoadIQ is mobile-first. Calculator, settings, Fit Check, Expense Intelligence, Vehicle Intelligence, billing, and dashboard surfaces must remain usable on iPhone-sized screens.

Do not claim a UI works unless it was verified in a rendered app.

Capacitor/mobile/iOS/Android support must follow `docs/architecture/mobile-platform-boundaries.md`. Do not imply native iOS or Android support beyond repository evidence and rendered/platform verification.

## Changelog Rules

- Update `CHANGELOG.md` for meaningful code, documentation, architecture, billing, API, security, mobile, or product-boundary changes.
- Do not record secrets, private tokens, internal credentials, or sensitive operational data.
- Do not use changelog entries as marketing claims.
- Keep entries factual and tied to actual repository changes.
- Documentation-only governance changes belong under `Documentation`.
- Security hardening belongs under `Security`.
- Billing/tier changes must not imply public availability unless confirmed.
- Release/version changes must follow `docs/operations/release-versioning.md`.
- Do not bump `package.json`, iOS, Android, or Capacitor version metadata unless the task explicitly requests a release/version bump.
- Do not modify iOS or Android native project files during unrelated docs, API, billing, or UI tasks.
- Do not create Android scaffold unless explicitly requested.
- Do not claim App Store or Play Console readiness without platform-specific validation.

## Legal And Public Claim Rules

LoadIQ is a transportation profitability intelligence and decision-support platform. It is not a broker, carrier, dispatcher, ELD, tax advisor, legal advisor, compliance authority, insurance advisor, accounting service, route authority, or guaranteed-profit system.

Do not invent public pricing, tier capabilities, provider support, mobile support, AI capability, compliance status, or future product behavior.

## Validation

Use the smallest validation set that matches the change. For docs-only work, run at least:

```bash
git diff --check
```

Inspect `package.json` before running heavier commands. Do not claim lint, typecheck, tests, or build passed unless they were executed.

## Final Report

Final reports must include:

- Branch name
- Files changed
- What evidence was used
- What was intentionally not changed
- Validation run
- Validation not run and why
- Current `git status --short`
- Risks, unresolved conflicts, or follow-up branches
