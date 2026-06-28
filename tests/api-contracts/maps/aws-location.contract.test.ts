export const awsLocationContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/maps/aws-location.contract.md",
  fixtureDirectory: "test-fixtures/api/maps/aws-location/",
  futureAssertions: [
    "AWS Location remains planned-only until runtime code and docs are approved",
    "future AWS credentials are never public or committed",
  ],
} as const;

