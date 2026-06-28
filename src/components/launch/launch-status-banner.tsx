"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getLaunchPhaseSnapshot,
  LaunchPhaseSnapshot,
} from "@/config/launch-phases";

function formatRemaining(targetIso: string | null) {
  if (!targetIso) return "Standard access active";

  const remaining = new Date(targetIso).getTime() - Date.now();
  if (remaining <= 0) return "Transitioning";

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function LaunchStatusBanner({
  initialSnapshot,
  pilotSlotsRemaining,
  launchSlotsRemaining,
  claimedOperatorCount,
  compact = false,
  showCountdown = true,
}: {
  initialSnapshot: LaunchPhaseSnapshot;
  pilotSlotsRemaining?: number | null;
  launchSlotsRemaining?: number | null;
  claimedOperatorCount?: number;
  compact?: boolean;
  showCountdown?: boolean;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [remaining, setRemaining] = useState("Syncing launch clock");

  useEffect(() => {
    const updateClock = () => {
      const next = getLaunchPhaseSnapshot(new Date(), claimedOperatorCount);
      setSnapshot(next);
      setRemaining(formatRemaining(next.endsAt ?? next.startsAt));
    };

    updateClock();
    const timer = window.setInterval(() => {
      updateClock();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [claimedOperatorCount]);

  const slotText = useMemo(() => {
    if (snapshot.code === "FOUNDER_PILOT") {
      return typeof pilotSlotsRemaining === "number"
        ? `${pilotSlotsRemaining} / 50 founder pilot slots remaining`
        : "Founder pilot users 1-50";
    }

    if (snapshot.code === "CONTROLLED_PUBLIC_LAUNCH") {
      return typeof launchSlotsRemaining === "number"
        ? `${launchSlotsRemaining} launch pricing seats remaining`
        : "Controlled public launch users 51-300";
    }

    if (snapshot.code === "EXPANSION_ACCESS") {
      return typeof launchSlotsRemaining === "number"
        ? `${launchSlotsRemaining} launch pricing seats remaining`
        : "Expansion access users 301-550";
    }

    if (snapshot.code === "GENERAL_AVAILABILITY") {
      return "Standard plans active";
    }

    if (snapshot.code === "pilot_active" || snapshot.code === "pilot_pending") {
      return typeof pilotSlotsRemaining === "number"
        ? `${pilotSlotsRemaining} / 50 pilot slots remaining`
        : "50 pilot slots";
    }

    if (snapshot.code === "launch_active" || snapshot.code === "launch_pending") {
      return typeof launchSlotsRemaining === "number"
        ? `${launchSlotsRemaining} / 500 launch slots remaining`
        : "500 launch slots";
    }

    return "Standard plans active";
  }, [launchSlotsRemaining, pilotSlotsRemaining, snapshot.code]);

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-sky-400/20 bg-[#08111F]/95 p-4 shadow-[0_0_22px_rgba(56,189,248,0.08)]"
          : "rounded-2xl border border-sky-400/20 bg-[#08111F]/95 p-5 shadow-[0_0_28px_rgba(56,189,248,0.1)]"
      }
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-sky-300">
            {snapshot.badge}
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-100">
            {snapshot.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {snapshot.message}
          </p>
        </div>

        <div className="grid gap-2 text-sm md:min-w-64">
          <div className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-3 font-bold text-sky-100">
            {slotText}
          </div>
          {showCountdown ? (
            <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-bold text-red-100">
              {remaining}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-3 font-bold text-slate-200">
              Account access is managed by your current pilot or launch phase.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
