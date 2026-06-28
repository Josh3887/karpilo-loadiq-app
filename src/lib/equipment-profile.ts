import {
  ATLAS_EQUIPMENT_INTELLIGENCE_PACKS,
  type AtlasEquipmentPackKey,
} from "@/lib/atlas/atlas-intelligence-system";

export const TRANSPORT_EQUIPMENT_OPTIONS = [
  "Dry van",
  "Reefer",
  "Flatbed",
  "Step deck",
  "Lowboy / RGN",
  "Conestoga",
  "Tanker",
  "Hot-shot",
  "Box truck",
  "Container / chassis",
  "Bulk / hopper / pneumatic",
  "Car hauler",
  "Livestock",
  "Dump",
  "Power-only",
  "Specialized / oversize",
  "Other",
] as const;

export const COMBINATION_TYPE_OPTIONS = [
  "Single tractor-trailer",
  "Straight truck",
  "Truck and trailer",
  "Hot-shot pickup and trailer",
  "Doubles",
  "Triples",
  "B-train / multi-combination",
  "Power-only",
  "Other",
] as const;

export type TransportEquipmentType =
  (typeof TRANSPORT_EQUIPMENT_OPTIONS)[number];
export type CombinationType = (typeof COMBINATION_TYPE_OPTIONS)[number];

export type StructuredEquipmentProfile = {
  equipmentType: string;
  atlasEquipmentPack: AtlasEquipmentPackKey;
  combinationType: string;
  trailerLengthFeet: number;
  trailerWidthInches: number;
  trailerHeightInches: number;
  vehicleTareWeightLbs: number;
  estimatedMaxGrossLbs: number;
  maxPayloadLbs: number;
  grossVehicleWeightRatingLbs: number;
  axleCount: number;
  hazmatCapable: boolean;
  tankerCapable: boolean;
  refrigeratedCapable: boolean;
  specializedCapabilities: string[];
  securementEquipment: string[];
  routeRestrictionNotes: string;
};

export const DEFAULT_EQUIPMENT_PROFILE_INPUT = {
  equipmentType: "Dry van",
  combinationType: "Single tractor-trailer",
  trailerLengthFeet: 53,
  trailerWidthInches: 102,
  trailerHeightInches: 162,
  vehicleTareWeightLbs: 0,
  estimatedMaxGrossLbs: 0,
  maxPayloadLbs: 45000,
  grossVehicleWeightRatingLbs: 80000,
  axleCount: 5,
  hazmatCapable: false,
  tankerCapable: false,
  refrigeratedCapable: false,
  specializedCapabilities: [],
  securementEquipment: [],
  routeRestrictionNotes: "",
} satisfies Omit<StructuredEquipmentProfile, "atlasEquipmentPack">;

const EQUIPMENT_TO_ATLAS_PACK: Record<string, AtlasEquipmentPackKey> = {
  "dry van": "dry_van",
  "van": "dry_van",
  "box truck": "dry_van",
  reefer: "reefer",
  "refrigerated van": "reefer",
  flatbed: "flatbed",
  "step deck": "step_deck",
  lowboy: "lowboy_rgn",
  rgn: "lowboy_rgn",
  "lowboy / rgn": "lowboy_rgn",
  conestoga: "conestoga",
  tanker: "tanker",
  "hot-shot": "hot_shot",
  "hot shot": "hot_shot",
  "container / chassis": "container_chassis",
  chassis: "container_chassis",
  container: "container_chassis",
  "bulk / hopper / pneumatic": "bulk_hopper",
  hopper: "bulk_hopper",
  pneumatic: "bulk_hopper",
  "car hauler": "car_hauler",
  livestock: "livestock",
  dump: "dump",
  "power-only": "power_only",
  "power only": "power_only",
  "specialized / oversize": "specialized_oversize",
  specialized: "specialized_oversize",
  oversize: "specialized_oversize",
};

function normalizeKey(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function splitList(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function mapEquipmentTypeToAtlasPack(
  equipmentType: string | null | undefined
): AtlasEquipmentPackKey {
  const key = normalizeKey(equipmentType);
  return EQUIPMENT_TO_ATLAS_PACK[key] ?? "specialized_oversize";
}

export function getAtlasEquipmentPackLabel(
  pack: string | null | undefined,
  fallback = "Specialized / Oversize / Overweight"
) {
  if (!pack) return fallback;

  return (
    ATLAS_EQUIPMENT_INTELLIGENCE_PACKS[pack as AtlasEquipmentPackKey]?.label ??
    fallback
  );
}

export function isHazmatEquipmentProfile({
  endorsements,
  hazmatCapable,
}: {
  endorsements?: string[];
  hazmatCapable?: boolean;
}) {
  return (
    hazmatCapable === true ||
    (endorsements ?? []).some((endorsement) =>
      normalizeKey(endorsement).includes("hazmat")
    )
  );
}

export function buildStructuredEquipmentProfile(input: {
  equipmentType?: string | null;
  combinationType?: string | null;
  trailerLengthFeet?: unknown;
  trailerWidthInches?: unknown;
  trailerHeightInches?: unknown;
  vehicleTareWeightLbs?: unknown;
  estimatedMaxGrossLbs?: unknown;
  maxPayloadLbs?: unknown;
  grossVehicleWeightRatingLbs?: unknown;
  axleCount?: unknown;
  hazmatCapable?: boolean | null;
  tankerCapable?: boolean | null;
  refrigeratedCapable?: boolean | null;
  specializedCapabilities?: string | string[] | null;
  securementEquipment?: string | string[] | null;
  routeRestrictionNotes?: string | null;
}): StructuredEquipmentProfile {
  const equipmentType =
    input.equipmentType || DEFAULT_EQUIPMENT_PROFILE_INPUT.equipmentType;

  return {
    equipmentType,
    atlasEquipmentPack: mapEquipmentTypeToAtlasPack(equipmentType),
    combinationType:
      input.combinationType || DEFAULT_EQUIPMENT_PROFILE_INPUT.combinationType,
    trailerLengthFeet: safeNumber(input.trailerLengthFeet),
    trailerWidthInches: safeNumber(input.trailerWidthInches),
    trailerHeightInches: safeNumber(input.trailerHeightInches),
    vehicleTareWeightLbs: safeNumber(input.vehicleTareWeightLbs),
    estimatedMaxGrossLbs: safeNumber(input.estimatedMaxGrossLbs),
    maxPayloadLbs: safeNumber(input.maxPayloadLbs),
    grossVehicleWeightRatingLbs: safeNumber(input.grossVehicleWeightRatingLbs),
    axleCount: Math.max(Math.round(safeNumber(input.axleCount)), 0),
    hazmatCapable: input.hazmatCapable === true,
    tankerCapable: input.tankerCapable === true,
    refrigeratedCapable: input.refrigeratedCapable === true,
    specializedCapabilities: splitList(input.specializedCapabilities),
    securementEquipment: splitList(input.securementEquipment),
    routeRestrictionNotes: String(input.routeRestrictionNotes ?? "").trim(),
  };
}

export function buildDefaultStructuredEquipmentProfile() {
  return buildStructuredEquipmentProfile(DEFAULT_EQUIPMENT_PROFILE_INPUT);
}

export function formatEquipmentDimensions(profile: StructuredEquipmentProfile) {
  const parts = [
    profile.trailerLengthFeet > 0 ? `${profile.trailerLengthFeet} ft` : "",
    profile.trailerWidthInches > 0 ? `${profile.trailerWidthInches} in wide` : "",
    profile.trailerHeightInches > 0 ? `${profile.trailerHeightInches} in high` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Not set";
}
