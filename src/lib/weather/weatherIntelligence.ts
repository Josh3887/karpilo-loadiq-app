import "server-only";

import {
  getGoogleCurrentWeather,
  getGoogleDailyForecast,
  getGoogleHourlyForecast,
  getGooglePublicAlerts,
} from "@/lib/weather/providers/googleWeather";
import {
  getNwsActiveAlertsByArea,
  getNwsActiveAlertsByPoint,
  getNwsForecastByGrid,
  getNwsHourlyForecastByGrid,
  getNwsPoint,
} from "@/lib/weather/providers/nws";
import {
  getOpenWeatherCurrentAndForecast,
  getOpenWeatherOneCall,
} from "@/lib/weather/providers/openWeather";
import { buildWeatherAnalysisWindow } from "@/lib/weather/weatherLoadWindow";
import {
  analyzeRouteWeather as summarizeRouteWeather,
  buildRouteWeatherCheckpoints,
  buildWeatherRiskSignals,
} from "@/lib/weather/weatherRouteRisk";
import { severityRank } from "@/lib/weather/weatherNormalize";
import type {
  NormalizedCurrentWeather,
  NormalizedForecastPeriod,
  NormalizedWeatherAlert,
  RouteWeatherAnalysis,
  RouteWeatherCheckpoint,
  RouteWeatherCheckpointInput,
  WeatherLoadAlignment,
  WeatherProvider,
  WeatherProviderError,
  WeatherRiskSignal,
  WeatherUnits,
} from "@/lib/weather/weatherTypes";

type WeatherIntelligenceSuccess<TData> = {
  ok: true;
  source: "Karpilo Weather Intelligence";
  provider: WeatherProvider;
  data: TData;
  errors?: WeatherProviderError[];
};

type WeatherIntelligenceFailure = {
  ok: false;
  source: "Karpilo Weather Intelligence";
  provider: WeatherProvider;
  error: WeatherProviderError;
  errors?: WeatherProviderError[];
};

export type WeatherIntelligenceResult<TData> =
  | WeatherIntelligenceSuccess<TData>
  | WeatherIntelligenceFailure;

export type WeatherForecastType = "hourly" | "daily";

export type WeatherLoadWindowInput = {
  pickupAt?: string | null;
  pickupWindowStart?: string | null;
  pickupWindowEnd?: string | null;
  departAt?: string | null;
  deliveryAt?: string | null;
  deliveryWindowStart?: string | null;
  deliveryWindowEnd?: string | null;
  estimatedRouteDurationMinutes?: number | null;
  timezone?: string | null;
  originTimezone?: string | null;
  destinationTimezone?: string | null;
};

export type WeatherRiskPointInput = WeatherLoadWindowInput & {
  latitude: number;
  longitude: number;
  area?: string | null;
  provider?: WeatherProvider;
};

export type WeatherRouteRiskInput = WeatherLoadWindowInput & {
  originLat?: number | null;
  originLon?: number | null;
  destinationLat?: number | null;
  destinationLon?: number | null;
  routeDistanceMiles?: number | null;
  routeDurationMinutes?: number | null;
  routePolyline?: string | null;
  routeCheckpoints?: RouteWeatherCheckpointInput[];
  provider?: WeatherProvider;
};

const SOURCE = "Karpilo Weather Intelligence" as const;

function failure<TData>(
  provider: WeatherProvider,
  error: WeatherProviderError,
  errors?: WeatherProviderError[]
): WeatherIntelligenceResult<TData> {
  return {
    ok: false,
    source: SOURCE,
    provider,
    error,
    errors,
  };
}

function success<TData>(
  provider: WeatherProvider,
  data: TData,
  errors?: WeatherProviderError[]
): WeatherIntelligenceResult<TData> {
  return {
    ok: true,
    source: SOURCE,
    provider,
    data,
    errors,
  };
}

function providerUnavailable(
  code: string,
  message: string,
  retryable = false
): WeatherProviderError {
  return {
    code,
    message,
    httpStatus: null,
    retryable,
  };
}

function firstError(errors: WeatherProviderError[]) {
  return (
    errors[0] ??
    providerUnavailable(
      "provider_unavailable",
      "Weather provider is unavailable.",
      true
    )
  );
}

export async function getWeatherCurrent(
  latitude: number,
  longitude: number,
  provider: WeatherProvider = "auto",
  units: WeatherUnits = "imperial"
): Promise<WeatherIntelligenceResult<NormalizedCurrentWeather>> {
  if (provider === "google" || provider === "auto") {
    const google = await getGoogleCurrentWeather(latitude, longitude, { units });

    if (google.ok) return success("google", google.data);
    if (provider === "google") return failure("google", google.error);

    const openweather = await openWeatherCurrent(latitude, longitude, units);
    if (openweather.ok) {
      return success("openweather", openweather.data, [google.error]);
    }

    return failure("auto", firstError([google.error, openweather.error]), [
      google.error,
      openweather.error,
    ]);
  }

  if (provider === "openweather") {
    const openweather = await openWeatherCurrent(latitude, longitude, units);
    return openweather.ok
      ? success("openweather", openweather.data)
      : failure("openweather", openweather.error);
  }

  return failure(
    provider,
    providerUnavailable(
      "unsupported_current_weather_provider",
      "Current weather supports google, openweather, or auto."
    )
  );
}

async function openWeatherCurrent(
  latitude: number,
  longitude: number,
  units: WeatherUnits
) {
  const result = await getOpenWeatherCurrentAndForecast(latitude, longitude, {
    units,
  });

  if (!result.ok) return result;
  if (!result.data.current) {
    return {
      ok: false as const,
      provider: "openweather" as const,
      error: providerUnavailable(
        "openweather_payload_error",
        "OpenWeather current response was unusable."
      ),
      fetchedAt: new Date().toISOString(),
    };
  }

  return {
    ok: true as const,
    provider: "openweather" as const,
    data: result.data.current,
    fetchedAt: result.fetchedAt,
  };
}

export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  options: {
    provider?: WeatherProvider;
    type?: WeatherForecastType;
    hours?: number;
    days?: number;
    units?: WeatherUnits;
  } = {}
): Promise<WeatherIntelligenceResult<NormalizedForecastPeriod[]>> {
  const provider = options.provider ?? "auto";
  const type = options.type ?? "hourly";
  const units = options.units ?? "imperial";

  if (provider === "google" || provider === "auto") {
    const google =
      type === "daily"
        ? await getGoogleDailyForecast(latitude, longitude, {
            days: options.days,
            units,
          })
        : await getGoogleHourlyForecast(latitude, longitude, {
            hours: options.hours,
            units,
          });

    if (google.ok) return success("google", google.data);
    if (provider === "google") return failure("google", google.error);

    const openweather = await openWeatherForecast(latitude, longitude, type, units);
    if (openweather.ok) {
      return success("openweather", sliceForecast(openweather.data, options), [
        google.error,
      ]);
    }

    return failure("auto", firstError([google.error, openweather.error]), [
      google.error,
      openweather.error,
    ]);
  }

  if (provider === "openweather") {
    const openweather = await openWeatherForecast(latitude, longitude, type, units);
    return openweather.ok
      ? success("openweather", sliceForecast(openweather.data, options))
      : failure("openweather", openweather.error);
  }

  if (provider === "nws") {
    const nws = await nwsForecast(latitude, longitude, type);
    return nws.ok ? success("nws", nws.data) : failure("nws", nws.error);
  }

  return failure(
    provider,
    providerUnavailable(
      "unsupported_forecast_provider",
      "Forecast supports google, openweather, nws, or auto."
    )
  );
}

async function openWeatherForecast(
  latitude: number,
  longitude: number,
  type: WeatherForecastType,
  units: WeatherUnits
) {
  const result = await getOpenWeatherOneCall(latitude, longitude, { units });

  if (!result.ok) return result;

  return {
    ok: true as const,
    provider: "openweather" as const,
    data: type === "daily" ? result.data.daily : result.data.hourly,
    fetchedAt: result.fetchedAt,
  };
}

async function nwsForecast(
  latitude: number,
  longitude: number,
  type: WeatherForecastType
) {
  const point = await getNwsPoint(latitude, longitude);

  if (!point.ok) return point;
  const { gridId, gridX, gridY } = point.data;

  if (!gridId || gridX === null || gridY === null) {
    return {
      ok: false as const,
      provider: "nws" as const,
      error: providerUnavailable(
        "nws_grid_unavailable",
        "NWS point response did not include grid coordinates."
      ),
      fetchedAt: new Date().toISOString(),
    };
  }

  return type === "daily"
    ? getNwsForecastByGrid(gridId, gridX, gridY, latitude, longitude)
    : getNwsHourlyForecastByGrid(gridId, gridX, gridY, latitude, longitude);
}

function sliceForecast(
  periods: NormalizedForecastPeriod[],
  options: { type?: WeatherForecastType; hours?: number; days?: number }
) {
  if (options.type === "daily") return periods.slice(0, options.days ?? 10);
  return periods.slice(0, options.hours ?? 24);
}

export async function getWeatherAlerts({
  latitude,
  longitude,
  area,
  provider = "auto",
  loadWindow,
}: {
  latitude?: number | null;
  longitude?: number | null;
  area?: string | null;
  provider?: WeatherProvider;
  loadWindow?: WeatherLoadWindowInput;
}): Promise<WeatherIntelligenceResult<NormalizedWeatherAlert[]>> {
  const alignment = loadWindow
    ? buildWeatherAnalysisWindow(loadWindow)
    : null;
  const errors: WeatherProviderError[] = [];
  const alerts: NormalizedWeatherAlert[] = [];

  const coordinates = coordinatesFrom(latitude, longitude);

  if ((provider === "google" || provider === "auto") && coordinates) {
    const google = await getGooglePublicAlerts(
      coordinates.latitude,
      coordinates.longitude
    );
    if (google.ok) alerts.push(...google.data);
    else errors.push(google.error);
    if (provider === "google") {
      return google.ok
        ? success("google", filterAlerts(alerts, alignment))
        : failure("google", google.error);
    }
  }

  if ((provider === "openweather" || provider === "auto") && coordinates) {
    const openweather = await getOpenWeatherOneCall(
      coordinates.latitude,
      coordinates.longitude
    );
    if (openweather.ok) alerts.push(...openweather.data.alerts);
    else errors.push(openweather.error);
    if (provider === "openweather") {
      return openweather.ok
        ? success("openweather", filterAlerts(alerts, alignment))
        : failure("openweather", openweather.error);
    }
  }

  if (provider === "nws" || provider === "auto") {
    const nwsAlerts = await getNwsAlerts({ latitude, longitude, area });
    if (nwsAlerts.ok) alerts.push(...nwsAlerts.data);
    else errors.push(nwsAlerts.error);
    if (provider === "nws") {
      return nwsAlerts.ok
        ? success("nws", filterAlerts(alerts, alignment))
        : failure("nws", nwsAlerts.error);
    }
  }

  const deduped = dedupeAlerts(filterAlerts(alerts, alignment));

  if (deduped.length || errors.length < 3) {
    return success("auto", deduped, errors.length ? errors : undefined);
  }

  return failure("auto", firstError(errors), errors);
}

async function getNwsAlerts({
  latitude,
  longitude,
  area,
}: {
  latitude?: number | null;
  longitude?: number | null;
  area?: string | null;
}) {
  if (area) return getNwsActiveAlertsByArea(area);
  const coordinates = coordinatesFrom(latitude, longitude);

  if (coordinates) {
    return getNwsActiveAlertsByPoint(
      coordinates.latitude,
      coordinates.longitude
    );
  }

  return {
    ok: false as const,
    provider: "nws" as const,
    error: providerUnavailable(
      "nws_alert_location_required",
      "NWS alerts require area or coordinates."
    ),
    fetchedAt: new Date().toISOString(),
  };
}

function filterAlerts(
  alerts: NormalizedWeatherAlert[],
  alignment: WeatherLoadAlignment | null
) {
  if (!alignment?.analysisWindowStart || !alignment.analysisWindowEnd) {
    return alerts;
  }

  const start = new Date(alignment.analysisWindowStart).getTime();
  const end = new Date(alignment.analysisWindowEnd).getTime();

  return alerts.filter((alert) => {
    const effective = alert.effective ? new Date(alert.effective).getTime() : start;
    const expires = alert.expires ? new Date(alert.expires).getTime() : end;
    return effective <= end && expires >= start;
  });
}

function dedupeAlerts(alerts: NormalizedWeatherAlert[]) {
  const seen = new Set<string>();

  return alerts.filter((alert) => {
    const key = [
      alert.provider,
      alert.event,
      alert.headline,
      alert.effective,
      alert.expires,
    ].join("|");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getWeatherRisk(
  input: WeatherRiskPointInput
): Promise<WeatherIntelligenceResult<{
  loadAlignment: WeatherLoadAlignment;
  current: NormalizedCurrentWeather | null;
  forecastMatch: NormalizedForecastPeriod | null;
  alerts: NormalizedWeatherAlert[];
  riskSignals: WeatherRiskSignal[];
  highestRiskCategory: string | null;
  highestRiskSeverity: string;
  summary: string;
}>> {
  const loadAlignment = buildWeatherAnalysisWindow(input);

  if (
    loadAlignment.weatherPredictiveStatus === "date_required" ||
    loadAlignment.weatherPredictiveStatus === "historical_unavailable" ||
    loadAlignment.weatherPredictiveStatus === "forecast_window_exceeded"
  ) {
    return success(input.provider ?? "auto", {
      loadAlignment,
      current: null,
      forecastMatch: null,
      alerts: [],
      riskSignals: [],
      highestRiskCategory: null,
      highestRiskSeverity: "none",
      summary:
        "Weather risk needs a valid load window before predictive exposure can be evaluated.",
    });
  }

  const forecast = await getWeatherForecast(input.latitude, input.longitude, {
    provider: input.provider,
    type: "hourly",
    hours: 240,
  });
  const alerts = await getWeatherAlerts({
    latitude: input.latitude,
    longitude: input.longitude,
    area: input.area,
    provider: input.provider,
    loadWindow: input,
  });
  const forecastMatch = forecast.ok
    ? matchForecastToTime(forecast.data, loadAlignment.analysisWindowStart)
    : null;
  const alertMatches = alerts.ok ? alerts.data : [];
  const provider =
    forecast.ok && forecast.provider !== "auto"
      ? forecast.provider
      : alerts.ok && alerts.provider !== "auto"
        ? alerts.provider
        : "openweather";
  const riskSignals = buildWeatherRiskSignals({
    provider,
    forecast: forecastMatch,
    alerts: alertMatches,
  });
  const highest = highestSignal(riskSignals);

  return success(input.provider ?? "auto", {
    loadAlignment,
    current: null,
    forecastMatch,
    alerts: alertMatches,
    riskSignals,
    highestRiskCategory: highest?.category ?? null,
    highestRiskSeverity: highest?.severity ?? "none",
    summary: riskSignals.length
      ? `${highest?.severity ?? "unknown"} weather exposure may impact this load window. This is decision support only.`
      : "No major weather exposure signals were detected for the supplied load window.",
  });
}

export async function getRouteWeatherAnalysis(
  input: WeatherRouteRiskInput
): Promise<WeatherIntelligenceResult<RouteWeatherAnalysis>> {
  const loadAlignment = buildWeatherAnalysisWindow({
    ...input,
    estimatedRouteDurationMinutes:
      input.estimatedRouteDurationMinutes ?? input.routeDurationMinutes,
  });
  const route = buildRouteWeatherCheckpoints({
    originLat: input.originLat,
    originLon: input.originLon,
    destinationLat: input.destinationLat,
    destinationLon: input.destinationLon,
    routeDistanceMiles: input.routeDistanceMiles,
    routeDurationMinutes: input.routeDurationMinutes,
    analysisWindowStart: loadAlignment.analysisWindowStart,
    analysisWindowEnd: loadAlignment.analysisWindowEnd,
    routePolyline: input.routePolyline,
    routeCheckpoints: input.routeCheckpoints,
  });

  if (
    loadAlignment.weatherPredictiveStatus === "date_required" ||
    loadAlignment.weatherPredictiveStatus === "historical_unavailable" ||
    loadAlignment.weatherPredictiveStatus === "forecast_window_exceeded"
  ) {
    return success(
      input.provider ?? "auto",
      summarizeRouteWeather({
        provider: input.provider ?? "auto",
        coverage: route.coverage,
        predictiveStatus: loadAlignment.weatherPredictiveStatus,
        analysisWindow: loadAlignment.window,
        checkpoints: route.checkpoints,
        uncoveredSegments: route.uncoveredSegments,
      })
    );
  }

  const checkpoints = await Promise.all(
    route.checkpoints.map(async (checkpoint) =>
      hydrateRouteWeatherCheckpoint(checkpoint, input.provider ?? "auto")
    )
  );

  return success(
    input.provider ?? "auto",
    summarizeRouteWeather({
      provider: input.provider ?? "auto",
      coverage: route.coverage,
      predictiveStatus: loadAlignment.weatherPredictiveStatus,
      analysisWindow: loadAlignment.window,
      checkpoints,
      uncoveredSegments: route.uncoveredSegments,
    })
  );
}

async function hydrateRouteWeatherCheckpoint(
  checkpoint: RouteWeatherCheckpoint,
  provider: WeatherProvider
): Promise<RouteWeatherCheckpoint> {
  const forecast = await getWeatherForecast(checkpoint.latitude, checkpoint.longitude, {
    provider,
    type: "hourly",
    hours: 240,
  });
  const alerts = await getWeatherAlerts({
    latitude: checkpoint.latitude,
    longitude: checkpoint.longitude,
    provider,
  });
  const forecastMatch = forecast.ok
    ? matchForecastToTime(forecast.data, checkpoint.estimatedArrivalTime)
    : null;
  const alertMatches = alerts.ok ? alerts.data : [];
  const providerUsed =
    forecast.ok && forecast.provider !== "auto"
      ? forecast.provider
      : alerts.ok && alerts.provider !== "auto"
        ? alerts.provider
        : null;
  const riskSignals = providerUsed
    ? buildWeatherRiskSignals({
        provider: providerUsed,
        checkpointIndex: checkpoint.index,
        forecast: forecastMatch,
        alerts: alertMatches,
      })
    : [];

  return {
    ...checkpoint,
    providerUsed,
    forecastMatch,
    alertMatches,
    riskSignals,
    predictiveStatus: forecast.ok || alerts.ok ? "ready" : "provider_unavailable",
    confidence: forecastMatch || alertMatches.length ? "medium" : "low",
    notes: [
      ...checkpoint.notes,
      ...(forecast.ok ? [] : [`Forecast unavailable: ${forecast.error.message}`]),
      ...(alerts.ok ? [] : [`Alerts unavailable: ${alerts.error.message}`]),
    ],
  };
}

function matchForecastToTime(
  periods: NormalizedForecastPeriod[],
  isoTime: string | null | undefined
) {
  if (!periods.length) return null;
  if (!isoTime) return periods[0] ?? null;
  const target = new Date(isoTime).getTime();
  if (Number.isNaN(target)) return periods[0] ?? null;

  return (
    periods.find((period) => {
      const start = new Date(period.forecastStart).getTime();
      const end = period.forecastEnd
        ? new Date(period.forecastEnd).getTime()
        : start + 60 * 60 * 1000;
      return start <= target && end >= target;
    }) ??
    [...periods].sort(
      (a, b) =>
        Math.abs(new Date(a.forecastStart).getTime() - target) -
        Math.abs(new Date(b.forecastStart).getTime() - target)
    )[0] ??
    null
  );
}

function highestSignal(signals: WeatherRiskSignal[]) {
  return [...signals].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity)
  )[0];
}

function coordinatesFrom(
  latitude: number | null | undefined,
  longitude: number | null | undefined
):
  | {
      latitude: number;
      longitude: number;
    }
  | null {
  if (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return { latitude, longitude };
  }

  return null;
}
