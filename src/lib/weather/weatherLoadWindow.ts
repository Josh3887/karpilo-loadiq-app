import type {
  WeatherLoadAlignment,
  WeatherPredictiveStatus,
} from "@/lib/weather/weatherTypes";

export type BuildWeatherAnalysisWindowInput = {
  pickupAt?: string | null;
  pickupWindowStart?: string | null;
  pickupWindowEnd?: string | null;
  departAt?: string | null;
  deliveryAt?: string | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  originTimezone?: string | null;
  destinationTimezone?: string | null;
  timezone?: string | null;
  estimatedRouteDurationMinutes?: number | null;
  estimatedRouteDistanceMiles?: number | null;
  maxForecastDays?: number;
  now?: Date;
};

const DEFAULT_MAX_FORECAST_DAYS = 10;

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function statusForWindow({
  start,
  end,
  now,
  maxForecastDays,
  fallback,
}: {
  start: Date | null;
  end: Date | null;
  now: Date;
  maxForecastDays: number;
  fallback: WeatherPredictiveStatus;
}): WeatherPredictiveStatus {
  if (!start) return "date_required";
  if (end && end.getTime() < now.getTime()) return "historical_unavailable";

  const forecastLimit = new Date(
    now.getTime() + maxForecastDays * 24 * 60 * 60 * 1000
  );

  if (start.getTime() > forecastLimit.getTime()) {
    return "forecast_window_exceeded";
  }
  if (end && end.getTime() > forecastLimit.getTime()) {
    return "forecast_window_exceeded";
  }

  return fallback;
}

export function buildWeatherAnalysisWindow(
  input: BuildWeatherAnalysisWindowInput
): WeatherLoadAlignment {
  const now = input.now ?? new Date();
  const maxForecastDays = input.maxForecastDays ?? DEFAULT_MAX_FORECAST_DAYS;
  const timezone =
    input.timezone ?? input.originTimezone ?? input.destinationTimezone ?? null;
  const pickupAt = parseDate(input.pickupAt);
  const pickupWindowStart = parseDate(input.pickupWindowStart);
  const pickupWindowEnd = parseDate(input.pickupWindowEnd);
  const departAt = parseDate(input.departAt);
  const deliveryAt = parseDate(input.deliveryAt);
  const deliveryWindowStart = parseDate(input.deliveryWindowStart);
  const deliveryWindowEnd = parseDate(input.deliveryWindowEnd);
  const notes: string[] = [];

  const start = departAt ?? pickupWindowStart ?? pickupAt;
  let end = deliveryWindowEnd ?? deliveryAt ?? deliveryWindowStart ?? null;
  let inferred = false;
  let matchedLoadWindow: WeatherLoadAlignment["matchedLoadWindow"] = "none";
  let fallbackStatus: WeatherPredictiveStatus = "ready";

  if (!start) {
    notes.push("Weather prediction requires pickup, departure, or window timing.");
    return {
      weatherPredictiveStatus: "date_required",
      matchedLoadWindow,
      analysisWindowStart: null,
      analysisWindowEnd: null,
      window: {
        start: null,
        end: null,
        timezone,
        inferred: false,
        notes,
      },
      notes,
    };
  }

  if (deliveryAt || deliveryWindowStart || deliveryWindowEnd) {
    matchedLoadWindow = "pickup_delivery";
  } else {
    matchedLoadWindow = "pickup";
  }

  if (!end && pickupWindowEnd) {
    end = pickupWindowEnd;
    fallbackStatus = "partial_window";
    notes.push("Pickup window end is used until delivery timing is available.");
  }

  const durationMinutes = Number(input.estimatedRouteDurationMinutes);

  if (!end && Number.isFinite(durationMinutes) && durationMinutes > 0) {
    end = addMinutes(start, durationMinutes);
    inferred = true;
    matchedLoadWindow = "inferred";
    fallbackStatus = "partial_window";
    notes.push(
      "Delivery window was inferred from estimated route duration and needs user confirmation."
    );
  }

  if (!end) {
    fallbackStatus = "partial_window";
    notes.push("Delivery timing is required for full route weather prediction.");
  }

  const status = statusForWindow({
    start,
    end,
    now,
    maxForecastDays,
    fallback: fallbackStatus,
  });

  if (status === "historical_unavailable") {
    notes.push("Historical weather is not available through the active providers.");
  }

  if (status === "forecast_window_exceeded") {
    notes.push("The load window exceeds the configured forecast range.");
  }

  return {
    weatherPredictiveStatus: status,
    matchedLoadWindow,
    analysisWindowStart: start.toISOString(),
    analysisWindowEnd: end?.toISOString() ?? null,
    window: {
      start: start.toISOString(),
      end: end?.toISOString() ?? null,
      timezone,
      inferred,
      notes,
    },
    notes,
  };
}
