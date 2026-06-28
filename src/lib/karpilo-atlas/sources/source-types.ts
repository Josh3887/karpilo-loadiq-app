import type {
  KarpiloAtlasPrivateTruthLayer,
  KarpiloAtlasReferenceLibrary,
} from "./library-types";

export type KarpiloAtlasAuthorityLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type KarpiloAtlasSourceAccess =
  | "public"
  | "licensed"
  | "user_entered"
  | "internal"
  | "excluded";

export type KarpiloAtlasSourceIntegrationStatus =
  | "registry_only"
  | "manual_reference"
  | "dataset_later"
  | "api_later"
  | "licensed_later"
  | "excluded";

export type KarpiloAtlasRefreshCadence =
  | "manual"
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "event_driven"
  | "not_applicable";

export type KarpiloAtlasSystemId =
  | "karpilo_atlas_core"
  | "karpilo_atlas_freight"
  | "karpilo_atlas_route"
  | "karpilo_atlas_education";

export type KarpiloLoadIQTier = "silver" | "gold" | "platinum" | "pro";

export type KarpiloAtlasSourceRegistryEntry = {
  id: string;
  publicName: string;
  internalName: string;
  library: KarpiloAtlasReferenceLibrary | KarpiloAtlasPrivateTruthLayer;
  authorityLevel: KarpiloAtlasAuthorityLevel;
  access: KarpiloAtlasSourceAccess;
  integrationStatus: KarpiloAtlasSourceIntegrationStatus;
  allowedUse: string[];
  prohibitedUse: string[];
  relatedSystems: KarpiloAtlasSystemId[];
  tierAvailability: KarpiloLoadIQTier[];
  requiresCitation: boolean;
  requiresDisclaimer: boolean;
  refreshCadence: KarpiloAtlasRefreshCadence;
  lastReviewedAt?: string;
  notes?: string;
};
