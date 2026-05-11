import { FuelPriceResponse } from "@/types/fuel";

export async function getDieselPrice(): Promise<FuelPriceResponse> {
  const response = await fetch("/api/fuel/eia");

  if (!response.ok) {
    return {
      status: "manual",
      fuel: null,
      message: "Fuel price lookup failed. Use manual entry.",
    };
  }

  return response.json() as Promise<FuelPriceResponse>;
}
