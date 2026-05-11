"use client";

import { useState } from "react";

import { dismissPilotStatusCard } from "@/services/user-experience";
import { OperatorProgramStatus } from "@/types/operator-program";

export function PilotStatusCard({ status }: { status: OperatorProgramStatus }) {
  const [hidden, setHidden] = useState(status.statusCardDismissed);

  if (hidden) return null;

  async function handleDismiss() {
    setHidden(true);
    await dismissPilotStatusCard().catch((error) => {
      console.error(error);
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-sky-400/20 bg-[#08111F]/95 p-4 shadow-[0_0_24px_rgba(56,189,248,0.08)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-sky-300">
            Operator Status
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-100">
            {status.statusTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {status.statusMessage}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-3 text-sm font-bold text-sky-100">
            {status.slotLabel}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-left text-[0.68rem] font-black uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-300 md:text-right"
          >
            Minimize
          </button>
        </div>
      </div>
    </section>
  );
}
