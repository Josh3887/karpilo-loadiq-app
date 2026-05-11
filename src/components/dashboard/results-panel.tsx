"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { ScenarioComparisonPanel } from "@/components/dashboard/scenario-comparison-panel";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { LoadInput, LoadResult } from "@/types/load";
import { saveLoad } from "@/services/save-load";

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRpm,
} from "@/utils/format";

type ResultsPanelProps = {
  result: LoadResult | null;
  input: LoadInput | null;
  canSaveLoad?: boolean;
  canCompareScenarios?: boolean;
  onLoadSaved?: () => void;
};

export function ResultsPanel({
  result,
  input,
  canSaveLoad = true,
  canCompareScenarios = false,
  onLoadSaved,
}: ResultsPanelProps) {
  const [saveStatus, setSaveStatus] = useState("");

  async function handleSaveLoad() {
    if (!result || !input) return;

    if (!canSaveLoad) {
      setSaveStatus(
        "Free plan saved-load limit reached. Upgrade to Pro for unlimited history."
      );
      return;
    }

    try {
      setSaveStatus("Saving load...");

      await saveLoad({
        input,
        result,
      });

      setSaveStatus("Load saved.");
      onLoadSaved?.();
    } catch (error) {
      console.error(error);

      setSaveStatus(
        error instanceof Error
          ? error.message
          : JSON.stringify(error)
      );
    }
  }

  if (!result) {
    return (
      <DashboardCard title="Load Intelligence">
        <div className="flex min-h-100 items-center justify-center text-center text-slate-500">
          Run a profitability analysis to generate operational intelligence.
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Operational Intelligence">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Trip Viability
            </div>

            <div className="mt-1 text-2xl font-black capitalize text-slate-100">
              {result.profitabilityBand}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveLoad}
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
          >
            Save Load
          </button>
        </div>

        {saveStatus && (
          <p className="text-sm text-slate-400">{saveStatus}</p>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <KpiCard label="Gross Revenue" value={formatCurrency(result.grossRevenue)} tone="green" />
          <KpiCard label="Estimated Net" value={formatCurrency(result.estimatedNet)} tone={result.estimatedNet > 0 ? "blue" : "red"} />
          <KpiCard label="True RPM" value={formatRpm(result.trueRpm)} tone="silver" />
          <KpiCard label="Fuel Cost" value={formatCurrency(result.fuelCost)} tone="red" />
          <KpiCard label="Break-Even RPM" value={formatRpm(result.breakEvenRpm)} tone={input && input.ratePerMile < result.breakEvenRpm ? "red" : "silver"} />
          <KpiCard label="Daily Net" value={formatCurrency(result.dailyProfitability)} tone={result.dailyProfitability > 0 ? "green" : "red"} />
          <KpiCard label="Deadhead" value={formatPercent(result.deadheadPercent)} tone={result.deadheadPercent > 25 ? "red" : "silver"} />
          <KpiCard
            label="Profitability"
            value={`${result.profitabilityScore}/100`}
            tone={result.profitabilityScore >= 75 ? "green" : result.profitabilityScore >= 60 ? "blue" : "red"}
          />
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
          <div className="mb-4 text-sm uppercase tracking-[0.18em] text-slate-400">
            Operational Breakdown
          </div>

          <div className="space-y-3 text-sm">
            <BreakdownRow label="Total Miles" value={`${formatNumber(result.totalMiles)} mi`} />
            <BreakdownRow label="Operational Cost" value={formatCurrency(result.operationalCost)} />
            <BreakdownRow label="Cost Per Mile" value={formatRpm(result.costPerMile)} />
            <BreakdownRow label="Fuel % of Gross" value={formatPercent(result.fuelPercentOfGross)} />
            <BreakdownRow label="Profit Margin" value={formatPercent(result.profitMarginPercent)} />
            <BreakdownRow label="Retained Earnings" value={formatCurrency(result.retainedEarnings)} />
            <BreakdownRow label="Dispatch Cost" value={formatCurrency(result.dispatchCost)} />
            <BreakdownRow label="Factoring Cost" value={formatCurrency(result.factoringCost)} />
          </div>
        </div>

        {result.explanations.length > 0 && (
          <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-5">
            <div className="mb-4 text-sm uppercase tracking-[0.18em] text-sky-300">
              Profit Intelligence
            </div>

            <div className="space-y-3 text-sm leading-6 text-slate-300">
              {result.explanations.map((explanation) => (
                <p key={explanation}>{explanation}</p>
              ))}
            </div>
          </div>
        )}

        {input && (
          <ScenarioComparisonPanel
            input={input}
            canCompareScenarios={canCompareScenarios}
          />
        )}

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-6 text-slate-500">
          LoadIQ outputs are estimates based on the values entered here. They do
          not guarantee broker payment, carrier settlement, reimbursements,
          fuel pricing, repair exposure, tax treatment, detention approval, or
          final net income. Verify assumptions against rate confirmations,
          settlement statements, receipts, and your operating records.
        </div>

        {result.warnings.length > 0 && (
          <div className="space-y-3">
            {result.warnings.map((warning) => (
              <div
                key={warning.message}
                className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-400" />

                <div>
                  <div className="text-sm font-semibold text-red-300">
                    Operational Warning
                  </div>

                  <div className="mt-1 text-sm text-slate-300">
                    {warning.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

type BreakdownRowProps = {
  label: string;
  value: string;
};

function BreakdownRow({ label, value }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-200">{value}</span>
    </div>
  );
}
