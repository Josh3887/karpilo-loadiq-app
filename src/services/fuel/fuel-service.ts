import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { fetchLatestEiaDieselPrice } from "@/services/fuel/eia-client";
import {
  EIA_ULSD_CACHE_KEY,
  isFreshFuelPrice,
} from "@/services/fuel/fuel-normalizer";
import { getSupabaseUrl } from "@/lib/supabase-env";
import { FuelPriceResponse, NormalizedFuelPrice } from "@/types/fuel";

type FuelCacheRow = {
  fuel_type: string | null;
  price_per_gallon: number | string | null;
  diesel_price: number | string | null;
  source_period: string | null;
  source: string | null;
  source_label: string | null;
  region: string | null;
  is_estimate: boolean | null;
  fetched_at: string | null;
  expires_at: string | null;
};

function createFuelCacheClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function rowToFuel(row: FuelCacheRow | null): NormalizedFuelPrice | null {
  if (!row) return null;

  const pricePerGallon = Number(row.price_per_gallon ?? row.diesel_price);

  if (
    !Number.isFinite(pricePerGallon) ||
    pricePerGallon <= 0 ||
    !row.source_period ||
    !row.fetched_at ||
    !row.expires_at
  ) {
    return null;
  }

  return {
    fuelType: "ULSD Diesel",
    pricePerGallon,
    period: row.source_period,
    source: "EIA",
    sourceLabel: "U.S. Energy Information Administration",
    region: "U.S. National Average",
    isEstimate: true,
    fetchedAt: row.fetched_at,
    expiresAt: row.expires_at,
  };
}

async function getCachedFuelPrice() {
  const supabase = createFuelCacheClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("fuel_price_cache")
    .select(
      "fuel_type, price_per_gallon, diesel_price, source_period, source, source_label, region, is_estimate, fetched_at, expires_at"
    )
    .eq("cache_key", EIA_ULSD_CACHE_KEY)
    .maybeSingle();

  if (error) {
    return null;
  }

  return rowToFuel(data as FuelCacheRow | null);
}

async function saveFuelPriceToCache(fuel: NormalizedFuelPrice) {
  const supabase = createFuelCacheClient();

  if (!supabase) {
    return;
  }

  await supabase.from("fuel_price_cache").upsert(
    {
      cache_key: EIA_ULSD_CACHE_KEY,
      source: "eia",
      fuel_type: fuel.fuelType,
      region: fuel.region,
      diesel_price: fuel.pricePerGallon,
      price_per_gallon: fuel.pricePerGallon,
      source_label: fuel.sourceLabel,
      source_period: fuel.period,
      is_estimate: fuel.isEstimate,
      fetched_at: fuel.fetchedAt,
      expires_at: fuel.expiresAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "cache_key",
    }
  );
}

export async function getLatestDieselFuelPrice(): Promise<FuelPriceResponse> {
  const cachedFuel = await getCachedFuelPrice();

  if (cachedFuel && isFreshFuelPrice(cachedFuel)) {
    return {
      status: "available",
      fuel: cachedFuel,
      message: "Loaded cached EIA diesel market estimate.",
    };
  }

  try {
    const freshFuel = await fetchLatestEiaDieselPrice();

    if (freshFuel.fuel) {
      await saveFuelPriceToCache(freshFuel.fuel);

      return {
        status: "available",
        fuel: freshFuel.fuel,
        message: "Loaded latest EIA diesel market estimate.",
      };
    }

    if (cachedFuel) {
      return {
        status: "available",
        fuel: cachedFuel,
        message: `Using cached EIA diesel estimate. Live refresh skipped: ${freshFuel.failureReason}`,
      };
    }

    return {
      status: "manual",
      fuel: null,
      message: `${freshFuel.failureReason} Manual fuel entry remains active.`,
    };
  } catch {
    // Fall back to cache or manual entry below.
  }

  if (cachedFuel) {
    return {
      status: "available",
      fuel: cachedFuel,
      message:
        "Using the latest cached EIA diesel estimate. Live refresh is unavailable.",
    };
  }

  return {
    status: "manual",
    fuel: null,
    message:
      "EIA diesel estimate unavailable. Manual fuel entry remains active.",
  };
}
