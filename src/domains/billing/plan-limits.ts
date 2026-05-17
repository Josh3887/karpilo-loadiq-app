import {
  FOUNDER_ACCESS,
  FUTURE_PRO_ACCESS,
  GOLD_ACCESS,
  PILOT_ACCESS,
  PLATINUM_ACCESS,
} from "@/config/pricing";
import type {
  EntitlementPlanTier,
  FeatureAccessLevel,
} from "@/domains/billing/feature-access";

export type PlanTier = EntitlementPlanTier;

export type PlanLimits = {
  tier: PlanTier;
  featureAccess: FeatureAccessLevel;
  monthlyPrice: number;
  annualPrice: number;
  monthlyCalculations: number | "unlimited";
  savedLoads: number | "unlimited";
  exports: boolean;
  advancedAnalytics: boolean;
  comparisons: boolean;
  laneTemplates: boolean;
};

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  no_access: {
    tier: "no_access",
    featureAccess: "none",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCalculations: 0,
    savedLoads: 0,
    exports: false,
    advancedAnalytics: false,
    comparisons: false,
    laneTemplates: false,
  },
  gold: {
    tier: "gold",
    featureAccess: "premium",
    monthlyPrice: GOLD_ACCESS.monthlyPrice,
    annualPrice: GOLD_ACCESS.annualPrice,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
  platinum: {
    tier: "platinum",
    featureAccess: "platinum",
    monthlyPrice: PLATINUM_ACCESS.monthlyPrice,
    annualPrice: PLATINUM_ACCESS.annualPrice,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
  launch500: {
    tier: "launch500",
    featureAccess: "platinum",
    monthlyPrice: FOUNDER_ACCESS.monthlyPrice,
    annualPrice: FOUNDER_ACCESS.annualPrice,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
  pilot: {
    tier: "pilot",
    featureAccess: "platinum",
    monthlyPrice: PILOT_ACCESS.monthlyPrice,
    annualPrice: PILOT_ACCESS.annualPrice,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
  pro: {
    tier: "pro",
    featureAccess: "fleet",
    monthlyPrice: FUTURE_PRO_ACCESS.monthlyPrice,
    annualPrice: FUTURE_PRO_ACCESS.annualPrice,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
};

export function getPlanLimits(tier: PlanTier | null | undefined) {
  return PLAN_LIMITS[tier ?? "no_access"] ?? PLAN_LIMITS.no_access;
}

export function formatPlanTierLabel(tier: PlanTier | string | null | undefined) {
  if (tier === "gold") return "Gold";
  if (tier === "platinum") return "Platinum";
  if (tier === "pilot") return "Pilot";
  if (tier === "launch500" || tier === "founder") return "Legacy Launch";
  if (tier === "pro") return "Future Pro";
  return "No active access";
}
