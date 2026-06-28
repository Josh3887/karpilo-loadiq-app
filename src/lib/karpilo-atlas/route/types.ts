import type {
  KarpiloAtlasReferenceLibrary,
  KarpiloAtlasRiskLevel,
} from "../types";

export type KarpiloAtlasTollExposure =
  | "none"
  | "possible"
  | "likely"
  | "unknown";

export type KarpiloAtlasRouteOutput = {
  routeBurdenScore: number;
  mileageConfidence: number;
  estimatedMiles: number | null;
  paidMiles: number | null;
  deadheadMiles: number | null;
  outOfRouteRisk: KarpiloAtlasRiskLevel;
  timeRisk: KarpiloAtlasRiskLevel;
  weatherRisk: KarpiloAtlasRiskLevel;
  terrainRisk: KarpiloAtlasRiskLevel;
  trafficRisk: KarpiloAtlasRiskLevel;
  hosPressure: KarpiloAtlasRiskLevel;
  dwellExposure: KarpiloAtlasRiskLevel;
  tollExposure: KarpiloAtlasTollExposure;
  fuelPenaltyEstimate: number | null;
  routeRedFlags: string[];
  missingInputs: string[];
  confidenceScore: number;
  routeSummary: string;
  sourceLibrariesUsed: KarpiloAtlasReferenceLibrary[];
  guardrailsApplied: string[];
};
