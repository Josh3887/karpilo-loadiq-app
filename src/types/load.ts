import { AccessorialInputItem } from "@/types/accessorial";
import { FuelPriceSource } from "@/types/fuel";

export type PayStructureType = "percentage" | "cpm" | "flat" | "daily";

export type PayStructure = {
  type: PayStructureType;
  label: string;
  percentageChain: number[];
  cpmRate: number;
  flatAmount: number;
  dailyRate: number;
  includeFuelSurcharge: boolean;
  includeAccessorials: boolean;
};

export type LoadInput = {
  loadNumber: string;
  carrierLoadId: string;
  dispatcherReference: string;

  pickupZip: string;
  pickupCity: string;
  pickupState: string;
  deliveryZip: string;
  deliveryCity: string;
  deliveryState: string;

  loadedMiles: number;
  deadheadMiles: number;

  routeLoadedMiles: number;
  actualLoadedMiles: number;
  routeDeadheadMiles: number;
  actualDeadheadMiles: number;

  dispatchDays: number;
  deadheadDays: number;

  ratePerMile: number;
  fuelSurcharge: number;
  fuelPrice: number;
  fuelPriceSource: FuelPriceSource;
  fuelPriceSourceLabel: string;
  fuelPriceRegion: string;
  fuelPricePeriod: string;
  fuelPriceFetchedAt: string;
  fuelPriceExpiresAt: string;
  fuelPriceIsEstimate: boolean;
  mpg: number;

  overhead: number;
  accessorialItems: AccessorialInputItem[];
  reserveAllocation: number;
  maintenanceReserve: number;
  tireReserve: number;
  tolls: number;
  lumpers: number;
  trailerFee: number;
  insuranceAllocation: number;
  variableCostPerMile: number;
  fixedCostAllocation: number;

  factoringPercent: number;
  dispatchPercent: number;

  targetTrueRpm: number;
  payStructure?: PayStructure;
};

export type ProfitabilityBand =
  | "excellent"
  | "strong"
  | "moderate"
  | "weak"
  | "dangerous";

export type LoadWarning = {
  type:
    | "deadhead"
    | "fuel"
    | "bad_load"
    | "margin"
    | "break_even"
    | "cash_flow";
  severity: "info" | "warning" | "danger";
  message: string;
};

export type CostBreakdown = {
  fuel: number;
  accessorialExpense: number;
  reimbursedAccessorialExpense: number;
  tolls: number;
  lumpers: number;
  dispatch: number;
  factoring: number;
  reserves: number;
  maintenanceReserve: number;
  tireReserve: number;
  overhead: number;
  trailerFee: number;
  insuranceAllocation: number;
  variableCosts: number;
  fixedCostAllocation: number;
};

export type LoadResult = {
  calculationVersion: string;
  linehaulRevenue: number;
  fuelSurchargeRevenue: number;
  accessorialRevenue: number;
  reimbursedRevenue: number;
  grossRevenue: number;
  payableRevenue: number;
  netRevenue: number;
  totalMiles: number;
  fuelCost: number;
  trueRpm: number;
  rpmAfterDeadhead: number;
  dispatchCost: number;
  factoringCost: number;
  operationalCost: number;
  totalTripCost: number;
  estimatedNet: number;
  retainedEarnings: number;
  deadheadPercent: number;
  fuelPercentOfGross: number;
  profitMarginPercent: number;
  costPerMile: number;
  breakEvenRpm: number;
  dailyProfitability: number;
  hourlyProfitability: number;
  profitabilityScore: number;
  profitabilityBand: ProfitabilityBand;
  costBreakdown: CostBreakdown;
  warnings: LoadWarning[];
  explanations: string[];
};
