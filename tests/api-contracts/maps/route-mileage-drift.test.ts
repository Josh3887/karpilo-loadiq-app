export const routeMileageDriftTestScaffold = {
  status: "scaffold",
  fixtureDirectory: "test-fixtures/api/maps/google-maps/",
  futureAssertions: [
    "Google route distance meters convert to miles with stable rounding",
    "route duration strings convert to minutes without silently overwriting user planning hours",
    "provider drift does not overwrite paid loaded miles",
  ],
} as const;

