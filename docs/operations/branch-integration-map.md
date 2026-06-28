# LoadIQ Branch Integration Map

Last updated: June 25, 2026

This map records local branch evidence at the time of the build-readiness
roadmap. It is a planning document only. It does not approve merging any branch
to `main`.

## Current Baseline Problem

Earlier merge-readiness work found that `main` was stale relative to the real
LoadIQ app/platform baseline. Branches based on `validate/loadiq-platform-baseline`
or later app-platform history should not be merged directly into stale `main`
without first resolving the app-platform baseline.

## Branch Status Table

| Branch | Head | Type | Current role | Direct-to-main status |
| --- | --- | --- | --- | --- |
| `validate/loadiq-platform-baseline` | `8de143a` | Code validation baseline | App/platform baseline with whitespace cleanup and validation history. | Do not merge to `main` without final platform audit and merge plan. |
| `docs/loadiq-docs-consolidation` | `54dec7c` | Docs-only | Consolidates governance, release, Supabase planning/design, and billing docs. | Do not merge directly to stale `main`; integrate after or with app baseline. |
| `docs/loadiq-env-integration-contracts` | `2b77dfd` | Docs-only | Adds environment and provider integration contract docs. | Do not merge directly to stale `main`; stack on docs consolidation or updated baseline. |
| `chore/loadiq-env-example-alignment` | `59dce77` | Config sample | Aligns `.env.example` with env/provider contracts using placeholders only. | Do not merge directly to stale `main`; review with env docs. |
| `docs/loadiq-api-admin-security-audit` | `02dbb26` | Docs-only | Adds API/admin/security exposure audit. | Do not merge directly to stale `main`; stack after env docs. |
| `fix/loadiq-developer-entitlement-override` | `3d7228c` | Code + docs | Removes hardcoded developer entitlement override and hardens billing harness gate. | Code-bearing branch; requires review and validation before integration. |
| `docs/loadiq-build-readiness-roadmap` | `3d7228c` plus uncommitted roadmap docs until committed | Docs changes on code-fix ancestry | Adds roadmap, branch map, and risk register from the current fixed branch. | Do not merge directly to stale `main`; use as planning/review branch. |
| `docs/loadiq-supabase-reconciliation-plan` | `a447aee` | Docs-only | Standalone Supabase live reconciliation plan. | Do not merge alone if superseded by consolidated docs; useful as source evidence. |
| `docs/loadiq-supabase-forward-reconciliation-design` | `28b30ab` | Docs-only | Standalone forward reconciliation design. | Do not merge alone if superseded by consolidated docs; useful as source evidence. |
| `docs/audit-loadiq-live-supabase-reconciliation` | `8de143a` | Audit branch | Read-only live Supabase audit branch; no unique committed roadmap evidence at head. | Do not merge; use audit findings already captured in docs. |
| `fix/loadiq-supabase-forward-reconciliation` | `3aa266f` | Migration + docs | Contains forward-only Supabase reconciliation migration and application runbook. | Do not merge/apply until migration review and remote application approval. |

## Important Commits

Current integrated chain on the roadmap branch includes:

- `18d0844` - docs: add LoadIQ governance spine
- `797499c` - docs: add LoadIQ release versioning governance
- `484cf26` - docs: add LoadIQ Supabase reconciliation plan
- `fe0beef` - docs: add LoadIQ Supabase forward reconciliation design
- `54dec7c` - docs: add LoadIQ billing entitlement reconciliation
- `2b77dfd` - docs: add LoadIQ env integration contracts
- `59dce77` - chore: align LoadIQ env example
- `02dbb26` - docs: add LoadIQ API admin security audit
- `3d7228c` - fix: harden developer entitlement override

Standalone Supabase branches also contain:

- `a447aee` - docs: add LoadIQ Supabase reconciliation plan
- `28b30ab` - docs: add LoadIQ Supabase forward reconciliation design
- `92079e1` - fix: add LoadIQ Supabase forward reconciliation migration
- `3aa266f` - docs: add Supabase forward reconciliation runbook

## Docs-Only Branches

Docs-only or docs-source branches:

- `docs/loadiq-docs-consolidation`
- `docs/loadiq-env-integration-contracts`
- `docs/loadiq-api-admin-security-audit`
- `docs/loadiq-supabase-reconciliation-plan`
- `docs/loadiq-supabase-forward-reconciliation-design`
- `docs/audit-loadiq-live-supabase-reconciliation`

The roadmap branch changes are intended to be docs-only, but the branch is based
on the code-bearing developer entitlement fix branch.

## Code-Bearing Branches

Code-bearing branches:

- `validate/loadiq-platform-baseline`
- `fix/loadiq-developer-entitlement-override`
- `docs/loadiq-build-readiness-roadmap` by ancestry only, because it is based
  on `fix/loadiq-developer-entitlement-override`

Review requirements:

- run lint/typecheck/build
- verify changed paths are intentional
- confirm no remote-service mutations were performed
- confirm billing and entitlement behavior changes are narrow

## Migration-Bearing Branches

Migration-bearing branch:

- `fix/loadiq-supabase-forward-reconciliation`

It contains the forward-only reconciliation migration and runbook. It must not
be merged or applied until:

- migration SQL review is complete
- remote Supabase target is confirmed
- backup/read-only checks are complete
- pricing mutation remains excluded
- controlled application is explicitly approved

## Branches Not Safe To Merge Directly To `main`

Do not merge these directly to current stale `main` without a reviewed
integration plan:

- `validate/loadiq-platform-baseline`
- `docs/loadiq-docs-consolidation`
- `docs/loadiq-env-integration-contracts`
- `chore/loadiq-env-example-alignment`
- `docs/loadiq-api-admin-security-audit`
- `fix/loadiq-developer-entitlement-override`
- `docs/loadiq-build-readiness-roadmap`
- `fix/loadiq-supabase-forward-reconciliation`

Reason: these branches assume the app/platform baseline that stale `main` does
not yet contain, or they carry migration/application risk requiring separate
approval.

## Recommended Integration Order

Recommended review stack:

1. Confirm `validate/loadiq-platform-baseline` is still the intended app
   platform baseline.
2. Integrate docs consolidation:
   - governance spine
   - release/versioning
   - Supabase reconciliation plan/design
   - billing entitlement reconciliation
3. Integrate env/API contract docs.
4. Integrate `.env.example` placeholder alignment.
5. Integrate API/admin/security audit docs.
6. Integrate developer entitlement override hardening fix.
7. Integrate build-readiness roadmap docs.
8. Keep Supabase migration branch separate until controlled application is
   approved.

If `main` is updated with the app-platform baseline first, recreate or rebase
the docs/fix stack onto the updated `main` and re-run validation.

## Stop Conditions

Stop and re-audit before merging if:

- `main` changes materially
- Supabase migration history changes
- Stripe prices or webhook behavior changes
- any branch gains changes under `src/`, `supabase/`, env files, package files,
  or native files outside its stated scope
- a cherry-pick or merge conflict touches billing, entitlement, Supabase, API,
  or auth behavior
