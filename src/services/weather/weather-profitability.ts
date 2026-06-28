import "server-only";

import { OpenWeatherFreeProvider } from "@/services/weather/openweather-free-provider";
import type { LoadInput, LoadResult } from "@/types/load";
import type {
  FiveDayWeatherForecast,
  WeatherCondition,
  WeatherPrecipitation,
  WeatherProvider,
  WeatherProviderFailure,
  WeatherTemperature,
  WeatherWind,
} from "@/types/weather";
import {
  WEATHER_RISK_DISCLAIMER,
  type WeatherProfitabilityFactor,
  type WeatherProfitabilityInput,
  type WeatherProfitabilityLoadValues,
  type WeatherProfitabilityPointAssessment,
  type WeatherProfitabilityPointFailure,
  type WeatherProfitabilityPointInput,
  type WeatherProfitabilityResult,
  type WeatherProfitabilityRiskLevel,
} from "@/types/weather-profitability";

const CALCULATION_VERSION = "loadiq-weather-profitability-v1" as const;
const DEFAULT_TRUCK_SPEED_MPH = 55;
const FORECAST_MATCH_WINDOW_HOURS = 6;

type WeatherPointAssessmentResult =
  | {
      status: "available";
      assessment: WeatherProfitabilityPointAssessment;
    }
  | {
      status: "unavailable";
      failure: WeatherProfitabilityPointFailure;
    };

export function createWeatherProfitabilityLoadValues(
  input: LoadInput,
  result?: LoadResult
): WeatherProfitabilityLoadValues {
  const totalMiles = result?.totalMiles ?? input.loadedMiles + input.deadheadMiles;
  const loadedMiles = input.loadedMiles;
  const loadGross =
    result?.grossRevenue ??
    (input.revenueInputMode === "gross"
      ? input.grossRevenue
      : input.loadedMiles * input.ratePerMile + input.fuelSurcharge);
  const targetRpm = result?.targetRpm ?? input.targetTrueRpm;
  const breakEvenRpm = result?.breakEvenRpm;

  return {
    totalMiles,
    loadedMiles,
    deadheadMiles: input.deadheadMiles,
    fuelPrice: input.fuelPrice,
    mpg: input.mpg,
    loadGross,
    targetRpm,
    baseProfit: result?.estimatedNet,
    baseMarginPercent: result?.profitMarginPercent,
    breakEvenRpm,
    baseMinimumAllInRate: maxPositive(breakEvenRpm, targetRpm),
  };
}

export async function calculateWeatherProfitability(
  input: WeatherProfitabilityInput,
  provider: WeatherProvider = new OpenWeatherFreeProvider()
): Promise<WeatherProfitabilityResult> {
  const points = normalizePointInputs(input.points);

  if (!points.length) {
    return unavailable(
      "Weather profitability requires at least one valid coordinate point.",
      []
    );
  }

  const pointResults = await Promise.all(
    points.map((point) => assessWeatherPoint(point, input.units, provider))
  );
  const pointAssessments = pointResults
    .filter((point) => point.status === "available")
    .map((point) => point.assessment);
  const pointFailures = pointResults
    .filter((point) => point.status === "unavailable")
    .map((point) => point.failure);

  if (!pointAssessments.length) {
    return unavailable(
      "Weather profitability could not calculate because no requested weather point returned usable provider data.",
      pointFailures
    );
  }

  const loadValues = normalizeLoadValues(input.loadValues);
  const weightedRiskScore = weightedPointRiskScore(pointAssessments);
  const maxPointRiskScore = Math.max(
    ...pointAssessments.map((point) => point.weatherRiskScore)
  );
  const weatherRiskScore = clamp(
    Math.round(weightedRiskScore * 0.75 + maxPointRiskScore * 0.25),
    0,
    100
  );
  const riskLevel = riskLevelForScore(weatherRiskScore);
  const estimatedSpeedReductionPercent = clamp(
    round(
      weightedAverage(
        pointAssessments.map((point) => ({
          value: point.estimatedSpeedReductionPercent,
          weight: pointWeight(point.role),
        }))
      )
    ),
    0,
    45
  );
  const estimatedDelayMinutes = estimateDelayMinutes(
    loadValues.totalMiles,
    estimatedSpeedReductionPercent
  );
  const estimatedFuelPenaltyDollars = estimateFuelPenaltyDollars({
    totalMiles: loadValues.totalMiles,
    mpg: loadValues.mpg,
    fuelPrice: loadValues.fuelPrice,
    weatherRiskScore,
    estimatedSpeedReductionPercent,
  });
  const recommendedRpmPremium = estimateRpmPremium({
    loadedMiles: loadValues.loadedMiles,
    loadGross: loadValues.loadGross,
    baseMinimumAllInRate: loadValues.baseMinimumAllInRate,
    baseProfit: loadValues.baseProfit,
    baseMarginPercent: loadValues.baseMarginPercent,
    weatherRiskScore,
    estimatedFuelPenaltyDollars,
  });
  const adjustedMinimumAllInRate = roundMoney(
    loadValues.baseMinimumAllInRate + recommendedRpmPremium
  );

  return {
    status: "available",
    weatherRiskScore,
    riskLevel,
    estimatedSpeedReductionPercent,
    estimatedDelayMinutes,
    estimatedFuelPenaltyDollars,
    recommendedRpmPremium,
    adjustedMinimumAllInRate,
    plainEnglishExplanation: explainWeatherProfitability({
      riskLevel,
      weatherRiskScore,
      pointAssessments,
      pointFailures,
      loadValues,
      estimatedSpeedReductionPercent,
      estimatedDelayMinutes,
      estimatedFuelPenaltyDollars,
      recommendedRpmPremium,
      adjustedMinimumAllInRate,
    }),
    disclaimer: WEATHER_RISK_DISCLAIMER,
    calculationVersion: CALCULATION_VERSION,
    dataCompleteness: {
      requestedPointCount: points.length,
      assessedPointCount: pointAssessments.length,
      failedPointCount: pointFailures.length,
      missingLoadValues: missingLoadValueLabels(input.loadValues),
    },
    loadValuesUsed: loadValues,
    pointAssessments,
    pointFailures,
  };
}

async function assessWeatherPoint(
  point: WeatherProfitabilityPointInput,
  units: WeatherProfitabilityInput["units"],
  provider: WeatherProvider
): Promise<WeatherPointAssessmentResult> {
  const scheduledAt = normalizeDateString(point.scheduledAt);
  const weatherResult = scheduledAt
    ? await getForecastWeatherForPoint(point, scheduledAt, units, provider)
    : await getCurrentWeatherForPoint(point, units, provider);

  if (weatherResult.status === "unavailable") {
    return {
      status: "unavailable",
      failure: {
        role: point.role,
        label: pointLabel(point),
        latitude: point.latitude,
        longitude: point.longitude,
        scheduledAt,
        reason: weatherResult.reason,
        providerFailure: weatherResult.providerFailure,
      },
    };
  }

  const factors = weatherFactors(weatherResult.weather);
  const rawScore = factors.reduce(
    (total, factor) => total + factor.scoreImpact,
    0
  );
  const weatherRiskScore = clamp(Math.round(rawScore), 0, 100);

  return {
    status: "available",
    assessment: {
      role: point.role,
      label: pointLabel(point),
      latitude: point.latitude,
      longitude: point.longitude,
      scheduledAt,
      weatherSource: weatherResult.weatherSource,
      weather: weatherResult.weather,
      weatherRiskScore,
      estimatedSpeedReductionPercent: estimatePointSpeedReduction(
        weatherRiskScore,
        factors
      ),
      factors,
    },
  };
}

async function getCurrentWeatherForPoint(
  point: WeatherProfitabilityPointInput,
  units: WeatherProfitabilityInput["units"],
  provider: WeatherProvider
) {
  const result = await provider.getCurrentWeather({
    latitude: point.latitude,
    longitude: point.longitude,
    units,
  });

  if (result.status === "unavailable") {
    return pointWeatherFailure(
      `Current weather unavailable for ${pointLabel(point)}.`,
      result
    );
  }

  return {
    status: "available" as const,
    weatherSource: "current" as const,
    weather: result.data,
  };
}

async function getForecastWeatherForPoint(
  point: WeatherProfitabilityPointInput,
  scheduledAt: string,
  units: WeatherProfitabilityInput["units"],
  provider: WeatherProvider
) {
  const result = await provider.getFiveDayForecast({
    latitude: point.latitude,
    longitude: point.longitude,
    units,
  });

  if (result.status === "unavailable") {
    return pointWeatherFailure(
      `Forecast weather unavailable for ${pointLabel(point)}.`,
      result
    );
  }

  const forecastPoint = nearestForecastPoint(result.data, scheduledAt);

  if (!forecastPoint) {
    return {
      status: "unavailable" as const,
      reason: `No 5-day / 3-hour forecast point was close enough to ${scheduledAt} for ${pointLabel(point)}.`,
      providerFailure: undefined,
    };
  }

  return {
    status: "available" as const,
    weatherSource: "forecast" as const,
    weather: {
      ...forecastPoint,
      units: result.data.units,
    },
  };
}

function pointWeatherFailure(
  reason: string,
  providerFailure: WeatherProviderFailure
) {
  return {
    status: "unavailable" as const,
    reason,
    providerFailure,
  };
}

function nearestForecastPoint(
  forecast: FiveDayWeatherForecast,
  scheduledAt: string
) {
  const targetTime = new Date(scheduledAt).getTime();

  if (!Number.isFinite(targetTime)) return null;

  const nearest = forecast.points
    .map((point) => ({
      point,
      distanceMs: Math.abs(new Date(point.forecastedAt).getTime() - targetTime),
    }))
    .filter(({ distanceMs }) => Number.isFinite(distanceMs))
    .sort((a, b) => a.distanceMs - b.distanceMs)[0];

  if (!nearest) return null;

  const maxDistanceMs = FORECAST_MATCH_WINDOW_HOURS * 60 * 60 * 1000;
  return nearest.distanceMs <= maxDistanceMs ? nearest.point : null;
}

function weatherFactors(weather: WeatherProfitabilityPointAssessment["weather"]) {
  const factors: WeatherProfitabilityFactor[] = [];

  factors.push(...conditionFactors(weather.condition));
  factors.push(...windFactors(weather.wind));
  factors.push(...precipitationFactors(weather.precipitation));
  factors.push(...temperatureFactors(weather.temperature));
  factors.push(...visibilityFactors(weather.visibilityMeters));

  return factors.sort((a, b) => b.scoreImpact - a.scoreImpact);
}

function conditionFactors(
  condition: WeatherCondition
): WeatherProfitabilityFactor[] {
  const code = condition.id;
  if (code === null) return [];

  const label = condition.description ?? condition.main ?? `code ${code}`;

  if (code >= 200 && code < 300) {
    return [
      factor(
        "forecast_condition_thunderstorm",
        "Thunderstorm condition",
        code >= 230 ? 45 : 35,
        `${label} (${code})`
      ),
    ];
  }

  if (code >= 300 && code < 400) {
    return [
      factor(
        "forecast_condition_drizzle",
        "Drizzle condition",
        8,
        `${label} (${code})`
      ),
    ];
  }

  if (code >= 500 && code < 600) {
    const impact = code === 511 ? 45 : code >= 502 ? 28 : code >= 501 ? 20 : 14;
    return [
      factor(
        "forecast_condition_rain",
        code === 511 ? "Freezing rain condition" : "Rain condition",
        impact,
        `${label} (${code})`
      ),
    ];
  }

  if (code >= 600 && code < 700) {
    const impact = code >= 611 ? 42 : code >= 602 ? 34 : 24;
    return [
      factor(
        "forecast_condition_snow",
        "Snow or ice condition",
        impact,
        `${label} (${code})`
      ),
    ];
  }

  if (code >= 700 && code < 800) {
    const impact = code === 781 ? 70 : code === 741 ? 24 : 14;
    return [
      factor(
        "forecast_condition_visibility",
        "Atmospheric visibility condition",
        impact,
        `${label} (${code})`
      ),
    ];
  }

  if (code > 800 && code < 900) {
    return [
      factor(
        "forecast_condition_clouds",
        "Cloud cover condition",
        code === 804 ? 4 : 2,
        `${label} (${code})`
      ),
    ];
  }

  return [];
}

function windFactors(wind: WeatherWind): WeatherProfitabilityFactor[] {
  const factors: WeatherProfitabilityFactor[] = [];
  const speedMph = windSpeedMph(wind.speed, wind.unit);
  const gustMph = windSpeedMph(wind.gust, wind.unit);

  if (speedMph !== null) {
    const impact =
      speedMph >= 45 ? 30 : speedMph >= 35 ? 22 : speedMph >= 25 ? 12 : speedMph >= 18 ? 6 : 0;

    if (impact > 0) {
      factors.push(
        factor(
          "wind_speed",
          "Sustained wind",
          impact,
          `${round(speedMph)} mph sustained wind`
        )
      );
    }
  }

  if (gustMph !== null) {
    const impact =
      gustMph >= 55 ? 28 : gustMph >= 45 ? 20 : gustMph >= 35 ? 12 : gustMph >= 25 ? 6 : 0;

    if (impact > 0) {
      factors.push(
        factor("wind_gust", "Wind gust", impact, `${round(gustMph)} mph gust`)
      );
    }
  }

  return factors;
}

function precipitationFactors(
  precipitation: WeatherPrecipitation
): WeatherProfitabilityFactor[] {
  const factors: WeatherProfitabilityFactor[] = [];
  const rainRateMm = maxNullable(
    precipitation.rain1hMm,
    precipitation.rain3hMm === null ? null : precipitation.rain3hMm / 3
  );
  const snowRateMm = maxNullable(
    precipitation.snow1hMm,
    precipitation.snow3hMm === null ? null : precipitation.snow3hMm / 3
  );

  if (rainRateMm !== null && rainRateMm > 0) {
    const impact =
      rainRateMm >= 10 ? 25 : rainRateMm >= 4 ? 16 : rainRateMm >= 1.5 ? 8 : 4;
    factors.push(
      factor(
        "rain_intensity",
        "Rain",
        impact,
        `${round(rainRateMm)} mm/hour estimated rain intensity`
      )
    );
  }

  if (snowRateMm !== null && snowRateMm > 0) {
    const impact = snowRateMm >= 6 ? 35 : snowRateMm >= 2 ? 20 : 10;
    factors.push(
      factor(
        "snow_intensity",
        "Snow",
        impact,
        `${round(snowRateMm)} mm/hour estimated snow intensity`
      )
    );
  }

  if (precipitation.probability !== null && precipitation.probability >= 0.5) {
    factors.push(
      factor(
        "precipitation_probability",
        "Precipitation probability",
        precipitation.probability >= 0.8 ? 8 : 4,
        `${Math.round(precipitation.probability * 100)}% forecast precipitation probability`
      )
    );
  }

  return factors;
}

function temperatureFactors(
  temperature: WeatherTemperature
): WeatherProfitabilityFactor[] {
  const tempF = temperatureFahrenheit(temperature.value, temperature.unit);
  if (tempF === null) return [];

  if (tempF <= -10) {
    return [
      factor("temperature_extreme_cold", "Extreme cold", 30, `${round(tempF)}F`),
    ];
  }

  if (tempF <= 10) {
    return [
      factor("temperature_extreme_cold", "Severe cold", 20, `${round(tempF)}F`),
    ];
  }

  if (tempF <= 25) {
    return [
      factor("temperature_cold", "Cold temperature", 10, `${round(tempF)}F`),
    ];
  }

  if (tempF >= 105) {
    return [
      factor("temperature_extreme_heat", "Extreme heat", 22, `${round(tempF)}F`),
    ];
  }

  if (tempF >= 95) {
    return [
      factor("temperature_heat", "High heat", 12, `${round(tempF)}F`),
    ];
  }

  if (tempF >= 90) {
    return [
      factor("temperature_heat", "Warm temperature", 6, `${round(tempF)}F`),
    ];
  }

  return [];
}

function visibilityFactors(
  visibilityMeters: number | null
): WeatherProfitabilityFactor[] {
  if (visibilityMeters === null) return [];

  if (visibilityMeters <= 200) {
    return [
      factor(
        "visibility",
        "Very low visibility",
        35,
        `${round(visibilityMeters)} meters visibility`
      ),
    ];
  }

  if (visibilityMeters <= 500) {
    return [
      factor(
        "visibility",
        "Low visibility",
        25,
        `${round(visibilityMeters)} meters visibility`
      ),
    ];
  }

  if (visibilityMeters <= 1600) {
    return [
      factor(
        "visibility",
        "Reduced visibility",
        15,
        `${round(visibilityMeters)} meters visibility`
      ),
    ];
  }

  if (visibilityMeters <= 5000) {
    return [
      factor(
        "visibility",
        "Limited visibility",
        6,
        `${round(visibilityMeters)} meters visibility`
      ),
    ];
  }

  return [];
}

function estimatePointSpeedReduction(
  weatherRiskScore: number,
  factors: WeatherProfitabilityFactor[]
) {
  const severeVisibility = factors.some(
    (factor) => factor.code === "visibility" && factor.scoreImpact >= 25
  );
  const severeWinter = factors.some(
    (factor) =>
      factor.code === "forecast_condition_snow" ||
      factor.code === "snow_intensity"
  );
  const baseReduction = weatherRiskScore * 0.42;
  const severityBump = severeVisibility || severeWinter ? 5 : 0;

  return clamp(round(baseReduction + severityBump), 0, 45);
}

function estimateDelayMinutes(
  totalMiles: number,
  estimatedSpeedReductionPercent: number
) {
  if (totalMiles <= 0 || estimatedSpeedReductionPercent <= 0) return 0;

  const baselineMinutes = (totalMiles / DEFAULT_TRUCK_SPEED_MPH) * 60;
  const adjustedSpeedFactor = 1 - estimatedSpeedReductionPercent / 100;

  if (adjustedSpeedFactor <= 0) return round(baselineMinutes);

  const adjustedMinutes = baselineMinutes / adjustedSpeedFactor;
  return Math.round(Math.max(adjustedMinutes - baselineMinutes, 0));
}

function estimateFuelPenaltyDollars({
  totalMiles,
  mpg,
  fuelPrice,
  weatherRiskScore,
  estimatedSpeedReductionPercent,
}: {
  totalMiles: number;
  mpg: number;
  fuelPrice: number;
  weatherRiskScore: number;
  estimatedSpeedReductionPercent: number;
}) {
  if (totalMiles <= 0 || mpg <= 0 || fuelPrice <= 0) return 0;

  const baselineFuelCost = (totalMiles / mpg) * fuelPrice;
  const penaltyPercent = clamp(
    weatherRiskScore * 0.05 + estimatedSpeedReductionPercent * 0.18,
    0,
    18
  );

  return roundMoney(baselineFuelCost * (penaltyPercent / 100));
}

function estimateRpmPremium({
  loadedMiles,
  loadGross,
  baseMinimumAllInRate,
  baseProfit,
  baseMarginPercent,
  weatherRiskScore,
  estimatedFuelPenaltyDollars,
}: {
  loadedMiles: number;
  loadGross: number;
  baseMinimumAllInRate: number;
  baseProfit: number;
  baseMarginPercent: number;
  weatherRiskScore: number;
  estimatedFuelPenaltyDollars: number;
}) {
  if (loadedMiles <= 0) return 0;

  const weatherBufferPercent =
    weatherRiskScore >= 75
      ? 0.05
      : weatherRiskScore >= 50
        ? 0.025
        : weatherRiskScore >= 25
          ? 0.01
          : 0;
  const thinMarginBufferPercent =
    baseProfit < 0 || (baseMarginPercent > 0 && baseMarginPercent < 10)
      ? 0.01
      : 0;
  const grossBasedBuffer =
    loadGross > 0 ? loadGross * (weatherBufferPercent + thinMarginBufferPercent) : 0;
  const rateBasedBuffer =
    baseMinimumAllInRate > 0
      ? baseMinimumAllInRate * loadedMiles * weatherBufferPercent
      : 0;
  const premiumDollars =
    estimatedFuelPenaltyDollars + Math.max(grossBasedBuffer, rateBasedBuffer);

  return roundMoney(premiumDollars / loadedMiles);
}

function explainWeatherProfitability({
  riskLevel,
  weatherRiskScore,
  pointAssessments,
  pointFailures,
  loadValues,
  estimatedSpeedReductionPercent,
  estimatedDelayMinutes,
  estimatedFuelPenaltyDollars,
  recommendedRpmPremium,
  adjustedMinimumAllInRate,
}: {
  riskLevel: WeatherProfitabilityRiskLevel;
  weatherRiskScore: number;
  pointAssessments: WeatherProfitabilityPointAssessment[];
  pointFailures: WeatherProfitabilityPointFailure[];
  loadValues: Required<WeatherProfitabilityLoadValues>;
  estimatedSpeedReductionPercent: number;
  estimatedDelayMinutes: number;
  estimatedFuelPenaltyDollars: number;
  recommendedRpmPremium: number;
  adjustedMinimumAllInRate: number;
}) {
  const topFactors = pointAssessments
    .flatMap((point) =>
      point.factors.slice(0, 2).map((factor) => `${point.label}: ${factor.detail}`)
    )
    .slice(0, 4);
  const factorText = topFactors.length
    ? ` Main factors: ${topFactors.join("; ")}.`
    : " No material provider weather factors were detected.";
  const failureText = pointFailures.length
    ? ` ${pointFailures.length} weather point(s) could not be assessed.`
    : "";
  const loadText =
    loadValues.totalMiles > 0 && loadValues.loadedMiles > 0
      ? ` The estimate uses ${round(loadValues.totalMiles)} total miles, ${round(loadValues.loadedMiles)} loaded miles, ${money(loadValues.fuelPrice)}/gal fuel, and ${round(loadValues.mpg)} MPG where provided.`
      : " Mileage or load economics were incomplete, so profitability adjustments may be partial.";

  return `${capitalize(riskLevel)} weather profitability risk (${weatherRiskScore}/100). Estimated speed reduction is ${estimatedSpeedReductionPercent}%, delay exposure is ${estimatedDelayMinutes} minutes, and weather fuel penalty is ${money(estimatedFuelPenaltyDollars)}.${factorText}${failureText}${loadText} Recommended RPM weather premium is ${money(recommendedRpmPremium)}/mi, making the adjusted minimum all-in rate ${money(adjustedMinimumAllInRate)}/mi. ${WEATHER_RISK_DISCLAIMER}`;
}

function weightedPointRiskScore(points: WeatherProfitabilityPointAssessment[]) {
  return weightedAverage(
    points.map((point) => ({
      value: point.weatherRiskScore,
      weight: pointWeight(point.role),
    }))
  );
}

function pointWeight(role: WeatherProfitabilityPointAssessment["role"]) {
  if (role === "pickup" || role === "delivery") return 1.15;
  if (role === "deadhead_origin") return 0.85;
  return 1;
}

function riskLevelForScore(score: number): WeatherProfitabilityRiskLevel {
  if (score >= 75) return "severe";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

function normalizePointInputs(points: WeatherProfitabilityPointInput[]) {
  return points
    .map((point) => ({
      ...point,
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.latitude) &&
        Number.isFinite(point.longitude) &&
        point.latitude >= -90 &&
        point.latitude <= 90 &&
        point.longitude >= -180 &&
        point.longitude <= 180
    );
}

function normalizeLoadValues(
  values: WeatherProfitabilityLoadValues | undefined
): Required<WeatherProfitabilityLoadValues> {
  const loadedMiles = positive(values?.loadedMiles);
  const deadheadMiles = positive(values?.deadheadMiles);
  const totalMiles = positive(values?.totalMiles) || loadedMiles + deadheadMiles;
  const loadGross = positive(values?.loadGross);
  const derivedGrossRpm = loadedMiles > 0 ? loadGross / loadedMiles : 0;
  const baseMinimumAllInRate = maxPositive(
    values?.baseMinimumAllInRate,
    values?.targetRpm,
    values?.breakEvenRpm,
    derivedGrossRpm
  );

  return {
    totalMiles,
    loadedMiles,
    deadheadMiles,
    fuelPrice: positive(values?.fuelPrice),
    mpg: positive(values?.mpg),
    loadGross,
    targetRpm: positive(values?.targetRpm),
    baseProfit: finiteNumber(values?.baseProfit),
    baseMarginPercent: finiteNumber(values?.baseMarginPercent),
    breakEvenRpm: positive(values?.breakEvenRpm),
    baseMinimumAllInRate,
  };
}

function missingLoadValueLabels(values: WeatherProfitabilityLoadValues | undefined) {
  const missing: string[] = [];

  if (!positive(values?.totalMiles) && !positive(values?.loadedMiles)) {
    missing.push("mileage");
  }
  if (!positive(values?.fuelPrice)) missing.push("fuel price");
  if (!positive(values?.mpg)) missing.push("MPG");
  if (!positive(values?.loadGross)) missing.push("load gross");
  if (!positive(values?.targetRpm)) missing.push("target RPM");
  if (values?.baseProfit === undefined) missing.push("base profit");
  if (values?.baseMarginPercent === undefined) missing.push("base margin");

  return missing;
}

function factor(
  code: string,
  label: string,
  scoreImpact: number,
  detail: string
): WeatherProfitabilityFactor {
  return {
    code,
    label,
    scoreImpact,
    detail,
  };
}

function windSpeedMph(value: number | null, unit: WeatherWind["unit"]) {
  if (value === null) return null;
  return unit === "mph" ? value : value * 2.23694;
}

function temperatureFahrenheit(
  value: number | null,
  unit: WeatherTemperature["unit"]
) {
  if (value === null) return null;
  if (unit === "F") return value;
  if (unit === "C") return value * (9 / 5) + 32;
  return (value - 273.15) * (9 / 5) + 32;
}

function weightedAverage(values: Array<{ value: number; weight: number }>) {
  const totalWeight = values.reduce((total, item) => total + item.weight, 0);
  if (totalWeight <= 0) return 0;

  return (
    values.reduce((total, item) => total + item.value * item.weight, 0) /
    totalWeight
  );
}

function maxNullable(...values: Array<number | null>) {
  const normalized = values.filter(
    (value): value is number => value !== null && Number.isFinite(value)
  );

  return normalized.length ? Math.max(...normalized) : null;
}

function maxPositive(...values: Array<number | undefined>) {
  return Math.max(...values.map(positive), 0);
}

function positive(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function finiteNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function round(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

function roundMoney(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

function money(value: number) {
  return `$${roundMoney(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function normalizeDateString(value: string | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  return date.toISOString();
}

function pointLabel(point: WeatherProfitabilityPointInput) {
  if (point.label?.trim()) return point.label.trim();
  if (point.role === "deadhead_origin") return "Deadhead origin";
  if (point.role === "pickup") return "Pickup";
  if (point.role === "delivery") return "Delivery";
  return point.sequence ? `Stop ${point.sequence}` : "Stop";
}

function unavailable(
  plainEnglishExplanation: string,
  pointFailures: WeatherProfitabilityPointFailure[]
): WeatherProfitabilityResult {
  return {
    status: "unavailable",
    weatherRiskScore: null,
    riskLevel: null,
    estimatedSpeedReductionPercent: null,
    estimatedDelayMinutes: null,
    estimatedFuelPenaltyDollars: null,
    recommendedRpmPremium: null,
    adjustedMinimumAllInRate: null,
    plainEnglishExplanation: `${plainEnglishExplanation} ${WEATHER_RISK_DISCLAIMER}`,
    disclaimer: WEATHER_RISK_DISCLAIMER,
    calculationVersion: CALCULATION_VERSION,
    pointFailures,
  };
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
