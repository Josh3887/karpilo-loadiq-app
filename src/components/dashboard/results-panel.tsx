"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { AtlasFreightIntelligenceSurface } from "@/components/ai/atlas-freight-intelligence-surface";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ScenarioComparisonPanel } from "@/components/dashboard/scenario-comparison-panel";
import { WeatherProfitabilityRiskPanel } from "@/components/dashboard/weather-profitability-risk-panel";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { getAtlasEquipmentPackLabel } from "@/lib/equipment-profile";
import { LoadInput, LoadResult } from "@/types/load";
import { saveLoad } from "@/services/save-load";
import {
  hoursToPlanningDays,
  milesToBenchmarkHours,
  minutesToHumanDuration,
  minutesToQuarterHours,
} from "@/services/trip-dates";
import type { LoadIqAiLoadAnalysisInput } from "@/types/ai-load-analysis";
import type { WeatherProfitabilityResult } from "@/types/weather-profitability";

import {
  formatCurrency,
  formatFuelPrice,
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
  canUseWeatherProfitabilityRisk = false,
  canSaveWeatherProfitabilitySnapshot = false,
  aiDevEnabled = false,
  entitlementTier = "no_access",
  previewMode = false,
  onLoadSaved,
}: ResultsPanelProps) {
  const [saveStatus, setSaveStatus] = useState("");
  const [weatherProfitabilitySnapshotState, setWeatherProfitabilitySnapshotState] =
    useState<{
      key: string;
      snapshot: WeatherProfitabilityResult | null;
    }>({
      key: "",
      snapshot: null,
    });
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
  const atlasPayload =
    result && input ? buildAtlasLoadAnalysisPayload(result, input) : null;
  const weatherSnapshotKey =
    result && input ? buildWeatherSnapshotKey(result, input) : "";
  const shouldRenderWeatherRisk =
    Boolean(input) && canUseWeatherProfitabilityRisk && !previewMode;
  const recommendedAction = getRecommendedAction(
    result,
    input,
    routeMileageVariance
  );
  const decisionReasons = result
    ? buildDecisionReasons(
        result,
        input,
        routeMileageVariance,
        routeFuelExposure
      )
    : [];
  const missingInputs = input
    ? buildMissingInputs(input)
    : ["calculator input context"];
  const profitConfidence = result
    ? getProfitConfidence(result, input, routeMileageVariance)
    : "Unavailable until a load is analyzed.";
  const handleWeatherSnapshotChange = useCallback(
    (snapshot: WeatherProfitabilityResult | null) => {
      setWeatherProfitabilitySnapshotState({
        key: weatherSnapshotKey,
        snapshot,
      });
    },
    [weatherSnapshotKey]
  );

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

      const savedLoad = await saveLoad({
        input,
        result,
        weatherProfitabilitySnapshot: canSaveWeatherProfitabilitySnapshot
          ? getCurrentWeatherSnapshot(
              weatherProfitabilitySnapshotState,
              weatherSnapshotKey
            )
          : null,
      });

      setSaveStatus(
        savedLoad.warning ? `Load saved. ${savedLoad.warning}` : "Load saved."
      );
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
      <DashboardCard title="Karpilo LoadIQ Decision Basis">
        <div className="flex min-h-100 items-center justify-center text-center text-slate-500">
          Run a profitability analysis to generate deterministic Karpilo LoadIQ
          planning notes.
        </div>
      </DashboardCard>
    );
  }

  return (
    <>
      <DashboardCard title="Karpilo Atlas Intelligence Readout">
        <div className="space-y-6">
          <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-sky-300">
                  Decision Summary
                </div>

                <div className="mt-2 text-3xl font-black text-slate-100">
                  {formatBand(result.profitabilityBand)}
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                  {recommendedAction.summary}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <div
                  className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-[0.16em] ${recommendedAction.className}`}
                >
                  {recommendedAction.label}
                </div>

                <button
                  type="button"
                  onClick={handleSaveLoad}
                  className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
                >
                  Save Load
                </button>
              </div>
            </div>

            {saveStatus && (
              <p className="mt-4 text-sm text-slate-400">{saveStatus}</p>
            )}

            {decisionReasons.length > 0 && (
              <div className="mt-5 grid gap-3 text-sm leading-6 text-slate-300 lg:grid-cols-3">
                {decisionReasons.map((reason) => (
                  <div
                    key={reason}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    {reason}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <PanelTitle>Karpilo LoadIQ Decision Basis</PanelTitle>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <KpiCard
                label="Gross Revenue"
                value={formatCurrency(result.grossRevenue)}
                tone="green"
              />
              <KpiCard
                label="Estimated Net"
                value={formatCurrency(result.estimatedNet)}
                tone={result.estimatedNet > 0 ? "blue" : "red"}
              />
              <KpiCard
                label="True RPM"
                value={formatRpm(result.trueRpm)}
                tone="silver"
              />
              <KpiCard
                label="Net RPM"
                value={formatRpm(netRpm)}
                tone={netRpm > 0 ? "green" : "red"}
              />
              <KpiCard
                label="Fuel Cost"
                value={formatCurrency(result.fuelCost)}
                tone="red"
              />
              <KpiCard
                label="Break-Even RPM"
                value={formatRpm(result.breakEvenRpm)}
                tone={
                  input && input.ratePerMile < result.breakEvenRpm
                    ? "red"
                    : "silver"
                }
              />
              <KpiCard
                label="Daily Net"
                value={formatCurrency(result.dailyProfitability)}
                tone={result.dailyProfitability > 0 ? "green" : "red"}
              />
              <KpiCard
                label="Deadhead"
                value={formatPercent(result.deadheadPercent)}
                tone={result.deadheadPercent > 25 ? "red" : "silver"}
              />
              <KpiCard
                label="Profitability"
                value={`${result.profitabilityScore}/100`}
                tone={
                  result.profitabilityScore >= 75
                    ? "green"
                    : result.profitabilityScore >= 60
                      ? "blue"
                      : "red"
                }
              />
            </div>
          </div>

          {input && (
            <div className="grid gap-4 xl:grid-cols-2">
              <ReadoutSection title="Revenue Basis">
                <div className="space-y-3 text-sm">
                  <BreakdownRow
                    label="Input Mode"
                    value={
                      input.revenueInputMode === "gross" ? "Load gross" : "RPM"
                    }
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
              </ReadoutSection>

              <ReadoutSection title="Mileage & Route Exposure">
                <div className="space-y-3 text-sm">
                  <BreakdownRow
                    label="Paid Loaded"
                    value={`${formatNumber(input.loadedMiles)} mi`}
                  />
                  <BreakdownRow
                    label="Google Estimated Loaded"
                    value={formatOptionalMiles(getEstimatedRouteMiles(input))}
                  />
                  <BreakdownRow
                    label="Google Estimated Deadhead"
                    value={formatOptionalMiles(
                      getEstimatedDeadheadRouteMiles(input)
                    )}
                  />
                  <BreakdownRow
                    label="Total Google Estimate"
                    value={formatOptionalMiles(getEstimatedTotalRouteMiles(input))}
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
                  Paid loaded miles remain user-entered. Google estimated miles
                  stay separate as planning estimates and are not truck-legal
                  routing.
                </p>
              </ReadoutSection>

              <ReadoutSection title="Fuel & Cost Exposure">
                <div className="space-y-3 text-sm">
                  <BreakdownRow
                    label="Fuel Source"
                    value={formatFuelSource(input)}
                  />
                  <BreakdownRow
                    label="Fuel Price"
                    value={formatFuelPrice(input.fuelPrice)}
                  />
                  <BreakdownRow label="MPG" value={formatNumber(input.mpg)} />
                  <BreakdownRow
                    label="Modeled Fuel"
                    value={formatCurrency(result.fuelCost)}
                  />
                  <BreakdownRow
                    label="Operational Cost"
                    value={formatCurrency(result.operationalCost)}
                  />
                  <BreakdownRow
                    label="Cost Per Mile"
                    value={formatRpm(result.costPerMile)}
                  />
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Fuel pricing uses the EIA diesel baseline when available,
                  unless the user overrides it with actual purchase price.
                  {formatFuelTimestamp(input)}
                </p>
              </ReadoutSection>

              <ReadoutSection title="Time & Schedule Pressure">
                <div className="space-y-3 text-sm">
                  <BreakdownRow
                    label="Google Drive Time"
                    value={formatOptionalDuration(
                      getEstimatedRouteDurationMinutes(input)
                    )}
                  />
                  <BreakdownRow
                    label="Google Planning Hours"
                    value={formatOptionalHours(getGoogleRouteQuarterHours(input))}
                  />
                  <BreakdownRow
                    label="Loaded Planning"
                    value={`${formatOptionalHours(
                      input.loadedPlanningHours
                    )} / ${formatNumber(input.dispatchDays)} day`}
                  />
                  <BreakdownRow
                    label="Deadhead Planning"
                    value={`${formatOptionalHours(
                      input.deadheadPlanningHours
                    )} / ${formatNumber(input.deadheadDays)} day`}
                  />
                  <BreakdownRow
                    label="50 MPH Benchmark"
                    value={`${formatOptionalHours(
                      getBenchmarkRouteHours(input)
                    )} / ${formatNumber(getBenchmarkRouteDays(input))} day`}
                  />
                  <BreakdownRow
                    label="Stop Count"
                    value={`${formatNumber(result.routeStopCount)} stop`}
                  />
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  User-edited planning hours and days remain the planning
                  authority. Google duration and 50 mph benchmark values are
                  suggestions.
                </p>
              </ReadoutSection>

              <ReadoutSection title="Freight Fit">
                <div className="space-y-3 text-sm">
                  <BreakdownRow
                    label="Cargo Weight"
                    value={formatLoadWeight(result.estimatedLoadWeightLbs)}
                  />
                  <BreakdownRow
                    label="Equipment Pack"
                    value={getAtlasEquipmentPackLabel(
                      input.atlasEquipmentPack,
                      input.equipmentType || "Equipment context not set"
                    )}
                  />
                  <BreakdownRow
                    label="Equipment"
                    value={formatOptionalText(input.equipmentType)}
                  />
                  <BreakdownRow
                    label="Capabilities"
                    value={formatCapabilitySummary(input)}
                  />
                  <BreakdownRow
                    label="Restrictions"
                    value={formatOptionalText(input.routeRestrictionNotes)}
                  />
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Cargo weight is planning context only and is not legal,
                  permit, bridge, or scale authority.
                </p>
              </ReadoutSection>

              <ReadoutSection title="Profit Confidence">
                <div className="space-y-3 text-sm">
                  <BreakdownRow
                    label="Confidence"
                    value={profitConfidence}
                  />
                  <BreakdownRow
                    label="Profit Margin"
                    value={formatPercent(result.profitMarginPercent)}
                  />
                  <BreakdownRow
                    label="Retained Earnings"
                    value={formatCurrency(result.retainedEarnings)}
                  />
                  <BreakdownRow
                    label="Warnings"
                    value={`${result.warnings.length}`}
                  />
                  <BreakdownRow
                    label="Missing Inputs"
                    value={
                      missingInputs.length > 0
                        ? `${missingInputs.length}`
                        : "None critical"
                    }
                  />
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Confidence is deterministic and based on available calculator,
                  route, and warning signals. It does not replace settlement
                  review.
                </p>
              </ReadoutSection>
            </div>
          )}

          <ReadoutDetail
            title="Missing Inputs & Assumptions"
            summary="Expandable Karpilo LoadIQ calculation details, planning notes, and assumptions."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
                <PanelTitle>Operational Cost Basis</PanelTitle>

                <div className="space-y-3 text-sm">
                  <BreakdownRow
                    label="Total Miles"
                    value={`${formatNumber(result.totalMiles)} mi`}
                  />
                  <BreakdownRow
                    label="Cargo Weight"
                    value={formatLoadWeight(result.estimatedLoadWeightLbs)}
                  />
                  <BreakdownRow
                    label="Fuel % of Gross"
                    value={formatPercent(result.fuelPercentOfGross)}
                  />
                  <BreakdownRow
                    label="Dispatch Cost"
                    value={formatCurrency(result.dispatchCost)}
                  />
                  <BreakdownRow
                    label="Factoring Cost"
                    value={formatCurrency(result.factoringCost)}
                  />
                  <BreakdownRow
                    label="Break-Even RPM"
                    value={formatRpm(result.breakEvenRpm)}
                  />
                </div>
              </div>

              {missingInputs.length > 0 && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
                  <PanelTitle>Missing Inputs</PanelTitle>

                  <ul className="space-y-2 text-sm leading-6 text-amber-100">
                    {missingInputs.map((missingInput) => (
                      <li key={missingInput}>- {missingInput}</li>
                    ))}
                  </ul>
                </div>
              )}

              {loadIqInsights.length > 0 && (
                <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-5">
                  <PanelTitle>Karpilo LoadIQ Planning Notes</PanelTitle>

                  <div className="space-y-3 text-sm leading-6 text-slate-300">
                    {loadIqInsights.map((insight) => (
                      <p key={insight}>{insight}</p>
                    ))}
                  </div>
                </div>
              )}

              {result.explanations.length > 0 && (
                <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-5">
                  <PanelTitle>Karpilo LoadIQ Calculation Basis</PanelTitle>

                  <div className="space-y-3 text-sm leading-6 text-slate-300">
                    {result.explanations.map((explanation) => (
                      <p key={explanation}>{explanation}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ReadoutDetail>

          {input && (
            <ReadoutDetail
              title="Karpilo Atlas Freight Intelligence"
              summary="Advanced Karpilo Atlas Freight detail remains gated through the existing runtime surface. AI-assisted explanation appears only after a successful request."
            >
              <AtlasFreightIntelligenceSurface
                payload={atlasPayload}
                enabled={aiDevEnabled && !previewMode}
              />
            </ReadoutDetail>
          )}

          {shouldRenderWeatherRisk && input && (
            <ReadoutDetail
              title="Weather / External Risk"
              summary="Weather Risk Context appears only when the current entitlement and provider state allow it."
            >
              <WeatherProfitabilityRiskPanel
                input={input}
                result={result}
                entitlementTier={entitlementTier}
                canUseWeatherProfitabilityRisk={canUseWeatherProfitabilityRisk}
                canSaveWeatherProfitabilitySnapshot={
                  canSaveWeatherProfitabilitySnapshot
                }
                onSnapshotChange={handleWeatherSnapshotChange}
              />
            </ReadoutDetail>
          )}

          <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-6 text-slate-500">
            Karpilo LoadIQ outputs are estimates based on the values entered
            here. They do not guarantee broker payment, carrier settlement,
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

      {input && (
        <ScenarioComparisonPanel
          input={input}
          canCompareScenarios={canCompareScenarios}
        />
      )}
    </>
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

function ReadoutSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
      <PanelTitle>{title}</PanelTitle>
      {children}
    </section>
  );
}

function ReadoutDetail({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-slate-800 bg-[#060B14] p-5">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.18em] text-slate-400">
              {title}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{summary}</p>
          </div>

          <span className="text-xs font-black uppercase tracking-[0.16em] text-sky-300 group-open:hidden">
            Expand
          </span>
          <span className="hidden text-xs font-black uppercase tracking-[0.16em] text-sky-300 group-open:inline">
            Collapse
          </span>
        </div>
      </summary>

      <div className="mt-5">{children}</div>
    </details>
  );
}

function BreakdownRow({ label, value }: BreakdownRowProps) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-800 pb-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="min-w-0 break-words font-semibold text-slate-200 sm:text-right">
        {value}
      </span>
    </div>
  );
}

function getRecommendedAction(
  result: LoadResult | null,
  input: LoadInput | null,
  routeMileageVariance: number | null
) {
  if (!result) {
    return {
      label: "Analyze Load",
      summary: "Run the calculator to generate a governed load readout.",
      className: "border-slate-700 bg-slate-900 text-slate-300",
    };
  }

  const missingInputs = input ? buildMissingInputs(input) : [];
  const hasDangerWarning = result.warnings.some(
    (warning) => warning.severity === "danger"
  );
  const hasElevatedRouteVariance =
    routeMileageVariance !== null && routeMileageVariance > 50;

  if (missingInputs.length > 0) {
    return {
      label: "Needs Data",
      summary:
        "Complete the missing calculator inputs before treating this load as decision-ready.",
      className: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    };
  }

  if (
    result.estimatedNet <= 0 ||
    result.profitabilityBand === "dangerous" ||
    hasDangerWarning
  ) {
    return {
      label: "Reject / Rework",
      summary:
        "The modeled load does not clear the current cost and risk assumptions. Rework rate, fuel, mileage, or time exposure before accepting.",
      className: "border-red-400/30 bg-red-500/10 text-red-200",
    };
  }

  if (
    result.profitabilityBand === "weak" ||
    result.profitabilityScore < 60 ||
    hasElevatedRouteVariance
  ) {
    return {
      label: "Negotiate",
      summary:
        "The load has a narrow or exposed signal. Verify paid miles, FSC treatment, and route assumptions before committing.",
      className: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    };
  }

  if (result.profitabilityScore >= 75) {
    return {
      label: "Accept Candidate",
      summary:
        "The modeled load has a favorable profit signal, subject to rate confirmation, route reality, weather, and settlement review.",
      className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    };
  }

  return {
    label: "Review Terms",
    summary:
      "The modeled load is viable but should be reviewed against route, time, and cost assumptions before dispatch.",
    className: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  };
}

function buildDecisionReasons(
  result: LoadResult,
  input: LoadInput | null,
  routeMileageVariance: number | null,
  routeFuelExposure: number | null
) {
  const reasons = [
    `${formatCurrency(result.estimatedNet)} estimated net with ${formatPercent(result.profitMarginPercent)} modeled margin.`,
    `${formatRpm(result.trueRpm)} true RPM against ${formatRpm(result.breakEvenRpm)} break-even RPM.`,
  ];

  if (!input) {
    return [
      ...reasons,
      "Calculator input context is unavailable for revenue, route, fuel, and schedule detail.",
    ];
  }

  reasons.push(
    `${formatNumber(input.loadedMiles)} paid loaded miles remain separate from ${formatOptionalMiles(getEstimatedRouteMiles(input))} Google estimated loaded miles.`
  );

  if (routeMileageVariance !== null) {
    reasons.push(
      `${formatSignedMiles(routeMileageVariance)} route variance with ${
        routeFuelExposure === null
          ? "unavailable"
          : formatCurrency(routeFuelExposure)
      } modeled fuel exposure.`
    );
  }

  return reasons.slice(0, 4);
}

function buildMissingInputs(input: LoadInput) {
  const missing = [
    input.revenueInputMode === "gross" && input.grossRevenue <= 0
      ? "load gross"
      : "",
    input.revenueInputMode === "rpm" && input.ratePerMile <= 0
      ? "booked RPM"
      : "",
    input.loadedMiles > 0 ? "" : "paid loaded miles",
    input.mpg > 0 ? "" : "MPG",
    input.fuelPrice > 0 ? "" : "fuel price",
    input.pickupCity || input.pickupState || input.pickupZip ? "" : "pickup",
    input.deliveryCity || input.deliveryState || input.deliveryZip
      ? ""
      : "delivery",
  ].filter(Boolean);

  return missing;
}

function getProfitConfidence(
  result: LoadResult,
  input: LoadInput | null,
  routeMileageVariance: number | null
) {
  const missingInputs = input ? buildMissingInputs(input) : ["calculator input"];

  if (
    missingInputs.length > 0 ||
    result.warnings.some((warning) => warning.severity === "danger")
  ) {
    return "Low";
  }

  if (result.warnings.length > 0 || routeMileageVariance === null) {
    return "Moderate";
  }

  return result.profitabilityScore >= 75 ? "High" : "Moderate";
}

function formatBand(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatLoadWeight(value: number) {
  return value > 0 ? `${formatNumber(value)} lb` : "Not entered";
}

function formatOptionalText(value: string | null | undefined) {
  const text = value?.trim();
  return text || "Not set";
}

function formatCapabilitySummary(input: LoadInput) {
  const capabilities = [
    input.hazmatCapable ? "Hazmat" : "",
    input.tankerCapable ? "Tanker" : "",
    input.refrigeratedCapable ? "Refrigerated" : "",
    ...input.specializedCapabilities,
    ...input.securementEquipment,
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  return capabilities.length > 0 ? capabilities.join(", ") : "Not set";
}

function getEstimatedRouteMiles(input: LoadInput) {
  if (
    input.routeEstimate?.loadedEstimate?.estimatedLoadedMiles !== null &&
    input.routeEstimate?.loadedEstimate?.estimatedLoadedMiles !== undefined
  ) {
    return input.routeEstimate.loadedEstimate.estimatedLoadedMiles;
  }

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

function getEstimatedDeadheadRouteMiles(input: LoadInput) {
  if (
    input.routeEstimate?.deadheadEstimate?.estimatedDeadheadMiles !== null &&
    input.routeEstimate?.deadheadEstimate?.estimatedDeadheadMiles !== undefined
  ) {
    return input.routeEstimate.deadheadEstimate.estimatedDeadheadMiles;
  }

  if (input.routeDeadheadMiles > 0) {
    return input.routeDeadheadMiles;
  }

  return null;
}

function getEstimatedTotalRouteMiles(input: LoadInput) {
  if (
    input.routeEstimate?.totalEstimate?.estimatedMiles !== null &&
    input.routeEstimate?.totalEstimate?.estimatedMiles !== undefined
  ) {
    return input.routeEstimate.totalEstimate.estimatedMiles;
  }

  const loaded = getEstimatedRouteMiles(input);
  const deadhead = getEstimatedDeadheadRouteMiles(input);

  if (loaded === null && deadhead === null) return null;

  return Number(((loaded ?? 0) + (deadhead ?? 0)).toFixed(1));
}

function getEstimatedRouteDurationMinutes(input: LoadInput) {
  if (
    input.routeEstimate?.totalEstimate?.estimatedDurationMinutes !== null &&
    input.routeEstimate?.totalEstimate?.estimatedDurationMinutes !== undefined
  ) {
    return input.routeEstimate.totalEstimate.estimatedDurationMinutes;
  }

  if (
    input.routeEstimate?.estimatedDurationMinutes !== null &&
    input.routeEstimate?.estimatedDurationMinutes !== undefined
  ) {
    return input.routeEstimate.estimatedDurationMinutes;
  }

  return null;
}

function getGoogleRouteQuarterHours(input: LoadInput) {
  if (input.googleRouteDurationQuarterHours > 0) {
    return input.googleRouteDurationQuarterHours;
  }

  const durationMinutes = getEstimatedRouteDurationMinutes(input);

  if (durationMinutes === null) return null;

  return minutesToQuarterHours(durationMinutes);
}

function getBenchmarkRouteHours(input: LoadInput) {
  const savedBenchmark =
    input.loadedBenchmarkHours + input.deadheadBenchmarkHours;

  if (savedBenchmark > 0) {
    return savedBenchmark;
  }

  const loadedMiles = getEstimatedRouteMiles(input) ?? input.loadedMiles;
  const deadheadMiles =
    getEstimatedDeadheadRouteMiles(input) ?? input.deadheadMiles;

  return (
    milesToBenchmarkHours(loadedMiles, 50) +
    milesToBenchmarkHours(deadheadMiles, 50)
  );
}

function getBenchmarkRouteDays(input: LoadInput) {
  const savedBenchmark = input.loadedBenchmarkDays + input.deadheadBenchmarkDays;

  if (savedBenchmark > 0) {
    return savedBenchmark;
  }

  return hoursToPlanningDays(getBenchmarkRouteHours(input), 10);
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

function formatOptionalDuration(value: number | null) {
  if (value === null) return "Unavailable";

  return minutesToHumanDuration(value);
}

function formatOptionalHours(value: number | null | undefined) {
  if (value === null || value === undefined || value <= 0) {
    return "Unavailable";
  }

  return `${formatNumber(value)} hr`;
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
    `Fuel is modeled at ${formatFuelPrice(input.fuelPrice)} from ${formatFuelSource(input)} across ${formatNumber(input.mpg)} MPG.`,
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

function getCurrentWeatherSnapshot(
  state: {
    key: string;
    snapshot: WeatherProfitabilityResult | null;
  },
  currentKey: string
) {
  return state.key === currentKey ? state.snapshot : null;
}

function buildWeatherSnapshotKey(result: LoadResult, input: LoadInput) {
  return JSON.stringify({
    routeEstimate: input.routeEstimate,
    loadedMiles: input.loadedMiles,
    deadheadMiles: input.deadheadMiles,
    fuelPrice: input.fuelPrice,
    mpg: input.mpg,
    grossRevenue: result.grossRevenue,
    totalMiles: result.totalMiles,
    targetRpm: result.targetRpm,
    estimatedNet: result.estimatedNet,
    profitMarginPercent: result.profitMarginPercent,
    breakEvenRpm: result.breakEvenRpm,
  });
}

function buildAtlasLoadAnalysisPayload(
  result: LoadResult,
  input: LoadInput
): LoadIqAiLoadAnalysisInput {
  const notes = [
    getFscTreatment(input),
    routeContextNote(input),
    missingInputNote(input),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    grossRevenue: nonNegativeNumber(result.grossRevenue),
    loadedMiles: nonNegativeNumber(input.loadedMiles),
    deadheadMiles: nonNegativeNumber(input.deadheadMiles),
    fuelCost: nonNegativeNumber(result.fuelCost),
    trueRpm: nonNegativeNumber(result.trueRpm),
    netProfit: finiteNumber(result.estimatedNet),
    daysCommitted: nonNegativeNumber(result.dispatchDays + result.deadheadDays),
    dispatchFee: nonNegativeNumber(result.dispatchCost),
    factoringFee: nonNegativeNumber(result.factoringCost),
    tolls: nonNegativeNumber(input.tolls),
    accessorials: nonNegativeNumber(result.accessorialRevenue),
    estimatedMaintenanceReserve: nonNegativeNumber(
      result.costBreakdown.maintenanceReserve
    ),
    pickupRegion: formatRegion(
      input.pickupCity,
      input.pickupState,
      input.pickupZip
    ),
    deliveryRegion: formatRegion(
      input.deliveryCity,
      input.deliveryState,
      input.deliveryZip
    ),
    equipmentType: optionalText(input.equipmentType),
    atlasEquipmentPack: optionalText(input.atlasEquipmentPack),
    equipmentPackLabel: getAtlasEquipmentPackLabel(
      input.atlasEquipmentPack,
      input.equipmentType || "Equipment context not set"
    ),
    combinationType: optionalText(input.combinationType),
    equipmentDimensions: formatEquipmentDimensions(input),
    maxPayloadLbs: nonNegativeNumber(input.maxPayloadLbs),
    grossVehicleWeightRatingLbs: nonNegativeNumber(
      input.grossVehicleWeightRatingLbs
    ),
    axleCount: nonNegativeNumber(input.axleCount),
    hazmatCapable: input.hazmatCapable,
    tankerCapable: input.tankerCapable,
    refrigeratedCapable: input.refrigeratedCapable,
    specializedCapabilities: formatStringList(input.specializedCapabilities),
    securementEquipment: formatStringList(input.securementEquipment),
    routeRestrictionNotes: optionalText(input.routeRestrictionNotes),
    notes,
  };
}

function finiteNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function nonNegativeNumber(value: number) {
  return Math.max(finiteNumber(value), 0);
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function formatStringList(values: string[]) {
  const text = values.map((value) => value.trim()).filter(Boolean).join(", ");
  return text || undefined;
}

function formatRegion(city: string, state: string, zip: string) {
  return (
    [city, state, zip].map((value) => value.trim()).filter(Boolean).join(", ") ||
    undefined
  );
}

function formatEquipmentDimensions(input: LoadInput) {
  const dimensions = [
    input.trailerLengthFeet > 0
      ? `${formatNumber(input.trailerLengthFeet)} ft`
      : "",
    input.trailerWidthInches > 0
      ? `${formatNumber(input.trailerWidthInches)} in wide`
      : "",
    input.trailerHeightInches > 0
      ? `${formatNumber(input.trailerHeightInches)} in high`
      : "",
  ]
    .filter(Boolean)
    .join(" / ");

  return dimensions || undefined;
}

function routeContextNote(input: LoadInput) {
  const estimatedLoaded = getEstimatedRouteMiles(input);
  const estimatedDeadhead = getEstimatedDeadheadRouteMiles(input);
  const routeStopCount = input.routeStops.length;
  const parts = [
    estimatedLoaded === null
      ? ""
      : `Google estimated loaded miles: ${formatNumber(estimatedLoaded)}.`,
    estimatedDeadhead === null
      ? ""
      : `Google estimated deadhead miles: ${formatNumber(estimatedDeadhead)}.`,
    routeStopCount > 0 ? `${routeStopCount} freight stop(s) entered.` : "",
  ].filter(Boolean);

  return parts.join(" ");
}

function missingInputNote(input: LoadInput) {
  const missing = [
    input.loadedMiles > 0 ? "" : "paid loaded miles",
    input.mpg > 0 ? "" : "MPG",
    input.fuelPrice > 0 ? "" : "fuel price",
    input.pickupCity || input.pickupState || input.pickupZip ? "" : "pickup",
    input.deliveryCity || input.deliveryState || input.deliveryZip
      ? ""
      : "delivery",
  ].filter(Boolean);

  return missing.length > 0
    ? `Missing or incomplete inputs: ${missing.join(", ")}.`
    : "";
}
