import {
  resolveEntitlements,
  resolvePaymentAccess,
} from "@/domains/billing/entitlement-service";
import { createClient } from "@/lib/supabase-server";

async function getSubscriptionUsage(userId: string) {
  const supabase = await createClient();

  const [{ data: subscription }, calculationCount, savedLoadCount] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "tier,status,provider,provider_customer_id,provider_subscription_id,current_period_end,trial_end,cancel_at_period_end,canceled_at"
        )
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

  return { subscription, usage };
}

export async function getServerPaymentAccess(userId: string) {
  const { subscription, usage } = await getSubscriptionUsage(userId);
  return resolvePaymentAccess(subscription, usage);
}

export async function getServerEntitlements(userId: string) {
  const { subscription, usage } = await getSubscriptionUsage(userId);
  const paymentAccess = resolvePaymentAccess(subscription, usage);
  return paymentAccess.hasActiveAccess
    ? paymentAccess.entitlements
    : resolveEntitlements("no_access", usage);
}
