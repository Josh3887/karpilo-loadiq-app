import { LOADIQ_LAUNCH } from "@/config/loadiq";

export type PublicPlanId = "pro-monthly" | "pro-annual";
export type InternalPlanTier = "no_access" | "gold" | "platinum" | "pilot" | "launch500";
export type BillingInterval = "month" | "year";

export const GOLD_ACCESS = {
  name: "Gold",
  monthlyPrice: 24.99,
  annualPrice: 189.99,
  annualSavings: 109.89,
} as const;

export const PLATINUM_ACCESS = {
  name: "Platinum Annual (Planned)",
  status: "coming_soon",
  pricingModel: "You Decide",
  monthlyPrice: 34.99,
  annualPrice: 0,
  annualSavings: 0,
  baseReferencePrice: 34.99,
  baseReferenceLabel: "$34.99 minimum annual commitment reference",
  checkoutEnabled: false,
  discountNote:
    "Platinum Annual is planned as a future user-selectable premium intelligence layer and is not available for checkout yet.",
  features: [
    "Gold access included",
    "Maintenance forecasting support",
    "Out-of-route event awareness",
    "Mileage mitigation intelligence",
    "Repair trend monitoring",
    "Breakdown pattern visibility",
    "Receipt intelligence",
    "Fuel and deviation analytics",
    "Future predictive operations signals",
  ],
} as const;

export const FOUNDER_ACCESS = {
  name: "Legacy Launch Operator Access",
  maxSeats: LOADIQ_LAUNCH.launchPromotion.slotLimit,
  publicTeaser: "First 500 launch operators may qualify for lifetime legacy pricing.",
  hiddenPricingEnabled: false,
  inviteCodeRequired: true,
  monthlyPrice: 19.99,
  annualPrice: 149.99,
} as const;

export const PILOT_ACCESS = {
  name: "Founding Operator Pilot Access",
  publicTeaser:
    "Pilot Operator Access may be available for approved early-access users.",
  maxSeats: LOADIQ_LAUNCH.pilot.slotLimit,
  durationDays: LOADIQ_LAUNCH.pilot.durationDays,
  monthlyPrice: 14.99,
  annualPrice: 129.99,
  lifetimeLockRule:
    "Pilot pricing remains locked while the subscription stays active and is lost if canceled, deleted, or transferred.",
} as const;

export const PUBLIC_PRICING_PLANS = [
  {
    id: "pro-monthly",
    tier: "gold",
    name: "Gold Monthly",
    price: GOLD_ACCESS.monthlyPrice,
    interval: "month",
    description: "For operators analyzing freight every week.",
    cta: "Upgrade when checkout is wired",
    featured: true,
    bullets: [
      "Unlimited load calculations",
      "Saved load history",
      "Pay templates and lane templates",
      "Post-trip actual comparison",
      "Advanced profitability intelligence",
    ],
  },
  {
    id: "pro-annual",
    tier: "gold",
    name: "Gold Annual",
    price: GOLD_ACCESS.annualPrice,
    interval: "year",
    description: "Best public value for year-round freight decisions.",
    cta: "Annual plan",
    savingsLabel: `Save $${GOLD_ACCESS.annualSavings.toFixed(2)} vs monthly`,
    bullets: [
      "Everything in Gold Monthly",
      "Lower effective monthly cost",
      "Saved load and template workflows",
      "Print/export readiness",
      "Built for owner-operator planning",
    ],
  },
] as const;

export const INTERNAL_FOUNDER_PLANS = [
  {
    tier: "launch500",
    name: "Legacy Launch Monthly",
    price: FOUNDER_ACCESS.monthlyPrice,
    interval: "month" as BillingInterval,
  },
  {
    tier: "launch500",
    name: "Legacy Launch Annual",
    price: FOUNDER_ACCESS.annualPrice,
    interval: "year" as BillingInterval,
  },
] as const;

export const INTERNAL_PILOT_PLANS = [
  {
    tier: "pilot",
    name: "Pilot Monthly",
    price: PILOT_ACCESS.monthlyPrice,
    interval: "month" as BillingInterval,
  },
  {
    tier: "pilot",
    name: "Pilot Annual",
    price: PILOT_ACCESS.annualPrice,
    interval: "year" as BillingInterval,
  },
] as const;

export function formatPriceLabel(price: number, interval: BillingInterval) {
  return `$${price.toFixed(2)}/${interval === "month" ? "mo" : "yr"}`;
}
