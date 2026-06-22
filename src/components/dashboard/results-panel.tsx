"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { AtlasEducationalSignal } from "@/components/ai/atlas-educational-signal";
import { AtlasFreightIntelligenceSurface } from "@/components/ai/atlas-freight-intelligence-surface";
import { AtlasRouteIntelligenceSurface } from "@/components/ai/atlas-route-intelligence-surface";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LoadFuelGauge } from "@/components/dashboard/load-fuel-gauge";
import { WeatherProfitabilityRiskPanel } from "@/components/dashboard/weather-profitability-risk-panel";
import { usePreviewMode } from "@/components/preview/preview-mode-provider";
import { ScenarioComparisonPanel } from "@/components/dashboard/scenario-comparison-panel";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { LoadInput, LoadResult } from "@/types/load";
import type { LoadIqAiLoadAnalysisInput } from "@/types/ai-load-analysis";
import type { WeatherProfitabilityResult } from "@/types/weather-profitability";
import { saveLoad } from "@/services/save-load";
import { ThemedSelect } from "@/components/ui/themed-select";
import { getAtlasEquipmentPackLabel } from "@/lib/equipment-profile";
import {
  ANALYTICS_EVENTS,
  bucketDeadheadMiles,
  bucketMileage,
  trackAnalyticsEvent,
} from "@/lib/analytics";
import {
  isFuelGaugeTrackedStatus,
  LOAD_PULLED_REASON_OPTIONS,
  LOAD_RUN_STATUS_OPTIONS,
  type LoadPulledReason,
  type LoadRunStatus,
} from "@/lib/fuel-gauge";

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
  entitlementTier?: string | null;
  onLoadSaved?: () => void;
  previewMode?: boolean;
};

export function ResultsPanel({
  result,
  input,
  canSaveLoad = false,
  canCompareScenarios = false,
  canUseWeatherProfitabilityRisk = false,
  canSaveWeatherProfitabilitySnapshot = false,
  aiDevEnabled = false,
  entitlementTier,
  onLoadSaved,
  previewMode = false,
}: ResultsPanelProps) {
  const preview = usePreviewMode();
  const [saveStatus, setSaveStatus] = useState<{
    tone: "info" | "success" | "error";
    message: string;
  } | null>(null);
  const [statusSelection, setStatusSelection] = useState<{
    inputKey: string;
    status: LoadRunStatus;
    reason: LoadPulledReason;
  } | null>(null);
  const [fuelPresetSelection, setFuelPresetSelection] = useState<{
    inputKey: string;
    startingFuelPercent: number;
  } | null>(null);
  const [weatherProfitabilitySnapshot, setWeatherProfitabilitySnapshot] =
    useState<WeatherProfitabilityResult | null>(null);
  const inputStatusKey = input
    ? [
        input.loadNumber,
        input.pickupZip,
        input.deliveryZip,
        input.loadedMiles,
        input.deadheadMiles,
        input.loadRunStatus,
        input.loadPulledReason,
        input.startingFuelPercent,
      ].join("|")
    : "";
  const selectedStatus =
    statusSelection?.inputKey === inputStatusKey ? statusSelection : null;
  const selectedFuelPreset =
    fuelPresetSelection?.inputKey === inputStatusKey
      ? fuelPresetSelection
      : null;
  const loadRunStatus = selectedStatus?.status ?? input?.loadRunStatus ?? "";
  const loadPulledReason =
    selectedStatus?.reason ?? input?.loadPulledReason ?? "";
  const resolvedLoadRunStatus = (
    loadRunStatus ||
    input?.loadRunStatus ||
    "planned"
  ) as LoadRunStatus;
  const resolvedLoadPulledReason =
    resolvedLoadRunStatus === "pulled"
      ? loadPulledReason || input?.loadPulledReason || ""
      : "";
  const startingFuelPercent =
    selectedFuelPreset?.startingFuelPercent ?? input?.startingFuelPercent ?? 100;
  const canPresetFuelGauge = isFuelGaugeTrackedStatus(resolvedLoadRunStatus);

  async function handleSaveLoad() {
    if (previewMode || preview.enabled) {
      preview.explain("save-load");
      return;
    }

    if (!result || !input) return;

    if (!canSaveLoad) {
      setSaveStatus({
        tone: "error",
        message:
          "An active Karpilo LoadIQ subscription is required before saving load history.",
      });
      return;
    }

    try {
      setSaveStatus({ tone: "info", message: "Saving load..." });

      const savedLoadResult = await saveLoad({
        input: {
          ...input,
          loadRunStatus: resolvedLoadRunStatus,
          loadPulledReason: resolvedLoadPulledReason,
          startingFuelPercent,
        },
        result,
        weatherProfitabilitySnapshot:
          canSaveWeatherProfitabilitySnapshot && entitlementTier === "pro"
            ? weatherProfitabilitySnapshot
            : null,
      });

      setSaveStatus({
        tone: "success",
        message: savedLoadResult.warning
          ? `${savedLoadResult.warning} Saved load ID: ${savedLoadResult.id}`
          : `Load saved. Saved load ID: ${savedLoadResult.id}`,
      });
      void trackAnalyticsEvent(ANALYTICS_EVENTS.CALCULATION_SAVED, {
        route: "/dashboard",
        plan_tier: entitlementTier ?? undefined,
        deadhead_bucket: bucketDeadheadMiles(input.deadheadMiles),
        mileage_bucket: bucketMileage(input.loadedMiles + input.deadheadMiles),
      });
      onLoadSaved?.();
    } catch (error) {
      console.error(error);

      setSaveStatus({
        tone: "error",
        message:
          error instanceof Error ? error.message : JSON.stringify(error),
      });
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
              label="Load Status"
              value={loadRunStatus}
              previewExplanation="save-load"
              onChange={(value) => {
                const nextStatus = value as LoadRunStatus;
                setStatusSelection({
                  inputKey: inputStatusKey,
                  status: nextStatus,
                  reason:
                    nextStatus === "pulled"
                      ? loadPulledReason || input?.loadPulledReason || ""
                      : "",
                });
              }}
              options={LOAD_RUN_STATUS_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                description: option.description,
              }))}
            />

            {loadRunStatus === "pulled" && (
              <ThemedSelect
                label="Pulled Reason"
                value={loadPulledReason}
                previewExplanation="save-load"
                onChange={(value) =>
                  setStatusSelection({
                    inputKey: inputStatusKey,
                    status: "pulled",
                    reason: value as LoadPulledReason,
                  })
                }
                options={LOAD_PULLED_REASON_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
            )}

            {canPresetFuelGauge && (
              <label className="block rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
                <span className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Fuel Gauge Preset
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={startingFuelPercent}
                    data-preview-explain="save-load"
                    onChange={(event) => {
                      setFuelPresetSelection({
                        inputKey: inputStatusKey,
                        startingFuelPercent: clampFuelPresetPercent(
                          event.currentTarget.valueAsNumber
                        ),
                      });
                    }}
                    className="h-12 w-28 rounded-xl border border-slate-800 bg-[#060B14] px-4 text-sm font-semibold text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
                    percent
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Preset this load&apos;s starting fuel before save. When the
                  status is Running, the gauge and saved snapshot use this
                  load-specific value.
                </p>
              </label>
            )}

            <button
              type="button"
              onClick={handleSaveLoad}
              disabled={
                !loadRunStatus ||
                (loadRunStatus === "pulled" && !loadPulledReason)
              }
              data-atlas-edu="save-load"
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
            >
              Save Load
            </button>
          </div>
        </div>

        {saveStatus && (
          <p
            className={
              saveStatus.tone === "success"
                ? "rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-100"
                : saveStatus.tone === "error"
                  ? "rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-6 text-red-100"
                  : "rounded-xl border border-sky-400/25 bg-sky-400/10 p-3 text-sm leading-6 text-sky-100"
            }
          >
            {saveStatus.message}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <KpiCard label="Gross Revenue" value={formatCurrency(result.grossRevenue)} tone="green" />
          <KpiCard label="Estimated Net" value={formatCurrency(result.estimatedNet)} tone={result.estimatedNet > 0 ? "blue" : "red"} />
          <KpiCard label="True RPM" value={formatRpm(result.trueRpm)} tone="silver" atlasEduKey="result-true-rpm" />
          <KpiCard label="Fuel Cost" value={formatCurrency(result.fuelCost)} tone="red" />
          <KpiCard label="Break-Even RPM" value={formatRpm(result.breakEvenRpm)} tone={input && input.ratePerMile < result.breakEvenRpm ? "red" : "silver"} atlasEduKey="result-break-even" />
          <KpiCard label="Daily Net" value={formatCurrency(result.dailyProfitability)} tone={result.dailyProfitability > 0 ? "green" : "red"} atlasEduKey="result-daily-net" />
          <KpiCard label="Net / Total Mi" value={formatRpm(result.profitPerTotalMile)} tone={result.profitPerTotalMile > 0 ? "green" : "red"} />
          <KpiCard label="Net / Loaded Mi" value={formatRpm(result.profitPerLoadedMile)} tone={result.profitPerLoadedMile > 0 ? "green" : "red"} />
          <KpiCard label="Deadhead" value={formatPercent(result.deadheadPercent)} tone={result.deadheadPercent > 25 ? "red" : "silver"} atlasEduKey="result-deadhead" />
          <KpiCard
            label="Profitability"
            value={`${result.profitabilityScore}/100`}
            tone={result.profitabilityScore >= 75 ? "green" : result.profitabilityScore >= 60 ? "blue" : "red"}
            atlasEduKey="result-margin"
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
            <BreakdownRow label="Deadhead Days" value={formatNumber(result.deadheadDays)} />
            <BreakdownRow label="Overhead Applied" value={formatCurrency(result.loadOverheadApplied)} />
            <BreakdownRow label="Cost Per Mile" value={formatRpm(result.costPerMile)} />
            <BreakdownRow label="Profit Per Day" value={formatCurrency(result.profitPerDay)} />
            <BreakdownRow label="Profit Per Hour" value={formatCurrency(result.profitPerHour)} />
            <BreakdownRow label="Fuel % of Gross" value={formatPercent(result.fuelPercentOfGross)} />
            <BreakdownRow label="Profit Margin" value={formatPercent(result.profitMarginPercent)} />
            <BreakdownRow
              label="Driver Pay Base"
              value={formatCurrency(result.driverPayBase)}
            />
            <BreakdownRow
              label="Driver Percentage Pay"
              value={formatCurrency(result.driverPercentagePay)}
            />
            <BreakdownRow
              label="Pay Basis"
              value={formatPayBasis(result.payCalculationBasis)}
            />
            <BreakdownRow
              label="Pay Period Mode"
              value={formatPayPeriod(result.payPeriodMode)}
            />
            <BreakdownRow label="Reserve Allocation" value={formatCurrency(result.reserveAllocationResolved)} />
            <BreakdownRow label="Retained Earnings" value={formatCurrency(result.retainedEarnings)} />
            <BreakdownRow label="Dispatch Cost" value={formatCurrency(result.dispatchCost)} />
            <BreakdownRow label="Factoring Cost" value={formatCurrency(result.factoringCost)} />
            <BreakdownRow
              label="Daily Target Gap"
              value={formatCurrency(result.incomeTargetComparison)}
            />
          </div>
        </div>

        {input && (
          <WeatherProfitabilityRiskPanel
            input={input}
            result={result}
            entitlementTier={entitlementTier}
            canUseWeatherProfitabilityRisk={canUseWeatherProfitabilityRisk}
            canSaveWeatherProfitabilitySnapshot={
              canSaveWeatherProfitabilitySnapshot
            }
            onSnapshotChange={setWeatherProfitabilitySnapshot}
          />
        )}

        {input && (
          <AtlasRouteIntelligenceSurface
            deadheadOrigin={formatRegion(
              input.deadheadStartCity,
              input.deadheadStartState,
              input.deadheadStartZip
            )}
            pickup={formatRegion(input.pickupCity, input.pickupState, input.pickupZip)}
            delivery={formatRegion(
              input.deliveryCity,
              input.deliveryState,
              input.deliveryZip
            )}
            loadedMiles={input.loadedMiles}
            deadheadMiles={input.deadheadMiles}
            totalMiles={result.totalMiles}
            deadheadPercent={result.deadheadPercent}
            routeStopCount={result.routeStopCount}
            stopOffCount={result.stopOffCount}
            dispatchDays={result.dispatchDays}
            deadheadDays={result.deadheadDays}
            pickupDate={input.pickupDate}
            deliveryDate={input.deliveryDate}
            deadheadStartDate={input.deadheadStartDate}
            deadheadEndDate={input.deadheadEndDate}
            estimatedLoadWeightLbs={result.estimatedLoadWeightLbs}
            equipmentType={input.equipmentType}
            equipmentPackLabel={getAtlasEquipmentPackLabel(
              input.atlasEquipmentPack
            )}
            combinationType={input.combinationType}
            equipmentDimensions={formatInputEquipmentDimensions(input)}
            maxPayloadLbs={input.maxPayloadLbs}
            grossVehicleWeightRatingLbs={input.grossVehicleWeightRatingLbs}
            axleCount={input.axleCount}
            hazmatCapable={input.hazmatCapable}
            tankerCapable={input.tankerCapable}
            refrigeratedCapable={input.refrigeratedCapable}
            routeRestrictionNotes={input.routeRestrictionNotes}
            routeModelVersion="Karpilo LoadIQ manual route context"
            reserveMode={formatReserveMode(result.reserveAllocationMode)}
            targetRpmSnapshot={formatRpm(result.targetRpm)}
            entitlementTier={entitlementTier}
          />
        )}

        <AtlasEducationalSignal
          title="Operational Meaning Layer"
          signal="Deadhead, cost per mile, break-even RPM, and daily net are connected signals. A strong gross rate can still weaken when unpaid movement or timing pressure expands."
          consequence="Use the deterministic numbers above as the operating baseline, then read the context below to understand what each pressure point does to the load."
          operatorReminder="Karpilo Atlas AI explains the significance of app outputs. It does not make dispatch, financial, legal, tax, safety, routing, broker, or compliance decisions."
        />

        <OperationalValueNotes result={result} />

        {input && (
          <LoadFuelGauge
            input={{
              ...input,
              loadRunStatus: resolvedLoadRunStatus,
              loadPulledReason: resolvedLoadPulledReason,
              startingFuelPercent,
            }}
            result={result}
            entitlementTier={entitlementTier}
          />
        )}

        {aiDevEnabled && input && !previewMode && (
          <AtlasFreightIntelligenceSurface
            payload={buildAtlasFreightPayload(input, result)}
          />
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

function buildAtlasFreightPayload(
  input: LoadInput,
  result: LoadResult
): LoadIqAiLoadAnalysisInput {
  return {
    grossRevenue: result.grossRevenue,
    loadedMiles: input.loadedMiles,
    deadheadMiles: input.deadheadMiles,
    fuelCost: result.fuelCost,
    trueRpm: result.trueRpm,
    netProfit: result.estimatedNet,
    daysCommitted: Math.max(result.dispatchDays + result.deadheadDays, 0),
    dispatchFee: result.dispatchCost,
    factoringFee: result.factoringCost,
    tolls: result.costBreakdown.tolls,
    accessorials: result.accessorialRevenue,
    estimatedMaintenanceReserve: result.costBreakdown.maintenanceReserve,
    equipmentType: input.equipmentType,
    atlasEquipmentPack: input.atlasEquipmentPack,
    equipmentPackLabel: getAtlasEquipmentPackLabel(input.atlasEquipmentPack),
    combinationType: input.combinationType,
    equipmentDimensions: formatInputEquipmentDimensions(input),
    maxPayloadLbs: input.maxPayloadLbs,
    grossVehicleWeightRatingLbs: input.grossVehicleWeightRatingLbs,
    axleCount: input.axleCount,
    hazmatCapable: input.hazmatCapable,
    tankerCapable: input.tankerCapable,
    refrigeratedCapable: input.refrigeratedCapable,
    specializedCapabilities: input.specializedCapabilities.join(", "),
    securementEquipment: input.securementEquipment.join(", "),
    routeRestrictionNotes: input.routeRestrictionNotes,
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
    notes: result.warnings.map((warning) => warning.message).join(" "),
  };
}

function formatInputEquipmentDimensions(input: LoadInput) {
  const parts = [
    input.trailerLengthFeet > 0 ? `${input.trailerLengthFeet} ft` : "",
    input.trailerWidthInches > 0 ? `${input.trailerWidthInches} in wide` : "",
    input.trailerHeightInches > 0 ? `${input.trailerHeightInches} in high` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "Not set";
}

function formatRegion(city: string, state: string, zip: string) {
  return [city, state, zip].filter(Boolean).join(", ");
}

function formatPayBasis(basis: LoadResult["payCalculationBasis"]) {
  if (basis === "gross_minus_fsc") return "Gross minus fuel surcharge";
  return "Gross revenue";
}

function formatPayPeriod(mode: LoadResult["payPeriodMode"]) {
  if (mode === "weekly") return "Weekly";
  return "By load";
}

function formatReserveMode(mode: LoadResult["reserveAllocationMode"]) {
  if (mode === "cpm") return "CPM allocation";
  if (mode === "percent") return "Percent allocation";
  return "Flat allocation";
}

function clampFuelPresetPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function OperationalValueNotes({ result }: { result: LoadResult }) {
  const notes = [
    {
      label: "Cost per mile",
      value: formatRpm(result.costPerMile),
      atlasEduKey: "result-cost-per-mile",
      body:
        "Shows the estimated operating pressure each total mile carries, including deadhead and fixed overhead.",
    },
    {
      label: "Break-even RPM",
      value: formatRpm(result.breakEvenRpm),
      atlasEduKey: "result-break-even",
      body:
        "Marks the estimated loaded-mile rate needed before the trip starts producing margin.",
    },
    {
      label: "Deadhead",
      value: formatPercent(result.deadheadPercent),
      atlasEduKey: "result-deadhead",
      body:
        "Keeps unpaid miles visible so route decisions are not judged by linehaul rate alone.",
    },
    {
      label: "Fuel share",
      value: formatPercent(result.fuelPercentOfGross),
      atlasEduKey: "result-fuel-share",
      body:
        "Highlights fuel variance exposure when pump price, MPG, or routing assumptions move.",
    },
    {
      label: "Daily net",
      value: formatCurrency(result.dailyProfitability),
      atlasEduKey: "result-daily-net",
      body:
        "Connects margin to time so a load can be compared against the days it occupies the truck.",
    },
    {
      label: "Trip margin",
      value: formatPercent(result.profitMarginPercent),
      atlasEduKey: "result-margin",
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
            data-atlas-edu={note.atlasEduKey}
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
