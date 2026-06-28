export type WeatherProvider = "google" | "openweather" | "nws" | "auto";

export type ActiveWeatherProvider = Exclude<WeatherProvider, "auto">;

export type WeatherPredictiveStatus =
  | "ready"
  | "date_required"
  | "partial_window"
  | "forecast_window_exceeded"
  | "historical_unavailable"
  | "provider_unavailable"
  | "current_only"
  | "error";

export type RouteWeatherCoverage =
  | "none"
  | "origin_destination_only"
  | "route_segmented"
  | "route_unavailable";

export type TruckingWeatherRiskCategory =
  | "HIGH_WIND"
  | "WINTER_WEATHER"
  | "FLOODING"
  | "SEVERE_STORM"
  | "TORNADO"
  | "FOG_VISIBILITY"
  | "EXTREME_HEAT"
  | "EXTREME_COLD"
  | "FIRE_WEATHER"
  | "UNKNOWN_ALERT";

export type WeatherRiskSeverity =
  | "none"
  | "low"
  | "moderate"
  | "high"
  | "severe"
  | "unknown";

export type WeatherUnits = "imperial" | "metric" | "standard";

export type WeatherProviderError = {
  code: string;
  message: string;
  httpStatus: number | null;
  retryable: boolean;
  provider?: ActiveWeatherProvider;
  operation?: string;
  endpointPath?: string;
};

export type WeatherProviderResult<TData> =
  | {
      ok: true;
      provider: ActiveWeatherProvider;
      data: TData;
      fetchedAt: string;
    }
  | {
      ok: false;
      provider: ActiveWeatherProvider;
      error: WeatherProviderError;
      fetchedAt: string;
    };

export type NormalizedCurrentWeather = {
  provider: ActiveWeatherProvider;
  latitude: number;
  longitude: number;
  observedAt: string | null;
  fetchedAt: string;
  units: WeatherUnits;
  temperature: number | null;
  feelsLike: number | null;
  humidityPercent: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirectionDegrees: number | null;
  visibilityMeters: number | null;
  condition: string | null;
  description: string | null;
  rawProviderData?: unknown;
};

export type NormalizedForecastPeriod = {
  provider: ActiveWeatherProvider;
  latitude: number;
  longitude: number;
  forecastStart: string;
  forecastEnd: string | null;
  units: WeatherUnits;
  temperature: number | null;
  feelsLike: number | null;
  humidityPercent: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirectionDegrees: number | null;
  visibilityMeters: number | null;
  precipitationProbability: number | null;
  condition: string | null;
  description: string | null;
  rawProviderData?: unknown;
};

export type NormalizedWeatherAlert = {
  provider: ActiveWeatherProvider;
  event: string | null;
  headline: string | null;
  severity: WeatherRiskSeverity;
  urgency: string | null;
  certainty: string | null;
  effective: string | null;
  expires: string | null;
  areaDescription: string | null;
  description: string | null;
  instruction: string | null;
  categories: TruckingWeatherRiskCategory[];
  rawProviderData?: unknown;
};

export type WeatherAnalysisWindow = {
  start: string | null;
  end: string | null;
  timezone: string | null;
  inferred: boolean;
  notes: string[];
};

export type WeatherLoadAlignment = {
  weatherPredictiveStatus: WeatherPredictiveStatus;
  matchedLoadWindow: "none" | "pickup" | "pickup_delivery" | "inferred";
  analysisWindowStart: string | null;
  analysisWindowEnd: string | null;
  window: WeatherAnalysisWindow;
  notes: string[];
};

export type RouteWeatherCheckpointInput = {
  index?: number;
  label?: string;
  latitude: number;
  longitude: number;
  distanceFromOriginMiles?: number | null;
  estimatedArrivalTime?: string | null;
  timezone?: string | null;
};

export type WeatherRiskSignal = {
  category: TruckingWeatherRiskCategory;
  severity: WeatherRiskSeverity;
  provider: ActiveWeatherProvider;
  source: "current" | "forecast" | "alert";
  message: string;
  checkpointIndex?: number;
  matchedAt?: string | null;
  confidence: "low" | "medium" | "high";
  notes: string[];
};

export type RouteWeatherCheckpoint = {
  index: number;
  label: string;
  latitude: number;
  longitude: number;
  distanceFromOriginMiles: number | null;
  estimatedArrivalTime: string | null;
  timezone: string | null;
  providerUsed: ActiveWeatherProvider | null;
  forecastMatch: NormalizedForecastPeriod | null;
  alertMatches: NormalizedWeatherAlert[];
  predictiveStatus: WeatherPredictiveStatus;
  riskSignals: WeatherRiskSignal[];
  confidence: "low" | "medium" | "high";
  notes: string[];
};

export type RouteWeatherUncoveredSegment = {
  fromCheckpointIndex: number | null;
  toCheckpointIndex: number | null;
  distanceMiles: number | null;
  reason: string;
};

export type RouteWeatherAnalysis = {
  provider: WeatherProvider;
  routeWeatherCoverage: RouteWeatherCoverage;
  weatherPredictiveStatus: WeatherPredictiveStatus;
  analysisWindowStart: string | null;
  analysisWindowEnd: string | null;
  checkpoints: RouteWeatherCheckpoint[];
  highestRiskCategory: TruckingWeatherRiskCategory | null;
  highestRiskSeverity: WeatherRiskSeverity;
  uncoveredSegments: RouteWeatherUncoveredSegment[];
  riskSignals: WeatherRiskSignal[];
  summary: string;
};

export type NwsPointMetadata = {
  provider: "nws";
  latitude: number;
  longitude: number;
  gridId: string | null;
  gridX: number | null;
  gridY: number | null;
  forecastUrl: string | null;
  forecastHourlyUrl: string | null;
  relativeLocation: {
    city: string | null;
    state: string | null;
  };
  rawProviderData?: unknown;
};
