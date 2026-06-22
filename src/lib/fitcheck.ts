import {
  LOADIQ_COMMERCIAL_TIER_LIST,
  STANDARD_PUBLIC_ACCESS,
} from "@/config/pricing";
import { TRANSPORT_EQUIPMENT_OPTIONS } from "@/lib/equipment-profile";

export const FITCHECK_NON_GUARANTEE_DISCLAIMER =
  "LoadIQ does not guarantee revenue, profit, income, freight availability, rate improvement, or business success. Estimates and recommendations are based on user-provided information, operational assumptions, and scenario-based analysis. Actual results may vary due to market conditions, fuel prices, broker behavior, equipment issues, weather, regulations, user decisions, and other factors outside of LoadIQ's control.";

export const FITCHECK_SHORT_DISCLAIMER =
  "LoadIQ does not guarantee revenue, profit, income, freight availability, rate improvement, or business success. Estimates are based on user-provided information and scenario-based analysis. Actual results may vary.";

export const BUSINESS_TYPE_OPTIONS = [
  { value: "owner_operator", label: "Owner-operator" },
  { value: "small_fleet", label: "Small fleet" },
  { value: "dispatcher", label: "Dispatcher" },
  { value: "other", label: "Other" },
] as const;

export const EQUIPMENT_TYPE_OPTIONS = TRANSPORT_EQUIPMENT_OPTIONS;

export const BIGGEST_PROBLEM_OPTIONS = [
  "Too much deadhead",
  "Rates are too low",
  "Fuel costs",
  "Inconsistent loads",
  "Broker problems",
  "Detention/wait time",
  "Poor lane planning",
  "Not sure what loads are actually profitable",
  "Other",
] as const;

export const ENDORSEMENT_OPTIONS = [
  "Hazmat",
  "Tanker",
  "TWIC",
  "Doubles/Triples",
  "None",
] as const;

export const PRIMARY_BUSINESS_PRIORITY_OPTIONS = [
  "Maximum income",
  "Consistent income",
  "Home time",
  "Lower stress",
  "Growth/scaling",
  "Debt payoff",
  "Business stability",
] as const;

export const DECISION_FACTOR_OPTIONS = [
  "Highest rate",
  "Fastest reload",
  "Lowest deadhead",
  "Home time",
  "Broker quality",
  "Fuel efficiency",
  "Consistent lane",
  "Least stress",
] as const;

export const TOOLTIP_DEFINITIONS = {
  operatorIncome:
    "What the business pays you personally for operating the business after business expenses are covered.",
  businessOverhead:
    "Business costs such as fuel, insurance, equipment, maintenance, dispatch, factoring, tolls, software, and other recurring operating expenses.",
  businessCushion:
    "Money left inside the business after expenses and operator income for repairs, reserves, taxes, emergencies, or growth.",
  profit: "Money left after the business covers overhead and pays the operator.",
  deadhead: "Miles driven without paid freight on the truck.",
  allMileRate:
    "Revenue divided by all miles driven, including loaded and deadhead miles.",
  loadedMileRate: "Revenue divided only by loaded miles.",
} as const;

export type FitCheckInput = {
  businessType: string;
  truckCount: number;
  trailerCount: number;
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
  authorityAge: string;
  operatingRegions: string;
  preferredLanes: string;
  avoidedLanes: string;
  endorsements: string[];
  homeTimePriority: "Low" | "Medium" | "High" | "";
  daysWillingToRun: number;
  last12MonthsGrossRevenue: number;
  averageMonthlyGrossRevenue: number;
  yearlyGrossRevenue: number[];
  bestMonthGross: number;
  worstMonthGross: number;
  totalMiles: number;
  loadedMiles: number;
  deadheadMiles: number;
  ratePerLoadedMile: number;
  averageLengthOfHaul: number;
  loadsPerMonth: number;
  fuelMonthlyCost: number;
  fuelCostPerMile: number;
  insuranceMonthlyCost: number;
  truckPayment: number;
  trailerPayment: number;
  maintenanceReserve: number;
  factoringPercent: number;
  factoringMonthlyCost: number;
  dispatchFeePercent: number;
  dispatchMonthlyCost: number;
  tollsPermits: number;
  eldSoftware: number;
  payrollDriverPay: number;
  otherFixedOverhead: number;
  monthlyBusinessOverhead: number;
  currentOperatorIncome: number;
  minimumOperatorIncome: number;
  targetOperatorIncome: number;
  idealOperatorIncome: number;
  desiredBusinessCushion: number;
  primaryBusinessPriority: string;
  currentLoadSources: string;
  loadBoardsUsed: string;
  usesDispatcher: "yes" | "no" | "unknown";
  brokerRelationshipLevel: "None" | "Some" | "Strong" | "";
  hasDirectCustomers: "yes" | "no" | "unknown";
  timeSearchingLoadsPerDay: number;
  negotiationFrequency: string;
  preferredDecisionFactor: string;
  biggestCurrentProblem: string;
  mainPainPoints: string[];
};

export type FitCheckResult = {
  monthlyGrossRevenue: number;
  monthlyOverhead: number;
  availableBeforeOperator: number;
  operatorIncomeGap: number;
  totalTargetNeed: number;
  businessHealthGap: number;
  deadheadPercent: number | null;
  loadedMileRate: number | null;
  allMileRate: number | null;
  remainingBusinessCushion: number;
  targetRemainingCushion: number;
  pressurePoints: string[];
  warnings: string[];
  fitPreviewStatus: "Likely fit" | "Possible fit" | "Needs more data" | "Not enough information yet";
  dataQuality: "complete" | "partial" | "insufficient";
};

export type FitCheckTierRecommendation = {
  recommendedTierId: "silver" | "gold" | "platinum" | "pro";
  recommendedTierName: string;
  decisionSupportDepth: string;
  whyRecommended: string[];
  whyLowerMayNotBeEnough: string;
  whyHigherMayNotBeNecessary: string;
  breakEvenContext: string;
  disclaimer: string;
};

export const defaultFitCheckInput: FitCheckInput = {
  businessType: "owner_operator",
  truckCount: 1,
  trailerCount: 1,
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
  authorityAge: "",
  operatingRegions: "",
  preferredLanes: "",
  avoidedLanes: "",
  endorsements: ["None"],
  homeTimePriority: "Medium",
  daysWillingToRun: 22,
  last12MonthsGrossRevenue: 0,
  averageMonthlyGrossRevenue: 0,
  yearlyGrossRevenue: [0, 0, 0, 0, 0],
  bestMonthGross: 0,
  worstMonthGross: 0,
  totalMiles: 0,
  loadedMiles: 0,
  deadheadMiles: 0,
  ratePerLoadedMile: 0,
  averageLengthOfHaul: 0,
  loadsPerMonth: 0,
  fuelMonthlyCost: 0,
  fuelCostPerMile: 0,
  insuranceMonthlyCost: 0,
  truckPayment: 0,
  trailerPayment: 0,
  maintenanceReserve: 0,
  factoringPercent: 0,
  factoringMonthlyCost: 0,
  dispatchFeePercent: 0,
  dispatchMonthlyCost: 0,
  tollsPermits: 0,
  eldSoftware: 0,
  payrollDriverPay: 0,
  otherFixedOverhead: 0,
  monthlyBusinessOverhead: 0,
  currentOperatorIncome: 0,
  minimumOperatorIncome: 0,
  targetOperatorIncome: 0,
  idealOperatorIncome: 0,
  desiredBusinessCushion: 0,
  primaryBusinessPriority: "Business stability",
  currentLoadSources: "",
  loadBoardsUsed: "",
  usesDispatcher: "unknown",
  brokerRelationshipLevel: "",
  hasDirectCustomers: "unknown",
  timeSearchingLoadsPerDay: 0,
  negotiationFrequency: "",
  preferredDecisionFactor: "",
  biggestCurrentProblem: "",
  mainPainPoints: [],
};

function safeNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function percentAmount(monthlyGrossRevenue: number, percent: number) {
  return percent > 0 ? monthlyGrossRevenue * (percent / 100) : 0;
}

export function calculateMonthlyOverhead(input: FitCheckInput) {
  const monthlyGrossRevenue = safeNumber(input.averageMonthlyGrossRevenue);
  const directOverhead = safeNumber(input.monthlyBusinessOverhead);

  if (directOverhead > 0) return directOverhead;

  const fuelFromMiles =
    input.fuelCostPerMile > 0 && input.totalMiles > 0
      ? input.fuelCostPerMile * input.totalMiles
      : 0;

  return [
    input.fuelMonthlyCost || fuelFromMiles,
    input.insuranceMonthlyCost,
    input.truckPayment,
    input.trailerPayment,
    input.maintenanceReserve,
    input.factoringMonthlyCost ||
      percentAmount(monthlyGrossRevenue, input.factoringPercent),
    input.dispatchMonthlyCost ||
      percentAmount(monthlyGrossRevenue, input.dispatchFeePercent),
    input.tollsPermits,
    input.eldSoftware,
    input.payrollDriverPay,
    input.otherFixedOverhead,
  ].reduce((total, item) => total + safeNumber(item), 0);
}

export function calculateFitCheck(input: FitCheckInput): FitCheckResult {
  const monthlyGrossRevenue = safeNumber(input.averageMonthlyGrossRevenue);
  const monthlyOverhead = calculateMonthlyOverhead(input);
  const availableBeforeOperator = monthlyGrossRevenue - monthlyOverhead;
  const operatorIncomeGap =
    safeNumber(input.targetOperatorIncome) - safeNumber(input.currentOperatorIncome);
  const totalTargetNeed =
    safeNumber(input.targetOperatorIncome) + safeNumber(input.desiredBusinessCushion);
  const businessHealthGap = totalTargetNeed - availableBeforeOperator;
  const deadheadPercent =
    input.totalMiles > 0 ? safeNumber(input.deadheadMiles) / input.totalMiles : null;
  const loadedMileRate =
    input.loadedMiles > 0 ? monthlyGrossRevenue / input.loadedMiles : null;
  const allMileRate =
    input.totalMiles > 0 ? monthlyGrossRevenue / input.totalMiles : null;
  const remainingBusinessCushion =
    availableBeforeOperator - safeNumber(input.currentOperatorIncome);
  const targetRemainingCushion =
    availableBeforeOperator - safeNumber(input.targetOperatorIncome);
  const warnings: string[] = [];
  const pressurePoints: string[] = [];

  if (input.businessType !== "dispatcher" && input.businessType !== "other" && input.truckCount < 1) {
    warnings.push("Truck count should be at least 1 for carrier operations.");
  }
  if (input.deadheadMiles > input.totalMiles && input.totalMiles > 0) {
    warnings.push("Deadhead miles cannot exceed total miles.");
  }
  if (input.loadedMiles + input.deadheadMiles > input.totalMiles && input.totalMiles > 0) {
    warnings.push("Loaded miles plus deadhead miles should not exceed total miles.");
  }
  if (input.monthlyBusinessOverhead > monthlyGrossRevenue && monthlyGrossRevenue > 0) {
    warnings.push("Monthly overhead is greater than monthly gross revenue.");
  }
  if (safeNumber(input.currentOperatorIncome) > availableBeforeOperator) {
    warnings.push("Current operator income exceeds estimated available surplus.");
  }
  if (totalTargetNeed > availableBeforeOperator && monthlyGrossRevenue > 0) {
    warnings.push("Target operator income plus desired business cushion exceeds estimated available before operator income.");
  }
  if (input.factoringPercent < 0 || input.factoringPercent > 100) {
    warnings.push("Factoring percentage must be between 0 and 100.");
  }
  if (input.dispatchFeePercent < 0 || input.dispatchFeePercent > 100) {
    warnings.push("Dispatch fee percentage must be between 0 and 100.");
  }
  if ([input.totalMiles, input.loadedMiles, input.deadheadMiles].some((value) => value < 0)) {
    warnings.push("Miles cannot be negative.");
  }

  if (deadheadPercent !== null && deadheadPercent >= 0.18) {
    pressurePoints.push("High deadhead");
  }
  if (allMileRate !== null && allMileRate > 0 && allMileRate < 2) {
    pressurePoints.push("Low all-mile rate");
  }
  if (monthlyGrossRevenue > 0 && monthlyOverhead / monthlyGrossRevenue >= 0.72) {
    pressurePoints.push("Overhead too high");
  }
  if (businessHealthGap > 0) {
    pressurePoints.push("Operator income target exceeds available surplus");
  }
  if (remainingBusinessCushion < safeNumber(input.desiredBusinessCushion)) {
    pressurePoints.push("Business cushion too low");
  }
  if (input.currentLoadSources && !input.currentLoadSources.includes(",")) {
    pressurePoints.push("Too much dependency on one source of freight");
  }
  if (!monthlyGrossRevenue || !monthlyOverhead || !input.targetOperatorIncome) {
    pressurePoints.push("Incomplete data");
  }
  if (input.bestMonthGross > 0 && input.worstMonthGross > 0 && input.bestMonthGross >= input.worstMonthGross * 1.6) {
    pressurePoints.push("Rate inconsistency");
  }
  if (input.preferredLanes || input.avoidedLanes || input.operatingRegions) {
    const laneText = `${input.preferredLanes} ${input.avoidedLanes} ${input.operatingRegions}`;
    if (laneText.split(",").filter(Boolean).length >= 3) {
      pressurePoints.push("Lane complexity");
    }
  }
  if (input.homeTimePriority === "High") {
    pressurePoints.push("Home-time constraint pressure");
  }

  const dataQuality =
    monthlyGrossRevenue > 0 &&
    monthlyOverhead > 0 &&
    input.currentOperatorIncome > 0 &&
    input.targetOperatorIncome > 0
      ? "complete"
      : monthlyGrossRevenue > 0 && (monthlyOverhead > 0 || input.targetOperatorIncome > 0)
        ? "partial"
        : "insufficient";

  const fitPreviewStatus =
    dataQuality === "insufficient"
      ? "Not enough information yet"
      : pressurePoints.includes("Incomplete data")
        ? "Needs more data"
        : businessHealthGap > 0 ||
            operatorIncomeGap > 0 ||
            input.biggestCurrentProblem === "Not sure what loads are actually profitable"
          ? "Likely fit"
          : "Possible fit";

  return {
    monthlyGrossRevenue,
    monthlyOverhead,
    availableBeforeOperator,
    operatorIncomeGap,
    totalTargetNeed,
    businessHealthGap,
    deadheadPercent,
    loadedMileRate,
    allMileRate,
    remainingBusinessCushion,
    targetRemainingCushion,
    pressurePoints: Array.from(new Set(pressurePoints)),
    warnings,
    fitPreviewStatus,
    dataQuality,
  };
}

function includesAny(value: string, needles: string[]) {
  const normalized = value.toLowerCase();
  return needles.some((needle) => normalized.includes(needle));
}

export function recommendFitCheckTier(
  input: FitCheckInput,
  result: FitCheckResult
): FitCheckTierRecommendation {
  const pressureCount = result.pressurePoints.filter(
    (point) => point !== "Incomplete data"
  ).length;
  const laneComplexity =
    result.pressurePoints.includes("Lane complexity") ||
    includesAny(input.preferredLanes, [",", "multi", "regional"]) ||
    includesAny(input.avoidedLanes, [",", "avoid", "market"]);
  const sourcingComplexity =
    input.usesDispatcher === "yes" ||
    input.hasDirectCustomers === "yes" ||
    input.brokerRelationshipLevel === "Some" ||
    input.brokerRelationshipLevel === "Strong" ||
    input.loadBoardsUsed.split(",").filter(Boolean).length > 1;
  const repeatWorkflow =
    input.loadsPerMonth >= 8 ||
    input.biggestCurrentProblem === "Inconsistent loads" ||
    input.biggestCurrentProblem === "Poor lane planning" ||
    input.biggestCurrentProblem === "Not sure what loads are actually profitable";
  const varianceWorkflow =
    pressureCount >= 3 ||
    result.businessHealthGap > 0 ||
    result.pressurePoints.includes("Rate inconsistency") ||
    result.pressurePoints.includes("Overhead too high");
  const scaleWorkflow =
    input.primaryBusinessPriority === "Growth/scaling" &&
    (input.businessType === "small_fleet" ||
      input.truckCount > 1 ||
      input.trailerCount > 1 ||
      input.loadsPerMonth >= 24 ||
      result.monthlyGrossRevenue >= 45000);

  let recommendedTierId: FitCheckTierRecommendation["recommendedTierId"] = "silver";
  const whyRecommended: string[] = [];

  if (scaleWorkflow) {
    recommendedTierId = "pro";
    whyRecommended.push(
      "Your inputs point to scale planning, repeatable operating assumptions, or multi-unit workflow pressure."
    );
  } else if (varianceWorkflow && (laneComplexity || sourcingComplexity || repeatWorkflow)) {
    recommendedTierId = "platinum";
    whyRecommended.push(
      "Your operation appears to need variance intelligence across estimates, overhead, rates, and operating patterns."
    );
  } else if (repeatWorkflow || laneComplexity || sourcingComplexity) {
    recommendedTierId = "gold";
    whyRecommended.push(
      "Your workflow appears to need operational visibility for repeat, avoid, or adjust decisions."
    );
  } else {
    whyRecommended.push(
      "Your current inputs are most aligned with load-level viability checks before choosing freight."
    );
  }

  if (result.operatorIncomeGap > 0) {
    whyRecommended.push(
      "There is an estimated operator income gap, but the tier is not raised only because the target income is higher."
    );
  }

  const tier =
    LOADIQ_COMMERCIAL_TIER_LIST.find((candidate) => candidate.id === recommendedTierId) ??
    LOADIQ_COMMERCIAL_TIER_LIST[0];
  const lowerReason =
    recommendedTierId === "silver"
      ? "A lower tier is not available in the current Karpilo LoadIQ commercial architecture."
      : recommendedTierId === "gold"
        ? "Silver may not be enough if the user is comparing repeat freight patterns, lanes, sources, or load-selection behavior."
        : recommendedTierId === "platinum"
          ? "Gold may not be enough if the user needs to understand why estimates and actual profitability patterns are drifting."
          : "Platinum may not be enough if the user is modeling scale thresholds, reserve goals, capital planning, and repeatable per-truck assumptions.";
  const higherReason =
    recommendedTierId === "pro"
      ? "A higher public decision-support tier is not defined in the current Karpilo LoadIQ commercial architecture."
      : recommendedTierId === "platinum"
        ? "Pro may not be necessary unless the user is actively modeling growth, reserves, hiring, expansion, or repeatable per-truck scale assumptions."
        : recommendedTierId === "gold"
          ? "Platinum may not be necessary until variance patterns, estimate misses, or deeper profitability drift become central to the workflow."
          : "Gold may not be necessary if the immediate need is only to decide whether individual loads are worth hauling.";
  const standardPublicMonthlyPrice = formatCurrencyWithCents(
    STANDARD_PUBLIC_ACCESS.monthlyPrice
  );

  return {
    recommendedTierId,
    recommendedTierName: tier.name,
    decisionSupportDepth: tier.decisionSupportDepth,
    whyRecommended,
    whyLowerMayNotBeEnough: lowerReason,
    whyHigherMayNotBeNecessary: higherReason,
    breakEvenContext: `At the current ${standardPublicMonthlyPrice} Standard Public monthly price, the subscription would need to help the user identify roughly ${standardPublicMonthlyPrice} in potential avoided leakage, better decisions, or time value each month to break even. This is context only, not a guarantee.`,
    disclaimer:
      "This recommendation does not guarantee revenue, profit, income, freight availability, rate improvement, or business success.",
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatCurrencyWithCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Unknown";
  return `${Math.round(value * 100)}%`;
}
