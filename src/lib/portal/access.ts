export type AccessStatus = "pending" | "approved" | "suspended" | "disabled";

export type LaunchPhase =
  | "beta"
  | "legacy_launch"
  | "founding_operator_phase_1"
  | "founding_operator_phase_2"
  | "open_market";

export type PlanKey = "silver" | "gold" | "platinum" | "pro";

export type PrimitivePortalFeatureKey =
  | "billing"
  | "settings"
  | "fitCheck"
  | "calculator"
  | "reports"
  | "maps"
  | "aiInsights"
  | "fleetTools";

export const primitivePortalAccess: Record<PrimitivePortalFeatureKey, boolean> = {
  billing: true,
  settings: true,
  fitCheck: true,
  calculator: false,
  reports: false,
  maps: false,
  aiInsights: false,
  fleetTools: false,
};

export const PLAN_KEYS = ["silver", "gold", "platinum", "pro"] as const;

export const LAUNCH_PHASES = [
  "beta",
  "legacy_launch",
  "founding_operator_phase_1",
  "founding_operator_phase_2",
  "open_market",
] as const;

export const ACCESS_STATUSES = [
  "pending",
  "approved",
  "suspended",
  "disabled",
] as const;

export function formatPlanKey(plan: PlanKey | null | undefined) {
  if (!plan) return "No plan selected";
  return plan
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatLaunchPhase(phase: LaunchPhase | null | undefined) {
  switch (phase) {
    case "beta":
      return "Beta";
    case "legacy_launch":
      return "Legacy Launch";
    case "founding_operator_phase_1":
      return "Founding Operator Phase 1";
    case "founding_operator_phase_2":
      return "Founding Operator Phase 2";
    case "open_market":
      return "Open Market";
    default:
      return "Beta";
  }
}

export function formatAccessStatus(status: AccessStatus | null | undefined) {
  switch (status) {
    case "approved":
      return "Approved";
    case "suspended":
      return "Suspended";
    case "disabled":
      return "Disabled";
    case "pending":
    default:
      return "Pending";
  }
}

export type PrimitiveFitCheckInput = {
  operatorType: string;
  authorityStatus: string;
  truckCount: number;
  averageMonthlyGross: number;
  biggestOperatingProblem: string;
  primaryGoal: string;
};

export function recommendPrimitiveFitCheckPlan(input: PrimitiveFitCheckInput): PlanKey {
  const truckCount = Number.isFinite(input.truckCount) ? input.truckCount : 0;
  const averageMonthlyGross = Number.isFinite(input.averageMonthlyGross)
    ? input.averageMonthlyGross
    : 0;
  const problemText = `${input.biggestOperatingProblem} ${input.primaryGoal}`.toLowerCase();

  if (
    truckCount > 1 ||
    averageMonthlyGross >= 45000 ||
    problemText.includes("growth") ||
    problemText.includes("scale") ||
    problemText.includes("fleet")
  ) {
    return "pro";
  }

  if (
    averageMonthlyGross >= 30000 ||
    problemText.includes("variance") ||
    problemText.includes("inconsistent") ||
    problemText.includes("overhead")
  ) {
    return "platinum";
  }

  if (
    averageMonthlyGross >= 15000 ||
    problemText.includes("lane") ||
    problemText.includes("repeat") ||
    problemText.includes("planning")
  ) {
    return "gold";
  }

  return "silver";
}
