import "server-only";

import { FOUNDER_ACCESS, PILOT_ACCESS } from "@/config/pricing";
import {
  getRolloutPhaseByCode,
  getRolloutPhaseForClaimedCount,
  ROLLOUT_PHASES,
  RolloutPhaseCode,
} from "@/config/rollout";
import { createClient } from "@/lib/supabase-server";
import {
  OperatorBadge,
  OperatorProgramCode,
  OperatorProgramPhase,
  OperatorProgramStatus,
} from "@/types/operator-program";

type ProgramRow = {
  pilot_user?: boolean | null;
  founding_operator?: boolean | null;
  launch500_user?: boolean | null;
  legacy_price_locked?: boolean | null;
  subscription_grandfathered?: boolean | null;
  program?: string | null;
  phase?: string | null;
};

type ExperienceRow = {
  founder_welcome_completed_at?: string | null;
  pilot_status_card_dismissed_at?: string | null;
};

type CountRow = {
  program?: string | null;
  claimed_count?: number | null;
};

type RolloutAssignmentRow = {
  rollout_phase?: string | null;
  cohort?: string | null;
  seat_number?: number | null;
};

function asProgram(value: unknown): OperatorProgramCode {
  if (value === "pilot50" || value === "launch500") return value;
  return "standard";
}

function asPhase(value: unknown): OperatorProgramPhase {
  if (ROLLOUT_PHASES.some((phase) => phase.code === value)) {
    return value as RolloutPhaseCode;
  }
  if (value === "pilot_active" || value === "official_launch") return value;
  return "prelaunch";
}

function countRemaining(total: number, claimed: number) {
  return Math.max(total - claimed, 0);
}

function buildBadges(row: ProgramRow): OperatorBadge[] {
  const badges: OperatorBadge[] = [];

  if (row.founding_operator || row.pilot_user) {
    badges.push({ label: "Founding Operator", tone: "sky" });
  }

  if (row.legacy_price_locked || row.launch500_user) {
    badges.push({ label: "Legacy Pricing", tone: "red" });
  }

  if (row.subscription_grandfathered || row.pilot_user) {
    badges.push({ label: "Lifetime Lock", tone: "emerald" });
  }

  return badges;
}

function buildStatus(params: {
  row: ProgramRow;
  assignment: RolloutAssignmentRow;
  experience: ExperienceRow;
  pilotClaimed: number;
  launchClaimed: number;
}): OperatorProgramStatus {
  const program = asProgram(params.row.program);
  const phase = asPhase(params.row.phase);
  const badges = buildBadges(params.row);
  const rolloutPhase = resolveRolloutPhase({
    row: params.row,
    assignment: params.assignment,
    phase,
    program,
    pilotClaimed: params.pilotClaimed,
    launchClaimed: params.launchClaimed,
  });
  const rollout = getRolloutPhaseByCode(rolloutPhase);
  const rolloutFields = {
    rolloutPhase,
    rolloutLabel: rollout.label,
    rolloutMessage: rollout.onboardingMessage,
    rolloutExpectation: rollout.operatorExpectation,
    pricingSummary: rollout.pricingSummary,
  };

  if (phase === "pilot_active" || phase === "FOUNDER_PILOT") {
    const remaining = countRemaining(PILOT_ACCESS.maxSeats, params.pilotClaimed);
    return {
      phase,
      program,
      pilotUser: Boolean(params.row.pilot_user),
      foundingOperator: Boolean(params.row.founding_operator),
      launch500User: Boolean(params.row.launch500_user),
      legacyPriceLocked: Boolean(params.row.legacy_price_locked),
      subscriptionGrandfathered: Boolean(params.row.subscription_grandfathered),
      statusTitle: "Pilot Operations Active",
      statusMessage:
        "Founding operator access is being assigned to approved early users. Operational workflows stay primary.",
      slotLabel: `${remaining} / ${PILOT_ACCESS.maxSeats} Founding Operator slots remaining`,
      slotsRemaining: remaining,
      slotsTotal: PILOT_ACCESS.maxSeats,
      statusCardDismissed: Boolean(params.experience.pilot_status_card_dismissed_at),
      shouldShowFounderWelcome:
        Boolean(params.row.founding_operator || params.row.pilot_user) &&
        !params.experience.founder_welcome_completed_at,
      badges,
      ...rolloutFields,
    };
  }

  if (
    phase === "official_launch" ||
    phase === "CONTROLLED_PUBLIC_LAUNCH" ||
    phase === "EXPANSION_ACCESS"
  ) {
    const remaining = countRemaining(FOUNDER_ACCESS.maxSeats, params.launchClaimed);
    return {
      phase,
      program,
      pilotUser: Boolean(params.row.pilot_user),
      foundingOperator: Boolean(params.row.founding_operator),
      launch500User: Boolean(params.row.launch500_user),
      legacyPriceLocked: Boolean(params.row.legacy_price_locked),
      subscriptionGrandfathered: Boolean(params.row.subscription_grandfathered),
      statusTitle: "Official Launch Active",
      statusMessage:
        "Legacy launch pricing is available only while assigned slots remain.",
      slotLabel: `${remaining} / ${FOUNDER_ACCESS.maxSeats} Legacy Pricing slots remaining`,
      slotsRemaining: remaining,
      slotsTotal: FOUNDER_ACCESS.maxSeats,
      statusCardDismissed: Boolean(params.experience.pilot_status_card_dismissed_at),
      shouldShowFounderWelcome:
        Boolean(params.row.founding_operator || params.row.launch500_user) &&
        !params.experience.founder_welcome_completed_at,
      badges,
      ...rolloutFields,
    };
  }

  return {
    phase,
    program,
    pilotUser: Boolean(params.row.pilot_user),
    foundingOperator: Boolean(params.row.founding_operator),
    launch500User: Boolean(params.row.launch500_user),
    legacyPriceLocked: Boolean(params.row.legacy_price_locked),
    subscriptionGrandfathered: Boolean(params.row.subscription_grandfathered),
    statusTitle: "Founding Operator Pilot Opening Soon",
    statusMessage:
      "LoadIQ is in pre-launch readiness. The app stays focused on freight analysis while early operator access is prepared.",
    slotLabel: "Pilot slot availability will appear here once assigned.",
    slotsRemaining: null,
    slotsTotal: null,
    statusCardDismissed: Boolean(params.experience.pilot_status_card_dismissed_at),
    shouldShowFounderWelcome:
      Boolean(params.row.founding_operator || params.row.pilot_user || params.row.launch500_user) &&
      !params.experience.founder_welcome_completed_at,
    badges,
    ...rolloutFields,
  };
}

function resolveRolloutPhase(params: {
  row: ProgramRow;
  assignment: RolloutAssignmentRow;
  phase: OperatorProgramPhase;
  program: OperatorProgramCode;
  pilotClaimed: number;
  launchClaimed: number;
}): RolloutPhaseCode {
  if (
    ROLLOUT_PHASES.some(
      (phase) => phase.code === params.assignment.rollout_phase
    )
  ) {
    return params.assignment.rollout_phase as RolloutPhaseCode;
  }

  if (ROLLOUT_PHASES.some((phase) => phase.code === params.phase)) {
    return params.phase as RolloutPhaseCode;
  }

  if (
    params.program === "pilot50" ||
    params.row.pilot_user ||
    params.row.founding_operator ||
    params.phase === "pilot_active"
  ) {
    return "FOUNDER_PILOT";
  }

  if (
    params.program === "launch500" ||
    params.row.launch500_user ||
    params.row.legacy_price_locked ||
    params.phase === "official_launch"
  ) {
    return params.launchClaimed >= 300
      ? "EXPANSION_ACCESS"
      : "CONTROLLED_PUBLIC_LAUNCH";
  }

  return getRolloutPhaseForClaimedCount(
    params.pilotClaimed + params.launchClaimed
  ).code;
}

export async function getOperatorProgramStatus(
  userId: string
): Promise<OperatorProgramStatus> {
  const supabase = await createClient();

  const [
    { data: programRow },
    { data: rolloutAssignment },
    { data: experienceRow },
    counts,
  ] = await Promise.all([
    supabase
      .from("operator_program_status")
      .select(
        "pilot_user, founding_operator, launch500_user, legacy_price_locked, subscription_grandfathered, program, phase"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("rollout_phase_assignments")
      .select("rollout_phase, cohort, seat_number")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("user_experience_state")
      .select("founder_welcome_completed_at, pilot_status_card_dismissed_at")
      .eq("user_id", userId)
      .maybeSingle(),
    getOperatorProgramCounts(),
  ]);

  return buildStatus({
    row: (programRow ?? {}) as ProgramRow,
    assignment: (rolloutAssignment ?? {}) as RolloutAssignmentRow,
    experience: (experienceRow ?? {}) as ExperienceRow,
    pilotClaimed: counts.pilotClaimed,
    launchClaimed: counts.launchClaimed,
  });
}

export async function getOperatorProgramCounts() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_operator_program_counts");

  const counts = ((data ?? []) as CountRow[]).reduce(
    (acc, row) => ({
      ...acc,
      [row.program ?? ""]: row.claimed_count ?? 0,
    }),
    {} as Record<string, number>
  );

  return {
    pilotClaimed: counts.pilot50 ?? 0,
    launchClaimed: counts.launch500 ?? 0,
  };
}

export async function userCanCheckoutProgram(params: {
  userId: string;
  program: OperatorProgramCode;
}) {
  if (params.program === "standard") return true;

  const status = await getOperatorProgramStatus(params.userId);

  if (params.program === "pilot50") {
    return status.pilotUser || status.foundingOperator;
  }

  return status.launch500User || status.legacyPriceLocked;
}
