import type {
  RouteWeatherCheckpointInput,
  WeatherProvider,
} from "@/lib/weather/weatherTypes";
import type {
  WeatherForecastType,
  WeatherLoadWindowInput,
  WeatherRouteRiskInput,
} from "@/lib/weather/weatherIntelligence";

const SUPPORTED_PROVIDERS = ["google", "openweather", "nws", "auto"] as const;
const CURRENT_PROVIDERS = ["google", "openweather", "auto"] as const;
const FORECAST_PROVIDERS = ["google", "openweather", "nws", "auto"] as const;

export type ParsedCoordinates =
  | {
      ok: true;
      latitude: number;
      longitude: number;
    }
  | {
      ok: false;
      message: string;
    };

export function weatherApiError(
  code: string,
  message: string,
  provider: WeatherProvider = "auto"
) {
  return {
    ok: false,
    source: "Karpilo Weather Intelligence",
    provider,
    error: {
      code,
      message,
    },
  };
}

export function parseCoordinates(
  lat: string | null,
  lon: string | null
): ParsedCoordinates {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return {
      ok: false,
      message: "Latitude must be numeric between -90 and 90.",
    };
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return {
      ok: false,
      message: "Longitude must be numeric between -180 and 180.",
    };
  }

  return {
    ok: true,
    latitude,
    longitude,
  };
}

export function parseOptionalNumber(value: string | null) {
  if (value === null || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function parsePositiveNumber(value: string | null) {
  const number = parseOptionalNumber(value);
  return number !== null && number > 0 ? number : null;
}

export function parseProvider(
  value: string | null,
  allowed: readonly WeatherProvider[] = SUPPORTED_PROVIDERS
): WeatherProvider | null {
  const normalized = (value ?? "auto").toLowerCase();

  return allowed.includes(normalized as WeatherProvider)
    ? (normalized as WeatherProvider)
    : null;
}

export function parseCurrentProvider(value: string | null) {
  return parseProvider(value, CURRENT_PROVIDERS);
}

export function parseForecastProvider(value: string | null) {
  return parseProvider(value, FORECAST_PROVIDERS);
}

export function parseForecastType(value: string | null): WeatherForecastType | null {
  if (!value) return "hourly";
  if (value === "hourly" || value === "daily") return value;
  return null;
}

export function parseHours(value: string | null) {
  const hours = parsePositiveNumber(value) ?? 24;
  return Math.min(Math.round(hours), 240);
}

export function parseDays(value: string | null) {
  const days = parsePositiveNumber(value) ?? 10;
  return Math.min(Math.round(days), 10);
}

export function parseArea(value: string | null) {
  if (!value) return null;
  const area = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(area) ? area : null;
}

export function loadWindowFromSearchParams(
  searchParams: URLSearchParams
): WeatherLoadWindowInput {
  return {
    pickupAt: searchParams.get("pickupAt"),
    pickupWindowStart: searchParams.get("pickupWindowStart"),
    pickupWindowEnd: searchParams.get("pickupWindowEnd"),
    departAt: searchParams.get("departAt"),
    deliveryAt: searchParams.get("deliveryAt"),
    deliveryWindowStart: searchParams.get("deliveryWindowStart"),
    deliveryWindowEnd: searchParams.get("deliveryWindowEnd"),
    estimatedRouteDurationMinutes: parsePositiveNumber(
      searchParams.get("estimatedRouteDurationMinutes")
    ),
    timezone: searchParams.get("timezone"),
    originTimezone: searchParams.get("originTimezone"),
    destinationTimezone: searchParams.get("destinationTimezone"),
  };
}

export function routeRiskFromSearchParams(
  searchParams: URLSearchParams
): WeatherRouteRiskInput {
  return {
    originLat: parseOptionalNumber(searchParams.get("originLat")),
    originLon: parseOptionalNumber(searchParams.get("originLon")),
    destinationLat: parseOptionalNumber(searchParams.get("destinationLat")),
    destinationLon: parseOptionalNumber(searchParams.get("destinationLon")),
    routeDistanceMiles: parsePositiveNumber(searchParams.get("routeDistanceMiles")),
    routeDurationMinutes: parsePositiveNumber(
      searchParams.get("routeDurationMinutes")
    ),
    routePolyline: searchParams.get("routePolyline"),
    provider: parseProvider(searchParams.get("provider")) ?? "auto",
    ...loadWindowFromSearchParams(searchParams),
  };
}

export function routeRiskFromBody(body: unknown): WeatherRouteRiskInput | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const record = body as Record<string, unknown>;

  return {
    originLat: numberFromUnknown(record.originLat),
    originLon: numberFromUnknown(record.originLon),
    destinationLat: numberFromUnknown(record.destinationLat),
    destinationLon: numberFromUnknown(record.destinationLon),
    routeDistanceMiles: positiveNumberFromUnknown(record.routeDistanceMiles),
    routeDurationMinutes: positiveNumberFromUnknown(record.routeDurationMinutes),
    routePolyline: stringFromUnknown(record.routePolyline),
    routeCheckpoints: routeCheckpointsFromUnknown(record.routeCheckpoints),
    provider:
      parseProvider(stringFromUnknown(record.provider)) ??
      "auto",
    pickupAt: stringFromUnknown(record.pickupAt),
    pickupWindowStart: stringFromUnknown(record.pickupWindowStart),
    pickupWindowEnd: stringFromUnknown(record.pickupWindowEnd),
    departAt: stringFromUnknown(record.departAt),
    deliveryAt: stringFromUnknown(record.deliveryAt),
    deliveryWindowStart: stringFromUnknown(record.deliveryWindowStart),
    deliveryWindowEnd: stringFromUnknown(record.deliveryWindowEnd),
    estimatedRouteDurationMinutes: positiveNumberFromUnknown(
      record.estimatedRouteDurationMinutes
    ),
    timezone: stringFromUnknown(record.timezone),
    originTimezone: stringFromUnknown(record.originTimezone),
    destinationTimezone: stringFromUnknown(record.destinationTimezone),
  };
}

function numberFromUnknown(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveNumberFromUnknown(value: unknown) {
  const number = numberFromUnknown(value);
  return number !== null && number > 0 ? number : null;
}

function stringFromUnknown(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function routeCheckpointsFromUnknown(value: unknown): RouteWeatherCheckpointInput[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value
    .map((entry, index): RouteWeatherCheckpointInput | null => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const record = entry as Record<string, unknown>;
      const latitude = numberFromUnknown(record.latitude);
      const longitude = numberFromUnknown(record.longitude);

      if (latitude === null || longitude === null) return null;

      return {
        index,
        label: stringFromUnknown(record.label) ?? undefined,
        latitude,
        longitude,
        distanceFromOriginMiles: positiveNumberFromUnknown(
          record.distanceFromOriginMiles
        ),
        estimatedArrivalTime: stringFromUnknown(record.estimatedArrivalTime),
        timezone: stringFromUnknown(record.timezone),
      };
    })
    .filter((entry): entry is RouteWeatherCheckpointInput => entry !== null);
}
