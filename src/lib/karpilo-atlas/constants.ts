import type {
  KarpiloAtlasSystemId,
  KarpiloLoadIQTier,
} from "./sources/source-types";

export const KARPILO_ATLAS_SYSTEM_IDS: KarpiloAtlasSystemId[] = [
  "karpilo_atlas_core",
  "karpilo_atlas_freight",
  "karpilo_atlas_route",
  "karpilo_atlas_education",
];

export const KARPILO_LOADIQ_COMMERCIAL_TIERS: KarpiloLoadIQTier[] = [
  "silver",
  "gold",
  "platinum",
  "pro",
];

export const KARPILO_ATLAS_USER_OWNED_INTELLIGENCE =
  "karpilo_atlas_user_owned_intelligence";
