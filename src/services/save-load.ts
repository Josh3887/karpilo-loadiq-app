import { createClient } from "@/lib/supabase-client";

import { recordUsageEvent } from "@/domains/billing/usage-service";
import { LoadInput, LoadResult } from "@/types/load";

type SaveLoadPayload = {
  input: LoadInput;
  result: LoadResult;
};

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Unknown Supabase error.";
  }

  const maybeError = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };

  return [
    maybeError.message,
    maybeError.details,
    maybeError.hint,
    maybeError.code,
  ]
    .filter(Boolean)
    .join(" | ");
}

export async function saveLoad({ input, result }: SaveLoadPayload) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(formatSupabaseError(userError));
  }

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { error: profileError } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
  });

  if (profileError) {
    throw new Error(formatSupabaseError(profileError));
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("tier,status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(formatSupabaseError(subscriptionError));
  }

  if (
    subscription?.tier !== "gold" &&
    subscription?.tier !== "platinum" &&
    subscription?.tier !== "pro" &&
    subscription?.tier !== "founder" &&
    subscription?.tier !== "pilot" &&
    subscription?.tier !== "launch500"
  ) {
    throw new Error("An active Karpilo LoadIQ subscription is required to save load history.");
  }

  const { count } = await supabase
    .from("saved_loads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const loadiqLoadNumber = `LIQ-${String((count ?? 0) + 1).padStart(5, "0")}`;

  const { error: saveError } = await supabase.from("saved_loads").insert({
    user_id: user.id,
    status: "saved",
    loadiq_load_number: loadiqLoadNumber,
    driver_load_number: input.loadNumber || null,
    load_outcome:
      input.loadRunStatus === "ran"
        ? "ran"
        : input.loadRunStatus === "test"
          ? "test_calculation"
          : "planned",
    load_run_status: input.loadRunStatus,
    was_run_status: input.loadRunStatus,
    pickup_zip: input.pickupZip,
    pickup_city: input.pickupCity,
    pickup_state: input.pickupState,
    delivery_zip: input.deliveryZip,
    delivery_city: input.deliveryCity,
    delivery_state: input.deliveryState,
    loaded_miles: input.loadedMiles,
    deadhead_miles: input.deadheadMiles,
    rate_per_mile: input.ratePerMile,
    gross_revenue: result.grossRevenue,
    total_miles: result.totalMiles,
    fuel_cost: result.fuelCost,
    fuel_estimate_source: input.fuelPriceSource,
    estimated_fuel_price: input.fuelPrice,
    actual_fuel_price: null,
    fuel_override: input.fuelPriceSource === "USER_OVERRIDE",
    eia_period: input.fuelPricePeriod || null,
    fuel_fetched_at: input.fuelPriceFetchedAt || null,
    operational_cost: result.operationalCost,
    dispatch_days: input.dispatchDays,
    daily_overhead: result.dailyFixedOverhead,
    overhead_applied: result.loadOverheadApplied,
    used_profile_values: input.profileDerivedValues,
    used_temporary_overrides: input.temporaryOverrides,
    calculated_at: new Date().toISOString(),
    estimated_net: result.estimatedNet,
    true_rpm: result.trueRpm,
    profitability_score: result.profitabilityScore,
    profitability_band: result.profitabilityBand,
    warnings: result.warnings,
    input_snapshot: input,
    result_snapshot: result,
    actuals_snapshot: {},
    pay_structure_snapshot: input.payStructure ?? {},
    calculation_version: result.calculationVersion,
  });

  if (saveError) {
    throw new Error(formatSupabaseError(saveError));
  }

  await recordUsageEvent("load_saved", {
    pickupZip: input.pickupZip,
    deliveryZip: input.deliveryZip,
    estimatedNet: result.estimatedNet,
    profitabilityScore: result.profitabilityScore,
  }).catch((error) => {
    console.error(error);
  });
}
