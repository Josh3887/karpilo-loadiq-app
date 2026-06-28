export const openWeatherContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/weather/openweather.contract.md",
  fixtureDirectory: "test-fixtures/api/weather/openweather/",
  futureAssertions: [
    "OpenWeather 2.5 weather profitability fixtures stay separate from One Call fixtures",
    "One Call success fixture normalizes current, forecast, and alert context",
    "OpenWeather access errors do not expose appid or full request URLs",
  ],
} as const;

