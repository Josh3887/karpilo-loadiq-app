import { NormalizedFuelPrice } from "@/types/fuel";

export const EIA_ULSD_CACHE_KEY = "eia-us-national-ulsd-weekly";
export const EIA_ULSD_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

export type EiaFuelDataPoint = {
  period?: string;
  value?: number | string;
};

export function normalizeEiaDieselPrice(
  dataPoint: EiaFuelDataPoint,
  fetchedAt = new Date()
): NormalizedFuelPrice | null {
  const pricePerGallon = Number(dataPoint.value);

  if (!Number.isFinite(pricePerGallon) || pricePerGallon <= 0) {
    return null;
  }

  if (!dataPoint.period) {
    return null;
  }

  return {
    fuelType: "ULSD Diesel",
    pricePerGallon: Number(pricePerGallon.toFixed(3)),
    period: dataPoint.period,
    source: "EIA",
    sourceLabel: "U.S. Energy Information Administration",
    region: "U.S. National Average",
    isEstimate: true,
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: new Date(
      fetchedAt.getTime() + EIA_ULSD_CACHE_TTL_MS
    ).toISOString(),
  };
}

export function isFreshFuelPrice(fuel: Pick<NormalizedFuelPrice, "expiresAt">) {
  return new Date(fuel.expiresAt).getTime() > Date.now();
}
