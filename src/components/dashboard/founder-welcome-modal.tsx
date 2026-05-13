"use client";

import { useEffect, useRef, useState } from "react";

import { markFounderWelcomeCompleted } from "@/services/user-experience";
import { recordWelcomeMessageView } from "@/services/onboarding-telemetry";
import { OperatorProgramStatus } from "@/types/operator-program";

export function FounderWelcomeModal({
  status,
}: {
  status: OperatorProgramStatus;
}) {
  const [open, setOpen] = useState(status.shouldShowFounderWelcome);
  const recordedView = useRef(false);

  useEffect(() => {
    if (!open || recordedView.current) return;

    recordedView.current = true;
    void recordWelcomeMessageView({
      rolloutPhase: status.rolloutPhase,
      messageKey: "founder_welcome",
      payload: {
        rolloutLabel: status.rolloutLabel,
        badges: status.badges.map((badge) => badge.label),
      },
    }).catch((error) => {
      console.error(error);
    });
  }, [open, status.badges, status.rolloutLabel, status.rolloutPhase]);

  if (!open) return null;

  async function closeModal() {
    setOpen(false);
    await markFounderWelcomeCompleted().catch((error) => {
      console.error(error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#02050A]/80 px-4 py-5 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="mx-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-sky-400/25 bg-[#08111F] p-5 shadow-[0_0_50px_rgba(56,189,248,0.18)] sm:p-7">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.28em] text-sky-300">
          {status.rolloutLabel}
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-100">
          {status.rolloutMessage}
        </h2>

        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
          <p>
            LoadIQ is being built from the seat, not from a pitch deck. It is
            here to help operators see true RPM, deadhead pressure, overhead,
            fuel exposure, and profit before a load turns into a hard lesson.
          </p>
          <p>
            {status.rolloutExpectation}
          </p>
          <p>
            This is only the beginning: LoadIQ is the first layer of a broader
            Karpilo operational ecosystem, built around practical decisions,
            cleaner freight judgment, and tools that respect a driver&apos;s time.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
          {status.badges.length > 0
            ? `Current recognition: ${status.badges.map((badge) => badge.label).join(", ")}.`
            : status.pricingSummary}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={closeModal}
            className="rounded-xl bg-sky-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#060B14] shadow-[0_0_25px_rgba(56,189,248,0.25)] transition hover:bg-sky-300"
          >
            Enter LoadIQ
          </button>
        </div>
      </section>
    </div>
  );
}
