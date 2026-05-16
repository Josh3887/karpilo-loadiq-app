"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { LearnMore } from "@/components/ui/learn-more";
import { LegalAcceptancePanel } from "@/components/legal/legal-acceptance-panel";
import { ThemedSelect } from "@/components/ui/themed-select";
import { EDUCATION_TOPICS } from "@/config/education";
import { LOADIQ_EMAILS } from "@/config/loadiq";
import {
  defaultOnboardingState,
  saveOnboardingState,
} from "@/services/onboarding";
import { OperatorProgramStatus } from "@/types/operator-program";

const setupSteps = [
  "Accept legal disclaimer",
  "Choose operation type",
  "Set income and profitability targets",
  "Add recurring overhead and reserves",
  "Create a default pay template",
  "Review Karpilo LoadIQ operating guardrails",
];

export function OnboardingChecklist({
  operatorStatus,
}: {
  operatorStatus: OperatorProgramStatus;
}) {
  const router = useRouter();
  const [operatorType, setOperatorType] = useState("leased_owner_operator");
  const [status, setStatus] = useState("");

  async function completeOnboarding() {
    try {
      setStatus("Saving onboarding progress...");
      await saveOnboardingState({
        ...defaultOnboardingState,
        currentStep: "dashboard",
        completedSteps: [
          "disclaimer",
          "profile",
          "targets",
          "costs",
          "pay",
          "education",
        ],
        isComplete: true,
      });
      setStatus("Onboarding complete. Opening the dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save onboarding progress."
      );
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
        <div className="mb-5 rounded-xl border border-sky-400/25 bg-sky-400/10 p-4">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-sky-300">
            {operatorStatus.rolloutLabel}
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-100">
            {operatorStatus.rolloutMessage}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {operatorStatus.rolloutExpectation}
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {operatorStatus.pricingSummary}
          </p>
        </div>

        <ThemedSelect
          label="Current Operator Profile"
          value={operatorType}
          onChange={setOperatorType}
          options={[
            {
              label: "Leased Owner Operator",
              value: "leased_owner_operator",
              description:
                "You run under a carrier or lease arrangement and may have percentage deductions.",
            },
            {
              label: "Independent Owner Operator",
              value: "independent_owner_operator",
              description:
                "You operate with more direct business responsibility and overhead ownership.",
            },
            {
              label: "Company Driver",
              value: "company_driver",
              description: "Future-ready comparison mode.",
            },
            {
              label: "Fleet",
              value: "fleet",
              description: "Future-ready multi-truck mode.",
            },
          ]}
        />

        <div className="mt-6 space-y-3">
          {setupSteps.map((step) => (
            <div
              key={step}
              className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm text-slate-300"
            >
              {step}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
          >
            Open Settings
          </Link>
          <button
            type="button"
            onClick={completeOnboarding}
            className="rounded-xl bg-sky-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#060B14] shadow-[0_0_25px_rgba(56,189,248,0.25)] transition hover:bg-sky-300"
          >
            Finish Setup
          </button>
        </div>

        {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}

        <p className="mt-5 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">
          Support, billing, privacy, account deletion, and app issues route to{" "}
          <a
            href={`mailto:${LOADIQ_EMAILS.support}`}
            className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
          >
            {LOADIQ_EMAILS.support}
          </a>
          .
        </p>
      </div>

      <aside className="space-y-4">
        <LegalAcceptancePanel />
        <LearnMore {...EDUCATION_TOPICS.trueRpm} />
        <LearnMore {...EDUCATION_TOPICS.deadhead} />
        <LearnMore {...EDUCATION_TOPICS.profitPerHour} />
        <LearnMore {...EDUCATION_TOPICS.overhead} />
        <LearnMore {...EDUCATION_TOPICS.payStructures} />
        <LearnMore {...EDUCATION_TOPICS.targetMargins} />
      </aside>
    </section>
  );
}
