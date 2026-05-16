import {
  FOUNDER_ACCESS,
  GOLD_ACCESS,
  PILOT_ACCESS,
  SUBSCRIPTION_TRIAL_DAYS,
} from "@/config/pricing";
import { OperatorProgramCode } from "@/types/operator-program";

export type StripeCheckoutPlanId =
  | "pro-monthly"
  | "pro-annual"
  | "pilot-monthly"
  | "pilot-annual"
  | "launch500-monthly"
  | "launch500-annual";

export type StripePlanTier = "gold" | "pilot" | "launch500";

export type StripeCheckoutPlan = {
  id: StripeCheckoutPlanId;
  tier: StripePlanTier;
  label: string;
  interval: "month" | "year";
  amount: number;
  trialDays: number;
  priceEnvVar: string;
  priceId?: string;
  requiresProgram?: OperatorProgramCode;
};

export const STRIPE_CHECKOUT_PLANS = {
  "pro-monthly": {
    id: "pro-monthly",
    tier: "gold",
    label: "Karpilo LoadIQ Gold Monthly",
    interval: "month",
    amount: GOLD_ACCESS.monthlyPrice,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    priceEnvVar: "STRIPE_PRICE_MONTHLY",
    priceId: process.env.STRIPE_PRICE_MONTHLY,
  },
  "pro-annual": {
    id: "pro-annual",
    tier: "gold",
    label: "Karpilo LoadIQ Gold Annual",
    interval: "year",
    amount: GOLD_ACCESS.annualPrice,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    priceEnvVar: "STRIPE_PRICE_ANNUAL",
    priceId: process.env.STRIPE_PRICE_ANNUAL,
  },
  "pilot-monthly": {
    id: "pilot-monthly",
    tier: "pilot",
    label: "Karpilo LoadIQ Pilot Monthly",
    interval: "month",
    amount: PILOT_ACCESS.monthlyPrice,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    priceEnvVar: "STRIPE_PRICE_PILOT_MONTHLY",
    // TODO(stripe): Set STRIPE_PRICE_PILOT_MONTHLY to the Stripe sandbox recurring
    // $14.99 Pilot Price ID after creating the product/price in Stripe.
    priceId: process.env.STRIPE_PRICE_PILOT_MONTHLY ?? process.env.STRIPE_PRICE_PILOT,
    requiresProgram: "pilot50",
  },
  "pilot-annual": {
    id: "pilot-annual",
    tier: "pilot",
    label: "Karpilo LoadIQ Pilot Annual",
    interval: "year",
    amount: PILOT_ACCESS.annualPrice,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    priceEnvVar: "STRIPE_PRICE_PILOT_ANNUAL",
    // TODO(stripe): Set STRIPE_PRICE_PILOT_ANNUAL to the Stripe sandbox
    // recurring $129.99 Pilot annual Price ID.
    priceId: process.env.STRIPE_PRICE_PILOT_ANNUAL,
    requiresProgram: "pilot50",
  },
  "launch500-monthly": {
    id: "launch500-monthly",
    tier: "launch500",
    label: "Karpilo LoadIQ Legacy Launch Monthly",
    interval: "month",
    amount: FOUNDER_ACCESS.monthlyPrice,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    priceEnvVar: "STRIPE_PRICE_LAUNCH500_MONTHLY",
    // TODO(stripe): Set STRIPE_PRICE_LAUNCH500_MONTHLY to the Stripe sandbox
    // recurring $19.99 legacy launch Price ID.
    priceId: process.env.STRIPE_PRICE_LAUNCH500_MONTHLY,
    requiresProgram: "launch500",
  },
  "launch500-annual": {
    id: "launch500-annual",
    tier: "launch500",
    label: "Karpilo LoadIQ Legacy Launch Annual",
    interval: "year",
    amount: FOUNDER_ACCESS.annualPrice,
    trialDays: SUBSCRIPTION_TRIAL_DAYS,
    priceEnvVar: "STRIPE_PRICE_LAUNCH500_ANNUAL",
    // TODO(stripe): Set STRIPE_PRICE_LAUNCH500_ANNUAL to the Stripe sandbox
    // recurring $149.99 legacy launch annual Price ID.
    priceId: process.env.STRIPE_PRICE_LAUNCH500_ANNUAL,
    requiresProgram: "launch500",
  },
} satisfies Record<StripeCheckoutPlanId, StripeCheckoutPlan>;

export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
] as const;

export function getStripeCheckoutPlan(planId: unknown) {
  if (
    planId === "pro-monthly" ||
    planId === "pro-annual" ||
    planId === "pilot-monthly" ||
    planId === "pilot-annual" ||
    planId === "launch500-monthly" ||
    planId === "launch500-annual"
  ) {
    return STRIPE_CHECKOUT_PLANS[planId] as StripeCheckoutPlan;
  }

  return null;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
