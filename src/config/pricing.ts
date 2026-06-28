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
export type LoadIqCommercialTierId = "silver" | "gold" | "platinum" | "pro";
export type LoadIqCommercialTier = {
  id: LoadIqCommercialTierId;
  name: string;
  decisionSupportDepth: string;
  coreQuestion: string;
  homepageStory: string;
  upgradePath: string;
  capabilities: readonly string[];
  displayOnly: true;
};
export type LoadIqLaunchPricingPhaseId =
  | "pilot_active"
  | "launch500_active"
  | "standard_active";
export type LoadIqLaunchPricingPhase = {
  id: LoadIqLaunchPricingPhaseId;
  name: string;
  statusLabel: string;
  monthlyPrice: number;
  annualPrice: number;
  slotLimit: number | null;
  lifetimePricing: boolean;
  paymentMode: string;
  disclosure: string;
};

export const SUBSCRIPTION_TRIAL_DAYS = 7;
export const FUTURE_PLATFORM_FEATURE_SCOPE =
  "Future released Karpilo LoadIQ features made generally available within the purchased entitlement scope and current product family.";
export const STANDARD_PUBLIC_ACCESS = {
  name: "Standard Public Access",
  monthlyPrice: 24.99,
  annualPrice: 189.99,
  annualSavings: 109.89,
  lifetimePricing: false,
} as const;

export const LOADIQ_COMMERCIAL_TIERS = {
  silver: {
    id: "silver",
    name: "Silver",
    decisionSupportDepth: "Load Viability",
    coreQuestion: "Is this load worth hauling?",
    homepageStory: "Know if the load is worth hauling.",
    upgradePath:
      "Upgrade to Gold when one-off load checks become repeat freight decisions.",
    capabilities: [
      "Load viability decision support",
      "Freight profitability estimate positioning",
      "Break-even and margin pressure framing",
      "Load-level operating-cost awareness",
    ],
    displayOnly: true,
  },
  gold: {
    id: "gold",
    name: "Gold",
    decisionSupportDepth: "Operational Visibility",
    coreQuestion: "What freight should I repeat, avoid, or adjust?",
    homepageStory: "Know which freight to repeat.",
    upgradePath:
      "Upgrade to Platinum when saved patterns and actuals need deeper variance explanation.",
    capabilities: [
      "Operational freight pattern visibility",
      "Repeat, avoid, or adjust decision support",
      "Saved-load and workflow context positioning",
      "Lane, pay, fuel, overhead, and margin awareness",
    ],
    displayOnly: true,
  },
  platinum: {
    id: "platinum",
    name: "Platinum",
    decisionSupportDepth: "Variance Intelligence",
    coreQuestion:
      "Why are my estimates wrong and what patterns are affecting profitability?",
    homepageStory: "Know why profitability changes.",
    upgradePath:
      "Upgrade to Pro when variance intelligence needs to support scale, capital, and growth planning.",
    capabilities: [
      "Estimate-to-actual variance positioning",
      "Profitability pattern interpretation",
      "Margin compression and operating drift awareness",
      "Maintenance, fuel, route, and expense pattern context",
    ],
    displayOnly: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    decisionSupportDepth: "Growth Intelligence",
    coreQuestion: "Can this operation scale safely and profitably?",
    homepageStory: "Know when your operation is ready to grow.",
    upgradePath:
      "Use Pro when repeatable per-truck modeling, capital planning, reserve goals, and growth thresholds become necessary.",
    capabilities: [
      "Scale projection positioning",
      "Threshold, reserve, and capital planning context",
      "Hiring and expansion modeling positioning",
      "Risk forecasting and repeatable per-truck modeling context",
    ],
    displayOnly: true,
  },
} as const satisfies Record<LoadIqCommercialTierId, LoadIqCommercialTier>;

export const LOADIQ_COMMERCIAL_TIER_LIST = [
  LOADIQ_COMMERCIAL_TIERS.silver,
  LOADIQ_COMMERCIAL_TIERS.gold,
  LOADIQ_COMMERCIAL_TIERS.platinum,
  LOADIQ_COMMERCIAL_TIERS.pro,
] as const;

export const GOLD_ACCESS = {
  name: "Gold",
  monthlyPrice: STANDARD_PUBLIC_ACCESS.monthlyPrice,
  annualPrice: STANDARD_PUBLIC_ACCESS.annualPrice,
  annualSavings: STANDARD_PUBLIC_ACCESS.annualSavings,
} as const;

export const PLATINUM_ACCESS = {
  name: "Platinum (Planned)",
  status: "reserved",
  pricingModel: "Reserved / Not Available For Checkout",
  monthlyPrice: 0,
  annualPrice: 0,
  annualSavings: 0,
  baseReferencePrice: 0,
  baseReferenceLabel: "Reserved pricing is not published.",
  checkoutEnabled: false,
  discountNote:
    "Platinum is reserved as a future intelligence layer and is not available for checkout yet.",
  features: [
    "Gold remains complete operational access",
    "Advanced trend visibility",
    "Expanded operational intelligence",
    "Maintenance pattern awareness",
    "Out-of-route expense awareness",
    "Repair trend monitoring",
    "Receipt intelligence",
    "Fuel and deviation analytics",
    "Truck-specific routing estimates, not route certification",
  ],
} as const;

export const FUTURE_PRO_ACCESS = {
  name: "Future Pro / Karpilo FleetOS",
  status: "planned",
  pricingModel: "Future fleet-capable architecture / pricing not published",
  monthlyPrice: 0,
  annualPrice: 0,
  perTruckPrice: 0,
  checkoutEnabled: false,
  priceSubjectToChange: true,
  featureAccess: "fleet",
  fleetEnabled: true,
  note:
    "Future Pro is a structural transition toward Karpilo FleetOS fleet capability, not a higher Platinum plan.",
  features: [
    "Fleet-capable operational architecture",
    "Pro estimation workflows",
    "Advanced truck-specific routing estimation",
    "IFTA estimation support, not filing",
  ],
} as const;

export const FOUNDER_ACCESS = {
  name: "Legacy Launch Operator Access",
  maxSeats: LOADIQ_LAUNCH.launchPromotion.slotLimit,
  publicTeaser:
    "First 500 launch operators may qualify for lifetime legacy pricing.",
  hiddenPricingEnabled: false,
  inviteCodeRequired: true,
  monthlyPrice: 19.99,
  annualPrice: 149.99,
  lifetimeLockRule:
    "Legacy Launch pricing remains locked while the subscription stays active and applies to the purchased entitlement scope and current Karpilo LoadIQ product family.",
} as const;

export const PILOT_ACCESS = {
  name: "Founding 50 Pilot Access",
  publicTeaser:
    "Pilot Operator Access may be available for approved early-access users.",
  maxSeats: LOADIQ_LAUNCH.pilot.slotLimit,
  durationDays: LOADIQ_LAUNCH.pilot.durationDays,
  monthlyPrice: 14.99,
  annualPrice: 129.99,
  lifetimeLockRule:
    "Pilot pricing remains locked while the subscription stays active and applies to the purchased entitlement scope and current Karpilo LoadIQ product family. It is lost if canceled, deleted, or transferred.",
} as const;

export const LOADIQ_LAUNCH_PRICING_PHASES = [
  {
    id: "pilot_active",
    name: PILOT_ACCESS.name,
    statusLabel: "Pilot Operations Active",
    monthlyPrice: PILOT_ACCESS.monthlyPrice,
    annualPrice: PILOT_ACCESS.annualPrice,
    slotLimit: PILOT_ACCESS.maxSeats,
    lifetimePricing: true,
    paymentMode: "Enabled only after server-authoritative slot validation.",
    disclosure:
      "Pilot pricing remains locked while the account stays active and in good standing within the purchased entitlement scope.",
  },
  {
    id: "launch500_active",
    name: "Launch 500 Access",
    statusLabel: "Official Launch Active",
    monthlyPrice: FOUNDER_ACCESS.monthlyPrice,
    annualPrice: FOUNDER_ACCESS.annualPrice,
    slotLimit: FOUNDER_ACCESS.maxSeats,
    lifetimePricing: true,
    paymentMode: "Enabled only after server-authoritative slot validation.",
    disclosure:
      "Legacy pricing remains locked while the account stays active and in good standing within the purchased entitlement scope.",
  },
  {
    id: "standard_active",
    name: STANDARD_PUBLIC_ACCESS.name,
    statusLabel: "Standard Public Access Now Active",
    monthlyPrice: STANDARD_PUBLIC_ACCESS.monthlyPrice,
    annualPrice: STANDARD_PUBLIC_ACCESS.annualPrice,
    slotLimit: null,
    lifetimePricing: false,
    paymentMode: "No lifetime price lock.",
    disclosure:
      "Standard public pricing has no lifetime lock and may change for future billing periods where permitted.",
  },
] as const satisfies readonly LoadIqLaunchPricingPhase[];

export const PUBLIC_PRICING_PLANS = [
  {
    id: "pro-monthly",
    tier: "gold",
    name: "Standard Public Monthly",
    price: GOLD_ACCESS.monthlyPrice,
    interval: "month",
    description:
      "Standard public access for operational freight estimation once checkout is enabled.",
    cta: "Standard monthly",
    featured: true,
    bullets: [
      `${SUBSCRIPTION_TRIAL_DAYS}-day free trial`,
      "Unlimited load calculations",
      "Saved load history",
      "Pay templates and lane templates",
      "Post-trip actual comparison",
      "Operational estimation support",
      "Prices subject to change",
    ],
  },
  {
    id: "pro-annual",
    tier: "gold",
    name: "Standard Public Annual",
    price: GOLD_ACCESS.annualPrice,
    interval: "year",
    description:
      "Annual standard public access for year-round freight estimation once checkout is enabled.",
    cta: "Standard annual",
    savingsLabel: `Save $${GOLD_ACCESS.annualSavings.toFixed(2)} vs monthly`,
    bullets: [
      `${SUBSCRIPTION_TRIAL_DAYS}-day free trial`,
      "Everything in Standard Public Monthly",
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

export function formatCommercialPriceLabel(
  price: number,
  interval: BillingInterval
) {
  const displayPrice = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return `$${displayPrice}/${interval === "month" ? "mo" : "yr"}`;
}
