export const verifyMockCoverageScaffold = {
  status: "scaffold",
  purpose:
    "Future check that every documented endpoint has success, malformed, and classified error fixture coverage.",
  fixtureNamingRules: [
    "success fixtures: capability.success.json",
    "malformed fixtures: capability.malformed.json",
    "error fixtures: errors/error-type.json",
  ],
  liveProviderAccess: false,
} as const;

