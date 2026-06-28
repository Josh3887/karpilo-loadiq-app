export const googleMapsContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/maps/google-maps.contract.md",
  fixtureDirectory: "test-fixtures/api/maps/google-maps/",
  futureAssertions: [
    "Google Routes and Address Validation docs are referenced",
    "server Google Maps key is not exposed as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "paid loaded miles remain separate from Google estimated route miles",
  ],
} as const;

