import "server-only";

import {
  normalizeGoogleAlerts,
  normalizeGoogleCurrent,
  normalizeGoogleForecastPeriods,
} from "@/lib/weather/weatherNormalize";
import type {
  NormalizedCurrentWeather,
  NormalizedForecastPeriod,
  NormalizedWeatherAlert,
  WeatherProviderResult,
  WeatherUnits,
} from "@/lib/weather/weatherTypes";

const DEFAULT_GOOGLE_WEATHER_BASE_URL = "https://weather.googleapis.com";

type GoogleForecastOptions = {
  hours?: number;
  days?: number;
  units?: WeatherUnits;
  includeRawProviderData?: boolean;
};

type GoogleAlertOptions = {
  includeRawProviderData?: boolean;
};

function getGoogleWeatherApiKey() {
  return process.env.GOOGLE_WEATHER_API_KEY?.trim();
}

function getGoogleWeatherBaseUrl() {
  return (
    process.env.GOOGLE_WEATHER_BASE_URL?.trim() ||
    DEFAULT_GOOGLE_WEATHER_BASE_URL
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
    provider: "google",
    error: {
      code,
      message,
      httpStatus,
      retryable,
    },
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchGoogleWeatherJson<TData>(
  path: string,
  latitude: number,
  longitude: number,
  revalidateSeconds: number,
  extraParams: Record<string, string | number | undefined> = {}
): Promise<WeatherProviderResult<TData>> {
  const apiKey = getGoogleWeatherApiKey();

  if (!apiKey) {
    return providerFailure(
      "missing_google_weather_api_key",
      "GOOGLE_WEATHER_API_KEY is not configured."
    );
  }

  const url = new URL(`${getGoogleWeatherBaseUrl()}${path}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("location.latitude", String(latitude));
  url.searchParams.set("location.longitude", String(longitude));

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "force-cache",
      next: {
        revalidate: revalidateSeconds,
      },
    });
  } catch {
    return providerFailure(
      "google_weather_network_error",
      "Google Weather request failed.",
      null,
      true
    );
  }

  if (!response.ok) {
    return providerFailure(
      "google_weather_http_error",
      `Google Weather returned HTTP ${response.status}.`,
      response.status,
      response.status >= 500 || response.status === 429
    );
  }

  try {
    return {
      ok: true,
      provider: "google",
      data: (await response.json()) as TData,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return providerFailure(
      "google_weather_payload_error",
      "Google Weather response was not valid JSON."
    );
  }
}

export async function getGoogleCurrentWeather(
  latitude: number,
  longitude: number,
  options: { units?: WeatherUnits; includeRawProviderData?: boolean } = {}
) {
  const result = await fetchGoogleWeatherJson<unknown>(
    "/v1/currentConditions:lookup",
    latitude,
    longitude,
    600
  );

  if (!result.ok) return result;

  const normalized = normalizeGoogleCurrent(
    result.data,
    latitude,
    longitude,
    options.units ?? "imperial",
    options.includeRawProviderData
  );

  if (!normalized) {
    return providerFailure<NormalizedCurrentWeather>(
      "google_weather_payload_error",
      "Google Weather current response was unusable."
    );
  }

  return {
    ok: true as const,
    provider: "google" as const,
    data: normalized,
    fetchedAt: result.fetchedAt,
  };
}

export async function getGoogleHourlyForecast(
  latitude: number,
  longitude: number,
  options: GoogleForecastOptions = {}
) {
  const hours = Math.min(Math.max(Math.round(options.hours ?? 24), 1), 240);
  const result = await fetchGoogleWeatherJson<unknown>(
    "/v1/forecast/hours:lookup",
    latitude,
    longitude,
    900,
    {
      hours,
    }
  );

  if (!result.ok) return result;

  return {
    ok: true as const,
    provider: "google" as const,
    data: normalizeGoogleForecastPeriods(
      result.data,
      latitude,
      longitude,
      options.units ?? "imperial",
      options.includeRawProviderData
    ),
    fetchedAt: result.fetchedAt,
  } satisfies WeatherProviderResult<NormalizedForecastPeriod[]>;
}

export async function getGoogleDailyForecast(
  latitude: number,
  longitude: number,
  options: GoogleForecastOptions = {}
) {
  const days = Math.min(Math.max(Math.round(options.days ?? 10), 1), 10);
  const result = await fetchGoogleWeatherJson<unknown>(
    "/v1/forecast/days:lookup",
    latitude,
    longitude,
    900,
    {
      days,
    }
  );

  if (!result.ok) return result;

  return {
    ok: true as const,
    provider: "google" as const,
    data: normalizeGoogleForecastPeriods(
      result.data,
      latitude,
      longitude,
      options.units ?? "imperial",
      options.includeRawProviderData
    ),
    fetchedAt: result.fetchedAt,
  } satisfies WeatherProviderResult<NormalizedForecastPeriod[]>;
}

export async function getGooglePublicAlerts(
  latitude: number,
  longitude: number,
  options: GoogleAlertOptions = {}
) {
  const result = await fetchGoogleWeatherJson<unknown>(
    "/v1/publicAlerts:lookup",
    latitude,
    longitude,
    300
  );

  if (!result.ok) return result;

  return {
    ok: true as const,
    provider: "google" as const,
    data: normalizeGoogleAlerts(result.data, options.includeRawProviderData),
    fetchedAt: result.fetchedAt,
  } satisfies WeatherProviderResult<NormalizedWeatherAlert[]>;
}
