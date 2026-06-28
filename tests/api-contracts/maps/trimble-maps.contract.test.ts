export const trimbleMapsContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/maps/trimble-maps.contract.md",
  fixtureDirectory: "test-fixtures/api/maps/trimble-maps/",
  futureAssertions: [
    "Trimble remains scaffolded unavailable until provider fields are verified",
    "future truck routing does not become legal route or permit authority",
  ],
} as const;

