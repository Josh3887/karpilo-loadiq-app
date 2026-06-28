export const redisContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/database/redis.contract.md",
  fixtureDirectory: "test-fixtures/api/database/redis/",
  futureAssertions: [
    "Upstash Redis token is server-only",
    "cache failures degrade without exposing cache credentials",
  ],
} as const;

