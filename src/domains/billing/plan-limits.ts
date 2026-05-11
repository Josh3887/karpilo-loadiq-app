import { FOUNDER_ACCESS } from "@/config/pricing";

export type PlanTier = "free" | "pro" | "founder";

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
  free: {
    tier: "free",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyCalculations: 10,
    savedLoads: 5,
    exports: false,
    advancedAnalytics: false,
    comparisons: false,
    laneTemplates: false,
  },
  pro: {
    tier: "pro",
    monthlyPrice: 24.99,
    annualPrice: 189.99,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
  founder: {
    tier: "founder",
    monthlyPrice: FOUNDER_ACCESS.monthlyPrice,
    annualPrice: FOUNDER_ACCESS.annualPrice,
    monthlyCalculations: "unlimited",
    savedLoads: "unlimited",
    exports: true,
    advancedAnalytics: true,
    comparisons: true,
    laneTemplates: true,
  },
};

export function getPlanLimits(tier: PlanTier | null | undefined) {
  return PLAN_LIMITS[tier ?? "free"] ?? PLAN_LIMITS.free;
}
