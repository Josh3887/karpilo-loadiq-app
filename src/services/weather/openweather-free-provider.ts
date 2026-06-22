import "server-only";

import {
  createWeatherFailure,
  logWeatherFailure,
} from "@/services/weather/weather-errors";
import {
  normalizeWeatherLookupInput,
  temperatureUnit,
  validateOpenWeatherApiKey,
  windSpeedUnit,
} from "@/services/weather/weather-validation";
import type {
  CurrentWeatherSnapshot,
  FiveDayWeatherForecast,
  WeatherCondition,
  WeatherForecastPoint,
  WeatherLookupInput,
  WeatherProvider,
  WeatherProviderFailure,
  WeatherProviderResult,
  WeatherTemperature,
  WeatherUnits,
  WeatherWind,
} from "@/types/weather";

type Fetcher = typeof fetch;

type OpenWeatherFreeProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetcher?: Fetcher;
};

const OPENWEATHER_FREE_PROVIDER_ID = "openweather_free";
const OPENWEATHER_SOURCE_LABEL = "OpenWeather Free API";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

export class OpenWeatherFreeProvider implements WeatherProvider {
  readonly id = OPENWEATHER_FREE_PROVIDER_ID;

  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly fetcher: Fetcher;

  constructor(options: OpenWeatherFreeProviderOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? OPENWEATHER_BASE_URL;
    this.fetcher = options.fetcher ?? fetch;
  }

  async getCurrentWeather(
    input: WeatherLookupInput
  ): Promise<WeatherProviderResult<CurrentWeatherSnapshot>> {
    const normalizedInput = normalizeWeatherLookupInput(input);

    if (!normalizedInput) {
      return createWeatherFailure({
        providerId: this.id,
        code: "invalid_coordinates",
        message: "Weather lookup received invalid latitude or longitude.",
      });
    }

    const keyValidation = validateOpenWeatherApiKey(this.apiKey);

    if (!keyValidation.ok) {
      return createWeatherFailure({
        providerId: this.id,
        code: keyValidation.code,
        message: keyValidation.message,
      });
    }

    const response = await this.fetchJson(
      "/weather",
      normalizedInput,
      keyValidation.apiKey
    );

    if (response.status === "unavailable") return response;

    const current = normalizeCurrentWeatherPayload(
      response.data,
      normalizedInput.units
    );

    if (!current) {
      return this.payloadFailure("OpenWeather current response was unusable.");
    }

    return {
      status: "available",
      providerId: this.id,
      data: current,
      message: "Loaded current weather from OpenWeather.",
      fetchedAt: current.fetchedAt,
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
        message: "Weather forecast lookup received invalid coordinates.",
      });
    }

    const keyValidation = validateOpenWeatherApiKey(this.apiKey);

    if (!keyValidation.ok) {
      return createWeatherFailure({
        providerId: this.id,
        code: keyValidation.code,
        message: keyValidation.message,
      });
    }

    const response = await this.fetchJson(
      "/forecast",
      normalizedInput,
      keyValidation.apiKey
    );

    if (response.status === "unavailable") return response;

    const forecast = normalizeForecastPayload(response.data, normalizedInput.units);

    if (!forecast) {
      return this.payloadFailure("OpenWeather forecast response was unusable.");
    }

    return {
      status: "available",
      providerId: this.id,
      data: forecast,
      message: "Loaded 5-day / 3-hour forecast from OpenWeather.",
      fetchedAt: forecast.fetchedAt,
    };
  }

  private async fetchJson(
    path: "/weather" | "/forecast",
    input: {
      latitude: number;
      longitude: number;
      units: WeatherUnits;
      language?: string;
    },
    apiKey: string
  ): Promise<
    | {
        status: "available";
        data: unknown;
      }
    | WeatherProviderFailure
  > {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("lat", String(input.latitude));
    url.searchParams.set("lon", String(input.longitude));
    url.searchParams.set("appid", apiKey);
    url.searchParams.set("units", input.units);

    if (input.language) {
      url.searchParams.set("lang", input.language);
    }

    let response: Response;

    try {
      response = await this.fetcher(url, {
        cache: "no-store",
      });
    } catch (error) {
      const failure = createWeatherFailure({
        providerId: this.id,
        code: "openweather_network_error",
        message:
          error instanceof Error
            ? `OpenWeather request failed: ${error.message}`
            : "OpenWeather request failed.",
        retryable: true,
      });
      logWeatherFailure(failure);
      return failure;
    }

    if (!response.ok) {
      const failure = openWeatherHttpFailure(this.id, response.status);
      logWeatherFailure(failure);
      return failure;
    }

    try {
      return {
        status: "available",
        data: await response.json(),
      };
    } catch (error) {
      const failure = createWeatherFailure({
        providerId: this.id,
        code: "openweather_payload_error",
        message:
          error instanceof Error
            ? `OpenWeather JSON parse failed: ${error.message}`
            : "OpenWeather JSON parse failed.",
      });
      logWeatherFailure(failure);
      return failure;
    }
  }

  private payloadFailure(message: string) {
    const failure = createWeatherFailure({
      providerId: this.id,
      code: "openweather_payload_error",
      message,
    });
    logWeatherFailure(failure);
    return failure;
  }
}

function openWeatherHttpFailure(
  providerId: typeof OPENWEATHER_FREE_PROVIDER_ID,
  status: number
) {
  if (status === 401) {
    return createWeatherFailure({
      providerId,
      code: "invalid_openweather_api_key",
      message: "OpenWeather rejected the configured API key.",
      httpStatus: status,
    });
  }

  if (status === 429) {
    return createWeatherFailure({
      providerId,
      code: "openweather_rate_limited",
      message: "OpenWeather rate limit reached.",
      retryable: true,
      httpStatus: status,
    });
  }

  return createWeatherFailure({
    providerId,
    code: "openweather_http_error",
    message: `OpenWeather returned HTTP ${status}.`,
    retryable: status >= 500,
    httpStatus: status,
  });
}

function normalizeCurrentWeatherPayload(
  payload: unknown,
  units: WeatherUnits
): CurrentWeatherSnapshot | null {
  if (!isRecord(payload)) return null;

  const main = asRecord(payload.main);
  const coord = asRecord(payload.coord);
  const sys = asRecord(payload.sys);
  const clouds = asRecord(payload.clouds);
  const wind = asRecord(payload.wind);
  const rain = asRecord(payload.rain);
  const snow = asRecord(payload.snow);
  const condition = weatherCondition(payload.weather);
  const fetchedAt = new Date().toISOString();
  const observedAt = unixToIso(numberValue(payload.dt));
  const latitude = numberValue(coord?.lat);
  const longitude = numberValue(coord?.lon);

  if (!main || latitude === null || longitude === null) return null;

  return {
    providerId: OPENWEATHER_FREE_PROVIDER_ID,
    sourceLabel: OPENWEATHER_SOURCE_LABEL,
    location: {
      latitude,
      longitude,
      name: stringValue(payload.name),
      country: stringValue(sys?.country),
      timezoneOffsetSeconds: numberValue(payload.timezone),
    },
    units,
    observedAt,
    fetchedAt,
    condition,
    temperature: normalizeTemperature(main, units),
    humidityPercent: numberValue(main.humidity),
    pressureHpa: numberValue(main.pressure),
    visibilityMeters: numberValue(payload.visibility),
    cloudsPercent: numberValue(clouds?.all),
    wind: normalizeWind(wind, units),
    precipitation: {
      rain1hMm: numberValue(rain?.["1h"]),
      rain3hMm: numberValue(rain?.["3h"]),
      snow1hMm: numberValue(snow?.["1h"]),
      snow3hMm: numberValue(snow?.["3h"]),
      probability: null,
    },
  };
}

function normalizeForecastPayload(
  payload: unknown,
  units: WeatherUnits
): FiveDayWeatherForecast | null {
  if (!isRecord(payload) || !Array.isArray(payload.list)) return null;

  const city = asRecord(payload.city);
  const coord = asRecord(city?.coord);
  const latitude = numberValue(coord?.lat);
  const longitude = numberValue(coord?.lon);

  if (latitude === null || longitude === null) return null;

  const points = payload.list
    .map((entry) => normalizeForecastPoint(entry, units))
    .filter((point): point is WeatherForecastPoint => Boolean(point));

  if (!points.length) return null;

  return {
    providerId: OPENWEATHER_FREE_PROVIDER_ID,
    sourceLabel: OPENWEATHER_SOURCE_LABEL,
    location: {
      latitude,
      longitude,
      name: stringValue(city?.name),
      country: stringValue(city?.country),
      timezoneOffsetSeconds: numberValue(city?.timezone),
    },
    units,
    fetchedAt: new Date().toISOString(),
    intervalHours: 3,
    points,
  };
}

function normalizeForecastPoint(
  value: unknown,
  units: WeatherUnits
): WeatherForecastPoint | null {
  if (!isRecord(value)) return null;

  const forecastedAt = unixToIso(numberValue(value.dt));
  const main = asRecord(value.main);

  if (!forecastedAt || !main) return null;

  const clouds = asRecord(value.clouds);
  const wind = asRecord(value.wind);
  const rain = asRecord(value.rain);
  const snow = asRecord(value.snow);

  return {
    forecastedAt,
    condition: weatherCondition(value.weather),
    temperature: normalizeTemperature(main, units),
    humidityPercent: numberValue(main.humidity),
    pressureHpa: numberValue(main.pressure),
    visibilityMeters: numberValue(value.visibility),
    cloudsPercent: numberValue(clouds?.all),
    wind: normalizeWind(wind, units),
    precipitation: {
      rain1hMm: null,
      rain3hMm: numberValue(rain?.["3h"]),
      snow1hMm: null,
      snow3hMm: numberValue(snow?.["3h"]),
      probability: numberValue(value.pop),
    },
  };
}

function normalizeTemperature(
  main: Record<string, unknown>,
  units: WeatherUnits
): WeatherTemperature {
  return {
    value: numberValue(main.temp),
    feelsLike: numberValue(main.feels_like),
    min: numberValue(main.temp_min),
    max: numberValue(main.temp_max),
    unit: temperatureUnit(units),
  };
}

function normalizeWind(
  wind: Record<string, unknown> | null | undefined,
  units: WeatherUnits
): WeatherWind {
  return {
    speed: numberValue(wind?.speed),
    gust: numberValue(wind?.gust),
    degrees: numberValue(wind?.deg),
    unit: windSpeedUnit(units),
  };
}

function weatherCondition(value: unknown): WeatherCondition {
  const first = Array.isArray(value) ? asRecord(value[0]) : null;

  return {
    id: numberValue(first?.id),
    main: stringValue(first?.main),
    description: stringValue(first?.description),
    icon: stringValue(first?.icon),
  };
}

function unixToIso(value: number | null) {
  return value === null ? null : new Date(value * 1000).toISOString();
}

function asRecord(value: unknown) {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberValue(value: unknown) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
