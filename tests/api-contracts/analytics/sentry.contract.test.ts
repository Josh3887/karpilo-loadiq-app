export const sentryContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/analytics/sentry.contract.md",
  fixtureDirectory: "test-fixtures/api/analytics/sentry/",
  futureAssertions: [
    "SENTRY_AUTH_TOKEN is never public",
    "Sentry payload filtering excludes provider keys and sensitive operational data",
  ],
} as const;

