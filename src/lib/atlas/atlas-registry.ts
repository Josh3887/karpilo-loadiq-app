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
    publicName: "Atlas Core",
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
      "Unified runtime cognition, orchestration, synchronization, and infrastructure intelligence.",
  },
  freight: {
    key: "freight",
    publicName: "Atlas Freight Intelligence",
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
      "Freight cognition for load economics, lane profitability, dispatch context, and operational margin pressure.",
  },
  route: {
    key: "route",
    publicName: "Atlas Route Intelligence",
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
      "Movement cognition for route vectors, corridor awareness, navigation telemetry, and predictive route flow.",
  },
  educational: {
    key: "educational",
    publicName: "Atlas Educational Intelligence",
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
      "Contextual operational understanding for workflow guidance, feature explanation, and embedded app cognition.",
  },
} as const satisfies Record<AtlasLayerKey, AtlasIntelligenceLayer>;

export const ATLAS_LAYER_ORDER: AtlasLayerKey[] = [
  "core",
  "freight",
  "route",
  "educational",
];

// TODO(Atlas migration): remove these legacy aliases after iAtion/iAtion Core
// references are fully replaced across APP and WEBSITE.
export const ATLAS_LEGACY_COMPATIBILITY_ALIASES = {
  iation: ATLAS_INTELLIGENCE_LAYERS.educational,
  iationCore: ATLAS_INTELLIGENCE_LAYERS.freight,
} as const;
