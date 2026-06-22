import "server-only";

import type {
  WeatherFailureCode,
  WeatherProviderFailure,
  WeatherProviderId,
} from "@/types/weather";

type WeatherFailureInput = {
  providerId: WeatherProviderId;
  code: WeatherFailureCode;
  message: string;
  safeMessage?: string;
  retryable?: boolean;
  httpStatus?: number | null;
};

const DEFAULT_SAFE_MESSAGES: Record<WeatherFailureCode, string> = {
  invalid_coordinates:
    "Weather lookup requires valid latitude and longitude coordinates.",
  missing_openweather_api_key:
    "Weather provider is not configured. Add the server-side OpenWeather key before enabling live weather.",
  invalid_openweather_api_key:
    "Weather provider rejected the configured OpenWeather key.",
  openweather_rate_limited:
    "Weather provider rate limit was reached. Try again later.",
  openweather_http_error:
    "Weather provider is unavailable. Try again later.",
  openweather_network_error:
    "Weather provider request failed. Try again later.",
  openweather_payload_error:
    "Weather provider returned an unusable response.",
};

export function createWeatherFailure({
  providerId,
  code,
  message,
  safeMessage,
  retryable = false,
  httpStatus = null,
}: WeatherFailureInput): WeatherProviderFailure {
  return {
    status: "unavailable",
    providerId,
    code,
    message,
    safeMessage: safeMessage ?? DEFAULT_SAFE_MESSAGES[code],
    retryable,
    httpStatus,
    fetchedAt: new Date().toISOString(),
  };
}

export function logWeatherFailure(failure: WeatherProviderFailure) {
  console.error("WEATHER_PROVIDER_ERROR:", {
    providerId: failure.providerId,
    code: failure.code,
    httpStatus: failure.httpStatus,
    message: failure.message,
  });
}
