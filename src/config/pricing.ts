export type PublicPlanId = "free" | "pro-monthly" | "pro-annual";
export type InternalPlanTier = "free" | "pro" | "founder";
export type BillingInterval = "month" | "year";

export const FOUNDER_ACCESS = {
  name: "Founding Operator Access",
  maxSeats: 500,
  publicTeaser: "First 500 operators may qualify for Founding Operator Access.",
  hiddenPricingEnabled: false,
  inviteCodeRequired: true,
  monthlyPrice: 19.99,
  annualPrice: 149.99,
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
    tier: "founder",
    name: "Founder Monthly",
    price: FOUNDER_ACCESS.monthlyPrice,
    interval: "month" as BillingInterval,
  },
  {
    tier: "founder",
    name: "Founder Annual",
    price: FOUNDER_ACCESS.annualPrice,
    interval: "year" as BillingInterval,
  },
] as const;

export function formatPriceLabel(price: number, interval: BillingInterval) {
  if (price === 0) return "$0";
  return `$${price.toFixed(2)}/${interval === "month" ? "mo" : "yr"}`;
}
