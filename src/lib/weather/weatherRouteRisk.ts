import {
  severityRank,
} from "@/lib/weather/weatherNormalize";
import type {
  ActiveWeatherProvider,
  NormalizedCurrentWeather,
  NormalizedForecastPeriod,
  NormalizedWeatherAlert,
  RouteWeatherAnalysis,
  RouteWeatherCheckpoint,
  RouteWeatherCheckpointInput,
  RouteWeatherCoverage,
  RouteWeatherUncoveredSegment,
  TruckingWeatherRiskCategory,
  WeatherAnalysisWindow,
  WeatherPredictiveStatus,
  WeatherRiskSeverity,
  WeatherRiskSignal,
} from "@/lib/weather/weatherTypes";

export type BuildRouteWeatherCheckpointsInput = {
  originLat?: number | null;
  originLon?: number | null;
  destinationLat?: number | null;
  destinationLon?: number | null;
  routeDistanceMiles?: number | null;
  routeDurationMinutes?: number | null;
  analysisWindowStart?: string | null;
  analysisWindowEnd?: string | null;
  routePolyline?: string | null;
  routeCheckpoints?: RouteWeatherCheckpointInput[];
};

export type BuildWeatherRiskSignalsInput = {
  provider: ActiveWeatherProvider;
  checkpointIndex?: number;
  current?: NormalizedCurrentWeather | null;
  forecast?: NormalizedForecastPeriod | null;
  alerts?: NormalizedWeatherAlert[];
};

export type AnalyzeRouteWeatherInput = {
  provider: ActiveWeatherProvider | "auto";
  coverage: RouteWeatherCoverage;
  predictiveStatus: WeatherPredictiveStatus;
  analysisWindow: WeatherAnalysisWindow;
  checkpoints: RouteWeatherCheckpoint[];
  uncoveredSegments?: RouteWeatherUncoveredSegment[];
};

function validCoordinate(latitude: unknown, longitude: unknown) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  return {
    latitude: lat,
    longitude: lon,
  };
}

function addMinutes(value: string | null | undefined, minutes: number) {
  if (!value) return null;
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + minutes * 60 * 1000).toISOString();
}

function checkpointEta(
  checkpoint: RouteWeatherCheckpointInput,
  durationMinutes: number | null,
  distanceMiles: number | null,
  analysisWindowStart: string | null | undefined,
  analysisWindowEnd: string | null | undefined
) {
  if (checkpoint.estimatedArrivalTime) return checkpoint.estimatedArrivalTime;
  if (!analysisWindowStart) return null;

  if (
    durationMinutes &&
    durationMinutes > 0 &&
    distanceMiles &&
    distanceMiles > 0 &&
    checkpoint.distanceFromOriginMiles !== null &&
    checkpoint.distanceFromOriginMiles !== undefined
  ) {
    return addMinutes(
      analysisWindowStart,
      Math.max(0, (checkpoint.distanceFromOriginMiles / distanceMiles) * durationMinutes)
    );
  }

  if (checkpoint.index === 0) return analysisWindowStart;
  return analysisWindowEnd ?? null;
}

export function buildRouteWeatherCheckpoints(
  input: BuildRouteWeatherCheckpointsInput
) {
  const routeDistanceMiles = positiveNumber(input.routeDistanceMiles);
  const routeDurationMinutes = positiveNumber(input.routeDurationMinutes);
  const uncoveredSegments: RouteWeatherUncoveredSegment[] = [];
  const supplied = (input.routeCheckpoints ?? [])
    .map((checkpoint, index) => {
      const coordinate = validCoordinate(checkpoint.latitude, checkpoint.longitude);
      if (!coordinate) return null;

      return {
        ...coordinate,
        index,
        label: checkpoint.label ?? `Checkpoint ${index + 1}`,
        distanceFromOriginMiles:
          positiveNumber(checkpoint.distanceFromOriginMiles) ?? null,
        estimatedArrivalTime: checkpointEta(
          { ...checkpoint, index },
          routeDurationMinutes,
          routeDistanceMiles,
          input.analysisWindowStart,
          input.analysisWindowEnd
        ),
        timezone: checkpoint.timezone ?? null,
      };
    })
    .filter((checkpoint): checkpoint is RouteWeatherCheckpointInput & {
      index: number;
      label: string;
      latitude: number;
      longitude: number;
      distanceFromOriginMiles: number | null;
      estimatedArrivalTime: string | null;
      timezone: string | null;
    } => Boolean(checkpoint));

  if (supplied.length > 2) {
    return {
      coverage: "route_segmented" as const,
      checkpoints: sampleCheckpoints(supplied).map(emptyCheckpoint),
      uncoveredSegments,
    };
  }

  const origin = validCoordinate(input.originLat, input.originLon);
  const destination = validCoordinate(input.destinationLat, input.destinationLon);

  if (!origin || !destination) {
    return {
      coverage: "route_unavailable" as const,
      checkpoints: [],
      uncoveredSegments: [
        {
          fromCheckpointIndex: null,
          toCheckpointIndex: null,
          distanceMiles: routeDistanceMiles,
          reason:
            "Origin and destination coordinates are required for route weather analysis.",
        },
      ],
    };
  }

  if (input.routePolyline) {
    uncoveredSegments.push({
      fromCheckpointIndex: 0,
      toCheckpointIndex: 1,
      distanceMiles: routeDistanceMiles,
      reason:
        "Route polyline decoding is deferred because current Route Intelligence does not return geometry.",
    });
  }

  return {
    coverage: "origin_destination_only" as const,
    checkpoints: [
      emptyCheckpoint({
        index: 0,
        label: "Origin",
        latitude: origin.latitude,
        longitude: origin.longitude,
        distanceFromOriginMiles: 0,
        estimatedArrivalTime: input.analysisWindowStart ?? null,
        timezone: null,
      }),
      emptyCheckpoint({
        index: 1,
        label: "Destination",
        latitude: destination.latitude,
        longitude: destination.longitude,
        distanceFromOriginMiles: routeDistanceMiles,
        estimatedArrivalTime:
          input.analysisWindowEnd ??
          addMinutes(input.analysisWindowStart, routeDurationMinutes ?? 0),
        timezone: null,
      }),
    ],
    uncoveredSegments,
  };
}

function sampleCheckpoints<T extends { index: number }>(checkpoints: T[]) {
  if (checkpoints.length <= 10) return checkpoints;
  const first = checkpoints[0];
  const last = checkpoints[checkpoints.length - 1];
  const middle = checkpoints.filter((_, index) => index > 0 && index < checkpoints.length - 1);
  const step = Math.ceil(middle.length / 8);

  return [
    first,
    ...middle.filter((_, index) => index % step === 0).slice(0, 8),
    last,
  ].filter((checkpoint): checkpoint is T => Boolean(checkpoint));
}

function emptyCheckpoint(input: {
  index: number;
  label: string;
  latitude: number;
  longitude: number;
  distanceFromOriginMiles: number | null;
  estimatedArrivalTime: string | null;
  timezone: string | null;
}): RouteWeatherCheckpoint {
  return {
    index: input.index,
    label: input.label,
    latitude: input.latitude,
    longitude: input.longitude,
    distanceFromOriginMiles: input.distanceFromOriginMiles,
    estimatedArrivalTime: input.estimatedArrivalTime,
    timezone: input.timezone,
    providerUsed: null,
    forecastMatch: null,
    alertMatches: [],
    predictiveStatus: input.estimatedArrivalTime ? "ready" : "partial_window",
    riskSignals: [],
    confidence: "low",
    notes: [],
  };
}

function positiveNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function signal(
  input: Omit<WeatherRiskSignal, "notes"> & { notes?: string[] }
): WeatherRiskSignal {
  return {
    ...input,
    notes: input.notes ?? [],
  };
}

export function buildWeatherRiskSignals({
  provider,
  checkpointIndex,
  current,
  forecast,
  alerts = [],
}: BuildWeatherRiskSignalsInput): WeatherRiskSignal[] {
  const signals: WeatherRiskSignal[] = [];
  const weather = forecast ?? current ?? null;

  if (weather?.windGust !== null && weather?.windGust !== undefined && weather.windGust >= 45) {
    signals.push(
      signal({
        provider,
        checkpointIndex,
        source: forecast ? "forecast" : "current",
        category: "HIGH_WIND",
        severity: weather.windGust >= 60 ? "severe" : "high",
        matchedAt: forecast?.forecastStart ?? current?.observedAt ?? null,
        confidence: "medium",
        message: "High wind exposure may impact safe operating conditions.",
      })
    );
  }

  if (weather?.visibilityMeters !== null && weather?.visibilityMeters !== undefined && weather.visibilityMeters < 1600) {
    signals.push(
      signal({
        provider,
        checkpointIndex,
        source: forecast ? "forecast" : "current",
        category: "FOG_VISIBILITY",
        severity: weather.visibilityMeters < 400 ? "high" : "moderate",
        matchedAt: forecast?.forecastStart ?? current?.observedAt ?? null,
        confidence: "medium",
        message: "Low visibility exposure may affect travel timing.",
      })
    );
  }

  const text = `${weather?.condition ?? ""} ${weather?.description ?? ""}`.toLowerCase();

  if (/snow|ice|sleet|freezing|winter/.test(text)) {
    signals.push(
      signal({
        provider,
        checkpointIndex,
        source: forecast ? "forecast" : "current",
        category: "WINTER_WEATHER",
        severity: "moderate",
        matchedAt: forecast?.forecastStart ?? current?.observedAt ?? null,
        confidence: "medium",
        message: "Winter weather exposure may impact route timing.",
      })
    );
  }

  if (/thunderstorm|severe|hail|lightning/.test(text)) {
    signals.push(
      signal({
        provider,
        checkpointIndex,
        source: forecast ? "forecast" : "current",
        category: "SEVERE_STORM",
        severity: "moderate",
        matchedAt: forecast?.forecastStart ?? current?.observedAt ?? null,
        confidence: "medium",
        message: "Storm exposure may impact schedule reliability.",
      })
    );
  }

  if (weather?.temperature !== null && weather?.temperature !== undefined) {
    if (weather.temperature >= 100) {
      signals.push(
        signal({
          provider,
          checkpointIndex,
          source: forecast ? "forecast" : "current",
          category: "EXTREME_HEAT",
          severity: weather.temperature >= 110 ? "high" : "moderate",
          matchedAt: forecast?.forecastStart ?? current?.observedAt ?? null,
          confidence: "medium",
          message: "Extreme heat exposure may add equipment and driver stress.",
        })
      );
    }

    if (weather.temperature <= 10) {
      signals.push(
        signal({
          provider,
          checkpointIndex,
          source: forecast ? "forecast" : "current",
          category: "EXTREME_COLD",
          severity: weather.temperature <= -10 ? "high" : "moderate",
          matchedAt: forecast?.forecastStart ?? current?.observedAt ?? null,
          confidence: "medium",
          message: "Extreme cold exposure may add equipment and timing risk.",
        })
      );
    }
  }

  alerts.forEach((alert) => {
    const categories = alert.categories.length
      ? alert.categories
      : (["UNKNOWN_ALERT"] as TruckingWeatherRiskCategory[]);

    categories.forEach((category) => {
      signals.push(
        signal({
          provider: alert.provider,
          checkpointIndex,
          source: "alert",
          category,
          severity: alert.severity,
          matchedAt: alert.effective,
          confidence: alert.provider === "nws" ? "high" : "medium",
          message:
            alert.headline ??
            alert.event ??
            "Official weather alert evidence may affect operating risk.",
        })
      );
    });
  });

  return signals;
}

export function analyzeRouteWeather({
  provider,
  coverage,
  predictiveStatus,
  analysisWindow,
  checkpoints,
  uncoveredSegments = [],
}: AnalyzeRouteWeatherInput): RouteWeatherAnalysis {
  const riskSignals = checkpoints.flatMap((checkpoint) => checkpoint.riskSignals);
  const highest = highestSignal(riskSignals);

  return {
    provider,
    routeWeatherCoverage: checkpoints.length ? coverage : "none",
    weatherPredictiveStatus: predictiveStatus,
    analysisWindowStart: analysisWindow.start,
    analysisWindowEnd: analysisWindow.end,
    checkpoints,
    highestRiskCategory: highest?.category ?? null,
    highestRiskSeverity: highest?.severity ?? "none",
    uncoveredSegments,
    riskSignals,
    summary: routeWeatherSummary({
      coverage,
      predictiveStatus,
      checkpoints,
      riskSignals,
      highestSeverity: highest?.severity ?? "none",
    }),
  };
}

function highestSignal(signals: WeatherRiskSignal[]) {
  return [...signals].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity)
  )[0];
}

function routeWeatherSummary({
  coverage,
  predictiveStatus,
  checkpoints,
  riskSignals,
  highestSeverity,
}: {
  coverage: RouteWeatherCoverage;
  predictiveStatus: WeatherPredictiveStatus;
  checkpoints: RouteWeatherCheckpoint[];
  riskSignals: WeatherRiskSignal[];
  highestSeverity: WeatherRiskSeverity;
}) {
  if (predictiveStatus === "date_required") {
    return "Weather exposure needs load date/time context before predictive route weather can be evaluated.";
  }
  if (predictiveStatus === "historical_unavailable") {
    return "The load window is historical; active forecast providers cannot validate past route weather.";
  }
  if (predictiveStatus === "forecast_window_exceeded") {
    return "The load window is beyond the configured forecast range.";
  }
  if (!checkpoints.length || coverage === "none" || coverage === "route_unavailable") {
    return "Route weather exposure could not be evaluated because route coordinates were unavailable.";
  }
  if (!riskSignals.length) {
    return "No major weather exposure signals were detected for the evaluated route checkpoints.";
  }

  return `${highestSeverity} route weather exposure detected across ${checkpoints.length} checkpoint(s). Use this as decision support only, not dispatch, navigation, legal, safety-compliance, or guaranteed-delay authority.`;
}
