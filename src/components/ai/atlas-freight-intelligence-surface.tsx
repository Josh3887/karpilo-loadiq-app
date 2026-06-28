"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, RadioTower } from "lucide-react";

import {
  AtlasAiStatusIndicator,
  type AtlasAiStatusInfo,
} from "@/components/ai/atlas-ai-status-indicator";
import {
  AtlasInfoBlock,
  AtlasMetricTile,
  AtlasRuntimeFrame,
} from "@/components/ai/atlas-runtime-frame";
import { AtlasOutputReportAction } from "@/components/ai/atlas-output-report-action";
import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";
import type {
  LoadIqAiLoadAnalysisInput,
  LoadIqAiLoadAnalysisOutput,
} from "@/types/ai-load-analysis";

type AtlasFreightIntelligenceSurfaceProps = {
  payload: LoadIqAiLoadAnalysisInput | null;
  variant?: "embedded" | "overlay";
  enabled?: boolean;
};

type AiResponse = {
  analysis?: LoadIqAiLoadAnalysisOutput;
  governance?: {
    status?: "cache_hit" | "completed";
    usageEventId?: string | null;
    cacheKey?: string | null;
    budget?: AtlasAiStatusInfo["budget"];
  };
  error?: string;
  message?: string;
  retryAfterSeconds?: number;
};

const ATLAS_FREIGHT_LAYER = ATLAS_INTELLIGENCE_LAYERS.freight;
const LOAD_ANALYSIS_FEATURE_KEY = "load_analysis";
const ATLAS_DISABLED_STATUS_INFO = {
  status: "disabled",
  reason: "ai_dev_disabled",
  message:
    "Atlas analysis support is not enabled in this environment. Deterministic LoadIQ intelligence remains available.",
} satisfies AtlasAiStatusInfo;

export function AtlasFreightIntelligenceSurface({
  payload,
  variant = "embedded",
  enabled = true,
}: AtlasFreightIntelligenceSurfaceProps) {
  const [analysis, setAnalysis] = useState<LoadIqAiLoadAnalysisOutput | null>(
    null
  );
  const [analysisPayloadKey, setAnalysisPayloadKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState<AtlasAiStatusInfo | null>(null);
  const [lastOutputReference, setLastOutputReference] = useState<{
    usageEventId?: string | null;
    cacheKey?: string | null;
  } | null>(null);
  const payloadKey = useMemo(() => JSON.stringify(payload ?? null), [payload]);
  const baselineReadout = useMemo(
    () => buildFreightBaselineReadout(payload),
    [payload]
  );
  const visibleAnalysis = analysisPayloadKey === payloadKey ? analysis : null;
  const effectiveStatusInfo =
    !enabled && payload ? ATLAS_DISABLED_STATUS_INFO : statusInfo;
  const atlasUnavailable =
    !enabled ||
    effectiveStatusInfo?.status === "disabled" ||
    effectiveStatusInfo?.reason === "ai_budget_exceeded";
  const atlasCoolingDown = effectiveStatusInfo?.reason === "ai_cooldown_active";

  useEffect(() => {
    let active = true;

    if (!payload) {
      return;
    }

    if (!enabled) {
      return;
    }

    async function loadStatus() {
      try {
        const response = await fetch(
          `/api/ai/status?featureKey=${LOAD_ANALYSIS_FEATURE_KEY}`
        );
        const data = (await response.json().catch(() => null)) as
          | AtlasAiStatusInfo
          | null;

        if (!active || !data) {
          return;
        }

        if (response.ok) {
          setStatusInfo(data);
        } else {
          setStatusInfo({
            status: "disabled",
            message:
              data.message ||
              "Atlas analysis support is unavailable. Calculator output remains available.",
          });
        }
      } catch {
        if (active) {
          setStatusInfo({
            status: "disabled",
            message:
              "Atlas analysis support is unavailable. Calculator output remains available.",
          });
        }
      }
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, [enabled, payload, payloadKey]);

  async function requestIntelligence() {
    if (!enabled) {
      setStatus(
        "Atlas Analysis Assistance is not enabled in this environment. Calculator output remains available."
      );
      return;
    }

    if (!payload) {
      setStatus(
        "Atlas Analysis Assistance needs complete calculated load values to generate an educational readout."
      );
      return;
    }

    setLoading(true);
    setStatus(`${ATLAS_FREIGHT_LAYER.runtimeId} processing Atlas analysis context...`);

    try {
      const response = await fetch("/api/ai/load-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as AiResponse;

      if (!response.ok || !data.analysis) {
        setStatusInfo((current) => ({
          status:
            data.error === "ai_cooldown_active" ||
            data.error === "ai_budget_exceeded"
              ? "limited"
              : "disabled",
          reason: data.error,
          message:
            data.message ||
            "Karpilo Atlas AI analysis support is temporarily unavailable.",
          retryAfterSeconds: data.retryAfterSeconds,
          budget: current?.budget,
        }));
        setStatus(
          data.error === "ai_not_configured"
            ? "Karpilo Atlas AI is not configured on this server."
            : data.message ||
                "Karpilo Atlas AI analysis support is temporarily unavailable."
        );
        return;
      }

      setAnalysis(data.analysis);
      setAnalysisPayloadKey(payloadKey);
      setLastOutputReference({
        usageEventId: data.governance?.usageEventId,
        cacheKey: data.governance?.cacheKey,
      });
      setStatusInfo((current) => ({
        status: "available",
        message:
          data.governance?.status === "cache_hit"
            ? "Atlas returned a cached readout for this matching load context."
            : "Atlas analysis support is available.",
        budget: data.governance?.budget ?? current?.budget,
      }));
      setStatus("");
    } catch {
      setStatus("Karpilo Atlas AI analysis support is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AtlasRuntimeFrame
      layer={ATLAS_FREIGHT_LAYER}
      compact={variant === "overlay"}
      description="Embedded educational context for margin pressure, deadhead exposure, FSC recovery, cost-per-mile strain, and load-quality signals. Calculator values remain authoritative."
      action={
        <button
          type="button"
          onClick={requestIntelligence}
          disabled={loading || !enabled || atlasUnavailable || atlasCoolingDown}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--atlas-accent)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 lg:w-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RadioTower className="h-4 w-4" aria-hidden="true" />
          )}
          {atlasCoolingDown
            ? "Atlas Cooling Down"
            : visibleAnalysis
              ? "Refresh Atlas Insight"
              : "Update Atlas Insight"}
        </button>
      }
    >
        {!visibleAnalysis && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <AtlasMetricTile
              label="Margin Signal"
              value={baselineReadout.marginSignal}
              detail={baselineReadout.marginDetail}
              layer={ATLAS_FREIGHT_LAYER}
            />
            <AtlasMetricTile
              label="Deadhead Exposure"
              value={baselineReadout.deadheadSignal}
              detail={baselineReadout.deadheadDetail}
              layer={ATLAS_FREIGHT_LAYER}
            />
            <AtlasMetricTile
              label="Load Quality"
              value={baselineReadout.dispatchSignal}
              detail={baselineReadout.dispatchDetail}
              layer={ATLAS_FREIGHT_LAYER}
            />
            <AtlasMetricTile
              label="Equipment Signal"
              value={baselineReadout.equipmentSignal}
              detail={baselineReadout.equipmentDetail}
              layer={ATLAS_FREIGHT_LAYER}
            />
          </div>
        )}

        {status && (
          <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
            {status}
          </p>
        )}

        <AtlasAiStatusIndicator statusInfo={payload ? effectiveStatusInfo : null} />

        {visibleAnalysis && (
          <div className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <AtlasInfoBlock
                title="Signal Readout"
                body={visibleAnalysis.signalReadout}
                layer={ATLAS_FREIGHT_LAYER}
              />
              <AtlasInfoBlock
                title="Margin Pressure"
                body={visibleAnalysis.marginPressure}
                layer={ATLAS_FREIGHT_LAYER}
              />
              <AtlasInfoBlock
                title="Broker Traffic"
                body={visibleAnalysis.brokerTraffic}
                layer={ATLAS_FREIGHT_LAYER}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-red-200">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  Road Signals
                </div>
                <ul className="space-y-2 text-sm leading-6 text-slate-300">
                  {visibleAnalysis.roadSignals.map((signal) => (
                    <li key={signal}>- {signal}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-lime-400/15 bg-[#06160E] p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-lime-300">
                  Driver Questions
                </div>
                <ul className="space-y-2 text-sm leading-6 text-slate-300">
                  {visibleAnalysis.driverQuestions.map((question) => (
                    <li key={question}>- {question}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4 text-xs leading-6 text-slate-500">
              Confidence: {visibleAnalysis.confidence}.{" "}
              {visibleAnalysis.intelligenceDisclaimer}
            </div>

            <AtlasOutputReportAction
              featureKey={LOAD_ANALYSIS_FEATURE_KEY}
              usageEventId={lastOutputReference?.usageEventId}
              cacheKey={lastOutputReference?.cacheKey}
            />
          </div>
        )}
    </AtlasRuntimeFrame>
  );
}

function buildFreightBaselineReadout(
  payload: LoadIqAiLoadAnalysisInput | null
) {
  if (!payload) {
    return {
      marginSignal: "Awaiting Output",
      marginDetail: "Atlas Analysis Assistance activates after calculator output exists.",
      deadheadSignal: "Route Pending",
      deadheadDetail: "Deadhead exposure needs completed load values.",
      dispatchSignal: "No Readout",
      dispatchDetail: "Run Analyze Load before requesting Atlas interpretation.",
      equipmentSignal: "Equipment Pending",
      equipmentDetail: "Vehicle context loads from the operational profile.",
    };
  }

  const grossRevenue = Number(payload.grossRevenue);
  const netProfit = Number(payload.netProfit);
  const loadedMiles = Number(payload.loadedMiles);
  const deadheadMiles = Number(payload.deadheadMiles);
  const fuelCost = Number(payload.fuelCost);
  const trueRpm = Number(payload.trueRpm);
  const daysCommitted = Number(payload.daysCommitted);
  const totalMiles = Math.max(loadedMiles + deadheadMiles, 0);
  const marginPercent =
    grossRevenue > 0 && Number.isFinite(netProfit)
      ? (netProfit / grossRevenue) * 100
      : 0;
  const deadheadPercent =
    totalMiles > 0 && Number.isFinite(deadheadMiles)
      ? (deadheadMiles / totalMiles) * 100
      : 0;
  const fuelPercent =
    grossRevenue > 0 && Number.isFinite(fuelCost)
      ? (fuelCost / grossRevenue) * 100
      : 0;

  return {
    marginSignal:
      marginPercent >= 25
        ? "Strong Margin Pressure"
        : marginPercent >= 12
          ? "Moderate Margin"
          : netProfit > 0
            ? "Thin Margin"
            : "Negative Signal",
    marginDetail: `Baseline output shows ${marginPercent.toFixed(1)}% estimated margin before final settlement reality.`,
    deadheadSignal:
      deadheadPercent >= 30
        ? "Elevated Deadhead"
        : deadheadPercent >= 15
          ? "Watch Repositioning"
          : "Controlled Movement",
    deadheadDetail: `${deadheadPercent.toFixed(1)}% of modeled movement is unpaid repositioning distance.`,
    dispatchSignal:
      daysCommitted >= 4
        ? "Time Exposure"
        : trueRpm > 0 && fuelPercent < 25
          ? "Signal Stable"
          : "Review Inputs",
    dispatchDetail: `${daysCommitted.toFixed(2)} committed day(s), ${fuelPercent.toFixed(1)}% fuel share, and ${trueRpm.toFixed(2)} true RPM.`,
    equipmentSignal:
      payload.equipmentPackLabel ||
      payload.equipmentType ||
      "Equipment Context",
    equipmentDetail: formatEquipmentDetail(payload),
  };
}

function formatEquipmentDetail(payload: LoadIqAiLoadAnalysisInput) {
  const parts = [
    payload.combinationType,
    payload.equipmentDimensions,
    Number(payload.maxPayloadLbs) > 0
      ? `${Number(payload.maxPayloadLbs).toLocaleString()} lbs payload`
      : "",
    payload.hazmatCapable ? "hazmat-capable" : "",
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(" / ")
    : "Profile equipment context is not set.";
}
