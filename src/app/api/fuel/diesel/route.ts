import { NextResponse } from "next/server";

import { getLatestDieselFuelPrice } from "@/services/fuel/fuel-service";

export async function GET() {
  const fuelPrice = await getLatestDieselFuelPrice();

  return NextResponse.json(fuelPrice, {
    headers: {
      "Cache-Control": "private, max-age=900",
    },
  });
}
