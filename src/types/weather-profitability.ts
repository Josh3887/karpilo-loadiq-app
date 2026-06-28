import type {
  CurrentWeatherSnapshot,
  WeatherForecastPoint,
  WeatherProviderFailure,
  WeatherUnits,
} from "@/types/weather";

export const WEATHER_RISK_DISCLAIMER =
  "Weather risk analysis is informational decision support only. It is not routing, dispatch, safety, legal, compliance, or guaranteed forecast advice.";

export type WeatherProfitabilityPointRole =
  | "deadhead_origin"
  | "pickup"
  | "stop"
  | "delivery";

export type WeatherProfitabilityRiskLevel =
  | "low"
  | "moderate"
  | "high"
  | "severe";

export type WeatherProfitabilityPointInput = {
  role: WeatherProfitabilityPointRole;
  latitude: number;
  longitude: number;
  label?: string;
  scheduledAt?: string;
  sequence?: number;
};

export type WeatherProfitabilityLoadValues = {
  totalMiles?: number;
  loadedMiles?: number;
  deadheadMiles?: number;
  fuelPrice?: number;
  mpg?: number;
  loadGross?: number;
  targetRpm?: number;
  baseProfit?: number;
  baseMarginPercent?: number;
  breakEvenRpm?: number;
  baseMinimumAllInRate?: number;
};

export type WeatherProfitabilityInput = {
  points: WeatherProfitabilityPointInput[];
  loadValues?: WeatherProfitabilityLoadValues;
  units?: WeatherUnits;
};

export type WeatherProfitabilityFactor = {
  code: string;
  label: string;
  scoreImpact: number;
  detail: string;
};

export type WeatherProfitabilityPointAssessment = {
  role: WeatherProfitabilityPointRole;
  label: string;
  latitude: number;
  longitude: number;
  scheduledAt: string | null;
  weatherSource: "current" | "forecast";
  weather:
    | CurrentWeatherSnapshot
    | (WeatherForecastPoint & {
        units: WeatherUnits;
      });
  weatherRiskScore: number;
  estimatedSpeedReductionPercent: number;
  factors: WeatherProfitabilityFactor[];
};

export type WeatherProfitabilityOutput = {
  status: "available";
  weatherRiskScore: number;
  riskLevel: WeatherProfitabilityRiskLevel;
  estimatedSpeedReductionPercent: number;
  estimatedDelayMinutes: number;
  estimatedFuelPenaltyDollars: number;
  recommendedRpmPremium: number;
  adjustedMinimumAllInRate: number;
  plainEnglishExplanation: string;
  disclaimer: typeof WEATHER_RISK_DISCLAIMER;
  calculationVersion: "loadiq-weather-profitability-v1";
  dataCompleteness: {
    requestedPointCount: number;
    assessedPointCount: number;
    failedPointCount: number;
    missingLoadValues: string[];
  };
  loadValuesUsed: Required<WeatherProfitabilityLoadValues>;
  pointAssessments: WeatherProfitabilityPointAssessment[];
  pointFailures: WeatherProfitabilityPointFailure[];
};

export type WeatherProfitabilityPointFailure = {
  role: WeatherProfitabilityPointRole;
  label: string;
  latitude: number;
  longitude: number;
  scheduledAt: string | null;
  reason: string;
  providerFailure?: WeatherProviderFailure;
};

export type WeatherProfitabilityUnavailable = {
  status: "unavailable";
  weatherRiskScore: null;
  riskLevel: null;
  estimatedSpeedReductionPercent: null;
  estimatedDelayMinutes: null;
  estimatedFuelPenaltyDollars: null;
  recommendedRpmPremium: null;
  adjustedMinimumAllInRate: null;
  plainEnglishExplanation: string;
  disclaimer: typeof WEATHER_RISK_DISCLAIMER;
  calculationVersion: "loadiq-weather-profitability-v1";
  pointFailures: WeatherProfitabilityPointFailure[];
};

export type WeatherProfitabilityResult =
  | WeatherProfitabilityOutput
  | WeatherProfitabilityUnavailable;
