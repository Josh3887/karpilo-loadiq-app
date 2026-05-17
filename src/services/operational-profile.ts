import { createClient } from "@/lib/supabase-client";
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

export async function getOperationalProfile() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const [profileResult, settingsResult, truckResult, templatesResult] =
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
    ]);

  if (profileResult.error) throw new Error(formatSupabaseError(profileResult.error));

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
    incomeTargetAmount: Number(
      settingsResult.data?.income_target_amount ?? 60000
    ),
    incomeTargetPeriod:
      settingsResult.data?.income_target_period === "monthly" ||
      settingsResult.data?.income_target_period === "weekly"
        ? settingsResult.data.income_target_period
        : "yearly",
    targetProfitMargin: Number(settingsResult.data?.target_profit_margin ?? 20),
    minimumTrueRpm: Number(settingsResult.data?.target_true_rpm ?? 2),
    minimumHourlyProfitability: Number(
      settingsResult.data?.minimum_hourly_profitability ?? 50
    ),
    operatingDaysPerWeek: Number(
      settingsResult.data?.operating_days_per_week ?? 5.5
    ),
    operatingDaysPerMonth: Number(
      settingsResult.data?.operating_days_per_month ??
        Number(settingsResult.data?.operating_days_per_week ?? 5.5) * 4.33
    ),
    defaultMpg: Number(
      truckResult.data?.default_mpg ?? settingsResult.data?.default_mpg ?? 6.5
    ),
    truckMake: truckResult.data?.make ?? "",
    truckModel: truckResult.data?.model ?? "",
    truckYear: Number(truckResult.data?.year ?? 0),
    truckEngine: truckResult.data?.engine ?? "",
    truckOdometer: Number(truckResult.data?.odometer ?? 0),
    trailerDivisionType: truckResult.data?.trailer_division_type ?? "",
    trailerType: truckResult.data?.trailer_type ?? "",
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
    defaultMaintenanceReserve: Number(
      settingsResult.data?.default_maintenance_reserve ?? 0
    ),
    defaultTireReserve: Number(settingsResult.data?.default_tire_reserve ?? 0),
    defaultTrailerFee: Number(settingsResult.data?.default_trailer_fee ?? 0),
    defaultInsuranceAllocation: Number(
      settingsResult.data?.default_insurance_allocation ?? 0
    ),
    defaultVariableCostPerMile: Number(
      settingsResult.data?.default_variable_cost_per_mile ?? 0
    ),
    defaultFixedCostAllocation: Number(
      settingsResult.data?.default_fixed_cost_allocation ?? 0
    ),
    defaultDispatchPercent: Number(
      settingsResult.data?.default_dispatch_percent ?? 0
    ),
    defaultFactoringPercent: Number(
      settingsResult.data?.default_factoring_percent ?? 0
    ),
  } satisfies OperationalProfile;

  return {
    profile,
    payTemplates: (templatesResult.data ?? []) as PayTemplate[],
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
    user_id: user.id,
    make: profile.truckMake,
    model: profile.truckModel,
    year: profile.truckYear || null,
    engine: profile.truckEngine,
    odometer: profile.truckOdometer || null,
    default_mpg: profile.defaultMpg,
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
