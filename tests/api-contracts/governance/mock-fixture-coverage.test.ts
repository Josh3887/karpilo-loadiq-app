export const mockFixtureCoverageTestScaffold = {
  status: "scaffold",
  fixtureNamingRules: [
    "success fixtures: capability.success.json",
    "malformed fixtures: capability.malformed.json",
    "error fixtures: errors/error-type.json",
  ],
  futureAssertions: [
    "each contract endpoint has at least one success fixture",
    "each provider has failure fixtures for required failure classes",
  ],
} as const;

