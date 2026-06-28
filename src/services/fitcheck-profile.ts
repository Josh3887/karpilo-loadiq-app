"use client";

import { createClient } from "@/lib/supabase-client";
import type { FitCheckInput, FitCheckResult } from "@/lib/fitcheck";
import {
  defaultOperationalProfile,
  getOperationalProfile,
  saveOperationalProfile,
  type OperationalProfile,
} from "@/services/operational-profile";
import type { Json } from "@/types/supabase";

export const FITCHECK_PROFILE_SCHEMA_WARNING =
  "FitCheck snapshot saved and core Settings context was updated, but Vehicle Intelligence hydration is limited because the live Supabase schema is missing truck/equipment profile columns. Run the approved Supabase reconciliation before relying on vehicle/equipment FitCheck persistence.";

const OPTIONAL_TRUCK_PROFILE_COLUMNS = [
  "fuel_tank_count",
  "fuel_tank_capacity_gallons",
  "atlas_equipment_pack",
  "equipment_type",
  "combination_type",
  "trailer_length_feet",
  "trailer_width_inches",
  "trailer_height_inches",
  "max_payload_lbs",
  "gross_vehicle_weight_rating_lbs",
  "axle_count",
  "hazmat_capable",
  "tanker_capable",
  "refrigerated_capable",
  "specialized_capabilities",
  "securement_equipment",
  "route_restriction_notes",
] as const;

export type LoadIqProfileSnapshot = {
  businessProfile?: {
    businessType?: string;
    truckCount?: number;
    trailerCount?: number;
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
    authorityAge?: string;
    operatingRegions?: string;
    preferredLanes?: string;
    avoidedLanes?: string;
    endorsements?: string[];
    homeTimePriority?: string;
    daysWillingToRun?: number;
  };
  operatorGoals?: {
    minimumOperatorIncome?: number;
    targetOperatorIncome?: number;
    idealOperatorIncome?: number;
    desiredBusinessCushion?: number;
    primaryBusinessPriority?: string;
  };
  operatingAssumptions?: {
    fuelCostPerMile?: number;
    monthlyInsurance?: number;
    truckPayment?: number;
    trailerPayment?: number;
    maintenanceReserve?: number;
    factoringFee?: number;
    dispatchFee?: number;
    eldSoftware?: number;
    otherRecurringOverhead?: number;
  };
  loadPreferences?: {
    loadBoardsUsed?: string;
    usesDispatcher?: string;
    brokerRelationshipLevel?: string;
    hasDirectCustomers?: string;
    preferredDecisionFactor?: string;
    mainPainPoints?: string[];
  };
  savedFitCheckResults?: Array<{
    createdAt: string;
    monthlyGrossRevenue: number;
    monthlyOverhead: number;
    availableBeforeOperator: number;
    currentOperatorIncome: number;
    minimumOperatorIncome: number;
    targetOperatorIncome: number;
    idealOperatorIncome: number;
    desiredBusinessCushion: number;
    operatorIncomeGap: number;
    businessHealthGap: number;
    remainingBusinessCushion: number;
    recommendedTierId: string;
    disclaimerAccepted: boolean;
  }>;
};

export type FitCheckProfileSaveResult = {
  snapshotSaved: boolean;
  settingsHydrationAttempted: boolean;
  warnings: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readLoadIqSnapshot(snapshot: unknown): LoadIqProfileSnapshot {
  if (!isRecord(snapshot)) return {};
  const loadIQ = snapshot.loadIQ;
  return isRecord(loadIQ) ? (loadIQ as LoadIqProfileSnapshot) : {};
}

function toJson(value: unknown): Json {
  return value as Json;
}

function errorText(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

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
    .join(" | ")
    .toLowerCase();
}

function isKnownTruckProfileSchemaGapError(error: unknown) {
  const text = errorText(error);
  if (!text) return false;

  const mentionsOptionalTruckProfileColumn =
    OPTIONAL_TRUCK_PROFILE_COLUMNS.some((column) => text.includes(column));
  const isSchemaCacheError =
    text.includes("pgrst204") ||
    text.includes("schema cache") ||
    text.includes("could not find") ||
    text.includes("column");

  return mentionsOptionalTruckProfileColumn && isSchemaCacheError;
}

function safeNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function positiveOrExisting(value: unknown, existing: number) {
  const numeric = safeNumber(value);
  return numeric > 0 ? numeric : existing;
}

function clampPercent(value: unknown, existing: number) {
  const numeric = safeNumber(value);
  if (numeric <= 0) return existing;
  return Math.min(numeric, 100);
}

function roundCurrency(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

function deriveTargetTrueRpm(
  input: FitCheckInput,
  result: FitCheckResult,
  existing: number
) {
  const totalMiles = safeNumber(input.totalMiles);
  const targetOperatorIncome = safeNumber(input.targetOperatorIncome);
  const targetNeed =
    safeNumber(result.monthlyOverhead) +
    targetOperatorIncome +
    safeNumber(input.desiredBusinessCushion);

  if (totalMiles <= 0 || targetOperatorIncome <= 0 || targetNeed <= 0) {
    return existing;
  }

  return roundCurrency(targetNeed / totalMiles);
}

function buildOperationalProfileFromFitCheck(
  input: FitCheckInput,
  result: FitCheckResult,
  existing: OperationalProfile
): OperationalProfile {
  const operatingDaysPerMonth = positiveOrExisting(
    input.daysWillingToRun,
    existing.operatingDaysPerMonth
  );
  const operatingDaysPerWeek = roundCurrency(
    operatingDaysPerMonth > 0
      ? Math.max(operatingDaysPerMonth / 4.33, 1)
      : existing.operatingDaysPerWeek
  );
  const targetIncome =
    safeNumber(input.targetOperatorIncome) ||
    safeNumber(input.minimumOperatorIncome) ||
    existing.incomeTargetAmount;

  return {
    ...existing,
    incomeTargetAmount: targetIncome,
    incomeTargetPeriod:
      targetIncome > 0 ? "monthly" : existing.incomeTargetPeriod,
    minimumTrueRpm: deriveTargetTrueRpm(input, result, existing.minimumTrueRpm),
    operatingDaysPerWeek,
    operatingDaysPerMonth,
    equipmentType: input.equipmentType || existing.equipmentType,
    combinationType: input.combinationType || existing.combinationType,
    trailerLengthFeet: positiveOrExisting(
      input.trailerLengthFeet,
      existing.trailerLengthFeet
    ),
    trailerWidthInches: positiveOrExisting(
      input.trailerWidthInches,
      existing.trailerWidthInches
    ),
    trailerHeightInches: positiveOrExisting(
      input.trailerHeightInches,
      existing.trailerHeightInches
    ),
    maxPayloadLbs: positiveOrExisting(
      input.maxPayloadLbs,
      existing.maxPayloadLbs
    ),
    grossVehicleWeightRatingLbs: positiveOrExisting(
      input.grossVehicleWeightRatingLbs,
      existing.grossVehicleWeightRatingLbs
    ),
    axleCount: positiveOrExisting(input.axleCount, existing.axleCount),
    hazmatCapable: input.hazmatCapable,
    tankerCapable: input.tankerCapable,
    refrigeratedCapable: input.refrigeratedCapable,
    specializedCapabilities:
      input.specializedCapabilities || existing.specializedCapabilities,
    securementEquipment:
      input.securementEquipment || existing.securementEquipment,
    routeRestrictionNotes:
      input.routeRestrictionNotes || existing.routeRestrictionNotes,
    trailerType: input.equipmentType || existing.trailerType,
    operationalClassification:
      input.businessType || existing.operationalClassification,
    defaultDispatchPercent: clampPercent(
      input.dispatchFeePercent,
      existing.defaultDispatchPercent
    ),
    defaultFactoringPercent: clampPercent(
      input.factoringPercent,
      existing.defaultFactoringPercent
    ),
  };
}

function accountTypeForBusinessType(businessType: string) {
  if (businessType === "small_fleet") return "fleet";
  if (businessType === "owner_operator") return "independent_owner_operator";
  return "leased_owner_operator";
}

const FITCHECK_OVERHEAD_LABELS = [
  "FitCheck known monthly business overhead",
  "FitCheck insurance",
  "FitCheck truck payment",
  "FitCheck trailer payment/rental",
  "FitCheck maintenance reserve",
  "FitCheck tolls and permits",
  "FitCheck ELD/software",
  "FitCheck dispatch monthly cost",
  "FitCheck factoring monthly cost",
  "FitCheck payroll/driver pay",
  "FitCheck other fixed overhead",
] as const;

function buildFitCheckOverheadRows(input: FitCheckInput, userId: string) {
  const knownMonthlyOverhead = safeNumber(input.monthlyBusinessOverhead);

  if (knownMonthlyOverhead > 0) {
    return [
      {
        user_id: userId,
        label: "FitCheck known monthly business overhead",
        category: "fixed_operations",
        amount: roundCurrency(knownMonthlyOverhead),
        amount_type: "flat",
        frequency: "monthly",
        responsibility: "driver",
        is_active: true,
      },
    ];
  }

  return [
    ["FitCheck insurance", "fixed_operations", input.insuranceMonthlyCost],
    ["FitCheck truck payment", "fixed_operations", input.truckPayment],
    ["FitCheck trailer payment/rental", "fixed_operations", input.trailerPayment],
    ["FitCheck maintenance reserve", "reserve", input.maintenanceReserve],
    ["FitCheck tolls and permits", "compliance", input.tollsPermits],
    ["FitCheck ELD/software", "services", input.eldSoftware],
    ["FitCheck dispatch monthly cost", "services", input.dispatchMonthlyCost],
    ["FitCheck factoring monthly cost", "services", input.factoringMonthlyCost],
    ["FitCheck payroll/driver pay", "fixed_operations", input.payrollDriverPay],
    ["FitCheck other fixed overhead", "fixed_operations", input.otherFixedOverhead],
  ]
    .map(([label, category, amount]) => ({
      user_id: userId,
      label,
      category,
      amount: roundCurrency(safeNumber(amount)),
      amount_type: "flat",
      frequency: "monthly",
      responsibility: "driver",
      is_active: true,
    }))
    .filter((row) => row.amount > 0);
}

async function replaceFitCheckOverheadRows(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  input: FitCheckInput
) {
  const { error: deleteError } = await supabase
    .from("user_overhead_items")
    .delete()
    .eq("user_id", userId)
    .in("label", [...FITCHECK_OVERHEAD_LABELS]);

  if (deleteError) throw new Error(deleteError.message);

  const overheadRows = buildFitCheckOverheadRows(input, userId);
  if (overheadRows.length === 0) return;

  const { error: insertError } = await supabase
    .from("user_overhead_items")
    .insert(overheadRows);

  if (insertError) throw new Error(insertError.message);
}

async function hydrateSettingsFromFitCheck(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  input: FitCheckInput,
  result: FitCheckResult
) {
  const warnings: string[] = [];
  const existingProfile =
    (await getOperationalProfile().catch(() => null))?.profile ??
    defaultOperationalProfile;
  const nextProfile = buildOperationalProfileFromFitCheck(
    input,
    result,
    existingProfile
  );

  try {
    await saveOperationalProfile(nextProfile);
  } catch (error) {
    if (!isKnownTruckProfileSchemaGapError(error)) {
      throw error;
    }

    warnings.push(FITCHECK_PROFILE_SCHEMA_WARNING);
  }

  await replaceFitCheckOverheadRows(supabase, userId, input);

  const monthlyOverhead = roundCurrency(safeNumber(result.monthlyOverhead));
  const operatingDaysPerMonth = positiveOrExisting(
    input.daysWillingToRun,
    nextProfile.operatingDaysPerMonth
  );
  const operatingDaysPerWeek = roundCurrency(
    operatingDaysPerMonth > 0
      ? Math.max(operatingDaysPerMonth / 4.33, 1)
      : nextProfile.operatingDaysPerWeek
  );
  const fixedOverheadDaily =
    operatingDaysPerMonth > 0
      ? roundCurrency(monthlyOverhead / operatingDaysPerMonth)
      : 0;
  const accountType = accountTypeForBusinessType(input.businessType);

  const { error: operatorProfileError } = await supabase
    .from("operator_profiles")
    .update({
      account_type: accountType,
      operation_type: nextProfile.operationType,
      leased_owner_operator: accountType === "leased_owner_operator",
      independent_owner_operator: accountType === "independent_owner_operator",
      default_mpg: nextProfile.defaultMpg,
      target_income: nextProfile.incomeTargetAmount,
      target_income_period: nextProfile.incomeTargetPeriod,
      target_true_rpm: nextProfile.minimumTrueRpm,
      target_profit_margin: nextProfile.targetProfitMargin,
      minimum_hourly_profitability: nextProfile.minimumHourlyProfitability,
      operating_days_per_week: operatingDaysPerWeek,
      operating_days_per_month: operatingDaysPerMonth,
      fixed_overhead_monthly: monthlyOverhead,
      fixed_overhead_weekly: roundCurrency(monthlyOverhead / 4.33),
      fixed_overhead_daily: fixedOverheadDaily,
      dispatch_percentage: clampPercent(input.dispatchFeePercent, 0),
      factoring_percentage: clampPercent(input.factoringPercent, 0),
      maintenance_reserve_rate: safeNumber(input.maintenanceReserve),
      settings_completed: true,
      onboarding_completed: true,
    })
    .eq("user_id", userId);

  if (operatorProfileError) throw new Error(operatorProfileError.message);

  return { warnings };
}

export function buildLoadIqProfileFromInput(input: FitCheckInput): LoadIqProfileSnapshot {
  return {
    businessProfile: {
      businessType: input.businessType,
      truckCount: input.truckCount,
      trailerCount: input.trailerCount,
      equipmentType: input.equipmentType,
      combinationType: input.combinationType,
      trailerLengthFeet: input.trailerLengthFeet,
      trailerWidthInches: input.trailerWidthInches,
      trailerHeightInches: input.trailerHeightInches,
      maxPayloadLbs: input.maxPayloadLbs,
      grossVehicleWeightRatingLbs: input.grossVehicleWeightRatingLbs,
      axleCount: input.axleCount,
      hazmatCapable: input.hazmatCapable,
      tankerCapable: input.tankerCapable,
      refrigeratedCapable: input.refrigeratedCapable,
      specializedCapabilities: input.specializedCapabilities,
      securementEquipment: input.securementEquipment,
      routeRestrictionNotes: input.routeRestrictionNotes,
      authorityAge: input.authorityAge,
      operatingRegions: input.operatingRegions,
      preferredLanes: input.preferredLanes,
      avoidedLanes: input.avoidedLanes,
      endorsements: input.endorsements,
      homeTimePriority: input.homeTimePriority,
      daysWillingToRun: input.daysWillingToRun,
    },
    operatorGoals: {
      minimumOperatorIncome: input.minimumOperatorIncome,
      targetOperatorIncome: input.targetOperatorIncome,
      idealOperatorIncome: input.idealOperatorIncome,
      desiredBusinessCushion: input.desiredBusinessCushion,
      primaryBusinessPriority: input.primaryBusinessPriority,
    },
    operatingAssumptions: {
      fuelCostPerMile: input.fuelCostPerMile,
      monthlyInsurance: input.insuranceMonthlyCost,
      truckPayment: input.truckPayment,
      trailerPayment: input.trailerPayment,
      maintenanceReserve: input.maintenanceReserve,
      factoringFee: input.factoringPercent || input.factoringMonthlyCost,
      dispatchFee: input.dispatchFeePercent || input.dispatchMonthlyCost,
      eldSoftware: input.eldSoftware,
      otherRecurringOverhead: input.otherFixedOverhead,
    },
    loadPreferences: {
      loadBoardsUsed: input.loadBoardsUsed,
      usesDispatcher: input.usesDispatcher,
      brokerRelationshipLevel: input.brokerRelationshipLevel,
      hasDirectCustomers: input.hasDirectCustomers,
      preferredDecisionFactor: input.preferredDecisionFactor,
      mainPainPoints: input.mainPainPoints,
    },
  };
}

export function applyProfileToFitCheckInput(
  input: FitCheckInput,
  profile: LoadIqProfileSnapshot
): FitCheckInput {
  return {
    ...input,
    businessType: profile.businessProfile?.businessType ?? input.businessType,
    truckCount: profile.businessProfile?.truckCount ?? input.truckCount,
    trailerCount: profile.businessProfile?.trailerCount ?? input.trailerCount,
    equipmentType: profile.businessProfile?.equipmentType ?? input.equipmentType,
    combinationType:
      profile.businessProfile?.combinationType ?? input.combinationType,
    trailerLengthFeet:
      profile.businessProfile?.trailerLengthFeet ?? input.trailerLengthFeet,
    trailerWidthInches:
      profile.businessProfile?.trailerWidthInches ?? input.trailerWidthInches,
    trailerHeightInches:
      profile.businessProfile?.trailerHeightInches ?? input.trailerHeightInches,
    maxPayloadLbs: profile.businessProfile?.maxPayloadLbs ?? input.maxPayloadLbs,
    grossVehicleWeightRatingLbs:
      profile.businessProfile?.grossVehicleWeightRatingLbs ??
      input.grossVehicleWeightRatingLbs,
    axleCount: profile.businessProfile?.axleCount ?? input.axleCount,
    hazmatCapable:
      profile.businessProfile?.hazmatCapable ?? input.hazmatCapable,
    tankerCapable:
      profile.businessProfile?.tankerCapable ?? input.tankerCapable,
    refrigeratedCapable:
      profile.businessProfile?.refrigeratedCapable ??
      input.refrigeratedCapable,
    specializedCapabilities:
      profile.businessProfile?.specializedCapabilities ??
      input.specializedCapabilities,
    securementEquipment:
      profile.businessProfile?.securementEquipment ?? input.securementEquipment,
    routeRestrictionNotes:
      profile.businessProfile?.routeRestrictionNotes ??
      input.routeRestrictionNotes,
    authorityAge: profile.businessProfile?.authorityAge ?? input.authorityAge,
    operatingRegions:
      profile.businessProfile?.operatingRegions ?? input.operatingRegions,
    preferredLanes: profile.businessProfile?.preferredLanes ?? input.preferredLanes,
    avoidedLanes: profile.businessProfile?.avoidedLanes ?? input.avoidedLanes,
    endorsements: profile.businessProfile?.endorsements ?? input.endorsements,
    homeTimePriority:
      (profile.businessProfile?.homeTimePriority as FitCheckInput["homeTimePriority"]) ??
      input.homeTimePriority,
    daysWillingToRun:
      profile.businessProfile?.daysWillingToRun ?? input.daysWillingToRun,
    minimumOperatorIncome:
      profile.operatorGoals?.minimumOperatorIncome ?? input.minimumOperatorIncome,
    targetOperatorIncome:
      profile.operatorGoals?.targetOperatorIncome ?? input.targetOperatorIncome,
    idealOperatorIncome:
      profile.operatorGoals?.idealOperatorIncome ?? input.idealOperatorIncome,
    desiredBusinessCushion:
      profile.operatorGoals?.desiredBusinessCushion ?? input.desiredBusinessCushion,
    primaryBusinessPriority:
      profile.operatorGoals?.primaryBusinessPriority ?? input.primaryBusinessPriority,
    fuelCostPerMile:
      profile.operatingAssumptions?.fuelCostPerMile ?? input.fuelCostPerMile,
    insuranceMonthlyCost:
      profile.operatingAssumptions?.monthlyInsurance ?? input.insuranceMonthlyCost,
    truckPayment: profile.operatingAssumptions?.truckPayment ?? input.truckPayment,
    trailerPayment:
      profile.operatingAssumptions?.trailerPayment ?? input.trailerPayment,
    maintenanceReserve:
      profile.operatingAssumptions?.maintenanceReserve ?? input.maintenanceReserve,
    eldSoftware: profile.operatingAssumptions?.eldSoftware ?? input.eldSoftware,
    otherFixedOverhead:
      profile.operatingAssumptions?.otherRecurringOverhead ??
      input.otherFixedOverhead,
    loadBoardsUsed:
      profile.loadPreferences?.loadBoardsUsed ?? input.loadBoardsUsed,
    usesDispatcher:
      (profile.loadPreferences?.usesDispatcher as FitCheckInput["usesDispatcher"]) ??
      input.usesDispatcher,
    brokerRelationshipLevel:
      (profile.loadPreferences?.brokerRelationshipLevel as FitCheckInput["brokerRelationshipLevel"]) ??
      input.brokerRelationshipLevel,
    hasDirectCustomers:
      (profile.loadPreferences?.hasDirectCustomers as FitCheckInput["hasDirectCustomers"]) ??
      input.hasDirectCustomers,
    preferredDecisionFactor:
      profile.loadPreferences?.preferredDecisionFactor ?? input.preferredDecisionFactor,
    mainPainPoints: profile.loadPreferences?.mainPainPoints ?? input.mainPainPoints,
  };
}

export async function getLoadIqProfileSnapshot() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("operator_profiles")
    .select("profile_snapshot")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return readLoadIqSnapshot(data?.profile_snapshot);
}

export async function saveLoadIqProfileSnapshot(
  profile: LoadIqProfileSnapshot,
  input: FitCheckInput,
  result: FitCheckResult,
  recommendedTierId: string,
  saveSensitiveFinancials: boolean
): Promise<FitCheckProfileSaveResult> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("operator_profiles")
    .select("user_id, profile_snapshot")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const existingSnapshot = isRecord(existing?.profile_snapshot)
    ? existing?.profile_snapshot
    : {};
  const existingLoadIq = readLoadIqSnapshot(existingSnapshot);
  const savedFitCheckResults = saveSensitiveFinancials
    ? [
        ...(existingLoadIq.savedFitCheckResults ?? []).slice(-9),
        {
          createdAt: new Date().toISOString(),
          monthlyGrossRevenue: result.monthlyGrossRevenue,
          monthlyOverhead: result.monthlyOverhead,
          availableBeforeOperator: result.availableBeforeOperator,
          currentOperatorIncome: input.currentOperatorIncome,
          minimumOperatorIncome: input.minimumOperatorIncome,
          targetOperatorIncome: input.targetOperatorIncome,
          idealOperatorIncome: input.idealOperatorIncome,
          desiredBusinessCushion: input.desiredBusinessCushion,
          operatorIncomeGap: result.operatorIncomeGap,
          businessHealthGap: result.businessHealthGap,
          remainingBusinessCushion: result.remainingBusinessCushion,
          recommendedTierId,
          disclaimerAccepted: true,
        },
      ]
    : existingLoadIq.savedFitCheckResults ?? [];

  const nextSnapshot = {
    ...existingSnapshot,
    loadIQ: {
      ...existingLoadIq,
      ...profile,
      savedFitCheckResults,
    },
  };

  const writePromise = existing?.user_id
    ? supabase
        .from("operator_profiles")
        .update({ profile_snapshot: toJson(nextSnapshot) })
        .eq("user_id", user.id)
    : supabase.from("operator_profiles").insert({
        user_id: user.id,
        profile_snapshot: toJson(nextSnapshot),
      });

  const { error: updateError } = await writePromise;

  if (updateError) throw new Error(updateError.message);

  const saveResult: FitCheckProfileSaveResult = {
    snapshotSaved: true,
    settingsHydrationAttempted: false,
    warnings: [],
  };

  if (Object.keys(profile).length > 0) {
    saveResult.settingsHydrationAttempted = true;
    const hydrationResult = await hydrateSettingsFromFitCheck(
      supabase,
      user.id,
      input,
      result
    );
    saveResult.warnings.push(...hydrationResult.warnings);
  }

  return saveResult;
}
