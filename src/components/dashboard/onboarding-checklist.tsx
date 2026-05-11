"use client";

import Link from "next/link";
import { useState } from "react";

import { LearnMore } from "@/components/ui/learn-more";
import { ThemedSelect } from "@/components/ui/themed-select";
import { EDUCATION_TOPICS } from "@/config/education";
import {
  defaultOnboardingState,
  saveOnboardingState,
} from "@/services/onboarding";

const setupSteps = [
  "Accept legal disclaimer",
  "Choose operation type",
  "Set income and profitability targets",
  "Add recurring overhead and reserves",
  "Create a default pay template",
  "Review LoadIQ operating guardrails",
];

export function OnboardingChecklist() {
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
      setStatus("Onboarding complete. You can enter the dashboard.");
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
      </div>

      <aside className="space-y-4">
        <LearnMore {...EDUCATION_TOPICS.trueRpm} />
        <LearnMore {...EDUCATION_TOPICS.overhead} />
        <LearnMore {...EDUCATION_TOPICS.payStructures} />
        <LearnMore {...EDUCATION_TOPICS.targetMargins} />
      </aside>
    </section>
  );
}
