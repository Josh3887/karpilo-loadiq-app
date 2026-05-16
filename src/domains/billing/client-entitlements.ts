import { createClient } from "@/lib/supabase-client";

import {
  EntitlementUsage,
  PaymentAccess,
  resolveEntitlements,
  resolvePaymentAccess,
} from "@/domains/billing/entitlement-service";

export type ClientEntitlementState = {
  entitlements: ReturnType<typeof resolveEntitlements>;
  paymentAccess: PaymentAccess;
  usage: EntitlementUsage;
};

function monthStartIso() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function getClientEntitlementState(): Promise<ClientEntitlementState> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const usage = {
      monthlyCalculations: 0,
      savedLoads: 0,
    };

    return {
      usage,
      paymentAccess: resolvePaymentAccess(null, usage),
      entitlements: resolveEntitlements("no_access", usage),
    };
  }

  const [{ data: subscription }, calculationCount, savedLoadCount] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "tier,status,provider,provider_customer_id,provider_subscription_id,current_period_end,trial_end,trial_duration_days,trial_status,billing_starts_at,lifetime_price_lock,future_feature_access_scope,cohort_phase,cohort_cap,price_subject_to_change,entitlement_status,cancel_at_period_end,canceled_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_name", "calculation_created")
        .gte("created_at", monthStartIso()),
      supabase
        .from("saved_loads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const usage = {
    monthlyCalculations: calculationCount.count ?? 0,
    savedLoads: savedLoadCount.count ?? 0,
  };
  const paymentAccess = resolvePaymentAccess(subscription, usage);

  return {
    usage,
    paymentAccess,
    entitlements: paymentAccess.entitlements,
  };
}
