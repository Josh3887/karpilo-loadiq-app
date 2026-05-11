import { PlanTier, getPlanLimits } from "@/domains/billing/plan-limits";

export type EntitlementUsage = {
  monthlyCalculations: number;
  savedLoads: number;
};

export type Entitlements = {
  tier: PlanTier;
  canCalculate: boolean;
  canSaveLoad: boolean;
  canExport: boolean;
  canUseAdvancedAnalytics: boolean;
  canCompareScenarios: boolean;
  canCreateLaneTemplates: boolean;
};

function withinLimit(used: number, limit: number | "unlimited") {
  return limit === "unlimited" || used < limit;
}

export function resolveEntitlements(
  tier: PlanTier | null | undefined,
  usage: EntitlementUsage
): Entitlements {
  const limits = getPlanLimits(tier);

  return {
    tier: limits.tier,
    canCalculate: withinLimit(
      usage.monthlyCalculations,
      limits.monthlyCalculations
    ),
    canSaveLoad: withinLimit(usage.savedLoads, limits.savedLoads),
    canExport: limits.exports,
    canUseAdvancedAnalytics: limits.advancedAnalytics,
    canCompareScenarios: limits.comparisons,
    canCreateLaneTemplates: limits.laneTemplates,
  };
}
