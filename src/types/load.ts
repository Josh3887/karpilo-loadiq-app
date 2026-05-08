export type LoadInput = {
  pickupZip: string;
  deliveryZip: string;
  loadedMiles: number;
  deadheadMiles: number;
  ratePerMile: number;
  fuelPrice: number;
  mpg: number;
  overhead: number;
  accessorials: number;
  tolls: number;
  lumpers: number;
  reserveAllocation: number;
  factoringPercent: number;
  dispatchPercent: number;
  targetTrueRpm: number;
};

export type ProfitabilityBand =
  | "excellent"
  | "strong"
  | "moderate"
  | "weak"
  | "dangerous";

export type LoadWarning = {
  type: "deadhead" | "fuel" | "bad_load" | "margin";
  severity: "info" | "warning" | "danger";
  message: string;
};

export type LoadResult = {
  grossRevenue: number;
  totalMiles: number;
  fuelCost: number;
  trueRpm: number;
  dispatchCost: number;
  factoringCost: number;
  operationalCost: number;
  estimatedNet: number;
  deadheadPercent: number;
  fuelPercentOfGross: number;
  profitMarginPercent: number;
  profitabilityScore: number;
  profitabilityBand: ProfitabilityBand;
  warnings: LoadWarning[];
};