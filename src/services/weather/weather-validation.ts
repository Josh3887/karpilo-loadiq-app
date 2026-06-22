import "server-only";

import type { WeatherLookupInput, WeatherUnits } from "@/types/weather";

export type NormalizedWeatherLookupInput = {
  latitude: number;
  longitude: number;
  units: WeatherUnits;
  language?: string;
};

export type OpenWeatherApiKeyValidation =
  | {
      ok: true;
      apiKey: string;
    }
  | {
      ok: false;
      code: "missing_openweather_api_key";
      message: string;
    };

const DEFAULT_UNITS: WeatherUnits = "imperial";

export function validateOpenWeatherApiKey(
  apiKey = process.env.OPENWEATHER_API_KEY
): OpenWeatherApiKeyValidation {
  const trimmedKey = apiKey?.trim();

  if (!trimmedKey) {
    return {
      ok: false,
      code: "missing_openweather_api_key",
      message: "OPENWEATHER_API_KEY is not configured.",
    };
  }

  return {
    ok: true,
    apiKey: trimmedKey,
  };
}

export function normalizeWeatherLookupInput(
  input: WeatherLookupInput
): NormalizedWeatherLookupInput | null {
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    units: input.units ?? DEFAULT_UNITS,
    language:
      typeof input.language === "string" && input.language.trim()
        ? input.language.trim()
        : undefined,
  };
}

export function temperatureUnit(units: WeatherUnits) {
  if (units === "imperial") return "F";
  if (units === "metric") return "C";
  return "K";
}

export function windSpeedUnit(units: WeatherUnits) {
  return units === "imperial" ? "mph" : "m/s";
}
