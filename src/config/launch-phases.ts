import { LOADIQ_LAUNCH } from "@/config/loadiq";
import {
  getRolloutPhaseForClaimedCount,
  RolloutPhaseCode,
} from "@/config/rollout";

export type LaunchPhaseCode =
  | "pilot_pending"
  | "pilot_active"
  | "launch_pending"
  | "launch_active"
  | "complete"
  | RolloutPhaseCode;

export type LaunchPhaseSnapshot = {
  code: LaunchPhaseCode;
  title: string;
  badge: string;
  message: string;
  startsAt: string | null;
  endsAt: string | null;
  slotLimit: number | null;
  phaseLabel: string;
};

export const PILOT_START_AT = LOADIQ_LAUNCH.pilot.startsAt;
export const PILOT_DAYS = LOADIQ_LAUNCH.pilot.durationDays;
export const LAUNCH_DAYS = LOADIQ_LAUNCH.launchPromotion.durationDays;
export const PILOT_SLOT_LIMIT = LOADIQ_LAUNCH.pilot.slotLimit;
export const LAUNCH_SLOT_LIMIT = LOADIQ_LAUNCH.launchPromotion.slotLimit;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getLaunchTimeline() {
  const pilotStart = new Date(PILOT_START_AT);
  const pilotEnd = addDays(pilotStart, PILOT_DAYS);
  const launchStart = pilotEnd;
  const launchEnd = addDays(launchStart, LAUNCH_DAYS);

  return {
    pilotStart,
    pilotEnd,
    launchStart,
    launchEnd,
  };
}

export function getLaunchPhaseSnapshot(
  now = new Date(),
  claimedOperatorCount?: number
): LaunchPhaseSnapshot {
  if (typeof claimedOperatorCount === "number") {
    const rollout = getRolloutPhaseForClaimedCount(claimedOperatorCount);
    const { pilotStart, pilotEnd, launchEnd } = getLaunchTimeline();

    return {
      code: rollout.code,
      title: rollout.onboardingTitle,
      badge: rollout.badge,
      message: rollout.onboardingMessage,
      startsAt:
        rollout.code === "GENERAL_AVAILABILITY" ? null : pilotStart.toISOString(),
      endsAt:
        rollout.code === "FOUNDER_PILOT"
          ? pilotEnd.toISOString()
          : rollout.code === "GENERAL_AVAILABILITY"
            ? null
            : launchEnd.toISOString(),
      slotLimit: rollout.seatEnd,
      phaseLabel: rollout.label,
    };
  }

  const { pilotStart, pilotEnd, launchStart, launchEnd } = getLaunchTimeline();

  if (now < pilotStart) {
    return {
      code: "pilot_pending",
      title: "Pre-Launch Pilot Pending",
      badge: "Pilot Opens Soon",
      message: "Pre-Launch Pilot Access - First 50 Operators",
      startsAt: pilotStart.toISOString(),
      endsAt: pilotEnd.toISOString(),
      slotLimit: PILOT_SLOT_LIMIT,
      phaseLabel: "Pre-Launch Pilot",
    };
  }

  if (now < pilotEnd) {
    return {
      code: "pilot_active",
      title: "Pilot Active",
      badge: "Pilot Access",
      message: "Pre-Launch Pilot Access - First 50 Operators",
      startsAt: pilotStart.toISOString(),
      endsAt: pilotEnd.toISOString(),
      slotLimit: PILOT_SLOT_LIMIT,
      phaseLabel: "Pre-Launch Pilot",
    };
  }

  if (now < launchStart) {
    return {
      code: "launch_pending",
      title: "Launch Promotion Pending",
      badge: "Launch Pending",
      message: "Official Launch Promotion - First 500 Users",
      startsAt: launchStart.toISOString(),
      endsAt: launchEnd.toISOString(),
      slotLimit: LAUNCH_SLOT_LIMIT,
      phaseLabel: "Official Launch Promotion",
    };
  }

  if (now < launchEnd) {
    return {
      code: "launch_active",
      title: "Launch Promotion Active",
      badge: "Launch Promotion",
      message: "Official Launch Promotion - First 500 Users",
      startsAt: launchStart.toISOString(),
      endsAt: launchEnd.toISOString(),
      slotLimit: LAUNCH_SLOT_LIMIT,
      phaseLabel: "Official Launch Promotion",
    };
  }

  return {
    code: "complete",
    title: "Official Launch Complete",
    badge: "Standard Access",
    message: "Launch promotions have ended. Standard LoadIQ plans are active.",
    startsAt: null,
    endsAt: null,
    slotLimit: null,
    phaseLabel: "Standard Access",
  };
}
