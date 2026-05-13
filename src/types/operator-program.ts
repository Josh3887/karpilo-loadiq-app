import { RolloutPhaseCode } from "@/config/rollout";

export type OperatorProgramPhase =
  | "prelaunch"
  | "pilot_active"
  | "official_launch"
  | RolloutPhaseCode;

export type OperatorProgramCode = "standard" | "pilot50" | "launch500";

export type OperatorBadgeTone = "sky" | "red" | "emerald";

export type OperatorBadge = {
  label: string;
  tone: OperatorBadgeTone;
};

export type OperatorProgramStatus = {
  phase: OperatorProgramPhase;
  program: OperatorProgramCode;
  pilotUser: boolean;
  foundingOperator: boolean;
  launch500User: boolean;
  legacyPriceLocked: boolean;
  subscriptionGrandfathered: boolean;
  statusTitle: string;
  statusMessage: string;
  slotLabel: string;
  slotsRemaining: number | null;
  slotsTotal: number | null;
  statusCardDismissed: boolean;
  shouldShowFounderWelcome: boolean;
  badges: OperatorBadge[];
  rolloutPhase: RolloutPhaseCode;
  rolloutLabel: string;
  rolloutMessage: string;
  rolloutExpectation: string;
  pricingSummary: string;
};
