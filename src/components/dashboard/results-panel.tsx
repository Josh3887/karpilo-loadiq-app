"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { usePreviewMode } from "@/components/preview/preview-mode-provider";
import { ScenarioComparisonPanel } from "@/components/dashboard/scenario-comparison-panel";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { LoadInput, LoadResult } from "@/types/load";
import { saveLoad } from "@/services/save-load";
import { ThemedSelect } from "@/components/ui/themed-select";

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
  previewMode?: boolean;
};

export function ResultsPanel({
  result,
  input,
  canSaveLoad = false,
  canCompareScenarios = false,
  onLoadSaved,
  previewMode = false,
}: ResultsPanelProps) {
  const preview = usePreviewMode();
  const [saveStatus, setSaveStatus] = useState("");
  const [loadRunStatus, setLoadRunStatus] = useState<
    "ran" | "test" | "planned" | ""
  >("");

  async function handleSaveLoad() {
    if (previewMode || preview.enabled) {
      preview.explain("save-load");
      return;
    }

    if (!result || !input) return;

    if (!canSaveLoad) {
      setSaveStatus(
        "An active Karpilo LoadIQ subscription is required before saving load history."
      );
      return;
    }

    try {
      setSaveStatus("Saving load...");

      await saveLoad({
        input: {
          ...input,
          loadRunStatus: loadRunStatus || input.loadRunStatus || "planned",
        },
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
      <DashboardCard title="Load Intelligence" previewExplanation="analyze-load">
        <div className="flex min-h-100 items-center justify-center text-center text-slate-500">
          Run a profitability analysis to generate operational intelligence.
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Operational Intelligence" previewExplanation="save-load">
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

          <div className="grid gap-3 sm:min-w-72">
            <ThemedSelect
              label="Did you actually run this load?"
              value={loadRunStatus}
              previewExplanation="save-load"
              onChange={(value) =>
                setLoadRunStatus(value as "ran" | "test" | "planned")
              }
              options={[
                { label: "Not yet, planned load", value: "planned" },
                { label: "Yes, I ran this load", value: "ran" },
                { label: "No, test calculation", value: "test" },
              ]}
            />

            <button
              type="button"
              onClick={handleSaveLoad}
              disabled={!loadRunStatus}
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
            >
              Save Load
            </button>
          </div>
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
          <KpiCard label="Net / Total Mi" value={formatRpm(result.profitPerTotalMile)} tone={result.profitPerTotalMile > 0 ? "green" : "red"} />
          <KpiCard label="Net / Loaded Mi" value={formatRpm(result.profitPerLoadedMile)} tone={result.profitPerLoadedMile > 0 ? "green" : "red"} />
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
            <BreakdownRow label="Daily Fixed Overhead" value={formatCurrency(result.dailyFixedOverhead)} />
            <BreakdownRow label="Dispatch Days" value={formatNumber(result.dispatchDays)} />
            <BreakdownRow label="Overhead Applied" value={formatCurrency(result.loadOverheadApplied)} />
            <BreakdownRow label="Cost Per Mile" value={formatRpm(result.costPerMile)} />
            <BreakdownRow label="Profit Per Day" value={formatCurrency(result.profitPerDay)} />
            <BreakdownRow label="Profit Per Hour" value={formatCurrency(result.profitPerHour)} />
            <BreakdownRow label="Fuel % of Gross" value={formatPercent(result.fuelPercentOfGross)} />
            <BreakdownRow label="Profit Margin" value={formatPercent(result.profitMarginPercent)} />
            <BreakdownRow label="Retained Earnings" value={formatCurrency(result.retainedEarnings)} />
            <BreakdownRow label="Dispatch Cost" value={formatCurrency(result.dispatchCost)} />
            <BreakdownRow label="Factoring Cost" value={formatCurrency(result.factoringCost)} />
            <BreakdownRow
              label="Daily Target Gap"
              value={formatCurrency(result.incomeTargetComparison)}
            />
          </div>
        </div>

        <OperationalValueNotes result={result} />

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
          Karpilo LoadIQ outputs are estimates based on the values entered here.
          They do not guarantee broker payment, carrier settlement,
          reimbursements, fuel pricing, repair exposure, tax treatment,
          detention approval, or final net income. Verify assumptions against
          rate confirmations, settlement statements, receipts, and your
          operating records.
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

function OperationalValueNotes({ result }: { result: LoadResult }) {
  const notes = [
    {
      label: "Cost per mile",
      value: formatRpm(result.costPerMile),
      body:
        "Shows the estimated operating pressure each total mile carries, including deadhead and fixed overhead.",
    },
    {
      label: "Break-even RPM",
      value: formatRpm(result.breakEvenRpm),
      body:
        "Marks the estimated loaded-mile rate needed before the trip starts producing margin.",
    },
    {
      label: "Deadhead",
      value: formatPercent(result.deadheadPercent),
      body:
        "Keeps unpaid miles visible so route decisions are not judged by linehaul rate alone.",
    },
    {
      label: "Fuel share",
      value: formatPercent(result.fuelPercentOfGross),
      body:
        "Highlights fuel variance exposure when pump price, MPG, or routing assumptions move.",
    },
    {
      label: "Daily net",
      value: formatCurrency(result.dailyProfitability),
      body:
        "Connects margin to time so a load can be compared against the days it occupies the truck.",
    },
    {
      label: "Trip margin",
      value: formatPercent(result.profitMarginPercent),
      body:
        "Provides directional profitability visibility; it is not a guarantee of settlement or final net income.",
    },
  ];

  return (
    <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-5">
      <div className="mb-3 text-sm uppercase tracking-[0.18em] text-sky-300">
        Operational Value Context
      </div>
      <p className="mb-4 text-sm leading-6 text-slate-300">
        Karpilo LoadIQ helps expose operational blind spots that can quietly
        cost more than the subscription itself. These figures are awareness
        tools, not promised savings.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {notes.map((note) => (
          <div
            key={note.label}
            className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                {note.label}
              </span>
              <span className="text-sm font-black text-slate-100">
                {note.value}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {note.body}
            </p>
          </div>
        ))}
      </div>
    </div>
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
