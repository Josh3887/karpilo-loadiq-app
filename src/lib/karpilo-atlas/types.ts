export type {
  KarpiloAtlasAuthorityLevel,
  KarpiloAtlasRefreshCadence,
  KarpiloAtlasSourceAccess,
  KarpiloAtlasSourceIntegrationStatus,
  KarpiloAtlasSourceRegistryEntry,
  KarpiloAtlasSystemId,
  KarpiloLoadIQTier,
} from "./sources/source-types";

export type {
  KarpiloAtlasLibraryCatalogEntry,
  KarpiloAtlasPrivateTruthLayer,
  KarpiloAtlasReferenceLibrary,
} from "./sources/library-types";

export type KarpiloAtlasDepth =
  | "none"
  | "basic"
  | "guided"
  | "advanced"
  | "professional";

export type KarpiloAtlasHistoricalMemory =
  | "none"
  | "limited"
  | "advanced"
  | "professional";

export type KarpiloAtlasRiskLevel =
  | "low"
  | "moderate"
  | "high"
  | "unknown";

export type KarpiloAtlasRecommendedAction =
  | "accept"
  | "review"
  | "reject"
  | "needs_more_data"
  | "not_available_in_tier";

export type KarpiloAtlasConfidenceBand = "low" | "moderate" | "high";
