import type {
  KarpiloAtlasLibraryCatalogEntry,
  KarpiloAtlasReferenceLibrary,
} from "./library-types";

export const KARPILO_ATLAS_LIBRARY_CATALOG: KarpiloAtlasLibraryCatalogEntry[] = [
  {
    id: "karpilo_atlas_regulatory_library",
    publicName: "Karpilo Atlas Regulatory Library",
    purpose:
      "Regulatory-awareness context for transportation, carrier, safety, freight, and operating topics.",
    authoritySummary:
      "Highest-authority legal and regulatory source awareness when tied to CFR, eCFR, Federal Register, FMCSA, PHMSA, CBP, FMC, or state statutes and regulations.",
    usedBy: [
      "karpilo_atlas_core",
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    guardrails: [
      "Use for awareness and source context only.",
      "Do not present Karpilo LoadIQ as legal, compliance, permit, hazmat, customs, or routing authority.",
      "Require citations and disclaimers for user-facing regulatory context.",
    ],
  },
  {
    id: "karpilo_atlas_carrier_identity_authority_library",
    publicName: "Karpilo Atlas Carrier Identity & Authority Library",
    purpose:
      "Carrier identity, operating authority, registration, and public carrier-status awareness.",
    authoritySummary:
      "Official public records can inform identity and authority awareness but must not certify current operating authority for the user.",
    usedBy: ["karpilo_atlas_core", "karpilo_atlas_education"],
    guardrails: [
      "Do not certify authority, safety status, insurance status, or operating legality.",
      "Direct users to official records for final verification.",
    ],
  },
  {
    id: "karpilo_atlas_safety_inspection_library",
    publicName: "Karpilo Atlas Safety & Inspection Library",
    purpose:
      "Safety, inspection, out-of-service, loading, unloading, and enforcement-awareness context.",
    authoritySummary:
      "Safety agencies, enforcement bodies, and inspection organizations provide safety context with different authority levels.",
    usedBy: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    guardrails: [
      "Treat CVSA as safety and inspection context, not federal law.",
      "Do not certify safety compliance, loading compliance, or roadside inspection outcomes.",
    ],
  },
  {
    id: "karpilo_atlas_hazmat_library",
    publicName: "Karpilo Atlas Hazmat Library",
    purpose:
      "Hazmat awareness, handling, routing, documentation, and carrier-question context.",
    authoritySummary:
      "PHMSA, CFR, eCFR, FMCSA, and state public hazmat references are high-authority awareness inputs.",
    usedBy: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    guardrails: [
      "Do not classify hazmat, certify packaging, certify placarding, or certify route legality.",
      "Do not replace hazmat training, carrier policy, shipper documentation, or official compliance review.",
    ],
  },
  {
    id: "karpilo_atlas_customs_border_library",
    publicName: "Karpilo Atlas Customs & Border Library",
    purpose:
      "Border, customs, import, export, and cross-border freight-awareness context.",
    authoritySummary:
      "CBP, FMC, MARAD, and official border/public trade sources can provide awareness but not brokerage authority.",
    usedBy: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    guardrails: [
      "Do not act as a customs broker.",
      "Do not certify import/export, customs, security, or border documentation compliance.",
    ],
  },
  {
    id: "karpilo_atlas_maritime_intermodal_library",
    publicName: "Karpilo Atlas Maritime & Intermodal Library",
    purpose:
      "Port, maritime, rail, intermodal, chassis, drayage, and container-awareness context.",
    authoritySummary:
      "FMC, MARAD, USACE, Surface Transportation Board, port, and public intermodal sources provide context only.",
    usedBy: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    guardrails: [
      "Do not book freight, reserve port appointments, dispatch drayage, or match carriers to freight.",
      "Do not replace port, rail, steamship line, chassis provider, or customs authority.",
    ],
  },
  {
    id: "karpilo_atlas_industry_association_library",
    publicName: "Karpilo Atlas Industry Association Library",
    purpose:
      "Industry perspective, owner-operator lens, and carrier/trucking association context.",
    authoritySummary:
      "OOIDA and ATA are industry perspectives. They are not law, regulation, agency guidance, or product truth.",
    usedBy: ["karpilo_atlas_core", "karpilo_atlas_education"],
    guardrails: [
      "Disclose the association lens when using industry association context.",
      "Do not treat association positions as legal, regulatory, or market truth.",
    ],
  },
  {
    id: "karpilo_atlas_fuel_cost_tax_reference_library",
    publicName: "Karpilo Atlas Fuel, Cost & Tax Reference Library",
    purpose:
      "Fuel, cost, excise-tax, IFTA, IRP, and tax-reference awareness context.",
    authoritySummary:
      "EIA, IRS, IFTA, IRP, and state public references can inform cost and tax awareness with clear boundaries.",
    usedBy: [
      "karpilo_atlas_core",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    guardrails: [
      "Do not provide tax filing advice, accounting advice, or IFTA/IRP filing authority.",
      "Use public fuel and cost references as planning context, not final operating truth.",
    ],
  },
  {
    id: "karpilo_atlas_route_weather_hazard_library",
    publicName: "Karpilo Atlas Route, Weather & Hazard Library",
    purpose:
      "Weather, public road condition, route-risk, incident, and hazard-awareness context.",
    authoritySummary:
      "NOAA, National Weather Service, National Hurricane Center, state DOT 511, FHWA, and USGS sources provide public risk context.",
    usedBy: ["karpilo_atlas_route", "karpilo_atlas_education"],
    guardrails: [
      "Do not provide truck navigation, legal routing, road-closure guarantees, or ETA guarantees.",
      "Weather and hazard context must remain decision support with provider limitations.",
    ],
  },
  {
    id: "karpilo_atlas_geospatial_freight_infrastructure_library",
    publicName: "Karpilo Atlas Geospatial & Freight Infrastructure Library",
    purpose:
      "Public geography, roadway, corridor, terrain, elevation, freight infrastructure, and facility context.",
    authoritySummary:
      "FHWA, BTS, Census TIGER/Line, USGS, USACE, and MARAD public datasets require refresh metadata and limitations.",
    usedBy: [
      "karpilo_atlas_core",
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
    ],
    guardrails: [
      "Do not certify legal routes, bridge clearances, permits, weights, or facility access.",
      "Treat public datasets as stale until reviewed or refreshed.",
    ],
  },
  {
    id: "karpilo_atlas_freight_flow_economic_library",
    publicName: "Karpilo Atlas Freight Flow & Economic Library",
    purpose:
      "Freight movement, public economic context, and trend awareness without load-board or rate-board behavior.",
    authoritySummary:
      "BTS, FHWA, Census, EIA, public agency news, and public transportation news can inform trend awareness only.",
    usedBy: ["karpilo_atlas_core", "karpilo_atlas_education"],
    guardrails: [
      "Do not show load availability, broker loads, carrier matching, or rate-board output.",
      "Do not represent public freight flow context as spot-market freight truth.",
    ],
  },
  {
    id: "karpilo_atlas_environmental_efficiency_library",
    publicName: "Karpilo Atlas Environmental & Efficiency Library",
    purpose:
      "Efficiency, emissions, fuel-use, and public operational-efficiency awareness context.",
    authoritySummary:
      "EPA SmartWay, EIA, NHTSA, and FHWA sources can provide public efficiency context with limitations.",
    usedBy: [
      "karpilo_atlas_core",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    guardrails: [
      "Do not certify emissions compliance or guarantee fuel outcomes.",
      "Do not replace carrier policy, maintenance judgment, or regulatory review.",
    ],
  },
  {
    id: "karpilo_atlas_public_news_library",
    publicName: "Karpilo Atlas Public News Library",
    purpose:
      "Public news, agency releases, and transportation commentary for low-authority trend awareness.",
    authoritySummary:
      "Public news and commentary are lowest-authority source context and never regulatory truth by themselves.",
    usedBy: ["karpilo_atlas_core", "karpilo_atlas_education"],
    guardrails: [
      "Use for trend and awareness context only.",
      "Never treat news commentary as law, official guidance, freight availability, or rate truth.",
    ],
  },
  {
    id: "karpilo_atlas_state_local_authority_library",
    publicName: "Karpilo Atlas State & Local Authority Library",
    purpose:
      "State and local route restriction, OS/OW, road condition, truck-route, and permit-awareness context.",
    authoritySummary:
      "State DOT, OS/OW permit offices, state 511 systems, and local truck-route sources vary by jurisdiction and freshness.",
    usedBy: [
      "karpilo_atlas_freight",
      "karpilo_atlas_route",
      "karpilo_atlas_education",
    ],
    guardrails: [
      "Do not certify permits, legal routing, local access, bridge limits, or truck restrictions.",
      "Require state/local source labeling and freshness notes.",
    ],
  },
];

export function getKarpiloAtlasLibraryById(
  id: KarpiloAtlasReferenceLibrary
): KarpiloAtlasLibraryCatalogEntry | undefined {
  return KARPILO_ATLAS_LIBRARY_CATALOG.find((library) => library.id === id);
}
