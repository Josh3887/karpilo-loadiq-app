import { resolveEntitlements } from "@/domains/billing/entitlement-service";
import { PlanTier } from "@/domains/billing/plan-limits";
import { createClient } from "@/lib/supabase-server";

function normalizeTier(tier: unknown): PlanTier {
  if (
    tier === "pro" ||
    tier === "founder" ||
    tier === "pilot" ||
    tier === "launch500"
  ) {
    return tier;
  }
  return "free";
}

export async function getServerEntitlements(userId: string) {
  const supabase = await createClient();

  const [{ data: subscription }, calculationCount, savedLoadCount] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier,status,current_period_end")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
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

  return resolveEntitlements(normalizeTier(subscription?.tier), usage);
}
