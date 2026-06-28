import { KARPILO_LOADIQ_COMMERCIAL_TIERS } from "../constants";
import type { KarpiloAtlasReferenceLibrary } from "./library-types";
import type {
  KarpiloAtlasAuthorityLevel,
  KarpiloAtlasSourceRegistryEntry,
  KarpiloAtlasSystemId,
} from "./source-types";

const ALL_TIERS = KARPILO_LOADIQ_COMMERCIAL_TIERS;

const OFFICIAL_PROHIBITIONS = [
  "Do not present Karpilo LoadIQ as legal, compliance, tax, permit, hazmat, customs, routing, safety, broker, dispatcher, or carrier authority.",
  "Do not guarantee official status, route legality, tax outcome, safety outcome, regulatory compliance, or freight outcome.",
];

const LOAD_BOARD_PROHIBITIONS = [
  "Do not scrape DAT.",
  "Do not integrate DAT without explicit licensed approval.",
  "Do not show DAT loads.",
  "Do not parse DAT screenshots as a product feature.",
  "Do not build rate-board behavior.",
  "Do not build load-board behavior.",
  "Do not perform freight matching.",
  "Do not dispatch freight.",
  "Do not broker freight.",
  "Do not tender freight.",
  "Do not assign loads.",
  "Do not allocate traffic among carriers.",
  "Do not accept compensation tied to arranging freight.",
];

function createPublicSourceEntry(
  entry: Omit<
    KarpiloAtlasSourceRegistryEntry,
    | "access"
    | "integrationStatus"
    | "tierAvailability"
    | "requiresCitation"
    | "requiresDisclaimer"
  >
): KarpiloAtlasSourceRegistryEntry {
  return {
    ...entry,
    access: "public",
    integrationStatus: "registry_only",
    tierAvailability: [...ALL_TIERS],
    requiresCitation: true,
    requiresDisclaimer: true,
  };
}

export const KARPILO_ATLAS_SOURCE_REGISTRY: KarpiloAtlasSourceRegistryEntry[] = [
  createPublicSourceEntry({
    id: "fmcsa_official_context",
    publicName: "FMCSA public regulatory and carrier-safety context",
    internalName: "Federal Motor Carrier Safety Administration",
    library: "karpilo_atlas_regulatory_library",
    authorityLevel: 1,
    allowedUse: [
      "Provide source-labeled transportation regulatory and carrier-safety awareness.",
      "Support Karpilo Atlas Education explanations about FMCSA-related topics.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not certify carrier authority, safety status, insurance status, or compliance.",
    ],
    relatedSystems: [
      "karpilo_atlas_core",
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "quarterly",
    notes:
      "Registry-only scaffold. This does not add FMCSA API calls, SAFER lookups, or provider integration.",
  }),
  createPublicSourceEntry({
    id: "usdot_official_context",
    publicName: "USDOT public transportation guidance context",
    internalName: "United States Department of Transportation",
    library: "karpilo_atlas_regulatory_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide official agency context for public transportation policy awareness.",
      "Support source-labeled educational summaries when USDOT context is relevant.",
    ],
    prohibitedUse: OFFICIAL_PROHIBITIONS,
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "cfr_ecfr_regulatory_text",
    publicName: "CFR / eCFR regulatory text context",
    internalName: "Code of Federal Regulations and Electronic Code of Federal Regulations",
    library: "karpilo_atlas_regulatory_library",
    authorityLevel: 1,
    allowedUse: [
      "Provide citation-required awareness of federal regulatory text.",
      "Support educational explanations with clear legal/compliance disclaimers.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not interpret regulatory text as legal advice.",
    ],
    relatedSystems: [
      "karpilo_atlas_core",
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "monthly",
  }),
  createPublicSourceEntry({
    id: "federal_register_notices",
    publicName: "Federal Register public notices and rules context",
    internalName: "Federal Register",
    library: "karpilo_atlas_regulatory_library",
    authorityLevel: 1,
    allowedUse: [
      "Provide citation-required awareness of public rulemaking notices and final-rule context.",
    ],
    prohibitedUse: OFFICIAL_PROHIBITIONS,
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "monthly",
  }),
  createPublicSourceEntry({
    id: "phmsa_hazmat_context",
    publicName: "PHMSA hazmat public regulatory context",
    internalName: "Pipeline and Hazardous Materials Safety Administration",
    library: "karpilo_atlas_hazmat_library",
    authorityLevel: 1,
    allowedUse: [
      "Provide source-labeled hazmat awareness and educational context.",
      "Support freight and route warnings that require user verification.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not classify hazmat, certify placarding, certify packaging, or certify hazmat routing.",
    ],
    relatedSystems: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "fmcsa_carrier_identity_public_records",
    publicName: "FMCSA carrier identity and authority public records context",
    internalName: "FMCSA carrier identity public records",
    library: "karpilo_atlas_carrier_identity_authority_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide carrier identity and operating-authority awareness when user-entered context requires verification prompts.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not certify current authority, insurance, safety fitness, or carrier eligibility.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "manual",
    notes:
      "Registry-only scaffold. Future lookup work requires a separate approved adapter and data-use review.",
  }),
  createPublicSourceEntry({
    id: "cvsa_inspection_context",
    publicName: "CVSA inspection and out-of-service awareness context",
    internalName: "Commercial Vehicle Safety Alliance",
    library: "karpilo_atlas_safety_inspection_library",
    authorityLevel: 3,
    allowedUse: [
      "Provide inspection and out-of-service awareness.",
      "Support safety education with industry/enforcement context labeling.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not treat CVSA context as federal law itself.",
    ],
    relatedSystems: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "nhtsa_safety_context",
    publicName: "NHTSA public safety context",
    internalName: "National Highway Traffic Safety Administration",
    library: "karpilo_atlas_safety_inspection_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public vehicle and highway safety awareness where relevant to trucking decision support.",
    ],
    prohibitedUse: OFFICIAL_PROHIBITIONS,
    relatedSystems: ["karpilo_atlas_route", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "osha_loading_unloading_safety_references",
    publicName: "OSHA loading and unloading safety reference context",
    internalName: "Occupational Safety and Health Administration loading and unloading references",
    library: "karpilo_atlas_safety_inspection_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide workplace safety awareness around loading, unloading, and facility handling risks.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not certify workplace safety compliance or shipper/receiver practices.",
    ],
    relatedSystems: ["karpilo_atlas_freight", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "cbp_border_context",
    publicName: "CBP customs and border public context",
    internalName: "U.S. Customs and Border Protection",
    library: "karpilo_atlas_customs_border_library",
    authorityLevel: 1,
    allowedUse: [
      "Provide customs and border awareness for cross-border freight questions.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not act as a customs broker or certify cross-border documentation.",
    ],
    relatedSystems: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "fmc_maritime_context",
    publicName: "FMC maritime public context",
    internalName: "Federal Maritime Commission",
    library: "karpilo_atlas_maritime_intermodal_library",
    authorityLevel: 1,
    allowedUse: [
      "Provide maritime and ocean-shipping awareness when intermodal context is relevant.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not replace maritime legal, booking, port, carrier, or customs authority.",
    ],
    relatedSystems: ["karpilo_atlas_freight", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "marad_maritime_public_context",
    publicName: "MARAD maritime public context",
    internalName: "Maritime Administration",
    library: "karpilo_atlas_maritime_intermodal_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide public maritime and port-context awareness for freight movement education.",
    ],
    prohibitedUse: OFFICIAL_PROHIBITIONS,
    relatedSystems: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "usace_waterborne_commerce_data",
    publicName: "USACE Waterborne Commerce public data context",
    internalName: "U.S. Army Corps of Engineers Waterborne Commerce Statistics",
    library: "karpilo_atlas_maritime_intermodal_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public waterborne freight and port-flow context for broad trend awareness.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not imply freight availability, port booking, or specific load opportunity.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "annual",
  }),
  createPublicSourceEntry({
    id: "surface_transportation_board_rail_public_data",
    publicName: "Surface Transportation Board public rail data context",
    internalName: "Surface Transportation Board public rail data",
    library: "karpilo_atlas_maritime_intermodal_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public rail and intermodal context for broad freight movement awareness.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not represent rail public data as customer-specific freight availability.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "eia_energy_and_diesel_context",
    publicName: "EIA public fuel and energy data context",
    internalName: "U.S. Energy Information Administration",
    library: "karpilo_atlas_fuel_cost_tax_reference_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public diesel and energy price trend context.",
      "Support fuel-cost education with source labeling and refresh metadata.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not treat public fuel averages as the user's actual fuel cost.",
    ],
    relatedSystems: [
      "karpilo_atlas_core",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "weekly",
  }),
  createPublicSourceEntry({
    id: "irs_tax_reference_context",
    publicName: "IRS tax-reference public context",
    internalName: "Internal Revenue Service",
    library: "karpilo_atlas_fuel_cost_tax_reference_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide tax-reference awareness and documentation reminders.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not provide tax advice, tax filing instructions, or accounting authority.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "ifta_reference_context",
    publicName: "IFTA public reference context",
    internalName: "International Fuel Tax Agreement references",
    library: "karpilo_atlas_fuel_cost_tax_reference_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide IFTA-awareness context for fuel and mileage documentation reminders.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not prepare IFTA returns or certify IFTA compliance.",
    ],
    relatedSystems: ["karpilo_atlas_route", "karpilo_atlas_education"],
    refreshCadence: "annual",
  }),
  createPublicSourceEntry({
    id: "irp_reference_context",
    publicName: "IRP public reference context",
    internalName: "International Registration Plan references",
    library: "karpilo_atlas_fuel_cost_tax_reference_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide IRP-awareness context for registration and jurisdictional documentation reminders.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not prepare IRP filings or certify registration compliance.",
    ],
    relatedSystems: ["karpilo_atlas_route", "karpilo_atlas_education"],
    refreshCadence: "annual",
  }),
  createPublicSourceEntry({
    id: "noaa_nws_weather_context",
    publicName: "NOAA / National Weather Service public weather context",
    internalName: "National Oceanic and Atmospheric Administration and National Weather Service",
    library: "karpilo_atlas_route_weather_hazard_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public weather and hazard-awareness context for route decision support.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not guarantee weather conditions, road conditions, or safe travel.",
    ],
    relatedSystems: ["karpilo_atlas_route", "karpilo_atlas_education"],
    refreshCadence: "daily",
  }),
  createPublicSourceEntry({
    id: "national_hurricane_center_context",
    publicName: "National Hurricane Center public tropical-weather context",
    internalName: "National Hurricane Center",
    library: "karpilo_atlas_route_weather_hazard_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide tropical-weather and hurricane-awareness context when route exposure may matter.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not guarantee storm path, timing, road closures, or operating safety.",
    ],
    relatedSystems: ["karpilo_atlas_route", "karpilo_atlas_education"],
    refreshCadence: "event_driven",
  }),
  createPublicSourceEntry({
    id: "state_dot_511_systems",
    publicName: "State DOT 511 public road-condition context",
    internalName: "State Department of Transportation 511 systems",
    library: "karpilo_atlas_state_local_authority_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide state-labeled road condition, closure, and incident-awareness context.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not guarantee road openness, legal routing, or ETA.",
    ],
    relatedSystems: ["karpilo_atlas_route", "karpilo_atlas_education"],
    refreshCadence: "event_driven",
  }),
  createPublicSourceEntry({
    id: "fhwa_national_highway_freight_network",
    publicName: "FHWA National Highway Freight Network public data context",
    internalName: "Federal Highway Administration National Highway Freight Network",
    library: "karpilo_atlas_geospatial_freight_infrastructure_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public freight-network and corridor context.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not certify route legality, truck access, clearances, or permits.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_route"],
    refreshCadence: "annual",
  }),
  createPublicSourceEntry({
    id: "census_tiger_line_geospatial_data",
    publicName: "Census TIGER/Line public geospatial context",
    internalName: "U.S. Census Bureau TIGER/Line",
    library: "karpilo_atlas_geospatial_freight_infrastructure_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public geospatial boundary and roadway context.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not use as truck navigation, legal routing, or address-validation authority.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_route"],
    refreshCadence: "annual",
  }),
  createPublicSourceEntry({
    id: "usgs_elevation_terrain_context",
    publicName: "USGS elevation and terrain public data context",
    internalName: "U.S. Geological Survey elevation and terrain data",
    library: "karpilo_atlas_geospatial_freight_infrastructure_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide terrain and elevation awareness for route-burden context.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not certify grade, clearance, legal routing, or equipment suitability.",
    ],
    relatedSystems: ["karpilo_atlas_route", "karpilo_atlas_education"],
    refreshCadence: "annual",
  }),
  createPublicSourceEntry({
    id: "state_osow_permit_offices",
    publicName: "State OS/OW permit office public context",
    internalName: "State oversize and overweight permit offices",
    library: "karpilo_atlas_state_local_authority_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide state-labeled permit-awareness prompts for oversize or overweight context.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not certify permits, route approval, dimensions, weights, bridge limits, or escorts.",
    ],
    relatedSystems: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "state_local_truck_route_restrictions",
    publicName: "State and local truck-route and restriction context",
    internalName: "State and local truck-route and truck-restriction public sources",
    library: "karpilo_atlas_state_local_authority_library",
    authorityLevel: 2,
    allowedUse: [
      "Provide state/local awareness prompts for truck-route restrictions and local access review.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not certify local truck access, curb access, bridge/tunnel restrictions, or legal routing.",
    ],
    relatedSystems: ["karpilo_atlas_route", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "bts_freight_analysis_framework",
    publicName: "BTS Freight Analysis Framework public data context",
    internalName: "Bureau of Transportation Statistics Freight Analysis Framework",
    library: "karpilo_atlas_freight_flow_economic_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public freight-flow context for trend and lane-awareness education.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not imply current load availability, rates, broker demand, or lane-specific market truth.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "annual",
  }),
  createPublicSourceEntry({
    id: "bts_transborder_freight_data",
    publicName: "BTS TransBorder Freight public data context",
    internalName: "Bureau of Transportation Statistics TransBorder Freight Data",
    library: "karpilo_atlas_freight_flow_economic_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public cross-border freight-flow trend context.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not represent trend data as current border freight availability or rates.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "monthly",
  }),
  createPublicSourceEntry({
    id: "census_commodity_flow_survey",
    publicName: "Census Commodity Flow Survey public data context",
    internalName: "U.S. Census Bureau Commodity Flow Survey",
    library: "karpilo_atlas_freight_flow_economic_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public commodity-flow trend context.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not present survey data as current spot-market, load-board, or rate-board truth.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "annual",
  }),
  createPublicSourceEntry({
    id: "epa_smartway_efficiency_context",
    publicName: "EPA SmartWay public efficiency context",
    internalName: "Environmental Protection Agency SmartWay",
    library: "karpilo_atlas_environmental_efficiency_library",
    authorityLevel: 4,
    allowedUse: [
      "Provide public fuel-efficiency and environmental-performance awareness.",
    ],
    prohibitedUse: [
      ...OFFICIAL_PROHIBITIONS,
      "Do not certify emissions compliance, SmartWay participation status, or fuel savings.",
    ],
    relatedSystems: [
      "karpilo_atlas_core",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "ooida_industry_perspective",
    publicName: "OOIDA owner-operator industry perspective",
    internalName: "Owner-Operator Independent Drivers Association",
    library: "karpilo_atlas_industry_association_library",
    authorityLevel: 5,
    allowedUse: [
      "Provide independent owner-operator and small-business trucking perspective with lens disclosure.",
    ],
    prohibitedUse: [
      "Do not treat OOIDA as law, regulation, official agency guidance, or universal trucking consensus.",
      "Do not use association perspective as a substitute for official sources or professional advice.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "ata_industry_perspective",
    publicName: "ATA motor-carrier industry perspective",
    internalName: "American Trucking Associations",
    library: "karpilo_atlas_industry_association_library",
    authorityLevel: 5,
    allowedUse: [
      "Provide broader motor-carrier and trucking-industry perspective with lens disclosure.",
    ],
    prohibitedUse: [
      "Do not treat ATA as law, regulation, official agency guidance, or universal trucking consensus.",
      "Do not use association perspective as a substitute for official sources or professional advice.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "quarterly",
  }),
  createPublicSourceEntry({
    id: "freightwaves_public_trucking_news",
    publicName: "FreightWaves and public trucking news context",
    internalName: "Public trucking news and commentary",
    library: "karpilo_atlas_public_news_library",
    authorityLevel: 6,
    allowedUse: [
      "Provide low-authority trend, commentary, and industry-news awareness.",
    ],
    prohibitedUse: [
      "Do not treat public news as law, agency guidance, official data, current freight availability, or rate truth.",
      "Do not build load-board or rate-board behavior from public news commentary.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "daily",
  }),
  createPublicSourceEntry({
    id: "public_agency_news_releases",
    publicName: "Public agency news releases context",
    internalName: "Public transportation agency news releases",
    library: "karpilo_atlas_public_news_library",
    authorityLevel: 6,
    allowedUse: [
      "Provide low-authority news-release awareness with source labeling.",
    ],
    prohibitedUse: [
      "Do not treat a news release as a complete legal, regulatory, safety, route, or operational authority by itself.",
    ],
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    refreshCadence: "daily",
  }),
  {
    id: "dat_load_board_excluded",
    publicName: "DAT/load-board data excluded",
    internalName: "DAT and commercial load-board data",
    library: "karpilo_atlas_public_news_library",
    authorityLevel: 6,
    access: "excluded",
    integrationStatus: "excluded",
    allowedUse: [
      "User may manually enter their own load-offer details for private Karpilo LoadIQ decision analysis.",
    ],
    prohibitedUse: LOAD_BOARD_PROHIBITIONS,
    relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
    tierAvailability: [],
    requiresCitation: false,
    requiresDisclaimer: true,
    refreshCadence: "not_applicable",
    notes:
      "Excluded by default. Karpilo LoadIQ must not scrape, parse, display, or act as a DAT/load-board/rate-board replacement.",
  },
];

export function getKarpiloAtlasSourcesByLibrary(
  library: KarpiloAtlasReferenceLibrary
): KarpiloAtlasSourceRegistryEntry[] {
  return KARPILO_ATLAS_SOURCE_REGISTRY.filter(
    (source) => source.library === library
  );
}

export function getKarpiloAtlasSourcesByAuthorityLevel(
  authorityLevel: KarpiloAtlasAuthorityLevel
): KarpiloAtlasSourceRegistryEntry[] {
  return KARPILO_ATLAS_SOURCE_REGISTRY.filter(
    (source) => source.authorityLevel === authorityLevel
  );
}

export function getKarpiloAtlasSourcesForSystem(
  systemId: KarpiloAtlasSystemId
): KarpiloAtlasSourceRegistryEntry[] {
  return KARPILO_ATLAS_SOURCE_REGISTRY.filter((source) =>
    source.relatedSystems.includes(systemId)
  );
}

export function getExcludedKarpiloAtlasSources(): KarpiloAtlasSourceRegistryEntry[] {
  return KARPILO_ATLAS_SOURCE_REGISTRY.filter(
    (source) =>
      source.access === "excluded" || source.integrationStatus === "excluded"
  );
}
