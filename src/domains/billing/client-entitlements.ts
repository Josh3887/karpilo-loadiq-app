import { createClient } from "@/lib/supabase-client";

import {
  EntitlementUsage,
  resolveEntitlements,
} from "@/domains/billing/entitlement-service";
import { PlanTier } from "@/domains/billing/plan-limits";

export type ClientEntitlementState = {
  entitlements: ReturnType<typeof resolveEntitlements>;
  usage: EntitlementUsage;
};

function monthStartIso() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function normalizeTier(tier: unknown): PlanTier {
  if (tier === "pro" || tier === "founder") return tier;
  return "free";
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
      entitlements: resolveEntitlements("free", usage),
    };
  }

  const [{ data: subscription }, calculationCount, savedLoadCount] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier,status,current_period_end")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
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

  return {
    usage,
    entitlements: resolveEntitlements(normalizeTier(subscription?.tier), usage),
  };
}
