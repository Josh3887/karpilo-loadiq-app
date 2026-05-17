import { LOADIQ_LAUNCH } from "@/config/loadiq";

// Legacy Stripe checkout IDs still use the "pro" slug, but they map to Gold.
export type PublicPlanId = "pro-monthly" | "pro-annual";
export type InternalPlanTier =
  | "no_access"
  | "gold"
  | "platinum"
  | "pilot"
  | "launch500"
  | "pro";
export type BillingInterval = "month" | "year";

export const SUBSCRIPTION_TRIAL_DAYS = 7;
export const FUTURE_PLATFORM_FEATURE_SCOPE =
  "Future released Karpilo LoadIQ platform features made generally available inside the platform ecosystem.";

export const GOLD_ACCESS = {
  name: "Gold",
  monthlyPrice: 29.99,
  annualPrice: 299.99,
  annualSavings: 59.89,
} as const;

export const PLATINUM_ACCESS = {
  name: "Platinum (Planned)",
  status: "coming_soon",
  pricingModel: "Planned / Coming Soon",
  monthlyPrice: 34.99,
  annualPrice: 349.99,
  annualSavings: 69.89,
  baseReferencePrice: 34.99,
  baseReferenceLabel: "$34.99/mo or $349.99/year planned",
  checkoutEnabled: false,
  discountNote:
    "Platinum is planned as a future premium intelligence layer and is not available for checkout yet.",
  features: [
    "Gold remains complete operational access",
    "Advanced trend visibility",
    "Expanded operational intelligence",
    "Maintenance pattern awareness",
    "Out-of-route expense awareness",
    "Repair trend monitoring",
    "Receipt intelligence",
    "Fuel and deviation analytics",
    "IFTA estimation support, not filing",
  ],
} as const;

export const FUTURE_PRO_ACCESS = {
  name: "Future Pro / Karpilo FleetOS",
  status: "planned",
  pricingModel: "Future fleet-capable architecture",
  monthlyPrice: 79.99,
  annualPrice: 799.99,
  perTruckPrice: 50,
  checkoutEnabled: false,
  priceSubjectToChange: true,
  featureAccess: "fleet",
  fleetEnabled: true,
  note:
    "Future Pro is a structural transition toward Karpilo FleetOS fleet capability, not a higher Platinum plan.",
} as const;

export const FOUNDER_ACCESS = {
  name: "Legacy Launch Operator Access",
  maxSeats: LOADIQ_LAUNCH.launchPromotion.slotLimit,
  publicTeaser:
    "First 500 launch operators may qualify for lifetime legacy pricing across two rollout phases of 250.",
  hiddenPricingEnabled: false,
  inviteCodeRequired: true,
  monthlyPrice: 19.99,
  annualPrice: 149.99,
  lifetimeLockRule:
    "Legacy Launch pricing remains locked while the subscription stays active and includes future released Karpilo LoadIQ platform features made generally available inside the platform ecosystem.",
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
    "Pilot pricing remains locked while the subscription stays active and includes future released Karpilo LoadIQ platform features made generally available inside the platform ecosystem. It is lost if canceled, deleted, or transferred.",
} as const;

export const PUBLIC_PRICING_PLANS = [
  {
    id: "pro-monthly",
    tier: "gold",
    name: "Gold Monthly",
    price: GOLD_ACCESS.monthlyPrice,
    interval: "month",
    description: "Complete operational access for load, fuel, overhead, and margin decisions.",
    cta: "Upgrade when checkout is wired",
    featured: true,
    bullets: [
      `${SUBSCRIPTION_TRIAL_DAYS}-day free trial`,
      "Unlimited load calculations",
      "Saved load history",
      "Pay templates and lane templates",
      "Post-trip actual comparison",
      "Operational decision support",
      "Prices subject to change",
    ],
  },
  {
    id: "pro-annual",
    tier: "gold",
    name: "Gold Annual",
    price: GOLD_ACCESS.annualPrice,
    interval: "year",
    description: "Annual operational discipline for year-round freight decisions.",
    cta: "Annual plan",
    savingsLabel: `Save $${GOLD_ACCESS.annualSavings.toFixed(2)} vs monthly`,
    bullets: [
      `${SUBSCRIPTION_TRIAL_DAYS}-day free trial`,
      "Everything in Gold Monthly",
      "Lower effective monthly cost",
      "Saved load and template workflows",
      "Print/export readiness",
      "Built for owner-operator margin awareness",
      "Prices subject to change",
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
