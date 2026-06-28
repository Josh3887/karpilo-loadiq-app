export const nwsContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/weather/nws.contract.md",
  fixtureDirectory: "test-fixtures/api/weather/nws/",
  futureAssertions: [
    "NWS_USER_AGENT is required before provider calls",
    "point lookup fixtures produce grid metadata without hardcoded grid values",
    "NWS alerts remain official evidence and do not become route authority",
  ],
} as const;

