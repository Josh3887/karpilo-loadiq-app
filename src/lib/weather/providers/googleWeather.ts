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

type GoogleWeatherOperation =
  | "currentConditions.lookup"
  | "forecast.hours.lookup"
  | "forecast.days.lookup"
  | "publicAlerts.lookup";

type GoogleWeatherErrorMetadata = {
  operation?: GoogleWeatherOperation;
  endpointPath?: string;
  httpStatus?: number | null;
  retryable?: boolean;
};

function getGoogleWeatherApiKey() {
  return process.env.GOOGLE_WEATHER_API_KEY?.trim();
}

function getGoogleWeatherBaseUrl() {
  return (
    process.env.GOOGLE_WEATHER_BASE_URL?.trim() ||
    DEFAULT_GOOGLE_WEATHER_BASE_URL
  )
    .replace(/\/+$/, "")
    .replace(/\/v1$/i, "");
}

function buildGoogleWeatherUrl(
  path: string,
  params: Record<string, string | number | undefined>
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${getGoogleWeatherBaseUrl()}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  return url;
}

function providerFailure<TData>(
  code: string,
  message: string,
  metadata: GoogleWeatherErrorMetadata = {}
): WeatherProviderResult<TData> {
  return {
    ok: false,
    provider: "google",
    error: {
      code,
      message,
      httpStatus: metadata.httpStatus ?? null,
      retryable: metadata.retryable ?? false,
      provider: "google",
      operation: metadata.operation,
      endpointPath: metadata.endpointPath,
    },
    fetchedAt: new Date().toISOString(),
  };
}

function classifyGoogleWeatherHttpError(status: number) {
  if (status === 404) {
    return {
      code: "google_weather_endpoint_not_found",
      message:
        "Google Weather endpoint was not found. Verify endpoint path, API availability, and project access.",
      retryable: false,
    };
  }

  if (status === 401 || status === 403) {
    return {
      code: "google_weather_access_error",
      message:
        "Google Weather rejected the request. Verify API key, billing, API enablement, and key restrictions.",
      retryable: false,
    };
  }

  if (status === 429) {
    return {
      code: "google_weather_rate_limited",
      message: "Google Weather rate limit or quota was reached.",
      retryable: true,
    };
  }

  if (status >= 500) {
    return {
      code: "google_weather_provider_unavailable",
      message: `Google Weather returned HTTP ${status}.`,
      retryable: true,
    };
  }

  return {
    code: "google_weather_http_error",
    message: `Google Weather returned HTTP ${status}.`,
    retryable: false,
  };
}

async function fetchGoogleWeatherJson<TData>(
  operation: GoogleWeatherOperation,
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
      "GOOGLE_WEATHER_API_KEY is not configured.",
      {
        operation,
        endpointPath: path,
      }
    );
  }

  const url = buildGoogleWeatherUrl(path, {
    key: apiKey,
    "location.latitude": latitude,
    "location.longitude": longitude,
    ...extraParams,
  });
  const endpointPath = url.pathname;

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
      {
        operation,
        endpointPath,
        retryable: true,
      }
    );
  }

  if (!response.ok) {
    const classified = classifyGoogleWeatherHttpError(response.status);

    return providerFailure(
      classified.code,
      classified.message,
      {
        operation,
        endpointPath,
        httpStatus: response.status,
        retryable: classified.retryable,
      }
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
      "Google Weather response was not valid JSON.",
      {
        operation,
        endpointPath,
      }
    );
  }
}

export async function getGoogleCurrentWeather(
  latitude: number,
  longitude: number,
  options: { units?: WeatherUnits; includeRawProviderData?: boolean } = {}
) {
  const result = await fetchGoogleWeatherJson<unknown>(
    "currentConditions.lookup",
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
      "Google Weather current response was unusable.",
      {
        operation: "currentConditions.lookup",
        endpointPath: "/v1/currentConditions:lookup",
      }
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
    "forecast.hours.lookup",
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
    "forecast.days.lookup",
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
    "publicAlerts.lookup",
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
