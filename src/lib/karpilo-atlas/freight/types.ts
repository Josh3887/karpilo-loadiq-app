import type {
  KarpiloAtlasReferenceLibrary,
  KarpiloAtlasRiskLevel,
} from "../types";

export type KarpiloAtlasEquipmentFit =
  | "good"
  | "acceptable"
  | "poor"
  | "invalid"
  | "unknown";

export type KarpiloAtlasTarpingRisk =
  | "none"
  | "possible"
  | "required"
  | "unknown";

export type KarpiloAtlasFreightOutput = {
  freightFitScore: number;
  equipmentFit: KarpiloAtlasEquipmentFit;
  trailerCompatibility: boolean | "unknown";
  securementBurden: KarpiloAtlasRiskLevel;
  tarpingRisk: KarpiloAtlasTarpingRisk;
  commodityRisk: KarpiloAtlasRiskLevel;
  damageRisk: KarpiloAtlasRiskLevel;
  handlingBurden: KarpiloAtlasRiskLevel;
  accessorialChecklist: string[];
  brokerQuestions: string[];
  redFlags: string[];
  missingInputs: string[];
  confidenceScore: number;
  freightSummary: string;
  sourceLibrariesUsed: KarpiloAtlasReferenceLibrary[];
  guardrailsApplied: string[];
};
