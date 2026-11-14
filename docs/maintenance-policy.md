# LoadIQ maintenance policy (initial foundation)
This repository is one part of Karpilo LoadIQ. Do not confuse the public website, authenticated application, and isolated AWS test environment.

## Automated checks
- Dependabot proposes weekly npm and GitHub Actions dependency updates. It does not deploy them.
- Pull requests run locked dependency installation, ESLint, and a Next.js production build.
- These checks do **not** constitute a full regression suite. Profit calculations, saved loads, billing, enrollment, authentication, and database migration tests must be added and verified before enabling automatic merges or production deployments.

## Deployment safety
- No automatic production merge or deployment authorization is granted by this policy.
- Keep financial calculations, billing, authentication, database changes, and infrastructure changes subject to dedicated regression tests and rollback verification.
- Validate Vercel and AWS environment routing before activating automatic deployment.
- Preserve current data and configuration. Never delete Supabase-related code until all active runtime routes and replacements are confirmed.
- AWS isolated test RDS currently has one-day backups and public accessibility with restricted security-group ingress; review before considering production-grade resilience.

## Operational cadence
- Critical security findings: assess immediately.
- Dependency proposals: weekly.
- Operational status report: daily at 20:00 America/Denver, once a durable scheduled monitor is connected.
- Log deployment version, test outcomes, rollback method, and incident follow-up.
