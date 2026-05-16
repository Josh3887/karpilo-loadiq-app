import { PlanTier, getPlanLimits } from "@/domains/billing/plan-limits";

export type BillingProvider = "stripe" | "apple" | "google" | "manual" | "unknown";

export type EntitlementStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "blocked"
  | "unknown";

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

export type SubscriptionAccessRecord = {
  tier?: unknown;
  status?: unknown;
  provider?: unknown;
  provider_customer_id?: unknown;
  provider_subscription_id?: unknown;
  current_period_end?: unknown;
  trial_end?: unknown;
  cancel_at_period_end?: unknown;
  canceled_at?: unknown;
};

export type PaymentAccess = {
  tier: PlanTier;
  billingProvider: BillingProvider;
  entitlementStatus: EntitlementStatus;
  hasActiveAccess: boolean;
  hasStripeCustomer: boolean;
  canContinueTrial: boolean;
  shouldPromptForBillingSetup: boolean;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  canceledAt: string | null;
  cancelAtPeriodEnd: boolean;
  entitlements: Entitlements;
};

function withinLimit(used: number, limit: number | "unlimited") {
  return limit === "unlimited" || used < limit;
}

export function normalizePlanTier(tier: unknown): PlanTier {
  if (tier === "gold" || tier === "pro") return "gold";
  if (tier === "platinum") return "platinum";
  if (tier === "pilot") return "pilot";
  if (tier === "launch500" || tier === "founder") return "launch500";

  return "no_access";
}

export function normalizeBillingProvider(provider: unknown): BillingProvider {
  if (
    provider === "stripe" ||
    provider === "apple" ||
    provider === "google" ||
    provider === "manual"
  ) {
    return provider;
  }

  return "unknown";
}

export function normalizeEntitlementStatus(status: unknown): EntitlementStatus {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled" || status === "cancelled") return "canceled";
  if (status === "incomplete_expired" || status === "expired") return "expired";
  if (status === "unpaid" || status === "blocked") return "blocked";

  return "unknown";
}

export function isActiveEntitlementStatus(status: EntitlementStatus) {
  return status === "active" || status === "trialing";
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isFutureIso(value: string | null) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
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

export function resolvePaymentAccess(
  subscription: SubscriptionAccessRecord | null | undefined,
  usage: EntitlementUsage
): PaymentAccess {
  const billingProvider = normalizeBillingProvider(subscription?.provider);
  const entitlementStatus = normalizeEntitlementStatus(subscription?.status);
  const hasActiveAccess = isActiveEntitlementStatus(entitlementStatus);
  const tier = hasActiveAccess
    ? normalizePlanTier(subscription?.tier)
    : "no_access";
  const currentPeriodEnd = asNullableString(subscription?.current_period_end);
  const trialEnd = asNullableString(subscription?.trial_end);
  const canceledAt = asNullableString(subscription?.canceled_at);
  const entitlements = resolveEntitlements(tier, usage);

  return {
    tier,
    billingProvider,
    entitlementStatus,
    hasActiveAccess,
    hasStripeCustomer:
      billingProvider === "stripe" &&
      typeof subscription?.provider_customer_id === "string" &&
      subscription.provider_customer_id.length > 0,
    canContinueTrial:
      entitlementStatus === "trialing" && isFutureIso(trialEnd),
    shouldPromptForBillingSetup: !hasActiveAccess,
    currentPeriodEnd,
    trialEnd,
    canceledAt,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    entitlements,
  };
}
