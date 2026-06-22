import type { LoadIqCommercialTierId } from "@/config/pricing";

export type SubscriptionLaunchPhaseId =
  | "beta_testing"
  | "legacy_launch"
  | "founding_operator_phase_1"
  | "founding_operator_phase_2"
  | "open_market";

export type SubscriptionLaunchPhaseDefinition = {
  id: SubscriptionLaunchPhaseId;
  label: string;
  purpose: string;
  cap: number | null;
  durationDays: number | null;
  lifetimePricing: boolean;
  betaOnly: boolean;
  selectablePlans: LoadIqCommercialTierId[];
};

export type SubscriptionLaunchPhaseEvaluation = {
  phase: SubscriptionLaunchPhaseDefinition;
  userCount: number;
  daysElapsed: number;
  capReached: boolean;
  durationExpired: boolean;
  isOpenMarket: boolean;
  lifetimePricingEligible: boolean;
  eligiblePlans: LoadIqCommercialTierId[];
  transitionReason: "cap_reached" | "duration_expired" | "phase_active" | "open_market";
};

export const SUBSCRIPTION_LAUNCH_PHASES = [
  {
    id: "beta_testing",
    label: "Prelaunch Waitlist",
    purpose: "Interest-only access before checkout and subscription activation are enabled",
    cap: null,
    durationDays: null,
    lifetimePricing: false,
    betaOnly: true,
    selectablePlans: [],
  },
  {
    id: "legacy_launch",
    label: "Founding 50 Pilot",
    purpose: "Approved founding operator pilot access after server-authoritative slot validation",
    cap: 50,
    durationDays: 30,
    lifetimePricing: true,
    betaOnly: false,
    selectablePlans: ["gold"],
  },
  {
    id: "founding_operator_phase_1",
    label: "Launch 500 Access",
    purpose: "Legacy pricing access for the first 500 launch operators",
    cap: 500,
    durationDays: 60,
    lifetimePricing: true,
    betaOnly: false,
    selectablePlans: ["gold"],
  },
  {
    id: "founding_operator_phase_2",
    label: "Launch 500 Access",
    purpose: "Legacy pricing access for the first 500 launch operators",
    cap: 500,
    durationDays: 60,
    lifetimePricing: true,
    betaOnly: false,
    selectablePlans: ["gold"],
  },
  {
    id: "open_market",
    label: "Standard Public Access",
    purpose: "Standard public subscription access with no lifetime pricing lock",
    cap: null,
    durationDays: null,
    lifetimePricing: false,
    betaOnly: false,
    selectablePlans: ["gold"],
  },
] as const satisfies readonly SubscriptionLaunchPhaseDefinition[];

export function getSubscriptionLaunchPhase(
  id: SubscriptionLaunchPhaseId
): SubscriptionLaunchPhaseDefinition {
  return (
    SUBSCRIPTION_LAUNCH_PHASES.find((phase) => phase.id === id) ??
    SUBSCRIPTION_LAUNCH_PHASES[SUBSCRIPTION_LAUNCH_PHASES.length - 1]
  );
}

export function evaluateSubscriptionLaunchPhase({
  phaseId,
  userCount,
  daysElapsed,
}: {
  phaseId: SubscriptionLaunchPhaseId;
  userCount: number;
  daysElapsed: number;
}): SubscriptionLaunchPhaseEvaluation {
  const phase = getSubscriptionLaunchPhase(phaseId);
  const capReached = phase.cap !== null && userCount >= phase.cap;
  const durationExpired =
    phase.durationDays !== null && daysElapsed >= phase.durationDays;
  const isOpenMarket = phase.id === "open_market" || capReached || durationExpired;

  return {
    phase,
    userCount,
    daysElapsed,
    capReached,
    durationExpired,
    isOpenMarket,
    lifetimePricingEligible: !isOpenMarket && phase.lifetimePricing,
    eligiblePlans: phase.selectablePlans,
    transitionReason:
      phase.id === "open_market"
        ? "open_market"
        : capReached
          ? "cap_reached"
          : durationExpired
            ? "duration_expired"
            : "phase_active",
  };
}
