import { createClient } from "@/lib/supabase-client";

import { getClientEntitlementState } from "@/domains/billing/client-entitlements";
import { recordUsageEvent } from "@/domains/billing/usage-service";
import { calculateFuelGauge } from "@/lib/fuel-gauge";
import { buildSavedLoadStopRows } from "@/services/route-intelligence";
import { LoadInput, LoadResult } from "@/types/load";
import type { WeatherProfitabilityResult } from "@/types/weather-profitability";
import { roundFuelPrice } from "@/utils/format";

type SaveLoadPayload = {
  input: LoadInput;
  result: LoadResult;
  weatherProfitabilitySnapshot?: WeatherProfitabilityResult | null;
};

export type SaveLoadResult = {
  id: string;
  warning?: string;
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

export async function saveLoad({
  input,
  result,
  weatherProfitabilitySnapshot = null,
}: SaveLoadPayload): Promise<SaveLoadResult> {
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

  const [
    { count, error: countError },
    entitlementState,
  ] = await Promise.all([
    supabase
      .from("saved_loads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    getClientEntitlementState(),
  ]);

  if (countError) {
    throw new Error(formatSupabaseError(countError));
  }

  const paymentAccess = entitlementState.paymentAccess;

  if (!paymentAccess.hasActiveAccess || !paymentAccess.entitlements.canSaveLoad) {
    throw new Error("An active Karpilo LoadIQ subscription is required to save load history.");
  }
  const savedWeatherProfitabilitySnapshot =
    paymentAccess.entitlements.canSaveWeatherProfitabilitySnapshot
      ? weatherProfitabilitySnapshot
      : null;

  const loadiqLoadNumber = `LIQ-${String((count ?? 0) + 1).padStart(5, "0")}`;

  const stopRows = buildSavedLoadStopRows(input, user.id);
  const reserveAllocationMode = result.reserveAllocationMode;
  const fuelGaugeSnapshot = calculateFuelGauge({
    loadRunStatus: input.loadRunStatus,
    totalMiles: result.totalMiles,
    mpg: input.mpg,
    fuelPrice: input.fuelPrice,
    fuelTankCount: input.fuelTankCount,
    fuelTankCapacityGallons: input.fuelTankCapacityGallons,
    startingFuelPercent: input.startingFuelPercent,
  });

  const { data: savedLoad, error: saveError } = await supabase
    .from("saved_loads")
    .insert({
      user_id: user.id,
      status: "saved",
      loadiq_load_number: loadiqLoadNumber,
      driver_load_number: input.loadNumber || null,
      load_outcome:
        input.loadRunStatus === "test"
          ? "test_calculation"
          : input.loadRunStatus,
      load_run_status: input.loadRunStatus,
      was_run_status: input.loadRunStatus,
      load_status_reason:
        input.loadRunStatus === "pulled" ? input.loadPulledReason || null : null,
      pickup_zip: input.pickupZip,
      pickup_city: input.pickupCity,
      pickup_state: input.pickupState,
      deadhead_start_city: input.deadheadStartCity || null,
      deadhead_start_state: input.deadheadStartState || null,
      deadhead_start_zip: input.deadheadStartZip || null,
      delivery_zip: input.deliveryZip,
      delivery_city: input.deliveryCity,
      delivery_state: input.deliveryState,
      estimated_load_weight_lbs:
        input.estimatedLoadWeightLbs > 0
          ? Math.round(input.estimatedLoadWeightLbs)
          : null,
      route_stop_count: stopRows.length,
      route_model_version: "loadiq-route-v1",
      reserve_allocation_mode: reserveAllocationMode,
      reserve_allocation_cpm:
        reserveAllocationMode === "cpm" ? result.reserveAllocationValue : null,
      reserve_allocation_percent:
        reserveAllocationMode === "percent"
          ? result.reserveAllocationValue
          : null,
      target_true_rpm_snapshot: result.targetRpm,
      loaded_miles: input.loadedMiles,
      deadhead_miles: input.deadheadMiles,
      rate_per_mile: input.ratePerMile,
      gross_revenue: result.grossRevenue,
      total_miles: result.totalMiles,
      fuel_cost: result.fuelCost,
      fuel_estimate_source: input.fuelPriceSource,
      estimated_fuel_price: roundFuelPrice(input.fuelPrice),
      actual_fuel_price: null,
      fuel_override: input.fuelPriceSource === "USER_OVERRIDE",
      eia_period: input.fuelPricePeriod || null,
      fuel_fetched_at: input.fuelPriceFetchedAt || null,
      fuel_gauge_snapshot: fuelGaugeSnapshot,
      equipment_context_snapshot: buildEquipmentContextSnapshot(input),
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
      result_snapshot: buildResultSnapshot(
        result,
        savedWeatherProfitabilitySnapshot
      ),
      actuals_snapshot: {},
      pay_structure_snapshot: input.payStructure ?? {},
      calculation_version: result.calculationVersion,
    })
    .select("id")
    .single();

  if (saveError || !savedLoad) {
    throw new Error(formatSupabaseError(saveError));
  }

  let routeStopWarning: string | undefined;

  if (stopRows.length > 0) {
    const { error: stopsError } = await supabase
      .from("saved_load_stops")
      .insert(
        stopRows.map((row) => ({
          ...row,
          saved_load_id: savedLoad.id,
        }))
      );

    if (stopsError) {
      console.error("SAVED_LOAD_STOPS_INSERT_FAILED", stopsError);
      const { error: routeStopStatusError } = await supabase
        .from("saved_loads")
        .update({
          route_stop_count: 0,
          route_model_version: "loadiq-route-v1-stops-unavailable",
        })
        .eq("id", savedLoad.id)
        .eq("user_id", user.id);

      if (routeStopStatusError) {
        console.error("SAVED_LOAD_ROUTE_STOP_STATUS_UPDATE_FAILED", routeStopStatusError);
      }

      routeStopWarning =
        "Load saved, but route stop detail could not be attached. The load will still appear on the Loads page.";
    }
  }

  await recordUsageEvent("load_saved", {
    pickupZip: input.pickupZip,
    deliveryZip: input.deliveryZip,
    estimatedNet: result.estimatedNet,
    profitabilityScore: result.profitabilityScore,
  }).catch((error) => {
    console.error(error);
  });
  return { id: savedLoad.id as string, warning: routeStopWarning };
}

function buildResultSnapshot(
  result: LoadResult,
  weatherProfitabilitySnapshot: WeatherProfitabilityResult | null
) {
  if (!weatherProfitabilitySnapshot) return result;

  return {
    ...result,
    weatherProfitabilitySnapshot,
  };
}

function buildEquipmentContextSnapshot(input: LoadInput) {
  return {
    equipmentType: input.equipmentType,
    atlasEquipmentPack: input.atlasEquipmentPack,
    combinationType: input.combinationType,
    dimensions: {
      trailerLengthFeet: input.trailerLengthFeet,
      trailerWidthInches: input.trailerWidthInches,
      trailerHeightInches: input.trailerHeightInches,
    },
    weights: {
      estimatedLoadWeightLbs: input.estimatedLoadWeightLbs,
      maxPayloadLbs: input.maxPayloadLbs,
      grossVehicleWeightRatingLbs: input.grossVehicleWeightRatingLbs,
      vehicleTareWeightLbs: input.vehicleTareWeightLbs,
      estimatedMaxGrossLbs: input.estimatedMaxGrossLbs,
      axleCount: input.axleCount,
    },
    capabilities: {
      hazmatCapable: input.hazmatCapable,
      tankerCapable: input.tankerCapable,
      refrigeratedCapable: input.refrigeratedCapable,
      specializedCapabilities: input.specializedCapabilities,
      securementEquipment: input.securementEquipment,
    },
    routeRestrictionNotes: input.routeRestrictionNotes,
    boundary:
      "User-entered operational context only; not certified scale, route, permit, hazmat, securement, or compliance data.",
  };
}
