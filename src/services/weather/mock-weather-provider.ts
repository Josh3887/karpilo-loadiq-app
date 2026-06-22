import "server-only";

import { createWeatherFailure } from "@/services/weather/weather-errors";
import {
  normalizeWeatherLookupInput,
  temperatureUnit,
  windSpeedUnit,
} from "@/services/weather/weather-validation";
import type {
  CurrentWeatherSnapshot,
  FiveDayWeatherForecast,
  WeatherForecastPoint,
  WeatherLookupInput,
  WeatherProvider,
  WeatherProviderResult,
  WeatherUnits,
} from "@/types/weather";

type MockWeatherProviderOptions = {
  now?: Date;
};

const MOCK_PROVIDER_ID = "mock_weather";
const MOCK_SOURCE_LABEL = "Mock Weather Provider";

export class MockWeatherProvider implements WeatherProvider {
  readonly id = MOCK_PROVIDER_ID;

  private readonly now: Date;

  constructor(options: MockWeatherProviderOptions = {}) {
    this.now = options.now ?? new Date("2026-01-01T12:00:00.000Z");
  }

  async getCurrentWeather(
    input: WeatherLookupInput
  ): Promise<WeatherProviderResult<CurrentWeatherSnapshot>> {
    const normalizedInput = normalizeWeatherLookupInput(input);

    if (!normalizedInput) {
      return createWeatherFailure({
        providerId: this.id,
        code: "invalid_coordinates",
        message: "Mock weather lookup received invalid coordinates.",
      });
    }

    const fetchedAt = this.now.toISOString();

    return {
      status: "available",
      providerId: this.id,
      data: {
        providerId: this.id,
        sourceLabel: MOCK_SOURCE_LABEL,
        location: {
          latitude: normalizedInput.latitude,
          longitude: normalizedInput.longitude,
          name: "Mock Location",
          country: "US",
          timezoneOffsetSeconds: null,
        },
        units: normalizedInput.units,
        observedAt: fetchedAt,
        fetchedAt,
        condition: {
          id: 801,
          main: "Clouds",
          description: "mock scattered clouds",
          icon: "02d",
        },
        temperature: {
          value: mockTemperature(72, normalizedInput.units),
          feelsLike: mockTemperature(71, normalizedInput.units),
          min: mockTemperature(66, normalizedInput.units),
          max: mockTemperature(78, normalizedInput.units),
          unit: temperatureUnit(normalizedInput.units),
        },
        humidityPercent: 54,
        pressureHpa: 1014,
        visibilityMeters: 10000,
        cloudsPercent: 38,
        wind: {
          speed: mockWindSpeed(11, normalizedInput.units),
          gust: mockWindSpeed(18, normalizedInput.units),
          degrees: 210,
          unit: windSpeedUnit(normalizedInput.units),
        },
        precipitation: {
          rain1hMm: null,
          rain3hMm: null,
          snow1hMm: null,
          snow3hMm: null,
          probability: null,
        },
      },
      message: "Loaded mock current weather.",
      fetchedAt,
    };
  }

  async getFiveDayForecast(
    input: WeatherLookupInput
  ): Promise<WeatherProviderResult<FiveDayWeatherForecast>> {
    const normalizedInput = normalizeWeatherLookupInput(input);

    if (!normalizedInput) {
      return createWeatherFailure({
        providerId: this.id,
        code: "invalid_coordinates",
        message: "Mock weather forecast lookup received invalid coordinates.",
      });
    }

    const fetchedAt = this.now.toISOString();
    const points = Array.from({ length: 40 }, (_, index) =>
      mockForecastPoint(this.now, index + 1, normalizedInput.units)
    );

    return {
      status: "available",
      providerId: this.id,
      data: {
        providerId: this.id,
        sourceLabel: MOCK_SOURCE_LABEL,
        location: {
          latitude: normalizedInput.latitude,
          longitude: normalizedInput.longitude,
          name: "Mock Location",
          country: "US",
          timezoneOffsetSeconds: null,
        },
        units: normalizedInput.units,
        fetchedAt,
        intervalHours: 3,
        points,
      },
      message: "Loaded mock 5-day / 3-hour forecast.",
      fetchedAt,
    };
  }
}

function mockForecastPoint(
  now: Date,
  step: number,
  units: WeatherUnits
): WeatherForecastPoint {
  const forecastedAt = new Date(now.getTime() + step * 3 * 60 * 60 * 1000);
  const cycle = step % 8;
  const baseTemp = 68 + cycle * 2;
  const precipitationProbability = step % 9 === 0 ? 0.42 : 0.08;

  return {
    forecastedAt: forecastedAt.toISOString(),
    condition: {
      id: precipitationProbability > 0.2 ? 500 : 802,
      main: precipitationProbability > 0.2 ? "Rain" : "Clouds",
      description:
        precipitationProbability > 0.2
          ? "mock light rain"
          : "mock scattered clouds",
      icon: precipitationProbability > 0.2 ? "10d" : "03d",
    },
    temperature: {
      value: mockTemperature(baseTemp, units),
      feelsLike: mockTemperature(baseTemp - 1, units),
      min: mockTemperature(baseTemp - 4, units),
      max: mockTemperature(baseTemp + 3, units),
      unit: temperatureUnit(units),
    },
    humidityPercent: 50 + cycle,
    pressureHpa: 1010 + cycle,
    visibilityMeters: 10000,
    cloudsPercent: 35 + cycle * 5,
    wind: {
      speed: mockWindSpeed(8 + cycle, units),
      gust: mockWindSpeed(14 + cycle, units),
      degrees: 180 + cycle * 12,
      unit: windSpeedUnit(units),
    },
    precipitation: {
      rain1hMm: null,
      rain3hMm: precipitationProbability > 0.2 ? 1.8 : null,
      snow1hMm: null,
      snow3hMm: null,
      probability: precipitationProbability,
    },
  };
}

function mockTemperature(fahrenheit: number, units: WeatherUnits) {
  if (units === "metric") {
    return round((fahrenheit - 32) * (5 / 9));
  }

  if (units === "standard") {
    return round((fahrenheit - 32) * (5 / 9) + 273.15);
  }

  return fahrenheit;
}

function mockWindSpeed(mph: number, units: WeatherUnits) {
  return units === "imperial" ? mph : round(mph * 0.44704);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
