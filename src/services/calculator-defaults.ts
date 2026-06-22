import {
  calculateCpmExposure,
  calculateOverheadBreakdown,
  calculatePercentDeductions,
  calculateWeeklyOverhead,
  getOverheadItemsWithSubscriptionExpense,
} from "@/services/overhead-items";
import {
  deriveIncomeTargets,
  buildOperationalEquipmentProfile,
  getOperationalProfile,
} from "@/services/operational-profile";
import {
  buildDefaultStructuredEquipmentProfile,
  type StructuredEquipmentProfile,
} from "@/lib/equipment-profile";
import { PayStructure } from "@/types/load";

export type CalculatorDefaults = {
  weeklyOverhead: number;
  monthlyOverhead: number;
  dailyOverhead: number;
  annualOverhead: number;
  operatingDaysPerWeek: number;
  operatingDaysPerMonth: number;
  cpmExposure: number;
  percentDeductions: number;
  incomeTargetDaily: number;
  incomeTargetWeekly: number;
  minimumHourlyProfitability: number;
  targetTrueRpm: number;
  defaultMpg: number;
  fuelTankCount: number;
  fuelTankCapacityGallons: number;
  equipmentProfile: StructuredEquipmentProfile;
  defaultPayStructure?: PayStructure;
  reserveAllocation: number;
  maintenanceReserve: number;
  tireReserve: number;
  trailerFee: number;
  insuranceAllocation: number;
  variableCostPerMile: number;
  fixedCostAllocation: number;
  dispatchPercent: number;
  factoringPercent: number;
};

export async function getCalculatorDefaults(): Promise<CalculatorDefaults> {
  const [items, operationalProfile] = await Promise.all([
    getOverheadItemsWithSubscriptionExpense().catch(() => []),
    getOperationalProfile().catch(() => null),
  ]);

  const profile = operationalProfile?.profile;
  const payTemplate = operationalProfile?.payTemplates.find(
    (template) => template.is_default
  );
  const weeklyOverhead = calculateWeeklyOverhead(items);
  const overheadBreakdown = calculateOverheadBreakdown(
    items,
    profile?.operatingDaysPerWeek ?? 5.5
  );
  const cpmExposure = calculateCpmExposure(items);
  const incomeTargets = deriveIncomeTargets(
    profile?.incomeTargetAmount ?? 60000,
    profile?.incomeTargetPeriod ?? "yearly"
  );
  const targetTrueRpm = profile?.minimumTrueRpm ?? 2;

  return {
    weeklyOverhead,
    monthlyOverhead: overheadBreakdown.monthly,
    dailyOverhead: overheadBreakdown.daily,
    annualOverhead: overheadBreakdown.annual,
    operatingDaysPerWeek: overheadBreakdown.operatingDaysPerWeek,
    operatingDaysPerMonth: overheadBreakdown.operatingDaysPerMonth,
    cpmExposure,
    percentDeductions: calculatePercentDeductions(items),
    incomeTargetDaily: incomeTargets.daily,
    incomeTargetWeekly: incomeTargets.weekly,
    minimumHourlyProfitability: profile?.minimumHourlyProfitability ?? 50,
    targetTrueRpm,
    defaultMpg: profile?.defaultMpg ?? 6.5,
    fuelTankCount: profile?.fuelTankCount ?? 0,
    fuelTankCapacityGallons: profile?.fuelTankCapacityGallons ?? 0,
    equipmentProfile: profile
      ? buildOperationalEquipmentProfile(profile)
      : buildDefaultStructuredEquipmentProfile(),
    defaultPayStructure: payTemplate?.structure,
    reserveAllocation: profile?.defaultReserveAllocation ?? 0,
    maintenanceReserve: profile?.defaultMaintenanceReserve ?? 0,
    tireReserve: profile?.defaultTireReserve ?? 0,
    trailerFee: profile?.defaultTrailerFee ?? 0,
    insuranceAllocation: profile?.defaultInsuranceAllocation ?? 0,
    variableCostPerMile:
      (profile?.defaultVariableCostPerMile ?? 0) + cpmExposure,
    fixedCostAllocation: profile?.defaultFixedCostAllocation ?? 0,
    dispatchPercent: profile?.defaultDispatchPercent ?? 0,
    factoringPercent:
      (profile?.defaultFactoringPercent ?? 0) + calculatePercentDeductions(items),
  };
}
