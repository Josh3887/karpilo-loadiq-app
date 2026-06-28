import { NextResponse } from "next/server";

import { getLatestDieselFuelPrice } from "@/services/fuel/fuel-service";
import { roundFuelPrice } from "@/utils/format";

export async function GET() {
  const fuelPrice = await getLatestDieselFuelPrice();
  const fuel = fuelPrice.fuel;

  return NextResponse.json(
    {
      price: fuel ? roundFuelPrice(fuel.pricePerGallon) : null,
      unit: "USD/gal",
      reportedAt: fuel?.period ?? null,
      source: "EIA.gov",
      status: fuelPrice.status === "available" && fuel ? "ok" : "unavailable",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
      },
    }
  );
}
