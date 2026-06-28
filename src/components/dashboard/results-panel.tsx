"use client";

import type { ReactNode } from "react";
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
  canUseWeatherProfitabilityRisk?: boolean;
  canSaveWeatherProfitabilitySnapshot?: boolean;
  aiDevEnabled?: boolean;
  entitlementTier?: string;
  previewMode?: boolean;
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
  const routeMileageVariance = input ? getRouteMileageVariance(input) : null;
  const routeFuelExposure =
    input && routeMileageVariance !== null
      ? getRouteFuelExposure(routeMileageVariance, input)
      : null;
  const netRpm =
    result && result.totalMiles > 0 ? result.estimatedNet / result.totalMiles : 0;
  const grossPaidRpm =
    result && input && input.loadedMiles > 0
      ? result.grossRevenue / input.loadedMiles
      : 0;
  const loadIqInsights =
    result && input
      ? buildLoadIqInsights(
          result,
          input,
          routeMileageVariance,
          routeFuelExposure
        )
      : [];

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
          <KpiCard label="Net RPM" value={formatRpm(netRpm)} tone={netRpm > 0 ? "green" : "red"} />
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

        {input && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
              <PanelTitle>Revenue Basis</PanelTitle>

              <div className="space-y-3 text-sm">
                <BreakdownRow
                  label="Input Mode"
                  value={input.revenueInputMode === "gross" ? "Load gross" : "RPM"}
                />
                <BreakdownRow
                  label="Linehaul"
                  value={formatCurrency(result.linehaulRevenue)}
                />
                <BreakdownRow
                  label="Fuel Surcharge"
                  value={formatCurrency(result.fuelSurchargeRevenue)}
                />
                <BreakdownRow
                  label="Gross Paid RPM"
                  value={formatRpm(grossPaidRpm)}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                {getFscTreatment(input)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
              <PanelTitle>Fuel Intelligence</PanelTitle>

              <div className="space-y-3 text-sm">
                <BreakdownRow
                  label="Fuel Source"
                  value={formatFuelSource(input)}
                />
                <BreakdownRow
                  label="Fuel Price"
                  value={`${formatCurrency(input.fuelPrice)}/gal`}
                />
                <BreakdownRow
                  label="MPG"
                  value={formatNumber(input.mpg)}
                />
                <BreakdownRow
                  label="Modeled Fuel"
                  value={formatCurrency(result.fuelCost)}
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Fuel pricing uses the EIA diesel baseline when available, unless
                the user overrides it with actual purchase price.
                {formatFuelTimestamp(input)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
              <PanelTitle>Mileage Intelligence</PanelTitle>

              <div className="space-y-3 text-sm">
                <BreakdownRow
                  label="Paid Loaded"
                  value={`${formatNumber(input.loadedMiles)} mi`}
                />
                <BreakdownRow
                  label="Estimated Route"
                  value={formatOptionalMiles(getEstimatedRouteMiles(input))}
                />
                <BreakdownRow
                  label="Variance"
                  value={
                    routeMileageVariance === null
                      ? "Unavailable"
                      : formatSignedMiles(routeMileageVariance)
                  }
                />
                <BreakdownRow
                  label="Fuel Exposure"
                  value={
                    routeFuelExposure === null
                      ? "Unavailable"
                      : formatCurrency(routeFuelExposure)
                  }
                />
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                Google route miles remain separate from paid loaded miles unless
                copied by explicit user action.
              </p>
            </div>
          </div>
        )}

        {loadIqInsights.length > 0 && (
          <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-5">
            <div className="mb-4 text-sm uppercase tracking-[0.18em] text-sky-300">
              LoadIQ Intelligence
            </div>

            <div className="space-y-3 text-sm leading-6 text-slate-300">
              {loadIqInsights.map((insight) => (
                <p key={insight}>{insight}</p>
              ))}
            </div>
          </div>
        )}

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

function PanelTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 text-sm uppercase tracking-[0.18em] text-slate-400">
      {children}
    </div>
  );
}

function BreakdownRow({ label, value }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function getEstimatedRouteMiles(input: LoadInput) {
  if (
    input.routeEstimate?.estimatedMiles !== null &&
    input.routeEstimate?.estimatedMiles !== undefined
  ) {
    return input.routeEstimate.estimatedMiles;
  }

  if (input.routeLoadedMiles > 0) {
    return input.routeLoadedMiles;
  }

  return null;
}

function getRouteMileageVariance(input: LoadInput) {
  const estimatedRouteMiles = getEstimatedRouteMiles(input);

  if (estimatedRouteMiles === null || input.loadedMiles <= 0) {
    return null;
  }

  return Number((estimatedRouteMiles - input.loadedMiles).toFixed(1));
}

function getRouteFuelExposure(varianceMiles: number, input: LoadInput) {
  if (input.mpg <= 0 || !Number.isFinite(varianceMiles)) {
    return null;
  }

  return (varianceMiles / input.mpg) * input.fuelPrice;
}

function formatOptionalMiles(value: number | null) {
  if (value === null) return "Unavailable";

  return `${formatNumber(value)} mi`;
}

function formatSignedMiles(value: number) {
  if (value === 0) return "0 mi";

  const prefix = value > 0 ? "+" : "";

  return `${prefix}${formatNumber(value)} mi`;
}

function formatFuelSource(input: LoadInput) {
  if (input.fuelPriceSource === "EIA") {
    return input.fuelPriceSourceLabel || "EIA diesel baseline";
  }

  if (input.fuelPriceSource === "USER_OVERRIDE") {
    return "User override";
  }

  return "Manual";
}

function formatFuelTimestamp(input: LoadInput) {
  if (!input.fuelPriceFetchedAt) {
    return "";
  }

  const timestamp = new Date(input.fuelPriceFetchedAt);

  if (Number.isNaN(timestamp.getTime())) {
    return "";
  }

  return ` Baseline fetched ${timestamp.toLocaleDateString()}.`;
}

function getFscTreatment(input: LoadInput) {
  if (input.revenueInputMode !== "gross") {
    return "RPM mode derives linehaul from paid loaded miles multiplied by booked RPM.";
  }

  if (input.fuelSurchargeIncludedInGross) {
    return "FSC is included in the entered load gross, so linehaul is derived by subtracting FSC before the engine calculates gross revenue.";
  }

  return "Entered load gross is treated as linehaul revenue, with FSC modeled separately.";
}

function buildLoadIqInsights(
  result: LoadResult,
  input: LoadInput,
  routeMileageVariance: number | null,
  routeFuelExposure: number | null
) {
  const insights = [
    `${getFscTreatment(input)} Linehaul is ${formatCurrency(result.linehaulRevenue)} and FSC is ${formatCurrency(result.fuelSurchargeRevenue)}.`,
    `Fuel is modeled at ${formatCurrency(input.fuelPrice)}/gal from ${formatFuelSource(input)} across ${formatNumber(input.mpg)} MPG.`,
  ];

  if (routeMileageVariance !== null) {
    insights.push(
      `Estimated route miles are ${formatSignedMiles(routeMileageVariance)} versus paid loaded miles, with ${routeFuelExposure === null ? "unavailable" : formatCurrency(routeFuelExposure)} in modeled fuel exposure.`
    );
  } else {
    insights.push(
      "Route variance is unavailable until a provider estimate or route loaded mileage is present."
    );
  }

  if (result.estimatedNet > 0) {
    insights.push(
      `The load clears estimated trip cost by ${formatCurrency(result.estimatedNet)} with a ${formatPercent(result.profitMarginPercent)} margin.`
    );
  } else {
    insights.push(
      `The load is below modeled trip cost by ${formatCurrency(Math.abs(result.estimatedNet))}; review rate, FSC, mileage, and fuel assumptions before accepting.`
    );
  }

  return insights;
}
