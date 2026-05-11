export type PublicPlanId = "free" | "pro-monthly" | "pro-annual";
export type InternalPlanTier = "free" | "pro" | "founder" | "pilot" | "launch500";
export type BillingInterval = "month" | "year";

export const FOUNDER_ACCESS = {
  name: "Legacy Launch Operator Access",
  maxSeats: 500,
  publicTeaser: "First 500 launch operators may qualify for lifetime legacy pricing.",
  hiddenPricingEnabled: false,
  inviteCodeRequired: true,
  monthlyPrice: 19.99,
  annualPrice: 159.99,
} as const;

export const PILOT_ACCESS = {
  name: "Founding Operator Pilot Access",
  publicTeaser:
    "Pilot Operator Access may be available for approved early-access users.",
  maxSeats: 50,
  durationDays: 45,
  monthlyPrice: 14.99,
  annualPrice: 129.99,
  lifetimeLockRule:
    "Pilot pricing remains locked while the subscription stays active and is lost if canceled, deleted, or transferred.",
} as const;

export const PUBLIC_PRICING_PLANS = [
  {
    id: "free",
    tier: "free",
    name: "Free",
    price: 0,
    interval: "month",
    description: "Basic calculator access for testing LoadIQ before upgrading.",
    cta: "Current baseline",
    bullets: [
      "Limited monthly calculations",
      "Limited saved-load capacity",
      "Manual fuel entry fallback",
      "No exports",
      "No advanced comparisons",
    ],
  },
  {
    id: "pro-monthly",
    tier: "pro",
    name: "Pro Monthly",
    price: 24.99,
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
    tier: "pro",
    name: "Pro Annual",
    price: 189.99,
    interval: "year",
    description: "Best public value for year-round freight decisions.",
    cta: "Annual plan",
    savingsLabel: "Save $109.89 vs monthly",
    bullets: [
      "Everything in Pro Monthly",
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
  if (price === 0) return "$0";
  return `$${price.toFixed(2)}/${interval === "month" ? "mo" : "yr"}`;
}
