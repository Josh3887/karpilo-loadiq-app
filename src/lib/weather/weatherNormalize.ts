import type {
  NormalizedCurrentWeather,
  NormalizedForecastPeriod,
  NormalizedWeatherAlert,
  NwsPointMetadata,
  TruckingWeatherRiskCategory,
  WeatherRiskSeverity,
  WeatherUnits,
} from "@/lib/weather/weatherTypes";

type RecordValue = Record<string, unknown>;

export function asRecord(value: unknown): RecordValue | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordValue)
    : null;
}

export function numberValue(value: unknown): number | null {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

export function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isoFromUnixSeconds(value: unknown) {
  const seconds = numberValue(value);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
}

export function safeIso(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function firstWeather(value: unknown) {
  return Array.isArray(value) ? asRecord(value[0]) : null;
}

function googleIntervalTime(value: unknown) {
  const record = asRecord(value);
  return safeIso(record?.startTime) ?? safeIso(record?.endTime);
}

function googleTemperature(value: unknown) {
  const record = asRecord(value);
  return numberValue(record?.degrees) ?? numberValue(record?.value);
}

function googleWindSpeed(value: unknown) {
  const record = asRecord(value);
  return numberValue(record?.value);
}

function severityFromProvider(value: unknown): WeatherRiskSeverity {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized.includes("extreme") || normalized.includes("severe")) {
    return "severe";
  }
  if (normalized.includes("high")) return "high";
  if (normalized.includes("moderate")) return "moderate";
  if (normalized.includes("minor") || normalized.includes("low")) return "low";
  if (normalized.includes("none")) return "none";

  return "unknown";
}

export function categorizeWeatherText(
  text: string | null | undefined
): TruckingWeatherRiskCategory[] {
  const value = String(text ?? "").toLowerCase();
  const categories = new Set<TruckingWeatherRiskCategory>();

  if (/wind|gust|blizzard/.test(value)) categories.add("HIGH_WIND");
  if (/snow|ice|sleet|winter|blizzard|freezing/.test(value)) {
    categories.add("WINTER_WEATHER");
  }
  if (/flood|flash flood|river/.test(value)) categories.add("FLOODING");
  if (/thunderstorm|severe storm|hail|lightning/.test(value)) {
    categories.add("SEVERE_STORM");
  }
  if (/tornado/.test(value)) categories.add("TORNADO");
  if (/fog|visibility|smoke|haze/.test(value)) {
    categories.add("FOG_VISIBILITY");
  }
  if (/heat|hot|excessive heat/.test(value)) categories.add("EXTREME_HEAT");
  if (/cold|freeze|wind chill/.test(value)) categories.add("EXTREME_COLD");
  if (/fire|red flag/.test(value)) categories.add("FIRE_WEATHER");

  return [...categories];
}

export function normalizeGoogleCurrent(
  payload: unknown,
  latitude: number,
  longitude: number,
  units: WeatherUnits = "imperial",
  includeRawProviderData = false
): NormalizedCurrentWeather | null {
  const record = asRecord(payload);
  if (!record) return null;
  const condition = asRecord(record.weatherCondition);
  const wind = asRecord(record.wind);
  const windSpeed = asRecord(wind?.speed);
  const windGust = asRecord(wind?.gust);

  return {
    provider: "google",
    latitude,
    longitude,
    observedAt:
      safeIso(record.currentTime) ??
      safeIso(record.observedTime) ??
      new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    units,
    temperature: googleTemperature(record.temperature),
    feelsLike: googleTemperature(record.feelsLikeTemperature),
    humidityPercent: numberValue(record.relativeHumidity),
    windSpeed: googleWindSpeed(windSpeed),
    windGust: googleWindSpeed(windGust),
    windDirectionDegrees: numberValue(wind?.direction),
    visibilityMeters: googleWindSpeed(record.visibility),
    condition:
      stringValue(condition?.type) ??
      stringValue(condition?.weatherConditionType),
    description:
      stringValue(condition?.description) ?? stringValue(condition?.displayName),
    rawProviderData: includeRawProviderData ? payload : undefined,
  };
}

export function normalizeGoogleForecastPeriods(
  payload: unknown,
  latitude: number,
  longitude: number,
  units: WeatherUnits = "imperial",
  includeRawProviderData = false
): NormalizedForecastPeriod[] {
  const record = asRecord(payload);
  const intervals =
    (Array.isArray(record?.forecastHours) && record?.forecastHours) ||
    (Array.isArray(record?.forecastDays) && record?.forecastDays) ||
    (Array.isArray(record?.intervals) && record?.intervals) ||
    [];

  return intervals
    .map((entry): NormalizedForecastPeriod | null => {
      const period = asRecord(entry);
      if (!period) return null;
      const condition = asRecord(period.weatherCondition);
      const wind = asRecord(period.wind);
      const windSpeed = asRecord(wind?.speed);
      const windGust = asRecord(wind?.gust);
      const forecastStart =
        safeIso(period.startTime) ??
        googleIntervalTime(period.interval) ??
        safeIso(period.date);

      if (!forecastStart) return null;

      return {
        provider: "google" as const,
        latitude,
        longitude,
        forecastStart,
        forecastEnd: safeIso(period.endTime) ?? null,
        units,
        temperature:
          googleTemperature(period.temperature) ??
          googleTemperature(asRecord(period.maxTemperature)) ??
          googleTemperature(asRecord(period.minTemperature)),
        feelsLike: googleTemperature(period.feelsLikeTemperature),
        humidityPercent: numberValue(period.relativeHumidity),
        windSpeed: googleWindSpeed(windSpeed),
        windGust: googleWindSpeed(windGust),
        windDirectionDegrees: numberValue(wind?.direction),
        visibilityMeters: googleWindSpeed(period.visibility),
        precipitationProbability: numberValue(period.precipitationProbability),
        condition:
          stringValue(condition?.type) ??
          stringValue(condition?.weatherConditionType),
        description:
          stringValue(condition?.description) ??
          stringValue(condition?.displayName),
        rawProviderData: includeRawProviderData ? entry : undefined,
      };
    })
    .filter((period): period is NormalizedForecastPeriod => period !== null);
}

export function normalizeGoogleAlerts(
  payload: unknown,
  includeRawProviderData = false
): NormalizedWeatherAlert[] {
  const record = asRecord(payload);
  const alerts =
    (Array.isArray(record?.alerts) && record?.alerts) ||
    (Array.isArray(record?.publicAlerts) && record?.publicAlerts) ||
    [];

  return alerts.map((entry) => {
    const alert = asRecord(entry) ?? {};
    const event =
      stringValue(alert.event) ??
      stringValue(alert.eventType) ??
      stringValue(alert.alertType);
    const headline = stringValue(alert.headline) ?? event;
    const categories = categorizeWeatherText(`${event ?? ""} ${headline ?? ""}`);

    return {
      provider: "google",
      event,
      headline,
      severity: severityFromProvider(alert.severity),
      urgency: stringValue(alert.urgency),
      certainty: stringValue(alert.certainty),
      effective: safeIso(alert.effectiveTime ?? alert.onsetTime),
      expires: safeIso(alert.expireTime ?? alert.expiresTime),
      areaDescription: stringValue(alert.areaDesc ?? alert.areaDescription),
      description: stringValue(alert.description),
      instruction: stringValue(alert.instruction),
      categories: categories.length ? categories : ["UNKNOWN_ALERT"],
      rawProviderData: includeRawProviderData ? entry : undefined,
    };
  });
}

export function normalizeOpenWeatherOneCallCurrent(
  payload: unknown,
  units: WeatherUnits = "imperial",
  includeRawProviderData = false
): NormalizedCurrentWeather | null {
  const record = asRecord(payload);
  const current = asRecord(record?.current);
  if (!record || !current) return null;
  const weather = firstWeather(current.weather);

  return {
    provider: "openweather",
    latitude: numberValue(record.lat) ?? 0,
    longitude: numberValue(record.lon) ?? 0,
    observedAt: isoFromUnixSeconds(current.dt),
    fetchedAt: new Date().toISOString(),
    units,
    temperature: numberValue(current.temp),
    feelsLike: numberValue(current.feels_like),
    humidityPercent: numberValue(current.humidity),
    windSpeed: numberValue(current.wind_speed),
    windGust: numberValue(current.wind_gust),
    windDirectionDegrees: numberValue(current.wind_deg),
    visibilityMeters: numberValue(current.visibility),
    condition: stringValue(weather?.main),
    description: stringValue(weather?.description),
    rawProviderData: includeRawProviderData ? current : undefined,
  };
}

export function normalizeOpenWeatherOneCallForecasts(
  payload: unknown,
  mode: "hourly" | "daily",
  units: WeatherUnits = "imperial",
  includeRawProviderData = false
): NormalizedForecastPeriod[] {
  const record = asRecord(payload);
  if (!record) return [];
  const latitude = numberValue(record.lat) ?? 0;
  const longitude = numberValue(record.lon) ?? 0;
  const list = mode === "daily" ? record.daily : record.hourly;

  if (!Array.isArray(list)) return [];

  return list
    .map((entry): NormalizedForecastPeriod | null => {
      const period = asRecord(entry);
      if (!period) return null;
      const weather = firstWeather(period.weather);
      const forecastStart = isoFromUnixSeconds(period.dt);
      if (!forecastStart) return null;
      const tempRecord = asRecord(period.temp);
      const feelsLikeRecord = asRecord(period.feels_like);

      return {
        provider: "openweather" as const,
        latitude,
        longitude,
        forecastStart,
        forecastEnd: null,
        units,
        temperature:
          numberValue(period.temp) ??
          numberValue(tempRecord?.day) ??
          numberValue(tempRecord?.max) ??
          numberValue(tempRecord?.min),
        feelsLike:
          numberValue(period.feels_like) ?? numberValue(feelsLikeRecord?.day),
        humidityPercent: numberValue(period.humidity),
        windSpeed: numberValue(period.wind_speed),
        windGust: numberValue(period.wind_gust),
        windDirectionDegrees: numberValue(period.wind_deg),
        visibilityMeters: numberValue(period.visibility),
        precipitationProbability: numberValue(period.pop),
        condition: stringValue(weather?.main),
        description: stringValue(weather?.description),
        rawProviderData: includeRawProviderData ? entry : undefined,
      };
    })
    .filter((period): period is NormalizedForecastPeriod => period !== null);
}

export function normalizeOpenWeatherAlerts(
  payload: unknown,
  includeRawProviderData = false
): NormalizedWeatherAlert[] {
  const record = asRecord(payload);
  if (!record || !Array.isArray(record.alerts)) return [];

  return record.alerts.map((entry) => {
    const alert = asRecord(entry) ?? {};
    const event = stringValue(alert.event);
    const headline = event;
    const categories = categorizeWeatherText(
      `${event ?? ""} ${stringValue(alert.description) ?? ""}`
    );

    return {
      provider: "openweather",
      event,
      headline,
      severity: "unknown",
      urgency: null,
      certainty: null,
      effective: isoFromUnixSeconds(alert.start),
      expires: isoFromUnixSeconds(alert.end),
      areaDescription: stringValue(alert.sender_name),
      description: stringValue(alert.description),
      instruction: null,
      categories: categories.length ? categories : ["UNKNOWN_ALERT"],
      rawProviderData: includeRawProviderData ? entry : undefined,
    };
  });
}

export function normalizeNwsPoint(
  payload: unknown,
  latitude: number,
  longitude: number,
  includeRawProviderData = false
): NwsPointMetadata | null {
  const record = asRecord(payload);
  const properties = asRecord(record?.properties);
  if (!properties) return null;
  const relative = asRecord(asRecord(properties.relativeLocation)?.properties);

  return {
    provider: "nws",
    latitude,
    longitude,
    gridId: stringValue(properties.gridId),
    gridX: numberValue(properties.gridX),
    gridY: numberValue(properties.gridY),
    forecastUrl: stringValue(properties.forecast),
    forecastHourlyUrl: stringValue(properties.forecastHourly),
    relativeLocation: {
      city: stringValue(relative?.city),
      state: stringValue(relative?.state),
    },
    rawProviderData: includeRawProviderData ? payload : undefined,
  };
}

export function normalizeNwsForecastPeriods(
  payload: unknown,
  latitude: number,
  longitude: number,
  includeRawProviderData = false
): NormalizedForecastPeriod[] {
  const periods = asRecord(asRecord(payload)?.properties)?.periods;
  if (!Array.isArray(periods)) return [];

  return periods
    .map((entry): NormalizedForecastPeriod | null => {
      const period = asRecord(entry);
      const forecastStart = safeIso(period?.startTime);
      if (!period || !forecastStart) return null;

      return {
        provider: "nws" as const,
        latitude,
        longitude,
        forecastStart,
        forecastEnd: safeIso(period.endTime),
        units:
          stringValue(period.temperatureUnit) === "C" ? "metric" : "imperial",
        temperature: numberValue(period.temperature),
        feelsLike: null,
        humidityPercent: numberValue(period.relativeHumidity),
        windSpeed: parseWindSpeed(period.windSpeed),
        windGust: null,
        windDirectionDegrees: null,
        visibilityMeters: null,
        precipitationProbability: numberValue(
          asRecord(period.probabilityOfPrecipitation)?.value
        ),
        condition: stringValue(period.shortForecast),
        description: stringValue(period.detailedForecast),
        rawProviderData: includeRawProviderData ? entry : undefined,
      };
    })
    .filter((period): period is NormalizedForecastPeriod => period !== null);
}

export function normalizeNwsAlerts(
  payload: unknown,
  includeRawProviderData = false
): NormalizedWeatherAlert[] {
  const features = asRecord(payload)?.features;
  if (!Array.isArray(features)) return [];

  return features.map((feature) => {
    const properties = asRecord(asRecord(feature)?.properties) ?? {};
    const event = stringValue(properties.event);
    const headline = stringValue(properties.headline) ?? event;
    const categories = categorizeWeatherText(
      `${event ?? ""} ${headline ?? ""} ${stringValue(properties.description) ?? ""}`
    );

    return {
      provider: "nws",
      event,
      headline,
      severity: severityFromProvider(properties.severity),
      urgency: stringValue(properties.urgency),
      certainty: stringValue(properties.certainty),
      effective: safeIso(properties.effective),
      expires: safeIso(properties.expires),
      areaDescription: stringValue(properties.areaDesc),
      description: stringValue(properties.description),
      instruction: stringValue(properties.instruction),
      categories: categories.length ? categories : ["UNKNOWN_ALERT"],
      rawProviderData: includeRawProviderData ? feature : undefined,
    };
  });
}

function parseWindSpeed(value: unknown) {
  if (typeof value !== "string") return numberValue(value);
  const match = value.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

export function severityRank(severity: WeatherRiskSeverity) {
  switch (severity) {
    case "severe":
      return 5;
    case "high":
      return 4;
    case "moderate":
      return 3;
    case "low":
      return 2;
    case "unknown":
      return 1;
    default:
      return 0;
  }
}
