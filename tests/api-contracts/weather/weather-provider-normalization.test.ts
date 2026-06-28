export const weatherProviderNormalizationTestScaffold = {
  status: "scaffold",
  fixtureDirectories: [
    "test-fixtures/api/weather/google-weather/",
    "test-fixtures/api/weather/openweather/",
    "test-fixtures/api/weather/nws/",
  ],
  futureAssertions: [
    "all weather providers normalize into shared current, forecast, and alert shapes",
    "provider-specific response fields do not leak to UI contracts",
    "malformed and empty responses produce classified failures",
  ],
} as const;

