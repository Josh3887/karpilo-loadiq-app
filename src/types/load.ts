import { AccessorialInputItem } from "@/types/accessorial";
import { FuelPriceSource } from "@/types/fuel";
import { RouteEstimate, RouteStopKind } from "@/types/route-intelligence";
import { OdometerValidation } from "@/types/trip-validation";
import type { LoadPulledReason, LoadRunStatus } from "@/lib/fuel-gauge";

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

export type ReserveAllocationMode = "flat" | "cpm" | "percent";

export type RouteStopInput = {
  id?: string;
  stopType: RouteStopKind;
  address: string;
  city: string;
  state: string;
  zip: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentWindowStart: string;
  appointmentWindowEnd: string;
  appointmentWindowOpenEnded: boolean;
  dwellHours: number;
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

export type TemporaryOverrides = Partial<
  Record<keyof ProfileDerivedValues, number>
>;

export type LoadInput = {
  loadNumber: string;
  carrierLoadId: string;
  dispatcherReference: string;

  pickupZip: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  deliveryZip: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;

  deadheadStartAddress: string;
  deadheadStartCity: string;
  deadheadStartState: string;
  deadheadStartZip: string;
  deadheadOriginSuggestionApplied: boolean;
  deadheadOriginSuggestionSourceLoadId: string;
  suggestedOriginOdometer: number;
  routeStops: RouteStopInput[];
  estimatedLoadWeightLbs: number;

  equipmentType: string;
  atlasEquipmentPack: string;
  combinationType: string;
  trailerLengthFeet: number;
  trailerWidthInches: number;
  trailerHeightInches: number;
  vehicleTareWeightLbs: number;
  estimatedMaxGrossLbs: number;
  maxPayloadLbs: number;
  grossVehicleWeightRatingLbs: number;
  axleCount: number;
  hazmatCapable: boolean;
  tankerCapable: boolean;
  refrigeratedCapable: boolean;
  specializedCapabilities: string[];
  securementEquipment: string[];
  routeRestrictionNotes: string;

  loadedMiles: number;
  deadheadMiles: number;
  routeEstimate: RouteEstimate | null;

  routeLoadedMiles: number;
  actualLoadedMiles: number;
  routeDeadheadMiles: number;
  actualDeadheadMiles: number;
  originOdometer: number;
  endOdometer: number;
  actualTotalMiles: number;
  odometerValidation: OdometerValidation | null;

  dispatchDays: number;
  deadheadDays: number;
  dispatchDate: string;
  pickupDate: string;
  pickupTime: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  pickupWindowOpenEnded: boolean;
  pickupDwellHours: number;
  deliveryDate: string;
  deliveryTime: string;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  deliveryWindowOpenEnded: boolean;
  deliveryDwellHours: number;
  deadheadStartDate: string;
  deadheadStartTime: string;
  deadheadEndDate: string;
  deadheadPlanningHours: number;
  loadedPlanningHours: number;
  deadheadPlanningHoursUserOverridden: boolean;
  deadheadDaysUserOverridden: boolean;
  loadedPlanningHoursUserOverridden: boolean;
  loadedDaysUserOverridden: boolean;
  googleRouteDurationHuman: string;
  googleRouteDurationQuarterHours: number;
  deadheadBenchmarkHours: number;
  loadedBenchmarkHours: number;
  deadheadBenchmarkDays: number;
  loadedBenchmarkDays: number;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  loadRunStatus: LoadRunStatus;
  loadPulledReason: LoadPulledReason;

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
  fuelTankCount: number;
  fuelTankCapacityGallons: number;
  startingFuelPercent: number;

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
  deadheadDays: number;
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
