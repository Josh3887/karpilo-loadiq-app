import { createClient } from "@/lib/supabase-client";

import { LoadInput, LoadResult } from "@/types/load";

type SaveLoadPayload = {
  input: LoadInput;
  result: LoadResult;
};

export async function saveLoad({
  input,
  result,
}: SaveLoadPayload) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated.");
  }

  const { error } = await supabase
    .from("saved_loads")
    .insert({
      user_id: user.id,

      pickup_zip: input.pickupZip,
      delivery_zip: input.deliveryZip,

      loaded_miles: input.loadedMiles,
      deadhead_miles: input.deadheadMiles,

      rate_per_mile: input.ratePerMile,

      gross_revenue: result.grossRevenue,
      total_miles: result.totalMiles,

      fuel_cost: result.fuelCost,
      operational_cost: result.operationalCost,

      estimated_net: result.estimatedNet,

      true_rpm: result.trueRpm,

      profitability_score: result.profitabilityScore,
      profitability_band: result.profitabilityBand,

      warnings: result.warnings,
    });

  if (error) {
    throw error;
  }
}