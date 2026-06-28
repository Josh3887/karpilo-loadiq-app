import {
  resolveEntitlements,
  resolvePaymentAccess,
  type EntitlementUsage,
  type PaymentAccess,
} from "@/domains/billing/entitlement-service";
import {
  getInternalBillingTestHarnessSnapshot,
  resolveInternalBillingTestSubscription,
} from "@/domains/billing/internal-test-harness";
import {
  OWNER_BUILD_ACCESS_SCOPE,
  getOwnerOverrideDiagnostics,
  logOwnerOverrideDiagnostics,
  type OwnerOverrideDiagnostics,
} from "@/domains/billing/owner-access";
import { createClient } from "@/lib/supabase-server";

async function getSubscriptionUsage(userId: string, userEmail?: string | null) {
  const supabase = await createClient();

  const [{ data: subscription }, calculationCount, savedLoadCount] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("event_name", "calculation_created"),
      supabase
        .from("saved_loads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

  const usage = {
    monthlyCalculations: calculationCount.count ?? 0,
    savedLoads: savedLoadCount.count ?? 0,
  };
  const billingTestHarness =
    await getInternalBillingTestHarnessSnapshot(userEmail);
  const harnessSubscription =
    resolveInternalBillingTestSubscription(billingTestHarness);

  return {
    subscription: harnessSubscription ?? subscription,
    usage,
    billingTestHarness,
  };
}

export async function getServerEntitlementState(
  userId: string,
  userEmail?: string | null
) {
  const { subscription, usage, billingTestHarness } = await getSubscriptionUsage(
    userId,
    userEmail
  );
  const { paymentAccess, ownerOverride } = resolveServerPaymentAccess({
    subscription,
    usage,
    userEmail,
    diagnosticsContext: "entitlement_state",
  });

  return {
    usage,
    paymentAccess,
    entitlements: paymentAccess.entitlements,
    billingTestHarness,
    ownerOverride,
  };
}

export async function getServerPaymentAccess(
  userId: string,
  userEmail?: string | null
) {
  const { subscription, usage } = await getSubscriptionUsage(userId, userEmail);
  return resolveServerPaymentAccess({
    subscription,
    usage,
    userEmail,
    diagnosticsContext: "payment_access",
  }).paymentAccess;
}

export async function getServerEntitlements(
  userId: string,
  userEmail?: string | null
) {
  const { subscription, usage } = await getSubscriptionUsage(userId, userEmail);
  const { paymentAccess } = resolveServerPaymentAccess({
    subscription,
    usage,
    userEmail,
    diagnosticsContext: "entitlements",
  });
  return paymentAccess.hasActiveAccess
    ? paymentAccess.entitlements
    : resolveEntitlements("no_access", usage);
}

function resolveServerPaymentAccess({
  subscription,
  usage,
  userEmail,
  diagnosticsContext,
}: {
  subscription: Parameters<typeof resolvePaymentAccess>[0];
  usage: EntitlementUsage;
  userEmail: string | null | undefined;
  diagnosticsContext: string;
}) {
  const ownerOverride = getOwnerOverrideDiagnostics(userEmail);

  logOwnerOverrideDiagnostics(ownerOverride, diagnosticsContext);

  return {
    ownerOverride,
    paymentAccess: ownerOverride.ownerOverrideMatched
      ? resolveOwnerBuildPaymentAccess(usage, ownerOverride)
      : resolvePaymentAccess(subscription, usage),
  };
}

function resolveOwnerBuildPaymentAccess(
  usage: EntitlementUsage,
  ownerOverride: OwnerOverrideDiagnostics
): PaymentAccess {
  const paymentAccess = resolvePaymentAccess(
    {
      tier: "beta_test",
      subscription_tier: "beta_test",
      status: "active",
      entitlement_status: "active",
      provider: "manual",
      feature_access: "fleet",
      grandfathered_access: true,
      lifetime_access: true,
      full_loadiq_access: true,
      fleet_enabled: true,
      fleetos_pro_access: true,
      truck_capacity_limit: null,
      future_feature_access_scope: OWNER_BUILD_ACCESS_SCOPE,
    },
    usage
  );
  const entitlements = {
    ...paymentAccess.entitlements,
    canCalculate: true,
    canUseRouteIntelligence: true,
    canSaveLoad: true,
    canExport: true,
    canUseAdvancedAnalytics: true,
    canUsePlatinumIntelligence: true,
    canUseWeatherProfitabilityRisk: true,
    canSaveWeatherProfitabilitySnapshot: true,
    canUseFleetFeatures: true,
    canCompareScenarios: true,
    canCreateLaneTemplates: true,
  };

  return {
    ...paymentAccess,
    entitlements,
    ownerBuildAccess: ownerOverride.ownerOverrideMatched,
    hasActiveAccess: true,
    fullLoadIqAccess: true,
    fleetEnabled: true,
    fleetOsProAccess: true,
    truckCapacityLimit: null,
    grandfatheredAccess: true,
    lifetimeAccess: true,
    shouldPromptForBillingSetup: false,
    futureFeatureAccessScope: OWNER_BUILD_ACCESS_SCOPE,
  };
}
