import { FOUNDER_ACCESS } from "@/config/pricing";

export type PlanTier = "no_access" | "gold" | "platinum" | "pilot" | "launch500";

export type PlanLimits = {
  tier: PlanTier;
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
    monthlyPrice: 24.99,
    annualPrice: 189.99,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
  platinum: {
    tier: "platinum",
    monthlyPrice: 34.99,
    annualPrice: 0,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
  launch500: {
    tier: "launch500",
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
    monthlyPrice: 14.99,
    annualPrice: 129.99,
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
  if (tier === "gold" || tier === "pro") return "Gold";
  if (tier === "platinum") return "Platinum";
  if (tier === "pilot") return "Pilot";
  if (tier === "launch500" || tier === "founder") return "Legacy Launch";
  return "No active access";
}
