# API Contract Test Scaffolds

These files are governance scaffolds for future provider contract tests. They
are intentionally mock-first and must not require real provider credentials in
normal CI.

## Rules

- Contract tests use mocks by default.
- Live provider checks must be opt-in only and disabled by default.
- No test should require real provider credentials in normal CI.
- Drift tests exist to keep docs, code, mocks, and environment files aligned.
- Provider keys must never be logged, snapshotted, sent to Sentry/PostHog, or
  exposed through client bundles.
- Provider failure tests must distinguish unauthorized, forbidden, not found,
  timeout, rate limit, provider unavailable, malformed JSON, empty response, and
  network failure.

This repo does not currently define a test runner script. The `.test.ts` files
export metadata and future assertions so TypeScript can validate the scaffold
without adding dependencies or runtime test behavior.

## Executable Governance Checks

The current enforceable checks run through package scripts:

```bash
npm run api-contracts:check
npm run api-contracts:docs
npm run api-contracts:env
npm run api-contracts:fixtures
```

These checks validate provider index coverage, official-doc fields, env example
safety, `.env.local` ignore behavior, fixture directory coverage, obvious
secret exposure patterns, and provider failure-classification metadata.
