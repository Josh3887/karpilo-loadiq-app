import { AccessorialInputItem } from "@/types/accessorial";
import { FuelPriceSource } from "@/types/fuel";

export type PayStructureType = "percentage" | "cpm" | "flat" | "daily";
export type PayCalculationBasis = "gross" | "gross_minus_fsc";
export type PayPeriodMode = "by_load" | "weekly";

export type PayStructure = {
  type: PayStructureType;
  label: string;
  percentageChain: number[];
  cpmRate: number;
  flatAmount: number;
  dailyRate: number;
  includeFuelSurcharge: boolean;
  includeAccessorials: boolean;
  payCalculationBasis: PayCalculationBasis;
  payPeriodMode: PayPeriodMode;
};

export type LoadRunStatus = "ran" | "test" | "planned";

export type ReserveAllocationMode = "flat" | "cpm" | "percent";

export type RouteStopInput = {
  id?: string;
  city: string;
  state: string;
  zip: string;
  milesFromPrevious: number;
  stopRevenue: number;
  stopExpense: number;
  notes: string;
};

export type CalculationValueSource =
  | "profile"
  | "load_input"
  | "temporary_override"
  | "system";

export type ProfileDerivedValues = {
  dailyFixedOverhead: number;
  operatingDaysPerWeek: number;
  operatingDaysPerMonth: number;
  dispatchPercent: number;
  factoringPercent: number;
  reserveAllocation: number;
  maintenanceReserve: number;
  tireReserve: number;
  trailerFee: number;
  insuranceAllocation: number;
  variableCostPerMile: number;
  fixedCostAllocation: number;
  mpg: number;
  targetTrueRpm: number;
  incomeTargetDaily: number;
  incomeTargetWeekly: number;
  minimumHourlyProfitability: number;
};

export type TemporaryOverrides = Partial<Record<keyof ProfileDerivedValues, number>>;

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

  deadheadStartCity: string;
  deadheadStartState: string;
  deadheadStartZip: string;
  routeStops: RouteStopInput[];
  estimatedLoadWeightLbs: number;

  loadedMiles: number;
  deadheadMiles: number;

  routeLoadedMiles: number;
  actualLoadedMiles: number;
  routeDeadheadMiles: number;
  actualDeadheadMiles: number;

  dispatchDays: number;
  deadheadDays: number;
  dispatchDate: string;
  deadheadStartDate: string;
  deadheadEndDate: string;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  loadRunStatus: LoadRunStatus;

  revenueInputMode: "rpm" | "gross";
  grossRevenue: number;
  fuelSurchargeIncludedInGross: boolean;
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
  profileDerivedValues: ProfileDerivedValues;
  temporaryOverrides: TemporaryOverrides;
  calculationSource: CalculationValueSource;
  accessorialItems: AccessorialInputItem[];
  reserveAllocationMode: ReserveAllocationMode;
  reserveAllocationValue: number;
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
  driverPayBase: number;
  driverPercentagePay: number;
  payCalculationBasis: PayCalculationBasis;
  payPeriodMode: PayPeriodMode;
  payableRevenue: number;
  netRevenue: number;
  totalMiles: number;
  routeStopCount: number;
  stopOffCount: number;
  estimatedLoadWeightLbs: number;
  fuelCost: number;
  trueRpm: number;
  rpmAfterDeadhead: number;
  dispatchCost: number;
  factoringCost: number;
  operationalCost: number;
  loadOverheadApplied: number;
  dailyFixedOverhead: number;
  dispatchDays: number;
  profitPerDay: number;
  profitPerHour: number;
  profitPerLoadedMile: number;
  profitPerTotalMile: number;
  targetRpm: number;
  incomeTargetComparison: number;
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
  reserveAllocationMode: ReserveAllocationMode;
  reserveAllocationValue: number;
  reserveAllocationResolved: number;
  profitabilityScore: number;
  profitabilityBand: ProfitabilityBand;
  costBreakdown: CostBreakdown;
  warnings: LoadWarning[];
  explanations: string[];
};
