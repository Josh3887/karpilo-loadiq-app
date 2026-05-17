import {
  resolveEntitlements,
  resolvePaymentAccess,
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
  const paymentAccess = resolvePaymentAccess(subscription, usage);

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
  return resolvePaymentAccess(subscription, usage);
}

export async function getServerEntitlements(
  userId: string,
  userEmail?: string | null
) {
  const { subscription, usage } = await getSubscriptionUsage(userId, userEmail);
  const paymentAccess = resolvePaymentAccess(subscription, usage);
  return paymentAccess.hasActiveAccess
    ? paymentAccess.entitlements
    : resolveEntitlements("no_access", usage);
}
