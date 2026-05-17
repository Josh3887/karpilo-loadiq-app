import { createClient } from "@/lib/supabase-client";
import {
  buildSavedLoadStopRows,
  SavedLoadStopRecord,
} from "@/services/route-intelligence";
import { loadInputSchema } from "@/lib/load-schema";
import { normalizeSavedLoadActuals } from "@/services/post-trip-actuals";
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
  const { data: existingStops, error: stopsError } = await supabase
    .from("saved_load_stops")
    .select("*")
    .eq("saved_load_id", loadId)
    .eq("user_id", userId)
    .order("stop_sequence", { ascending: true });

  if (stopsError) {
    throw new Error(formatSupabaseError(stopsError));
  }

  const parsedInput = loadInputSchema.safeParse(savedLoad.input_snapshot);

  const { data: duplicate, error: duplicateError } = await supabase
    .from("saved_loads")
    .insert({
      user_id: userId,
      status: "saved",
      driver_load_number: savedLoad.driver_load_number,
      load_outcome: "unknown",
      was_run_status: savedLoad.was_run_status ?? null,
      pickup_zip: savedLoad.pickup_zip,
      pickup_city: savedLoad.input_snapshot?.pickupCity ?? null,
      pickup_state: savedLoad.input_snapshot?.pickupState ?? null,
      deadhead_start_city: savedLoad.deadhead_start_city ?? null,
      deadhead_start_state: savedLoad.deadhead_start_state ?? null,
      deadhead_start_zip: savedLoad.deadhead_start_zip ?? null,
      delivery_zip: savedLoad.delivery_zip,
      delivery_city: savedLoad.input_snapshot?.deliveryCity ?? null,
      delivery_state: savedLoad.input_snapshot?.deliveryState ?? null,
      estimated_load_weight_lbs: savedLoad.estimated_load_weight_lbs ?? null,
      route_stop_count: savedLoad.route_stop_count ?? null,
      route_model_version: savedLoad.route_model_version ?? null,
      reserve_allocation_mode: savedLoad.reserve_allocation_mode ?? null,
      reserve_allocation_cpm: savedLoad.reserve_allocation_cpm ?? null,
      reserve_allocation_percent: savedLoad.reserve_allocation_percent ?? null,
      target_true_rpm_snapshot: savedLoad.target_true_rpm_snapshot ?? null,
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
      dispatch_days: savedLoad.dispatch_days,
      overhead_applied: savedLoad.overhead_applied,
      used_profile_values: savedLoad.used_profile_values ?? {},
      used_temporary_overrides: savedLoad.used_temporary_overrides ?? {},
      calculated_at: savedLoad.calculated_at,
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

  const duplicateStops =
    existingStops && existingStops.length > 0
      ? (existingStops as SavedLoadStopRecord[]).map((stop) => ({
          user_id: userId,
          saved_load_id: duplicate.id as string,
          stop_sequence: stop.stop_sequence,
          stop_type: stop.stop_type,
          city: stop.city,
          state: stop.state,
          zip: stop.zip,
          miles_from_previous: stop.miles_from_previous,
          stop_revenue: stop.stop_revenue,
          stop_expense: stop.stop_expense,
          notes: stop.notes,
        }))
      : parsedInput.success
        ? buildSavedLoadStopRows(parsedInput.data, userId).map((stop) => ({
            ...stop,
            saved_load_id: duplicate.id as string,
          }))
        : [];

  if (duplicateStops.length > 0) {
    const { error: duplicateStopsError } = await supabase
      .from("saved_load_stops")
      .insert(duplicateStops);

    if (duplicateStopsError) {
      throw new Error(formatSupabaseError(duplicateStopsError));
    }
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
    .select(
      "gross_revenue, total_miles, operational_cost, input_snapshot, result_snapshot"
    )
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
  const estimatedTripCost = Number(
    resultSnapshot?.totalTripCost ?? load.operational_cost ?? estimatedFuelCost
  );
  const actualFuelPrice = Number(actuals.actualFuelPrice ?? 0);
  const legacyFuelCost =
    actualFuelPrice > 0 &&
    mpg > 0 &&
    totalMiles > 0 &&
    !actuals.postTripActualExpenses?.length
      ? (totalMiles / mpg) * actualFuelPrice
      : Number(actuals.fuelCost || estimatedFuelCost);
  const normalizedActuals = normalizeSavedLoadActuals(
    {
      ...actuals,
      fuelCost: Number(legacyFuelCost.toFixed(2)),
      actualFuelPrice,
    },
    {
      grossRevenue: Number(load.gross_revenue),
      estimatedTripCost,
      totalTripMiles: totalMiles,
    }
  );
  const actualNet = Number(normalizedActuals.actualNetProfit ?? 0);

  const { error } = await supabase
    .from("saved_loads")
    .update({
      status: "completed",
      actual_net: actualNet,
      actual_fuel_price:
        normalizedActuals.actualFuelPrice > 0
          ? normalizedActuals.actualFuelPrice
          : null,
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
    actual_fuel_price:
      normalizedActuals.actualFuelPrice > 0
        ? normalizedActuals.actualFuelPrice
        : null,
    notes: actuals.notes,
  });
}

export async function updateSavedLoadOutcome(
  loadId: string,
  outcome: string,
  status: string
) {
  const supabase = createClient();
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("saved_loads")
    .update({
      load_outcome: outcome,
      status,
    })
    .eq("id", loadId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}
