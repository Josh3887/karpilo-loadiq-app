export type AtlasCoreSecondaryRoleKey =
  | "equipment_context"
  | "regulation_reference"
  | "operational_review";

export type AtlasEquipmentPackKey =
  | "dry_van"
  | "reefer"
  | "flatbed"
  | "step_deck"
  | "lowboy_rgn"
  | "conestoga"
  | "hot_shot"
  | "tanker"
  | "bulk_hopper"
  | "container_chassis"
  | "car_hauler"
  | "livestock"
  | "dump"
  | "power_only"
  | "specialized_oversize";

export type AtlasTierKey = "silver" | "gold" | "platinum" | "pro";

export type AtlasTierIntelligencePolicy = {
  tier: AtlasTierKey;
  education: string;
  freight: string;
  route: string;
  fitCheck: string;
  addOnCredits: string;
};

export const ATLAS_SYSTEM_MISSION =
  "Atlas is governed transportation intelligence for LoadIQ. It explains structured app, vehicle, freight, route, cost, and public-reference data without acting as dispatch, routing, compliance, legal, tax, safety, or broker authority.";

export const ATLAS_CONTROLLED_ACTIVATION_POLICY = {
  ambientTriggersDisabled: true,
  summary:
    "Atlas must activate from explicit user intent, calculated results, saved snapshots, or server-side governance checks. Hover, focus, route-change, and background navigation events must not open Atlas panels or call AI.",
  allowedTriggers: [
    {
      key: "explicit_user_request",
      label: "Explicit User Request",
      description:
        "A button, supported Atlas control, or intentional analysis action requested by the user.",
    },
    {
      key: "calculated_result",
      label: "Calculated Result",
      description:
        "A deterministic LoadIQ result exists and the user requests an Atlas explanation.",
    },
    {
      key: "saved_snapshot",
      label: "Saved Snapshot",
      description:
        "A saved load, route, vehicle, FitCheck, or review record is opened by the user.",
    },
    {
      key: "governance_status",
      label: "Governance Status",
      description:
        "Server-side entitlement, cooldown, budget, model, cache, and kill-switch checks pass.",
    },
  ],
  blockedTriggers: [
    "pointerover",
    "focusin",
    "route_change",
    "background_polling",
    "automatic_modal",
  ],
} as const;

export const ATLAS_CORE_SECONDARY_ROLES: Record<
  AtlasCoreSecondaryRoleKey,
  {
    label: string;
    purpose: string;
    feeds: string[];
    boundary: string;
  }
> = {
  equipment_context: {
    label: "Equipment Context",
    purpose:
      "Maintains structured vehicle, trailer, body, cargo-capability, securement-tool, dimension, weight, hazmat, and combination context.",
    feeds: ["Atlas Freight", "Atlas Route", "Atlas Education", "FitCheck"],
    boundary:
      "Equipment Context is structured data intelligence. It does not certify equipment legality, maintenance condition, securement compliance, or route permission.",
  },
  regulation_reference: {
    label: "Regulation Reference",
    purpose:
      "Attaches federal, state, provider, and user-entered reference context to Atlas outputs when regulatory concepts are involved.",
    feeds: ["Atlas Freight", "Atlas Route", "Atlas Education"],
    boundary:
      "Regulation Reference provides source-labeled education only. It must not say a load, route, carrier, driver, or securement method is legal, approved, or compliant.",
  },
  operational_review: {
    label: "Operational Review",
    purpose:
      "Compares planned assumptions against actual trip results so Atlas can explain what changed and what assumptions failed.",
    feeds: ["Atlas Freight", "Atlas Route", "Atlas Education", "FitCheck"],
    boundary:
      "Operational Review explains variance. It does not guarantee future load outcomes, broker behavior, rates, settlements, or profit.",
  },
};

export const ATLAS_EQUIPMENT_INTELLIGENCE_PACKS: Record<
  AtlasEquipmentPackKey,
  {
    label: string;
    contextSignals: string[];
    freightConcerns: string[];
    routeConcerns: string[];
  }
> = {
  dry_van: {
    label: "Dry Van / Box Freight",
    contextSignals: ["palletized vs floor-loaded", "cube", "seal", "dock"],
    freightConcerns: ["load shift", "detention", "lumper", "claims"],
    routeConcerns: ["dock access", "urban delivery", "low clearance"],
  },
  reefer: {
    label: "Reefer / Insulated Van",
    contextSignals: ["temperature range", "pre-cool", "fuel", "washout"],
    freightConcerns: ["temperature claims", "dwell", "food-grade handling"],
    routeConcerns: ["weather", "fuel stops", "appointment windows"],
  },
  flatbed: {
    label: "Flatbed",
    contextSignals: ["commodity shape", "tarps", "chains", "straps"],
    freightConcerns: ["securement", "tarp pay", "weather exposure"],
    routeConcerns: ["wind", "terrain", "permit awareness"],
  },
  step_deck: {
    label: "Step Deck",
    contextSignals: ["deck height", "over-height risk", "ramps"],
    freightConcerns: ["dimensions", "securement", "loading equipment"],
    routeConcerns: ["clearance", "terrain", "permit awareness"],
  },
  lowboy_rgn: {
    label: "Lowboy / RGN",
    contextSignals: ["height", "weight", "axles", "permits"],
    freightConcerns: ["heavy equipment fit", "loading", "escort awareness"],
    routeConcerns: ["bridge", "clearance", "state permit awareness"],
  },
  conestoga: {
    label: "Conestoga",
    contextSignals: ["covered flatbed", "side access", "commodity length"],
    freightConcerns: ["load fit", "side kit clearance", "weather protection"],
    routeConcerns: ["wind", "dock access", "clearance"],
  },
  hot_shot: {
    label: "Hot-Shot",
    contextSignals: ["truck class", "trailer length", "payload", "CDL need"],
    freightConcerns: ["payload margin", "expedite pressure", "rate floor"],
    routeConcerns: ["fuel range", "urban access", "weather"],
  },
  tanker: {
    label: "Tanker",
    contextSignals: ["liquid/dry bulk", "surge", "hazmat", "washout"],
    freightConcerns: ["endorsements", "product compatibility", "washout"],
    routeConcerns: ["hazmat routing", "weather", "grade"],
  },
  bulk_hopper: {
    label: "Bulk / Hopper / Pneumatic",
    contextSignals: ["commodity", "unload method", "weight", "washout"],
    freightConcerns: ["contamination", "unload delay", "scale risk"],
    routeConcerns: ["facility access", "grade", "weather"],
  },
  container_chassis: {
    label: "Container / Chassis / Intermodal",
    contextSignals: ["container size", "chassis", "port/rail", "appointments"],
    freightConcerns: ["demurrage", "detention", "chassis availability"],
    routeConcerns: ["port access", "urban congestion", "appointment windows"],
  },
  car_hauler: {
    label: "Car Hauler",
    contextSignals: ["units", "deck positions", "height", "inspection"],
    freightConcerns: ["damage claims", "load order", "delivery constraints"],
    routeConcerns: ["clearance", "urban access", "weather"],
  },
  livestock: {
    label: "Livestock",
    contextSignals: ["animal type", "welfare", "temperature", "timing"],
    freightConcerns: ["welfare", "biosecurity", "time sensitivity"],
    routeConcerns: ["weather", "stops", "facility access"],
  },
  dump: {
    label: "Dump",
    contextSignals: ["material", "site access", "gross weight", "tipping"],
    freightConcerns: ["site conditions", "scale risk", "material handling"],
    routeConcerns: ["local roads", "site grade", "weather"],
  },
  power_only: {
    label: "Power-Only",
    contextSignals: ["trailer owner", "trailer condition", "insurance"],
    freightConcerns: ["trailer liability", "drop terms", "compatibility"],
    routeConcerns: ["pickup access", "trailer restrictions", "deadhead"],
  },
  specialized_oversize: {
    label: "Specialized / Oversize / Overweight",
    contextSignals: ["dimensions", "axles", "permits", "escorts"],
    freightConcerns: ["permits", "securement", "loading", "risk premium"],
    routeConcerns: ["clearance", "bridge", "curfews", "state restrictions"],
  },
};

export const ATLAS_TIER_INTELLIGENCE_POLICY: AtlasTierIntelligencePolicy[] = [
  {
    tier: "silver",
    education: "Deterministic Atlas Education only.",
    freight: "No generative freight AI.",
    route: "Base Route Intelligence and deterministic route context.",
    fitCheck: "Deterministic FitCheck and setup guidance.",
    addOnCredits: "Not eligible.",
  },
  {
    tier: "gold",
    education: "Limited contextual AI where enabled.",
    freight: "Limited Atlas Freight analysis with strict cooldown and call caps.",
    route:
      "Base Route Intelligence and basic provider-backed summaries without truck-specific routing, enriched route AI, or vehicle-constraint routing.",
    fitCheck: "Limited summary where enabled.",
    addOnCredits: "Not eligible by default.",
  },
  {
    tier: "platinum",
    education: "Full Atlas Education within governed usage.",
    freight: "Full equipment-aware and cargo-aware Freight analysis.",
    route:
      "Enriched provider-backed Route intelligence with truck-specific routing estimates where providers are enabled.",
    fitCheck: "Full FitCheck summary and setup review.",
    addOnCredits: "Eligible when billing add-ons are implemented.",
  },
  {
    tier: "pro",
    education: "Advanced Atlas coaching within governed usage.",
    freight: "Advanced Freight analysis and historical pattern review.",
    route:
      "Advanced truck-specific route, lane, reload, deadhead, and multi-load estimation intelligence.",
    fitCheck: "Full FitCheck plus operational re-check automation.",
    addOnCredits: "Eligible when billing add-ons are implemented.",
  },
];

export function isTruckSpecificRoutingTier(tier: string | null | undefined) {
  return (
    tier === "platinum" ||
    tier === "pro" ||
    tier === "pilot" ||
    tier === "launch500" ||
    tier === "founder"
  );
}
