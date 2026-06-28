export const postHogContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/analytics/posthog.contract.md",
  fixtureDirectory: "test-fixtures/api/analytics/posthog/",
  futureAssertions: [
    "PostHog events do not include secrets, direct personal identifiers, or sensitive route/load data",
    "analytics remains internal and non-authoritative for entitlements",
  ],
} as const;

