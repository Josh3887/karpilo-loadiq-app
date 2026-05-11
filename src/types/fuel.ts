export type FuelPriceSource = "EIA" | "USER_OVERRIDE" | "MANUAL";

export type NormalizedFuelPrice = {
  fuelType: "ULSD Diesel";
  pricePerGallon: number;
  period: string;
  source: "EIA";
  sourceLabel: "U.S. Energy Information Administration";
  region: "U.S. National Average";
  isEstimate: true;
  fetchedAt: string;
  expiresAt: string;
};

export type FuelPriceResponse =
  | {
      status: "available";
      fuel: NormalizedFuelPrice;
      message: string;
    }
  | {
      status: "manual";
      fuel: null;
      message: string;
    };
