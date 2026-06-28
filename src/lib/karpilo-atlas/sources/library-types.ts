import type { KarpiloAtlasSystemId } from "./source-types";

export type KarpiloAtlasReferenceLibrary =
  | "karpilo_atlas_regulatory_library"
  | "karpilo_atlas_carrier_identity_authority_library"
  | "karpilo_atlas_safety_inspection_library"
  | "karpilo_atlas_hazmat_library"
  | "karpilo_atlas_customs_border_library"
  | "karpilo_atlas_maritime_intermodal_library"
  | "karpilo_atlas_industry_association_library"
  | "karpilo_atlas_fuel_cost_tax_reference_library"
  | "karpilo_atlas_route_weather_hazard_library"
  | "karpilo_atlas_geospatial_freight_infrastructure_library"
  | "karpilo_atlas_freight_flow_economic_library"
  | "karpilo_atlas_environmental_efficiency_library"
  | "karpilo_atlas_public_news_library"
  | "karpilo_atlas_state_local_authority_library";

export type KarpiloAtlasPrivateTruthLayer =
  | "karpilo_atlas_user_owned_intelligence";

export type KarpiloAtlasLibraryCatalogEntry = {
  id: KarpiloAtlasReferenceLibrary;
  publicName: string;
  purpose: string;
  authoritySummary: string;
  usedBy: KarpiloAtlasSystemId[];
  guardrails: string[];
};
