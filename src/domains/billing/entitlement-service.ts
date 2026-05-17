import { PlanTier, getPlanLimits } from "@/domains/billing/plan-limits";
import {
  FeatureAccessLevel,
  SubscriptionTier,
  hasFleetAccess,
  hasGoldAccess,
  hasGrandfatheredLoadIqAccess,
  hasPlatinumAccess,
  normalizeLegacyPlanTier,
  resolveFeatureAccessArchitecture,
  type FeatureAccessArchitecture,
} from "@/domains/billing/feature-access";

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
  subscriptionTier: SubscriptionTier;
  featureAccess: FeatureAccessLevel;
  grandfatheredAccess: boolean;
  lifetimeAccess: boolean;
  fullLoadIqAccess: boolean;
  fleetEnabled: boolean;
  fleetOsProAccess: boolean;
  truckCapacityLimit: number | null;
  canCalculate: boolean;
  canSaveLoad: boolean;
  canExport: boolean;
  canUseAdvancedAnalytics: boolean;
  canUsePlatinumIntelligence: boolean;
  canUseFleetFeatures: boolean;
  canCompareScenarios: boolean;
  canCreateLaneTemplates: boolean;
};

export type SubscriptionAccessRecord = {
  tier?: unknown;
  subscription_tier?: unknown;
  status?: unknown;
  provider?: unknown;
  provider_customer_id?: unknown;
  provider_subscription_id?: unknown;
  current_period_end?: unknown;
  trial_end?: unknown;
  trial_duration_days?: unknown;
  trial_status?: unknown;
  billing_starts_at?: unknown;
  lifetime_price_lock?: unknown;
  future_feature_access_scope?: unknown;
  cohort_phase?: unknown;
  cohort_cap?: unknown;
  price_subject_to_change?: unknown;
  entitlement_status?: unknown;
  feature_access?: unknown;
  grandfathered_access?: unknown;
  lifetime_access?: unknown;
  full_loadiq_access?: unknown;
  fleet_enabled?: unknown;
  fleetos_pro_access?: unknown;
  truck_capacity_limit?: unknown;
  cancel_at_period_end?: unknown;
  canceled_at?: unknown;
};

export type PaymentAccess = {
  tier: PlanTier;
  subscriptionTier: SubscriptionTier;
  featureAccess: FeatureAccessLevel;
  billingProvider: BillingProvider;
  entitlementStatus: EntitlementStatus;
  hasActiveAccess: boolean;
  grandfatheredAccess: boolean;
  lifetimeAccess: boolean;
  fullLoadIqAccess: boolean;
  fleetEnabled: boolean;
  fleetOsProAccess: boolean;
  truckCapacityLimit: number | null;
  hasStripeCustomer: boolean;
  canContinueTrial: boolean;
  shouldPromptForBillingSetup: boolean;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  trialDurationDays: number | null;
  trialStatus: string | null;
  billingStartsAt: string | null;
  lifetimePriceLock: boolean;
  futureFeatureAccessScope: string | null;
  cohortPhase: string | null;
  cohortCap: number | null;
  priceSubjectToChange: boolean | null;
  canceledAt: string | null;
  cancelAtPeriodEnd: boolean;
  entitlements: Entitlements;
};

function withinLimit(used: number, limit: number | "unlimited") {
  return limit === "unlimited" || used < limit;
}

export function normalizePlanTier(tier: unknown): PlanTier {
  return normalizeLegacyPlanTier(tier);
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

function asNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asNullableBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function isFutureIso(value: string | null) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

export function resolveEntitlements(
  tier: PlanTier | null | undefined,
  usage: EntitlementUsage,
  featureArchitecture?: FeatureAccessArchitecture
): Entitlements {
  const access =
    featureArchitecture ??
    resolveFeatureAccessArchitecture({
      tier,
    });
  const limits = getPlanLimits(access.planTier);
  const goldAccess = hasGoldAccess(access);
  const platinumAccess = hasPlatinumAccess(access);
  const fleetAccess = hasFleetAccess(access);
  const activeLoadIqAccess = access.fullLoadIqAccess || goldAccess;

  return {
    tier: limits.tier,
    subscriptionTier: access.subscriptionTier,
    featureAccess: access.featureAccess,
    grandfatheredAccess: hasGrandfatheredLoadIqAccess(access),
    lifetimeAccess: access.lifetimeAccess,
    fullLoadIqAccess: access.fullLoadIqAccess,
    fleetEnabled: access.fleetEnabled,
    fleetOsProAccess: access.fleetOsProAccess,
    truckCapacityLimit: access.truckCapacityLimit,
    canCalculate: activeLoadIqAccess && withinLimit(
      usage.monthlyCalculations,
      limits.monthlyCalculations
    ),
    canSaveLoad:
      activeLoadIqAccess && withinLimit(usage.savedLoads, limits.savedLoads),
    canExport: limits.exports && goldAccess,
    canUseAdvancedAnalytics: limits.advancedAnalytics && goldAccess,
    canUsePlatinumIntelligence: limits.advancedAnalytics && platinumAccess,
    canUseFleetFeatures: limits.advancedAnalytics && fleetAccess,
    canCompareScenarios: limits.comparisons && goldAccess,
    canCreateLaneTemplates: limits.laneTemplates && goldAccess,
  };
}

export function resolvePaymentAccess(
  subscription: SubscriptionAccessRecord | null | undefined,
  usage: EntitlementUsage
): PaymentAccess {
  const featureArchitecture = resolveFeatureAccessArchitecture(subscription);
  const billingProvider = normalizeBillingProvider(subscription?.provider);
  const rawEntitlementStatus = normalizeEntitlementStatus(
    subscription?.entitlement_status ?? subscription?.status
  );
  const currentPeriodEnd = asNullableString(subscription?.current_period_end);
  const trialEnd = asNullableString(subscription?.trial_end);
  const hasStaleTrial =
    rawEntitlementStatus === "trialing" &&
    Boolean(trialEnd) &&
    !isFutureIso(trialEnd);
  const entitlementStatus = hasStaleTrial ? "expired" : rawEntitlementStatus;
  const hasProtectedLifetimeAccess =
    hasGrandfatheredLoadIqAccess(featureArchitecture) &&
    (featureArchitecture.planTier === "pilot" ||
      featureArchitecture.planTier === "launch500");
  const hasResolvedLoadIqAccess =
    featureArchitecture.fullLoadIqAccess ||
    hasGoldAccess(featureArchitecture) ||
    hasPlatinumAccess(featureArchitecture) ||
    hasFleetAccess(featureArchitecture);
  const hasActiveAccess =
    (isActiveEntitlementStatus(entitlementStatus) && hasResolvedLoadIqAccess) ||
    hasProtectedLifetimeAccess;
  const tier = hasActiveAccess ? featureArchitecture.planTier : "no_access";
  const trialDurationDays = asNullableNumber(subscription?.trial_duration_days);
  const trialStatus = asNullableString(subscription?.trial_status);
  const billingStartsAt = asNullableString(subscription?.billing_starts_at);
  const lifetimePriceLock =
    Boolean(subscription?.lifetime_price_lock) ||
    featureArchitecture.lifetimeAccess;
  const futureFeatureAccessScope =
    featureArchitecture.futureFeatureAccessScope;
  const cohortPhase = asNullableString(subscription?.cohort_phase);
  const cohortCap = asNullableNumber(subscription?.cohort_cap);
  const priceSubjectToChange = asNullableBoolean(
    subscription?.price_subject_to_change
  );
  const canceledAt = asNullableString(subscription?.canceled_at);
  const entitlements = resolveEntitlements(tier, usage, {
    ...featureArchitecture,
    planTier: tier,
    subscriptionTier: hasActiveAccess
      ? featureArchitecture.subscriptionTier
      : "none",
    featureAccess: hasActiveAccess ? featureArchitecture.featureAccess : "none",
    fullLoadIqAccess:
      hasActiveAccess && featureArchitecture.fullLoadIqAccess,
    fleetEnabled: hasActiveAccess && featureArchitecture.fleetEnabled,
    fleetOsProAccess:
      hasActiveAccess && featureArchitecture.fleetOsProAccess,
  });

  return {
    tier,
    subscriptionTier: entitlements.subscriptionTier,
    featureAccess: entitlements.featureAccess,
    billingProvider,
    entitlementStatus,
    hasActiveAccess,
    grandfatheredAccess: entitlements.grandfatheredAccess,
    lifetimeAccess: entitlements.lifetimeAccess,
    fullLoadIqAccess: entitlements.fullLoadIqAccess,
    fleetEnabled: entitlements.fleetEnabled,
    fleetOsProAccess: entitlements.fleetOsProAccess,
    truckCapacityLimit: entitlements.truckCapacityLimit,
    hasStripeCustomer:
      billingProvider === "stripe" &&
      typeof subscription?.provider_customer_id === "string" &&
      subscription.provider_customer_id.length > 0,
    canContinueTrial:
      entitlementStatus === "trialing" && isFutureIso(trialEnd),
    shouldPromptForBillingSetup: !hasActiveAccess,
    currentPeriodEnd,
    trialEnd,
    trialDurationDays,
    trialStatus,
    billingStartsAt,
    lifetimePriceLock,
    futureFeatureAccessScope,
    cohortPhase,
    cohortCap,
    priceSubjectToChange,
    canceledAt,
    cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
    entitlements,
  };
}
