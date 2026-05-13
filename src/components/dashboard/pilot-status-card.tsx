"use client";

import { useState } from "react";

import { APP_FEATURE_FLAGS } from "@/config/app";
import { LaunchPhaseSnapshot } from "@/config/launch-phases";
import { LaunchStatusBanner } from "@/components/launch/launch-status-banner";
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

  if (hidden) return null;

  async function handleDismiss() {
    setHidden(true);
    await dismissPilotStatusCard().catch((error) => {
      console.error(error);
    });
  }

  return (
    <section className="mb-6">
      <LaunchStatusBanner
        initialSnapshot={initialSnapshot}
        pilotSlotsRemaining={pilotSlotsRemaining}
        launchSlotsRemaining={launchSlotsRemaining}
        claimedOperatorCount={claimedOperatorCount}
        showCountdown={APP_FEATURE_FLAGS.showAppCountdown}
      />
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
