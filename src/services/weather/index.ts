import "server-only";

export { MockWeatherProvider } from "@/services/weather/mock-weather-provider";
export { OpenWeatherFreeProvider } from "@/services/weather/openweather-free-provider";
export {
  createWeatherProvider,
  getCurrentWeatherByCoordinates,
  getFiveDayWeatherForecastByCoordinates,
} from "@/services/weather/weather-service";
export {
  calculateWeatherProfitability,
  createWeatherProfitabilityLoadValues,
} from "@/services/weather/weather-profitability";
export { validateOpenWeatherApiKey } from "@/services/weather/weather-validation";
export type {
  CurrentWeatherSnapshot,
  FiveDayWeatherForecast,
  WeatherCondition,
  WeatherFailureCode,
  WeatherForecastPoint,
  WeatherLookupInput,
  WeatherProvider,
  WeatherProviderFailure,
  WeatherProviderId,
  WeatherProviderResult,
  WeatherProviderSuccess,
  WeatherUnits,
} from "@/types/weather";
export type {
  WeatherProfitabilityFactor,
  WeatherProfitabilityInput,
  WeatherProfitabilityLoadValues,
  WeatherProfitabilityOutput,
  WeatherProfitabilityPointAssessment,
  WeatherProfitabilityPointFailure,
  WeatherProfitabilityPointInput,
  WeatherProfitabilityPointRole,
  WeatherProfitabilityResult,
  WeatherProfitabilityRiskLevel,
  WeatherProfitabilityUnavailable,
} from "@/types/weather-profitability";
