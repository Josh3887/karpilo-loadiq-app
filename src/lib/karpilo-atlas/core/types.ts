import type { KarpiloAtlasEntitlements } from "../entitlements";
import type {
  KarpiloAtlasRecommendedAction,
  KarpiloAtlasReferenceLibrary,
  KarpiloAtlasRiskLevel,
  KarpiloAtlasSystemId,
  KarpiloLoadIQTier,
} from "../types";

export type KarpiloAtlasDecisionType =
  | "load_fit"
  | "route_analysis"
  | "freight_analysis"
  | "education"
  | "profile_setup"
  | "post_trip_audit"
  | "tier_gate"
  | "missing_inputs";

export type KarpiloAtlasCoreInput = {
  tier: KarpiloLoadIQTier;
  entitlements: KarpiloAtlasEntitlements;
  loadInputSnapshot?: unknown;
  userCostSnapshot?: unknown;
  equipmentProfileSnapshot?: unknown;
  routeInputSnapshot?: unknown;
  freightInputSnapshot?: unknown;
  userOwnedHistorySnapshot?: unknown;
};

export type KarpiloAtlasCoreOutput = {
  decisionType: KarpiloAtlasDecisionType;
  requiredSystems: KarpiloAtlasSystemId[];
  availableSystems: KarpiloAtlasSystemId[];
  blockedSystems: KarpiloAtlasSystemId[];
  missingInputs: string[];
  assumptions: string[];
  confidenceScore: number;
  userRiskLevel: KarpiloAtlasRiskLevel;
  loadIQDecisionScore: number;
  recommendedAction: KarpiloAtlasRecommendedAction;
  explanationSummary: string;
  auditNotes: string[];
  guardrailsApplied: string[];
  sourceLibrariesUsed: KarpiloAtlasReferenceLibrary[];
};
