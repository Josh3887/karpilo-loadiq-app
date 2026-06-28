import "server-only";

import {
  normalizeOpenWeatherAlerts,
  normalizeOpenWeatherOneCallCurrent,
  normalizeOpenWeatherOneCallForecasts,
} from "@/lib/weather/weatherNormalize";
import type {
  NormalizedCurrentWeather,
  NormalizedForecastPeriod,
  NormalizedWeatherAlert,
  WeatherProviderResult,
  WeatherUnits,
} from "@/lib/weather/weatherTypes";

const DEFAULT_OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/3.0";

type OpenWeatherOptions = {
  units?: WeatherUnits;
  exclude?: string;
  includeRawProviderData?: boolean;
};

export type OpenWeatherOneCallNormalized = {
  current: NormalizedCurrentWeather | null;
  hourly: NormalizedForecastPeriod[];
  daily: NormalizedForecastPeriod[];
  alerts: NormalizedWeatherAlert[];
};

function getOpenWeatherApiKey() {
  return process.env.OPENWEATHER_API_KEY?.trim();
}

function getOpenWeatherBaseUrl() {
  return (
    process.env.OPENWEATHER_BASE_URL?.trim() || DEFAULT_OPENWEATHER_BASE_URL
  ).replace(/\/$/, "");
}

function providerFailure<TData>(
  code: string,
  message: string,
  httpStatus: number | null = null,
  retryable = false
): WeatherProviderResult<TData> {
  return {
    ok: false,
    provider: "openweather",
    error: {
      code,
      message,
      httpStatus,
      retryable,
    },
    fetchedAt: new Date().toISOString(),
  };
}

export async function getOpenWeatherOneCall(
  latitude: number,
  longitude: number,
  options: OpenWeatherOptions = {}
): Promise<WeatherProviderResult<OpenWeatherOneCallNormalized>> {
  const apiKey = getOpenWeatherApiKey();

  if (!apiKey) {
    return providerFailure(
      "missing_openweather_api_key",
      "OPENWEATHER_API_KEY is not configured."
    );
  }

  const units = options.units ?? "imperial";
  const url = new URL(`${getOpenWeatherBaseUrl()}/onecall`);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", units);

  if (options.exclude) {
    url.searchParams.set("exclude", options.exclude);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "force-cache",
      next: {
        revalidate: 600,
      },
    });
  } catch {
    return providerFailure(
      "openweather_network_error",
      "OpenWeather One Call request failed.",
      null,
      true
    );
  }

  if (!response.ok) {
    return providerFailure(
      response.status === 401 || response.status === 403
        ? "openweather_access_error"
        : response.status === 429
          ? "openweather_rate_limited"
          : "openweather_http_error",
      response.status === 401 || response.status === 403
        ? "OpenWeather rejected the configured key or One Call access."
        : `OpenWeather returned HTTP ${response.status}.`,
      response.status,
      response.status >= 500 || response.status === 429
    );
  }

  try {
    const payload = await response.json();
    return {
      ok: true,
      provider: "openweather",
      data: {
        current: normalizeOpenWeatherOneCallCurrent(
          payload,
          units,
          options.includeRawProviderData
        ),
        hourly: normalizeOpenWeatherOneCallForecasts(
          payload,
          "hourly",
          units,
          options.includeRawProviderData
        ),
        daily: normalizeOpenWeatherOneCallForecasts(
          payload,
          "daily",
          units,
          options.includeRawProviderData
        ),
        alerts: normalizeOpenWeatherAlerts(
          payload,
          options.includeRawProviderData
        ),
      },
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return providerFailure(
      "openweather_payload_error",
      "OpenWeather One Call response was not valid JSON."
    );
  }
}

export async function getOpenWeatherCurrentAndForecast(
  latitude: number,
  longitude: number,
  options: OpenWeatherOptions = {}
) {
  return getOpenWeatherOneCall(latitude, longitude, options);
}

export async function getOpenWeatherAlerts(
  latitude: number,
  longitude: number,
  options: OpenWeatherOptions = {}
): Promise<WeatherProviderResult<NormalizedWeatherAlert[]>> {
  const result = await getOpenWeatherOneCall(latitude, longitude, options);

  if (!result.ok) return result;

  return {
    ok: true,
    provider: "openweather",
    data: result.data.alerts,
    fetchedAt: result.fetchedAt,
  };
}
