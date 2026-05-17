import { FUTURE_PLATFORM_FEATURE_SCOPE } from "@/config/pricing";

export type EntitlementPlanTier =
  | "no_access"
  | "gold"
  | "platinum"
  | "pilot"
  | "launch500"
  | "pro";

export type SubscriptionTier =
  | "none"
  | "pilot"
  | "launch"
  | "gold"
  | "platinum"
  | "pro";

export type FeatureAccessLevel =
  | "none"
  | "standard"
  | "premium"
  | "platinum"
  | "fleet";

export type FeatureAccessSource = {
  tier?: unknown;
  subscription_tier?: unknown;
  feature_access?: unknown;
  grandfathered_access?: unknown;
  lifetime_access?: unknown;
  lifetime_price_lock?: unknown;
  full_loadiq_access?: unknown;
  fleet_enabled?: unknown;
  fleetos_pro_access?: unknown;
  truck_capacity_limit?: unknown;
  future_feature_access_scope?: unknown;
};

export type FeatureAccessArchitecture = {
  planTier: EntitlementPlanTier;
  subscriptionTier: SubscriptionTier;
  featureAccess: FeatureAccessLevel;
  grandfatheredAccess: boolean;
  lifetimeAccess: boolean;
  fullLoadIqAccess: boolean;
  fleetEnabled: boolean;
  fleetOsProAccess: boolean;
  truckCapacityLimit: number | null;
  futureFeatureAccessScope: string | null;
};

export const FEATURE_ACCESS_CLASSIFICATION = {
  universal: [
    "core calculator",
    "basic operational profile",
    "estimated load analysis",
    "billing/account management",
    "support and legal surfaces",
  ],
  gold: [
    "saved loads",
    "trip actuals",
    "pay templates",
    "lane templates",
    "scenario comparison",
    "operational reporting basics",
    "expanded operational profile",
  ],
  platinum: [
    "advanced operational intelligence",
    "advanced trend reporting",
    "advanced trip actual intelligence",
    "future export/report infrastructure hooks",
    "maintenance and profitability pattern intelligence",
    "future single-operator AI operational systems",
  ],
  fleet: [
    "future multi-truck scaling",
    "future Karpilo FleetOS structures",
    "future driver management",
    "future fleet dispatch/admin layers",
    "future per-truck billing parameters",
  ],
} as const;

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNullablePositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

export function normalizeLegacyPlanTier(value: unknown): EntitlementPlanTier {
  if (value === "gold") return "gold";
  if (value === "pro") return "pro";
  if (value === "platinum") return "platinum";
  if (value === "pilot") return "pilot";
  if (value === "launch500" || value === "founder" || value === "launch") {
    return "launch500";
  }

  return "no_access";
}

export function normalizeSubscriptionTier(
  subscriptionTier: unknown,
  legacyTier?: unknown
): SubscriptionTier {
  if (subscriptionTier === "pilot") return "pilot";
  if (subscriptionTier === "launch" || subscriptionTier === "launch500") {
    return "launch";
  }
  if (subscriptionTier === "gold") return "gold";
  if (subscriptionTier === "platinum") return "platinum";
  if (subscriptionTier === "pro" || subscriptionTier === "fleet") return "pro";

  const tier = normalizeLegacyPlanTier(legacyTier);
  if (tier === "pilot") return "pilot";
  if (tier === "launch500") return "launch";
  if (tier === "platinum") return "platinum";
  if (tier === "gold") return "gold";

  return "none";
}

export function planTierFromSubscriptionTier(
  tier: SubscriptionTier,
  legacyTier?: unknown
): EntitlementPlanTier {
  if (tier === "pilot") return "pilot";
  if (tier === "launch") return "launch500";
  if (tier === "gold") return "gold";
  if (tier === "platinum") return "platinum";
  if (tier === "pro") return "pro";

  return normalizeLegacyPlanTier(legacyTier);
}

export function normalizeFeatureAccess(
  value: unknown,
  tier: SubscriptionTier
): FeatureAccessLevel {
  if (value === "standard") return "standard";
  if (value === "premium") return "premium";
  if (value === "platinum") return "platinum";
  if (value === "fleet") return "fleet";

  if (tier === "pro") return "none";
  if (tier === "platinum" || tier === "pilot" || tier === "launch") {
    return "platinum";
  }
  if (tier === "gold") return "premium";

  return "none";
}

export function resolveFeatureAccessArchitecture(
  source: FeatureAccessSource | null | undefined
): FeatureAccessArchitecture {
  const subscriptionTier = normalizeSubscriptionTier(
    source?.subscription_tier,
    source?.tier
  );
  const planTier = planTierFromSubscriptionTier(subscriptionTier, source?.tier);
  const featureAccess = normalizeFeatureAccess(
    source?.feature_access,
    subscriptionTier
  );
  const isProtectedCohort =
    subscriptionTier === "pilot" ||
    subscriptionTier === "launch" ||
    planTier === "pilot" ||
    planTier === "launch500";
  const lifetimePriceLock = Boolean(source?.lifetime_price_lock);
  const derivedGrandfatheredAccess = isProtectedCohort && lifetimePriceLock;
  const grandfatheredAccess =
    asBoolean(source?.grandfathered_access) ?? derivedGrandfatheredAccess;
  const derivedLifetimeAccess =
    isProtectedCohort && (grandfatheredAccess || lifetimePriceLock);
  const lifetimeAccess =
    asBoolean(source?.lifetime_access) ?? derivedLifetimeAccess;
  const fleetEnabled = asBoolean(source?.fleet_enabled) ?? false;
  const fleetOsProAccess = asBoolean(source?.fleetos_pro_access) ?? false;
  const activeFleetAccess =
    featureAccess === "fleet" && fleetEnabled && fleetOsProAccess;
  const derivedFullLoadIqAccess =
    featureAccess === "premium" ||
    featureAccess === "platinum" ||
    activeFleetAccess ||
    (isProtectedCohort && (grandfatheredAccess || lifetimeAccess));
  const fullLoadIqAccess =
    asBoolean(source?.full_loadiq_access) ?? derivedFullLoadIqAccess;
  const futureFeatureAccessScope =
    asNullableString(source?.future_feature_access_scope) ??
    (isProtectedCohort && lifetimeAccess
      ? FUTURE_PLATFORM_FEATURE_SCOPE
      : null);

  return {
    planTier,
    subscriptionTier,
    featureAccess,
    grandfatheredAccess,
    lifetimeAccess,
    fullLoadIqAccess,
    fleetEnabled,
    fleetOsProAccess,
    truckCapacityLimit: asNullablePositiveInteger(
      source?.truck_capacity_limit
    ),
    futureFeatureAccessScope,
  };
}

export function hasGrandfatheredLoadIqAccess(
  access: FeatureAccessArchitecture
) {
  return (
    access.grandfatheredAccess &&
    access.lifetimeAccess &&
    access.fullLoadIqAccess &&
    !access.fleetOsProAccess
  );
}

export function hasGoldAccess(access: FeatureAccessArchitecture) {
  return (
    access.featureAccess === "premium" ||
    access.featureAccess === "platinum" ||
    hasFleetAccess(access) ||
    hasGrandfatheredLoadIqAccess(access)
  );
}

export function hasPlatinumAccess(access: FeatureAccessArchitecture) {
  return (
    access.featureAccess === "platinum" ||
    hasFleetAccess(access) ||
    hasGrandfatheredLoadIqAccess(access)
  );
}

export function hasFleetAccess(access: FeatureAccessArchitecture) {
  return (
    access.featureAccess === "fleet" &&
    access.fleetEnabled &&
    access.fleetOsProAccess
  );
}
