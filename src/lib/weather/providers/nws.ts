import "server-only";

import {
  normalizeNwsAlerts,
  normalizeNwsForecastPeriods,
  normalizeNwsPoint,
} from "@/lib/weather/weatherNormalize";
import type {
  NormalizedForecastPeriod,
  NormalizedWeatherAlert,
  NwsPointMetadata,
  WeatherProviderResult,
} from "@/lib/weather/weatherTypes";

const DEFAULT_NWS_BASE_URL = "https://api.weather.gov";

function getNwsBaseUrl() {
  return (process.env.NWS_BASE_URL?.trim() || DEFAULT_NWS_BASE_URL).replace(
    /\/$/,
    ""
  );
}

function getNwsUserAgent() {
  return process.env.NWS_USER_AGENT?.trim();
}

function providerFailure<TData>(
  code: string,
  message: string,
  httpStatus: number | null = null,
  retryable = false
): WeatherProviderResult<TData> {
  return {
    ok: false,
    provider: "nws",
    error: {
      code,
      message,
      httpStatus,
      retryable,
    },
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchNwsJson<TData>(
  path: string,
  revalidateSeconds: number
): Promise<WeatherProviderResult<TData>> {
  const userAgent = getNwsUserAgent();

  if (!userAgent) {
    return providerFailure(
      "missing_nws_user_agent",
      "NWS_USER_AGENT is not configured."
    );
  }

  let response: Response;

  try {
    response = await fetch(`${getNwsBaseUrl()}${path}`, {
      cache: "force-cache",
      headers: {
        Accept: "application/geo+json, application/json",
        "User-Agent": userAgent,
      },
      next: {
        revalidate: revalidateSeconds,
      },
    });
  } catch {
    return providerFailure(
      "nws_network_error",
      "NWS request failed.",
      null,
      true
    );
  }

  if (!response.ok) {
    return providerFailure(
      "nws_http_error",
      `NWS returned HTTP ${response.status}.`,
      response.status,
      response.status >= 500 || response.status === 429
    );
  }

  try {
    return {
      ok: true,
      provider: "nws",
      data: (await response.json()) as TData,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return providerFailure("nws_payload_error", "NWS response was not valid JSON.");
  }
}

export async function getNwsPoint(latitude: number, longitude: number) {
  const result = await fetchNwsJson<unknown>(
    `/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    86400
  );

  if (!result.ok) return result;

  const normalized = normalizeNwsPoint(result.data, latitude, longitude);

  if (!normalized) {
    return providerFailure<NwsPointMetadata>(
      "nws_payload_error",
      "NWS point response was unusable."
    );
  }

  return {
    ok: true as const,
    provider: "nws" as const,
    data: normalized,
    fetchedAt: result.fetchedAt,
  };
}

export async function getNwsForecastByGrid(
  gridId: string,
  gridX: number,
  gridY: number,
  latitude = 0,
  longitude = 0
) {
  const result = await fetchNwsJson<unknown>(
    `/gridpoints/${encodeURIComponent(gridId)}/${gridX},${gridY}/forecast`,
    900
  );

  if (!result.ok) return result;

  return {
    ok: true as const,
    provider: "nws" as const,
    data: normalizeNwsForecastPeriods(result.data, latitude, longitude),
    fetchedAt: result.fetchedAt,
  } satisfies WeatherProviderResult<NormalizedForecastPeriod[]>;
}

export async function getNwsHourlyForecastByGrid(
  gridId: string,
  gridX: number,
  gridY: number,
  latitude = 0,
  longitude = 0
) {
  const result = await fetchNwsJson<unknown>(
    `/gridpoints/${encodeURIComponent(gridId)}/${gridX},${gridY}/forecast/hourly`,
    900
  );

  if (!result.ok) return result;

  return {
    ok: true as const,
    provider: "nws" as const,
    data: normalizeNwsForecastPeriods(result.data, latitude, longitude),
    fetchedAt: result.fetchedAt,
  } satisfies WeatherProviderResult<NormalizedForecastPeriod[]>;
}

export async function getNwsActiveAlertsByArea(area: string) {
  const result = await fetchNwsJson<unknown>(
    `/alerts/active?area=${encodeURIComponent(area.toUpperCase())}`,
    300
  );

  if (!result.ok) return result;

  return {
    ok: true as const,
    provider: "nws" as const,
    data: normalizeNwsAlerts(result.data),
    fetchedAt: result.fetchedAt,
  } satisfies WeatherProviderResult<NormalizedWeatherAlert[]>;
}

export async function getNwsActiveAlertsByPoint(
  latitude: number,
  longitude: number
) {
  const result = await fetchNwsJson<unknown>(
    `/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    300
  );

  if (!result.ok) return result;

  return {
    ok: true as const,
    provider: "nws" as const,
    data: normalizeNwsAlerts(result.data),
    fetchedAt: result.fetchedAt,
  } satisfies WeatherProviderResult<NormalizedWeatherAlert[]>;
}
