export const ATLAS_RUNTIME_IDS = {
  core: "K-ATLS-CORE",
  freight: "K-ATLS-FI",
  route: "K-ATLS-RTE",
  educational: "K-ATLS-EDU",
} as const;

export type AtlasLayerKey = keyof typeof ATLAS_RUNTIME_IDS;
export type AtlasRuntimeId = (typeof ATLAS_RUNTIME_IDS)[AtlasLayerKey];

export type AtlasColorIdentity = {
  name: "purple" | "green" | "red" | "blue";
  primary: string;
  accent: string;
  glow: string;
};

export type AtlasAssetSet = {
  emblem: string;
  dashboard: string;
  dashboardAlt: string;
  backdrop: string;
};

export type AtlasIntelligenceLayer = {
  key: AtlasLayerKey;
  publicName: string;
  runtimeId: AtlasRuntimeId;
  colorIdentity: AtlasColorIdentity;
  assets: AtlasAssetSet;
  shortOperationalDescription: string;
};

export const ATLAS_ASSET_ROOT = "/branding/atlas";

export const ATLAS_INTELLIGENCE_LAYERS = {
  core: {
    key: "core",
    publicName: "Karpilo Atlas AI",
    runtimeId: ATLAS_RUNTIME_IDS.core,
    colorIdentity: {
      name: "purple",
      primary: "#A855F7",
      accent: "#C084FC",
      glow: "rgba(168, 85, 247, 0.28)",
    },
    assets: {
      emblem: `${ATLAS_ASSET_ROOT}/core/karpilo-atlas-core-emblem.png`,
      dashboard: `${ATLAS_ASSET_ROOT}/core/karpilo-atlas-core-dashboard-v1.png`,
      dashboardAlt: `${ATLAS_ASSET_ROOT}/core/karpilo-atlas-core-dashboard-alt.png`,
      backdrop: `${ATLAS_ASSET_ROOT}/backdrops/karpilo-atlas-core-backdrop-vertical-v1.png`,
    },
    shortOperationalDescription:
      "Educational and analytical support for explaining Karpilo LoadIQ calculations and user-interface context.",
  },
  freight: {
    key: "freight",
    publicName: "Atlas Analysis Assistance",
    runtimeId: ATLAS_RUNTIME_IDS.freight,
    colorIdentity: {
      name: "green",
      primary: "#84CC16",
      accent: "#A3E635",
      glow: "rgba(132, 204, 22, 0.26)",
    },
    assets: {
      emblem: `${ATLAS_ASSET_ROOT}/freight/karpilo-atlas-freight-emblem.png`,
      dashboard: `${ATLAS_ASSET_ROOT}/freight/karpilo-atlas-freight-dashboard-v1.png`,
      dashboardAlt: `${ATLAS_ASSET_ROOT}/freight/karpilo-atlas-freight-dashboard-alt.png`,
      backdrop: `${ATLAS_ASSET_ROOT}/backdrops/karpilo-atlas-freight-backdrop-vertical-v1.png`,
    },
    shortOperationalDescription:
      "Calculation interpretation support for profitability estimates, margin pressure, deadhead, fuel, RPM, and overhead context.",
  },
  route: {
    key: "route",
    publicName: "Atlas Operational Context",
    runtimeId: ATLAS_RUNTIME_IDS.route,
    colorIdentity: {
      name: "red",
      primary: "#EF4444",
      accent: "#F87171",
      glow: "rgba(239, 68, 68, 0.28)",
    },
    assets: {
      emblem: `${ATLAS_ASSET_ROOT}/route/karpilo-atlas-route-emblem.png`,
      dashboard: `${ATLAS_ASSET_ROOT}/route/karpilo-atlas-route-dashboard-v1.png`,
      dashboardAlt: `${ATLAS_ASSET_ROOT}/route/karpilo-atlas-route-dashboard-alt.png`,
      backdrop: `${ATLAS_ASSET_ROOT}/backdrops/karpilo-atlas-route-backdrop-vertical-v1.png`,
    },
    shortOperationalDescription:
      "Informational context for entered route variables, deadhead exposure, stop complexity, timing, and distance assumptions.",
  },
  educational: {
    key: "educational",
    publicName: "Atlas Educational Support",
    runtimeId: ATLAS_RUNTIME_IDS.educational,
    colorIdentity: {
      name: "blue",
      primary: "#38BDF8",
      accent: "#7DD3FC",
      glow: "rgba(56, 189, 248, 0.28)",
    },
    assets: {
      emblem: `${ATLAS_ASSET_ROOT}/educational/karpilo-atlas-educational-emblem.png`,
      dashboard: `${ATLAS_ASSET_ROOT}/educational/karpilo-atlas-educational-dashboard-v1.png`,
      dashboardAlt: `${ATLAS_ASSET_ROOT}/educational/karpilo-atlas-educational-dashboard-alt.png`,
      backdrop: `${ATLAS_ASSET_ROOT}/backdrops/karpilo-atlas-educational-backdrop-vertical-v1.png`,
    },
    shortOperationalDescription:
      "User-interface guidance that explains fields, workflow meaning, and how user-supplied inputs affect estimates.",
  },
} as const satisfies Record<AtlasLayerKey, AtlasIntelligenceLayer>;

export const ATLAS_LAYER_ORDER: AtlasLayerKey[] = [
  "core",
  "freight",
  "route",
  "educational",
];

export const ATLAS_PROCESSING_DISCLOSURE =
  "Karpilo Atlas AI provides embedded educational, informational, and analytical support inside Karpilo LoadIQ. Where applicable, third-party AI infrastructure may help process explanations, but Atlas remains supplemental to the calculator and does not make operational decisions.";

export const ATLAS_PROPRIETARY_STATEMENT =
  "Karpilo Atlas AI, Atlas Insights, Atlas Guidance, Atlas Educational Support, and Atlas Operational Context are proprietary Karpilo LoadIQ support concepts developed by Karpilo Endeavor Technologies. These systems support educational app guidance, calculation explanation, profitability interpretation, and non-authoritative operational awareness based on structured application data, calculated outputs, and user-provided inputs.";

export const ATLAS_EDUCATIONAL_DISCLAIMER =
  "Karpilo Atlas AI provides contextual educational support for navigating Karpilo LoadIQ features, workflows, and app tools. It explains functionality and calculation context only. It does not make business, financial, legal, tax, compliance, safety, routing, broker, or dispatch decisions.";

// TODO(Atlas Core): active orchestration intentionally deferred to protect
// deterministic calculator authority.

// TODO(Atlas migration): remove these legacy aliases after iAtion/iAtion Core
// references are fully replaced across APP and WEBSITE.
export const ATLAS_LEGACY_COMPATIBILITY_ALIASES = {
  iation: ATLAS_INTELLIGENCE_LAYERS.educational,
  iationCore: ATLAS_INTELLIGENCE_LAYERS.freight,
} as const;
