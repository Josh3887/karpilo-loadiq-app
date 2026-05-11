import { createClient } from "@/lib/supabase-client";
import { LoadInput, LoadResult } from "@/types/load";
import { SavedLoadActuals, SavedLoadRecord } from "@/types/saved-load";

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

async function getCurrentUserId() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  if (!user) {
    throw new Error("User not authenticated.");
  }

  return user.id;
}

export async function duplicateSavedLoad(loadId: string) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data: load, error: loadError } = await supabase
    .from("saved_loads")
    .select("*")
    .eq("id", loadId)
    .eq("user_id", userId)
    .single();

  if (loadError || !load) {
    throw new Error(formatSupabaseError(loadError));
  }

  const savedLoad = load as SavedLoadRecord;

  const { data: duplicate, error: duplicateError } = await supabase
    .from("saved_loads")
    .insert({
      user_id: userId,
      status: "estimated",
      pickup_zip: savedLoad.pickup_zip,
      pickup_city: savedLoad.input_snapshot?.pickupCity ?? null,
      pickup_state: savedLoad.input_snapshot?.pickupState ?? null,
      delivery_zip: savedLoad.delivery_zip,
      delivery_city: savedLoad.input_snapshot?.deliveryCity ?? null,
      delivery_state: savedLoad.input_snapshot?.deliveryState ?? null,
      loaded_miles: savedLoad.loaded_miles,
      deadhead_miles: savedLoad.deadhead_miles,
      rate_per_mile: savedLoad.rate_per_mile,
      gross_revenue: savedLoad.gross_revenue,
      total_miles: savedLoad.total_miles,
      fuel_cost: savedLoad.fuel_cost,
      fuel_estimate_source: savedLoad.fuel_estimate_source,
      estimated_fuel_price: savedLoad.estimated_fuel_price,
      actual_fuel_price: null,
      fuel_override: savedLoad.fuel_override,
      eia_period: savedLoad.eia_period,
      fuel_fetched_at: savedLoad.fuel_fetched_at,
      operational_cost: savedLoad.operational_cost,
      estimated_net: savedLoad.estimated_net,
      true_rpm: savedLoad.true_rpm,
      profitability_score: savedLoad.profitability_score,
      profitability_band: savedLoad.profitability_band,
      warnings: savedLoad.warnings ?? [],
      input_snapshot: savedLoad.input_snapshot ?? {},
      result_snapshot: savedLoad.result_snapshot ?? {},
      actuals_snapshot: {},
      pay_structure_snapshot: savedLoad.pay_structure_snapshot ?? {},
      calculation_version: savedLoad.calculation_version ?? "loadiq-v2",
    })
    .select("id")
    .single();

  if (duplicateError || !duplicate) {
    throw new Error(formatSupabaseError(duplicateError));
  }

  return duplicate.id as string;
}

export async function updateSavedLoadActuals(
  loadId: string,
  actuals: SavedLoadActuals
) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { data: load, error: loadError } = await supabase
    .from("saved_loads")
    .select("gross_revenue, total_miles, input_snapshot, result_snapshot")
    .eq("id", loadId)
    .eq("user_id", userId)
    .single();

  if (loadError || !load) {
    throw new Error(formatSupabaseError(loadError));
  }

  const inputSnapshot = load.input_snapshot as Partial<LoadInput> | null;
  const resultSnapshot = load.result_snapshot as Partial<LoadResult> | null;
  const mpg = Number(inputSnapshot?.mpg ?? 0);
  const totalMiles = Number(load.total_miles);
  const estimatedFuelCost = Number(resultSnapshot?.fuelCost ?? 0);
  const actualFuelPrice = Number(actuals.actualFuelPrice ?? 0);
  const calculatedActualFuelCost =
    actualFuelPrice > 0 && mpg > 0 && totalMiles > 0
      ? (totalMiles / mpg) * actualFuelPrice
      : Number(actuals.fuelCost || estimatedFuelCost);
  const normalizedActuals: SavedLoadActuals = {
    ...actuals,
    fuelCost: Number(calculatedActualFuelCost.toFixed(2)),
    actualFuelPrice,
  };

  const totalActualCost =
    normalizedActuals.fuelCost +
    actuals.tolls +
    actuals.lumpers +
    actuals.maintenance +
    actuals.parking +
    actuals.other;
  const actualNet = Number(load.gross_revenue) - totalActualCost;

  const { error } = await supabase
    .from("saved_loads")
    .update({
      status: "completed",
      actual_net: actualNet,
      actual_fuel_price: actualFuelPrice > 0 ? actualFuelPrice : null,
      actuals_snapshot: normalizedActuals,
    })
    .eq("id", loadId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  await supabase.from("post_trip_actuals").insert({
    user_id: userId,
    saved_load_id: loadId,
    actuals_snapshot: normalizedActuals,
    actual_net: actualNet,
    actual_fuel_price: actualFuelPrice > 0 ? actualFuelPrice : null,
    notes: actuals.notes,
  });
}
