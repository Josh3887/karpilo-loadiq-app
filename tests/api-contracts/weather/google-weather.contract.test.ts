export const googleWeatherContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/weather/google-weather.contract.md",
  fixtureDirectory: "test-fixtures/api/weather/google-weather/",
  futureAssertions: [
    "contract lists official provider, endpoint, auth, quota docs, and last verified date",
    "current/hourly/daily/public-alerts success fixtures normalize into LoadIQ weather shapes",
    "Google Weather keys are never public, logged, snapshotted, or sent to telemetry",
    "404 endpoint drift is classified as google_weather_endpoint_not_found",
  ],
} as const;

