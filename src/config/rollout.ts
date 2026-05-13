export type RolloutPhaseCode =
  | "FOUNDER_PILOT"
  | "CONTROLLED_PUBLIC_LAUNCH"
  | "EXPANSION_ACCESS"
  | "GENERAL_AVAILABILITY";

export type RolloutCohortCode = "pilot50" | "launch500" | "standard";

export type RolloutPhaseDefinition = {
  code: RolloutPhaseCode;
  cohort: RolloutCohortCode;
  label: string;
  badge: string;
  seatStart: number;
  seatEnd: number | null;
  pricingSummary: string;
  onboardingTitle: string;
  onboardingMessage: string;
  operatorExpectation: string;
};

export const ROLLOUT_PHASES = [
  {
    code: "FOUNDER_PILOT",
    cohort: "pilot50",
    label: "Founder Pilot",
    badge: "Users 1-50",
    seatStart: 1,
    seatEnd: 50,
    pricingSummary: "$14.99/mo or $129.99/yr while active and in good standing.",
    onboardingTitle: "Founder Pilot operating window",
    onboardingMessage:
      "You are in the first controlled LoadIQ operating layer. Expect a focused product, founder-led review, and practical iteration around real freight workflows.",
    operatorExpectation:
      "Use LoadIQ while safely parked, verify numbers independently, and send sharp operational feedback when the app exposes unclear freight pressure.",
  },
  {
    code: "CONTROLLED_PUBLIC_LAUNCH",
    cohort: "launch500",
    label: "Controlled Public Launch",
    badge: "Users 51-300",
    seatStart: 51,
    seatEnd: 300,
    pricingSummary: "$19.99/mo or $149.99/yr while active and in good standing.",
    onboardingTitle: "Controlled launch access",
    onboardingMessage:
      "LoadIQ is expanding with measured access so calculator performance, saved-load workflows, and support routing stay stable under real operator use.",
    operatorExpectation:
      "Complete your operating profile before relying on true RPM, and report confusing setup moments through support or feedback.",
  },
  {
    code: "EXPANSION_ACCESS",
    cohort: "launch500",
    label: "Expansion Access",
    badge: "Users 301-550",
    seatStart: 301,
    seatEnd: 550,
    pricingSummary: "$19.99/mo or $149.99/yr while active and in good standing.",
    onboardingTitle: "Expansion access",
    onboardingMessage:
      "LoadIQ is opening to a broader operator group while preserving private profiles, saved-load isolation, and launch-pricing discipline.",
    operatorExpectation:
      "Keep profile assumptions current as fuel, overhead, dispatch fees, insurance, and maintenance reserves change.",
  },
  {
    code: "GENERAL_AVAILABILITY",
    cohort: "standard",
    label: "General Availability",
    badge: "Users 551+",
    seatStart: 551,
    seatEnd: null,
    pricingSummary: "$24.99/mo or $189.99/yr standard access.",
    onboardingTitle: "General availability",
    onboardingMessage:
      "LoadIQ is operating as a standard paid freight profitability platform with secure profiles, saved-load history, and production support routing.",
    operatorExpectation:
      "Use the platform as an operating aid, not a substitute for dispatcher, carrier, broker, tax, compliance, or safety judgment.",
  },
] as const satisfies readonly RolloutPhaseDefinition[];

export const ROLLOUT_CONFIG = {
  version: "2026.05.rollout-control",
  defaultPhase: "GENERAL_AVAILABILITY",
  supportFooter:
    "Support, billing, privacy, deletion, and app issues route through support@karpiloloadiq.com.",
  telemetrySources: {
    appGate: "app_access_gate",
    onboarding: "onboarding",
    founderWelcome: "founder_welcome",
    safetyReminder: "monthly_safety_reminder",
  },
} as const;

export function getRolloutPhaseByCode(code: RolloutPhaseCode) {
  return (
    ROLLOUT_PHASES.find((phase) => phase.code === code) ??
    ROLLOUT_PHASES[ROLLOUT_PHASES.length - 1]
  );
}

export function getRolloutPhaseForSeat(seatNumber: number | null | undefined) {
  if (!seatNumber || seatNumber < 1) {
    return getRolloutPhaseByCode(ROLLOUT_CONFIG.defaultPhase);
  }

  return (
    ROLLOUT_PHASES.find((phase) => {
      const upperBound = phase.seatEnd ?? Number.POSITIVE_INFINITY;
      return seatNumber >= phase.seatStart && seatNumber <= upperBound;
    }) ?? getRolloutPhaseByCode(ROLLOUT_CONFIG.defaultPhase)
  );
}

export function getRolloutPhaseForClaimedCount(claimedCount: number) {
  return getRolloutPhaseForSeat(claimedCount + 1);
}
