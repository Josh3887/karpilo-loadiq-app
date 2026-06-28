import "server-only";

import { MockWeatherProvider } from "@/services/weather/mock-weather-provider";
import { OpenWeatherFreeProvider } from "@/services/weather/openweather-free-provider";
import type {
  CurrentWeatherSnapshot,
  FiveDayWeatherForecast,
  WeatherLookupInput,
  WeatherProvider,
  WeatherProviderResult,
} from "@/types/weather";

type WeatherProviderMode = "openweather_free" | "mock_weather";

type CreateWeatherProviderOptions = {
  mode?: WeatherProviderMode;
  openWeatherApiKey?: string;
};

export function createWeatherProvider(
  options: CreateWeatherProviderOptions = {}
): WeatherProvider {
  if (options.mode === "mock_weather") {
    return new MockWeatherProvider();
  }

  return new OpenWeatherFreeProvider({
    apiKey: options.openWeatherApiKey,
  });
}

export async function getCurrentWeatherByCoordinates(
  input: WeatherLookupInput,
  provider = createWeatherProvider()
): Promise<WeatherProviderResult<CurrentWeatherSnapshot>> {
  return provider.getCurrentWeather(input);
}

export async function getFiveDayWeatherForecastByCoordinates(
  input: WeatherLookupInput,
  provider = createWeatherProvider()
): Promise<WeatherProviderResult<FiveDayWeatherForecast>> {
  return provider.getFiveDayForecast(input);
}
