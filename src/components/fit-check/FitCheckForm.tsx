"use client";

import { useMemo, useState } from "react";

import {
  PLAN_KEYS,
  formatPlanKey,
  recommendPrimitiveFitCheckPlan,
  type PlanKey,
} from "@/lib/portal/access";
import type { FitCheckRow } from "@/lib/portal/server";
import { createClient } from "@/lib/supabase-client";

const authorityStatuses = [
  "new_authority",
  "active_authority",
  "leased_on",
  "company_driver",
  "planning",
] as const;

export function FitCheckForm({ latestFitCheck }: { latestFitCheck: FitCheckRow | null }) {
  const [operatorType, setOperatorType] = useState(
    latestFitCheck?.operator_type ?? "owner_operator"
  );
  const [authorityStatus, setAuthorityStatus] = useState(
    latestFitCheck?.authority_status ?? "active_authority"
  );
  const [truckCount, setTruckCount] = useState(
    String(latestFitCheck?.truck_count ?? 1)
  );
  const [averageMonthlyGross, setAverageMonthlyGross] = useState(
    String(latestFitCheck?.average_monthly_gross ?? 0)
  );
  const [biggestOperatingProblem, setBiggestOperatingProblem] = useState(
    latestFitCheck?.biggest_operating_problem ?? ""
  );
  const [primaryGoal, setPrimaryGoal] = useState(latestFitCheck?.primary_goal ?? "");
  const [savedPlan, setSavedPlan] = useState<PlanKey | null>(
    latestFitCheck?.recommended_plan ?? null
  );
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const recommendedPlan = useMemo(
    () =>
      recommendPrimitiveFitCheckPlan({
        operatorType,
        authorityStatus,
        truckCount: Number(truckCount),
        averageMonthlyGross: Number(averageMonthlyGross),
        biggestOperatingProblem,
        primaryGoal,
      }),
    [
      authorityStatus,
      averageMonthlyGross,
      biggestOperatingProblem,
      operatorType,
      primaryGoal,
      truckCount,
    ]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Sign in is required before saving Fit Check.");
        return;
      }

      const result = {
        recommendedPlan,
        explanation:
          "Primitive Fit Check recommendation based on operator type, authority status, truck count, average monthly gross, primary problem, and primary goal.",
      };

      const { error: fitCheckError } = await supabase.from("fit_checks").insert({
        user_id: user.id,
        operator_type: operatorType,
        authority_status: authorityStatus,
        truck_count: Number(truckCount) || 0,
        average_monthly_gross: Number(averageMonthlyGross) || 0,
        biggest_operating_problem: biggestOperatingProblem.trim() || null,
        primary_goal: primaryGoal.trim() || null,
        recommended_plan: recommendedPlan,
        result,
      });

      if (fitCheckError) throw new Error(fitCheckError.message);

      const now = new Date().toISOString();
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          operator_type: operatorType,
          plan_interest: recommendedPlan,
          updated_at: now,
        },
        { onConflict: "id" }
      );
      await supabase.from("portal_access").upsert(
        {
          user_id: user.id,
          status: "pending",
          launch_phase: "beta",
          plan_interest: recommendedPlan,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      setSavedPlan(recommendedPlan);
      setStatus("Fit Check saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save Fit Check."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-[#0B1220] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
        Primitive Fit Check
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        This is controlled-access qualification intake. It is not a guarantee of
        revenue, profit, approval, subscription availability, or business
        outcome.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Operator type" value={operatorType} onChange={setOperatorType} />
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Authority status
          </span>
          <select
            value={authorityStatus}
            onChange={(event) => setAuthorityStatus(event.target.value)}
            className="mt-2 h-12 w-full rounded-lg border border-slate-800 bg-[#060B14] px-3 text-slate-100 outline-none focus:border-sky-400"
          >
            {authorityStatuses.map((statusValue) => (
              <option key={statusValue} value={statusValue}>
                {statusValue.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <Field label="Truck count" value={truckCount} onChange={setTruckCount} type="number" />
        <Field
          label="Average monthly gross"
          value={averageMonthlyGross}
          onChange={setAverageMonthlyGross}
          type="number"
        />
        <Field
          label="Biggest operating problem"
          value={biggestOperatingProblem}
          onChange={setBiggestOperatingProblem}
        />
        <Field label="Primary goal" value={primaryGoal} onChange={setPrimaryGoal} />
      </div>

      <div className="mt-5 rounded-lg border border-sky-400/20 bg-sky-400/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
          Recommended plan
        </p>
        <p className="mt-2 text-2xl font-black text-white">
          {formatPlanKey(recommendedPlan)}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Available plan keys: {PLAN_KEYS.join(", ")}. Plans are entitlement
          keys, not separate apps or duplicated feature implementations.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-lg bg-sky-400 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#060B14] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Fit Check"}
      </button>

      {savedPlan ? (
        <p className="mt-4 text-sm font-bold text-slate-300">
          Last saved recommendation: {formatPlanKey(savedPlan)}
        </p>
      ) : null}
      {status ? <p className="mt-4 text-sm font-bold text-emerald-300">{status}</p> : null}
      {error ? <p className="mt-4 text-sm font-bold text-red-300">{error}</p> : null}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-lg border border-slate-800 bg-[#060B14] px-3 text-slate-100 outline-none focus:border-sky-400"
      />
    </label>
  );
}
