"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  BILLING_TEST_HARNESS_STATE_LABELS,
  BILLING_TEST_HARNESS_STATES,
  type BillingTestHarnessState,
  type InternalBillingTestHarnessSnapshot,
} from "@/domains/billing/internal-test-harness-types";

type InternalBillingTestHarnessPanelProps = {
  harness: InternalBillingTestHarnessSnapshot | null | undefined;
};

export function InternalBillingTestHarnessPanel({
  harness,
}: InternalBillingTestHarnessPanelProps) {
  const router = useRouter();
  const [updatedSnapshot, setUpdatedSnapshot] =
    useState<InternalBillingTestHarnessSnapshot | null>(null);
  const [selectedState, setSelectedState] = useState<BillingTestHarnessState>(
    harness?.simulatedState ?? "beta_testing_app_access"
  );
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  const snapshot = updatedSnapshot ?? harness ?? null;

  if (!snapshot) return null;

  async function updateHarness(enabled: boolean) {
    setPending(true);
    setStatus(enabled ? "Applying simulated billing state..." : "Disabling simulation...");

    const response = await fetch("/api/internal/billing-test-harness", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enabled,
        simulatedState: selectedState,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      harness?: InternalBillingTestHarnessSnapshot;
    };

    setPending(false);

    if (!response.ok || !data.harness) {
      setStatus(data.error ?? "Unable to update billing simulation.");
      return;
    }

    setUpdatedSnapshot(data.harness);
    setStatus(enabled ? "Billing simulation updated." : "Billing simulation disabled.");
    window.dispatchEvent(new CustomEvent("billing-test-harness-updated"));
    router.refresh();
  }

  return (
    <section className="mb-6 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-amber-50 shadow-[0_0_35px_rgba(251,191,36,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="break-words text-xs font-black uppercase leading-5 tracking-[0.18em] text-amber-200">
            Developer billing simulation active — internal testing only.
          </p>
          <h2 className="mt-2 break-words text-xl font-black text-slate-50">
            Internal Billing Test Harness
          </h2>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-amber-100/85">
            This harness reads and writes only the internal test-account table
            for {snapshot.email}. It does not overwrite Stripe data,
            subscriptions, or production entitlement records.
          </p>
          {snapshot.error && (
            <p className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-6 text-red-100">
              {snapshot.error}
            </p>
          )}
        </div>

        <span
          className={
            snapshot.enabled
              ? "rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-100"
              : "rounded-full border border-slate-600 bg-slate-950 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300"
          }
        >
          {snapshot.enabled ? "Simulation enabled" : "Simulation disabled"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <HarnessMetric label="State" value={labelState(snapshot.simulatedState)} />
        <HarnessMetric label="Entitlement" value={snapshot.entitlementStatus} />
        <HarnessMetric label="Tier / Program" value={`${snapshot.tier ?? "none"} / ${snapshot.program ?? "none"}`} />
        <HarnessMetric label="Trial" value={snapshot.trialStatus} />
        <HarnessMetric label="Billing starts" value={formatDate(snapshot.billingStartsAt)} />
        <HarnessMetric label="Lifetime lock" value={snapshot.lifetimePriceLock ? "Protected" : "Not active"} />
        <HarnessMetric label="Cohort" value={formatCohort(snapshot)} />
        <HarnessMetric label="Price rule" value={snapshot.priceSubjectToChange === false ? "Locked" : "Subject to change"} />
      </div>

      {snapshot.futureFeatureAccessScope && (
        <div className="mt-4 rounded-xl border border-amber-300/20 bg-[#060B14] p-4 text-sm leading-6 text-amber-50/90">
          {snapshot.futureFeatureAccessScope}
        </div>
      )}

      {snapshot.notes && (
        <div className="mt-4 rounded-xl border border-amber-300/20 bg-[#060B14] p-4 text-sm leading-6 text-amber-50/90">
          {snapshot.notes}
        </div>
      )}

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <label className="block text-sm font-bold text-amber-100">
          Simulated state
          <select
            value={selectedState}
            onChange={(event) =>
              setSelectedState(event.target.value as BillingTestHarnessState)
            }
            disabled={Boolean(snapshot.error) || pending}
            className="mt-2 w-full rounded-xl border border-amber-300/20 bg-[#060B14] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {BILLING_TEST_HARNESS_STATES.map((state) => (
              <option key={state} value={state}>
                {labelState(state)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => updateHarness(true)}
          disabled={Boolean(snapshot.error) || pending}
          className="rounded-xl border border-amber-300/35 bg-amber-400/15 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-amber-100 transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Apply State
        </button>

        <button
          type="button"
          onClick={() => updateHarness(false)}
          disabled={Boolean(snapshot.error) || pending}
          className="rounded-xl border border-slate-600 bg-slate-950 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200 transition hover:border-red-300/40 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Disable
        </button>
      </div>

      {status && (
        <p className="mt-4 break-words text-sm leading-6 text-amber-100/80">
          {status}
        </p>
      )}
    </section>
  );
}

function HarnessMetric({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-amber-300/15 bg-[#060B14] p-4">
      <div className="break-words text-xs uppercase leading-5 tracking-[0.16em] text-amber-100/55">
        {label}
      </div>
      <div className="mt-2 break-words text-sm font-black text-slate-50 [overflow-wrap:anywhere]">
        {value ?? "Not set"}
      </div>
    </div>
  );
}

function labelState(state: BillingTestHarnessState) {
  return BILLING_TEST_HARNESS_STATE_LABELS[state] ?? "Unknown simulation state";
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCohort(snapshot: InternalBillingTestHarnessSnapshot) {
  const phase = snapshot.cohortPhase?.replace(/_/g, " ") ?? "Standard";
  return snapshot.cohortCap ? `${phase} / ${snapshot.cohortCap}` : phase;
}
