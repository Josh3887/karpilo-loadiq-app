"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, RadioTower } from "lucide-react";

import {
  AtlasInfoBlock,
  AtlasMetricTile,
  AtlasRuntimeFrame,
} from "@/components/ai/atlas-runtime-frame";
import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";
import type {
  LoadIqAiLoadAnalysisInput,
  LoadIqAiLoadAnalysisOutput,
} from "@/types/ai-load-analysis";

type AtlasFreightIntelligenceSurfaceProps = {
  payload: LoadIqAiLoadAnalysisInput | null;
  variant?: "embedded" | "overlay";
};

type AiResponse = {
  analysis?: LoadIqAiLoadAnalysisOutput;
  error?: string;
};

const ATLAS_FREIGHT_LAYER = ATLAS_INTELLIGENCE_LAYERS.freight;

export function AtlasFreightIntelligenceSurface({
  payload,
  variant = "embedded",
}: AtlasFreightIntelligenceSurfaceProps) {
  const [analysis, setAnalysis] = useState<LoadIqAiLoadAnalysisOutput | null>(
    null
  );
  const [analysisPayloadKey, setAnalysisPayloadKey] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const payloadKey = useMemo(() => JSON.stringify(payload ?? null), [payload]);
  const visibleAnalysis = analysisPayloadKey === payloadKey ? analysis : null;

  async function requestIntelligence() {
    if (!payload) {
      setStatus(
        "Atlas Freight Intelligence needs complete calculated load values to generate a freight intelligence readout."
      );
      return;
    }

    setLoading(true);
    setStatus(`${ATLAS_FREIGHT_LAYER.runtimeId} processing freight signal...`);

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
        setStatus(
          data.error === "ai_not_configured"
            ? "Atlas Freight Intelligence is not configured on this server."
            : "Atlas Freight Intelligence is temporarily unavailable."
        );
        return;
      }

      setAnalysis(data.analysis);
      setAnalysisPayloadKey(payloadKey);
      setStatus("");
    } catch {
      setStatus("Atlas Freight Intelligence is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AtlasRuntimeFrame
      layer={ATLAS_FREIGHT_LAYER}
      compact={variant === "overlay"}
      description="Embedded freight cognition for margin pressure, deadhead exposure, FSC recovery, cost-per-mile strain, and dispatch quality. Calculator values remain authoritative."
      action={
        <button
          type="button"
          onClick={requestIntelligence}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--atlas-accent)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 lg:w-auto"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RadioTower className="h-4 w-4" aria-hidden="true" />
          )}
          {visibleAnalysis ? "Refresh Freight Signal" : "Update Freight Signal"}
        </button>
      }
    >
        {!visibleAnalysis && (
          <div className="grid gap-3 md:grid-cols-3">
            <AtlasMetricTile
              label="Margin Signal"
              value="Awaiting Readout"
              detail="Interprets net pressure without replacing the calculator."
              layer={ATLAS_FREIGHT_LAYER}
            />
            <AtlasMetricTile
              label="Route Dilution"
              value="Deadhead Context"
              detail="Frames unpaid miles against total route efficiency."
              layer={ATLAS_FREIGHT_LAYER}
            />
            <AtlasMetricTile
              label="Dispatch Quality"
              value="Operational Lens"
              detail="Highlights questions to resolve before committing."
              layer={ATLAS_FREIGHT_LAYER}
            />
          </div>
        )}

        {status && (
          <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
            {status}
          </p>
        )}

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
          </div>
        )}
    </AtlasRuntimeFrame>
  );
}
