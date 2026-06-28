"use client";

import { useState } from "react";

import { LaunchPhaseSnapshot } from "@/config/launch-phases";
import { dismissPilotStatusCard } from "@/services/user-experience";
import { OperatorProgramStatus } from "@/types/operator-program";

export function PilotStatusCard({
  status,
  initialSnapshot,
  pilotSlotsRemaining,
  launchSlotsRemaining,
  claimedOperatorCount,
}: {
  status: OperatorProgramStatus;
  initialSnapshot: LaunchPhaseSnapshot;
  pilotSlotsRemaining?: number | null;
  launchSlotsRemaining?: number | null;
  claimedOperatorCount?: number;
}) {
  const [hidden, setHidden] = useState(status.statusCardDismissed);

  const hasOperationalProgram =
    status.pilotUser ||
    status.foundingOperator ||
    status.launch500User ||
    status.legacyPriceLocked ||
    status.subscriptionGrandfathered ||
    status.badges.length > 0;

  if (!hasOperationalProgram) return null;
  if (hidden) return null;

  async function handleDismiss() {
    setHidden(true);
    await dismissPilotStatusCard().catch((error) => {
      console.error(error);
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
            Operator Access
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-100">
            {status.statusTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {status.statusMessage}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {status.badges.map((badge) => (
              <span
                key={badge.label}
                className="rounded-full border border-sky-400/25 bg-[#060B14] px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-sky-200"
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-3 text-xs leading-5 text-slate-400">
          <div className="font-black uppercase tracking-[0.16em] text-slate-200">
            {status.pricingSummary}
          </div>
          <div className="mt-2">
            {status.slotLabel || initialSnapshot.phaseLabel}
          </div>
          {typeof claimedOperatorCount === "number" && (
            <div className="mt-1">
              {claimedOperatorCount} operator access records claimed.
            </div>
          )}
          {typeof pilotSlotsRemaining === "number" &&
            typeof launchSlotsRemaining === "number" && (
              <div className="mt-1">
                Pilot {pilotSlotsRemaining} · Launch {launchSlotsRemaining}
              </div>
            )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="mt-3 text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300"
      >
        Minimize status
      </button>
    </section>
  );
}
