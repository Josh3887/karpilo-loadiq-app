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
  const paymentAccess =
    resolveOwnerBuildPaymentAccess(userEmail, usage) ??
    resolvePaymentAccess(subscription, usage);

  return {
    usage,
    paymentAccess,
    entitlements: paymentAccess.entitlements,
    billingTestHarness,
  };
}

export async function getServerPaymentAccess(
  userId: string,
  userEmail?: string | null
) {
  const { subscription, usage } = await getSubscriptionUsage(userId, userEmail);
  return (
    resolveOwnerBuildPaymentAccess(userEmail, usage) ??
    resolvePaymentAccess(subscription, usage)
  );
}

export async function getServerEntitlements(
  userId: string,
  userEmail?: string | null
) {
  const { subscription, usage } = await getSubscriptionUsage(userId, userEmail);
  const paymentAccess =
    resolveOwnerBuildPaymentAccess(userEmail, usage) ??
    resolvePaymentAccess(subscription, usage);
  return paymentAccess.hasActiveAccess
    ? paymentAccess.entitlements
    : resolveEntitlements("no_access", usage);
}

function resolveOwnerBuildPaymentAccess(
  userEmail: string | null | undefined,
  usage: EntitlementUsage
): PaymentAccess | null {
  if (!isOwnerBuildAccessEmail(userEmail)) return null;

  const paymentAccess = resolvePaymentAccess(
    {
      tier: "beta_test",
      subscription_tier: "beta_test",
      status: "active",
      entitlement_status: "active",
      provider: "manual",
      feature_access: "platinum",
      grandfathered_access: true,
      lifetime_access: true,
      full_loadiq_access: true,
      future_feature_access_scope: "owner_build_access",
    },
    usage
  );
  const entitlements = {
    ...paymentAccess.entitlements,
    canCalculate: true,
    canSaveLoad: true,
    canExport: true,
    canUseAdvancedAnalytics: true,
    canUsePlatinumIntelligence: true,
    canUseWeatherProfitabilityRisk: true,
    canSaveWeatherProfitabilitySnapshot: true,
    canCompareScenarios: true,
    canCreateLaneTemplates: true,
  };

  return {
    ...paymentAccess,
    entitlements,
    hasActiveAccess: true,
    fullLoadIqAccess: true,
    grandfatheredAccess: true,
    lifetimeAccess: true,
    shouldPromptForBillingSetup: false,
    futureFeatureAccessScope: "owner_build_access",
  };
}

function isOwnerBuildAccessEmail(userEmail: string | null | undefined) {
  const email = normalizeEmail(userEmail);

  if (!email) return false;

  return getOwnerBuildAccessEmails().includes(email);
}

function getOwnerBuildAccessEmails() {
  return (process.env.LOADIQ_OWNER_EMAILS ?? "")
    .split(/[\s,]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}
