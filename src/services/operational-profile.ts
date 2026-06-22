import { createClient } from "@/lib/supabase-client";
import {
  buildStructuredEquipmentProfile,
  type StructuredEquipmentProfile,
} from "@/lib/equipment-profile";
import { PayStructure } from "@/types/load";

export type OperationType = "local" | "regional" | "dedicated" | "otr";
export type IncomeTargetPeriod = "yearly" | "monthly" | "weekly";

export type OperationalProfile = {
  profileName: string;
  companyName: string;
  operationType: OperationType;
  incomeTargetAmount: number;
  incomeTargetPeriod: IncomeTargetPeriod;
  targetProfitMargin: number;
  minimumTrueRpm: number;
  minimumHourlyProfitability: number;
  operatingDaysPerWeek: number;
  operatingDaysPerMonth: number;
  defaultMpg: number;
  truckMake: string;
  truckModel: string;
  truckYear: number;
  truckEngine: string;
  truckOdometer: number;
  fuelTankCount: number;
  fuelTankCapacityGallons: number;
  equipmentType: string;
  combinationType: string;
  trailerLengthFeet: number;
  trailerWidthInches: number;
  trailerHeightInches: number;
  maxPayloadLbs: number;
  grossVehicleWeightRatingLbs: number;
  axleCount: number;
  hazmatCapable: boolean;
  tankerCapable: boolean;
  refrigeratedCapable: boolean;
  specializedCapabilities: string;
  securementEquipment: string;
  routeRestrictionNotes: string;
  trailerDivisionType: string;
  trailerType: string;
  vehicleTareWeightLbs: number;
  estimatedMaxGrossLbs: number;
  operationalClassification: string;
  defaultReserveAllocation: number;
  defaultMaintenanceReserve: number;
  defaultTireReserve: number;
  defaultTrailerFee: number;
  defaultInsuranceAllocation: number;
  defaultVariableCostPerMile: number;
  defaultFixedCostAllocation: number;
  defaultDispatchPercent: number;
  defaultFactoringPercent: number;
};

export type PayTemplate = {
  id: string;
  name: string;
  structure: PayStructure;
  is_default: boolean;
};

export const defaultOperationalProfile: OperationalProfile = {
  profileName: "",
  companyName: "",
  operationType: "otr",
  incomeTargetAmount: 60000,
  incomeTargetPeriod: "yearly",
  targetProfitMargin: 20,
  minimumTrueRpm: 2,
  minimumHourlyProfitability: 50,
  operatingDaysPerWeek: 5.5,
  operatingDaysPerMonth: 23.8,
  defaultMpg: 6.5,
  truckMake: "",
  truckModel: "",
  truckYear: 0,
  truckEngine: "",
  truckOdometer: 0,
  fuelTankCount: 0,
  fuelTankCapacityGallons: 0,
  equipmentType: "Dry van",
  combinationType: "Single tractor-trailer",
  trailerLengthFeet: 53,
  trailerWidthInches: 102,
  trailerHeightInches: 162,
  maxPayloadLbs: 45000,
  grossVehicleWeightRatingLbs: 80000,
  axleCount: 5,
  hazmatCapable: false,
  tankerCapable: false,
  refrigeratedCapable: false,
  specializedCapabilities: "",
  securementEquipment: "",
  routeRestrictionNotes: "",
  trailerDivisionType: "",
  trailerType: "",
  vehicleTareWeightLbs: 0,
  estimatedMaxGrossLbs: 0,
  operationalClassification: "",
  defaultReserveAllocation: 0,
  defaultMaintenanceReserve: 0,
  defaultTireReserve: 0,
  defaultTrailerFee: 0,
  defaultInsuranceAllocation: 0,
  defaultVariableCostPerMile: 0,
  defaultFixedCostAllocation: 0,
  defaultDispatchPercent: 0,
  defaultFactoringPercent: 0,
};

type LoadIqProfileFallback = {
  businessProfile?: {
    businessType?: string;
    equipmentType?: string;
    combinationType?: string;
    trailerLengthFeet?: number;
    trailerWidthInches?: number;
    trailerHeightInches?: number;
    maxPayloadLbs?: number;
    grossVehicleWeightRatingLbs?: number;
    axleCount?: number;
    hazmatCapable?: boolean;
    tankerCapable?: boolean;
    refrigeratedCapable?: boolean;
    specializedCapabilities?: string;
    securementEquipment?: string;
    routeRestrictionNotes?: string;
    daysWillingToRun?: number;
  };
  operatorGoals?: {
    minimumOperatorIncome?: number;
    targetOperatorIncome?: number;
    desiredBusinessCushion?: number;
  };
  operatingAssumptions?: {
    monthlyInsurance?: number;
    truckPayment?: number;
    trailerPayment?: number;
    maintenanceReserve?: number;
    factoringFee?: number;
    dispatchFee?: number;
    eldSoftware?: number;
    otherRecurringOverhead?: number;
  };
};

function formatSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") return "Unknown Supabase error.";

  const maybeError = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };

  return [
    maybeError.message,
    maybeError.details,
    maybeError.hint,
    maybeError.code,
  ]
    .filter(Boolean)
    .join(" | ");
}

function readList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(", ");
  }

  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readLoadIqSnapshot(snapshot: unknown): LoadIqProfileFallback {
  if (!isRecord(snapshot)) return {};
  const loadIQ = snapshot.loadIQ;
  return isRecord(loadIQ) ? (loadIQ as LoadIqProfileFallback) : {};
}

function numberFrom(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function positiveNumberFrom(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

function targetRpmFromFitCheck(
  snapshot: LoadIqProfileFallback,
  fallback: number
) {
  const results = isRecord(snapshot)
    ? (snapshot as { savedFitCheckResults?: unknown }).savedFitCheckResults
    : undefined;
  const latestResult = Array.isArray(results)
    ? (results.at(-1) as Record<string, unknown> | undefined)
    : undefined;
  const targetNeed =
    numberFrom(latestResult?.monthlyOverhead, 0) +
    numberFrom(snapshot.operatorGoals?.targetOperatorIncome, 0) +
    numberFrom(snapshot.operatorGoals?.desiredBusinessCushion, 0);
  const miles = numberFrom(
    (latestResult as { totalMiles?: unknown } | undefined)?.totalMiles,
    0
  );

  if (targetNeed <= 0 || miles <= 0) return fallback;
  return Number((targetNeed / miles).toFixed(2));
}

function writeList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildOperationalEquipmentProfile(
  profile: OperationalProfile
): StructuredEquipmentProfile {
  return buildStructuredEquipmentProfile({
    equipmentType: profile.equipmentType || profile.trailerType,
    combinationType: profile.combinationType,
    trailerLengthFeet: profile.trailerLengthFeet,
    trailerWidthInches: profile.trailerWidthInches,
    trailerHeightInches: profile.trailerHeightInches,
    vehicleTareWeightLbs: profile.vehicleTareWeightLbs,
    estimatedMaxGrossLbs: profile.estimatedMaxGrossLbs,
    maxPayloadLbs: profile.maxPayloadLbs,
    grossVehicleWeightRatingLbs: profile.grossVehicleWeightRatingLbs,
    axleCount: profile.axleCount,
    hazmatCapable: profile.hazmatCapable,
    tankerCapable: profile.tankerCapable,
    refrigeratedCapable: profile.refrigeratedCapable,
    specializedCapabilities: profile.specializedCapabilities,
    securementEquipment: profile.securementEquipment,
    routeRestrictionNotes: profile.routeRestrictionNotes,
  });
}

async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw new Error(formatSupabaseError(error));
  if (!user) throw new Error("User not authenticated.");

  return user;
}

export function deriveIncomeTargets(
  amount: number,
  period: IncomeTargetPeriod
) {
  const yearly =
    period === "yearly" ? amount : period === "monthly" ? amount * 12 : amount * 52;
  const monthly = yearly / 12;
  const weekly = yearly / 52;
  const daily = weekly / 5;

  return {
    yearly,
    monthly,
    weekly,
    daily,
  };
}

function normalizePayStructure(structure: Partial<PayStructure>): PayStructure {
  return {
    type: structure.type ?? "percentage",
    label: structure.label ?? "100% gross",
    percentageChain: structure.percentageChain ?? [100],
    cpmRate: Number(structure.cpmRate ?? 0),
    flatAmount: Number(structure.flatAmount ?? 0),
    dailyRate: Number(structure.dailyRate ?? 0),
    includeFuelSurcharge: structure.includeFuelSurcharge ?? true,
    includeAccessorials: structure.includeAccessorials ?? true,
    payCalculationBasis: structure.payCalculationBasis ?? "gross",
    payPeriodMode: structure.payPeriodMode ?? "by_load",
  };
}

export async function getOperationalProfile() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const [
    profileResult,
    settingsResult,
    truckResult,
    templatesResult,
    operatorProfileResult,
  ] =
    await Promise.all([
      supabase
        .from("users")
        .select("profile_name, company_name, operation_type")
        .eq("id", user.id)
        .maybeSingle(),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("truck_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("pay_structure_templates")
        .select("id, name, structure, is_default")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("operator_profiles")
        .select(
          "profile_snapshot, default_mpg, target_income, target_income_period, target_true_rpm, target_profit_margin, minimum_hourly_profitability, operating_days_per_week, operating_days_per_month, dispatch_percentage, factoring_percentage"
        )
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (profileResult.error) throw new Error(formatSupabaseError(profileResult.error));
  if (operatorProfileResult.error) {
    throw new Error(formatSupabaseError(operatorProfileResult.error));
  }

  const fallbackSnapshot = readLoadIqSnapshot(
    operatorProfileResult.data?.profile_snapshot
  );
  const fallbackBusiness = fallbackSnapshot.businessProfile;
  const fallbackGoals = fallbackSnapshot.operatorGoals;
  const fallbackDaysPerMonth = positiveNumberFrom(
    fallbackBusiness?.daysWillingToRun,
    23.8
  );
  const fallbackDaysPerWeek = Number((fallbackDaysPerMonth / 4.33).toFixed(2));
  const fallbackTargetIncome =
    positiveNumberFrom(fallbackGoals?.targetOperatorIncome, 0) ||
    positiveNumberFrom(fallbackGoals?.minimumOperatorIncome, 0);

  const profile = {
    ...defaultOperationalProfile,
    profileName: profileResult.data?.profile_name ?? "",
    companyName: profileResult.data?.company_name ?? "",
    operationType:
      profileResult.data?.operation_type === "local" ||
      profileResult.data?.operation_type === "regional" ||
      profileResult.data?.operation_type === "dedicated" ||
      profileResult.data?.operation_type === "otr"
        ? profileResult.data.operation_type
        : "otr",
    incomeTargetAmount: positiveNumberFrom(
      settingsResult.data?.income_target_amount ??
        operatorProfileResult.data?.target_income ??
        fallbackTargetIncome,
      60000
    ),
    incomeTargetPeriod:
      settingsResult.data?.income_target_period === "monthly" ||
      settingsResult.data?.income_target_period === "weekly"
        ? settingsResult.data.income_target_period
        : operatorProfileResult.data?.target_income_period === "monthly" ||
            operatorProfileResult.data?.target_income_period === "weekly"
          ? operatorProfileResult.data.target_income_period
          : fallbackTargetIncome > 0
            ? "monthly"
            : "yearly",
    targetProfitMargin: numberFrom(
      settingsResult.data?.target_profit_margin ??
        operatorProfileResult.data?.target_profit_margin,
      20
    ),
    minimumTrueRpm: numberFrom(
      settingsResult.data?.target_true_rpm ??
        operatorProfileResult.data?.target_true_rpm,
      targetRpmFromFitCheck(fallbackSnapshot, 2)
    ),
    minimumHourlyProfitability: numberFrom(
      settingsResult.data?.minimum_hourly_profitability ??
        operatorProfileResult.data?.minimum_hourly_profitability,
      50
    ),
    operatingDaysPerWeek: numberFrom(
      settingsResult.data?.operating_days_per_week ??
        operatorProfileResult.data?.operating_days_per_week,
      fallbackDaysPerWeek
    ),
    operatingDaysPerMonth: numberFrom(
      settingsResult.data?.operating_days_per_month ??
        operatorProfileResult.data?.operating_days_per_month ??
        Number(settingsResult.data?.operating_days_per_week ?? fallbackDaysPerWeek) *
          4.33,
      fallbackDaysPerMonth
    ),
    defaultMpg: numberFrom(
      truckResult.data?.default_mpg ??
        settingsResult.data?.default_mpg ??
        operatorProfileResult.data?.default_mpg,
      6.5
    ),
    truckMake: truckResult.data?.make ?? "",
    truckModel: truckResult.data?.model ?? "",
    truckYear: Number(truckResult.data?.year ?? 0),
    truckEngine: truckResult.data?.engine ?? "",
    truckOdometer: Number(truckResult.data?.odometer ?? 0),
    fuelTankCount: Number(truckResult.data?.fuel_tank_count ?? 0),
    fuelTankCapacityGallons: Number(
      truckResult.data?.fuel_tank_capacity_gallons ?? 0
    ),
    equipmentType:
      truckResult.data?.equipment_type ??
      truckResult.data?.trailer_type ??
      fallbackBusiness?.equipmentType ??
      "Dry van",
    combinationType:
      truckResult.data?.combination_type ??
      fallbackBusiness?.combinationType ??
      "Single tractor-trailer",
    trailerLengthFeet: numberFrom(
      truckResult.data?.trailer_length_feet ?? fallbackBusiness?.trailerLengthFeet,
      0
    ),
    trailerWidthInches: numberFrom(
      truckResult.data?.trailer_width_inches ?? fallbackBusiness?.trailerWidthInches,
      0
    ),
    trailerHeightInches: numberFrom(
      truckResult.data?.trailer_height_inches ?? fallbackBusiness?.trailerHeightInches,
      0
    ),
    maxPayloadLbs: numberFrom(
      truckResult.data?.max_payload_lbs ?? fallbackBusiness?.maxPayloadLbs,
      0
    ),
    grossVehicleWeightRatingLbs: numberFrom(
      truckResult.data?.gross_vehicle_weight_rating_lbs ??
        fallbackBusiness?.grossVehicleWeightRatingLbs,
      0
    ),
    axleCount: numberFrom(
      truckResult.data?.axle_count ?? fallbackBusiness?.axleCount,
      0
    ),
    hazmatCapable:
      truckResult.data?.hazmat_capable === true ||
      fallbackBusiness?.hazmatCapable === true,
    tankerCapable:
      truckResult.data?.tanker_capable === true ||
      fallbackBusiness?.tankerCapable === true,
    refrigeratedCapable:
      truckResult.data?.refrigerated_capable === true ||
      fallbackBusiness?.refrigeratedCapable === true,
    specializedCapabilities: readList(
      truckResult.data?.specialized_capabilities ??
        fallbackBusiness?.specializedCapabilities
    ),
    securementEquipment: readList(
      truckResult.data?.securement_equipment ??
        fallbackBusiness?.securementEquipment
    ),
    routeRestrictionNotes:
      truckResult.data?.route_restriction_notes ??
      fallbackBusiness?.routeRestrictionNotes ??
      "",
    trailerDivisionType: truckResult.data?.trailer_division_type ?? "",
    trailerType:
      truckResult.data?.trailer_type ?? fallbackBusiness?.equipmentType ?? "",
    vehicleTareWeightLbs: Number(
      truckResult.data?.vehicle_tare_weight_lbs ?? 0
    ),
    estimatedMaxGrossLbs: Number(
      truckResult.data?.estimated_max_gross_lbs ?? 0
    ),
    operationalClassification:
      truckResult.data?.operational_classification ?? "",
    defaultReserveAllocation: Number(
      settingsResult.data?.default_reserve_allocation ?? 0
    ),
    defaultMaintenanceReserve: numberFrom(
      settingsResult.data?.default_maintenance_reserve,
      0
    ),
    defaultTireReserve: Number(settingsResult.data?.default_tire_reserve ?? 0),
    defaultTrailerFee: numberFrom(settingsResult.data?.default_trailer_fee, 0),
    defaultInsuranceAllocation: numberFrom(
      settingsResult.data?.default_insurance_allocation,
      0
    ),
    defaultVariableCostPerMile: Number(
      settingsResult.data?.default_variable_cost_per_mile ?? 0
    ),
    defaultFixedCostAllocation: Number(
      settingsResult.data?.default_fixed_cost_allocation ?? 0
    ),
    defaultDispatchPercent: numberFrom(
      settingsResult.data?.default_dispatch_percent ??
        operatorProfileResult.data?.dispatch_percentage,
      0
    ),
    defaultFactoringPercent: numberFrom(
      settingsResult.data?.default_factoring_percent ??
        operatorProfileResult.data?.factoring_percentage,
      0
    ),
  } satisfies OperationalProfile;

  return {
    profile,
    payTemplates: (templatesResult.data ?? []).map((template) => ({
      ...template,
      structure: normalizePayStructure(
        (template.structure ?? {}) as Partial<PayStructure>
      ),
    })) as PayTemplate[],
  };
}

export async function saveOperationalProfile(profile: OperationalProfile) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { error: userError } = await supabase.from("users").upsert({
    id: user.id,
    email: user.email,
    profile_name: profile.profileName,
    company_name: profile.companyName,
    operation_type: profile.operationType,
  });

  if (userError) throw new Error(formatSupabaseError(userError));

  const { error: settingsError } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    income_target_amount: profile.incomeTargetAmount,
    income_target_period: profile.incomeTargetPeriod,
    target_profit_margin: profile.targetProfitMargin,
    target_true_rpm: profile.minimumTrueRpm,
    minimum_hourly_profitability: profile.minimumHourlyProfitability,
    operating_days_per_week: profile.operatingDaysPerWeek,
    operating_days_per_month:
      profile.operatingDaysPerMonth || profile.operatingDaysPerWeek * 4.33,
    default_mpg: profile.defaultMpg,
    default_reserve_allocation: profile.defaultReserveAllocation,
    default_maintenance_reserve: profile.defaultMaintenanceReserve,
    default_tire_reserve: profile.defaultTireReserve,
    default_trailer_fee: profile.defaultTrailerFee,
    default_insurance_allocation: profile.defaultInsuranceAllocation,
    default_variable_cost_per_mile: profile.defaultVariableCostPerMile,
    default_fixed_cost_allocation: profile.defaultFixedCostAllocation,
    default_dispatch_percent: profile.defaultDispatchPercent,
    default_factoring_percent: profile.defaultFactoringPercent,
  });

  if (settingsError) throw new Error(formatSupabaseError(settingsError));

  const { error: truckError } = await supabase.from("truck_profiles").upsert({
    atlas_equipment_pack: buildOperationalEquipmentProfile(profile)
      .atlasEquipmentPack,
    user_id: user.id,
    make: profile.truckMake,
    model: profile.truckModel,
    year: profile.truckYear || null,
    engine: profile.truckEngine,
    odometer: profile.truckOdometer || null,
    default_mpg: profile.defaultMpg,
    fuel_tank_count: profile.fuelTankCount || null,
    fuel_tank_capacity_gallons: profile.fuelTankCapacityGallons || null,
    equipment_type: profile.equipmentType || null,
    combination_type: profile.combinationType || null,
    trailer_length_feet: profile.trailerLengthFeet || null,
    trailer_width_inches: profile.trailerWidthInches || null,
    trailer_height_inches: profile.trailerHeightInches || null,
    max_payload_lbs: profile.maxPayloadLbs || null,
    gross_vehicle_weight_rating_lbs:
      profile.grossVehicleWeightRatingLbs || null,
    axle_count: profile.axleCount || null,
    hazmat_capable: profile.hazmatCapable,
    tanker_capable: profile.tankerCapable,
    refrigerated_capable: profile.refrigeratedCapable,
    specialized_capabilities: writeList(profile.specializedCapabilities),
    securement_equipment: writeList(profile.securementEquipment),
    route_restriction_notes: profile.routeRestrictionNotes || null,
    trailer_division_type: profile.trailerDivisionType || null,
    trailer_type: profile.trailerType || null,
    vehicle_tare_weight_lbs: profile.vehicleTareWeightLbs || null,
    estimated_max_gross_lbs: profile.estimatedMaxGrossLbs || null,
    operational_classification: profile.operationalClassification || null,
  });

  if (truckError) throw new Error(formatSupabaseError(truckError));
}

export async function createPayTemplate(
  name: string,
  structure: PayStructure,
  isDefault: boolean
) {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (isDefault) {
    await supabase
      .from("pay_structure_templates")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { error } = await supabase.from("pay_structure_templates").insert({
    user_id: user.id,
    name,
    structure,
    is_default: isDefault,
  });

  if (error) throw new Error(formatSupabaseError(error));
}
