"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, RadioTower } from "lucide-react";

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
  const embedded = variant === "embedded";

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
    <section
      className={[
        "overflow-hidden rounded-2xl border bg-[#04100B] shadow-[0_0_34px_rgba(132,204,22,0.08)]",
        embedded ? "border-lime-400/25" : "border-lime-400/20",
      ].join(" ")}
    >
      <div className="relative">
        {embedded && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-300/70 to-transparent"
          />
        )}

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-lime-300/25 bg-lime-400/10 shadow-[0_0_28px_rgba(132,204,22,0.18)]">
              <Image
                src={ATLAS_FREIGHT_LAYER.assets.emblem}
                alt=""
                fill
                sizes="56px"
                className="h-full w-full object-cover"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-300">
                {ATLAS_FREIGHT_LAYER.runtimeId}
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-50">
                {ATLAS_FREIGHT_LAYER.publicName}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Embedded freight cognition for margin pressure, deadhead
                exposure, FSC recovery, cost-per-mile strain, and dispatch
                quality. Calculator values remain authoritative.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={requestIntelligence}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-lime-200 transition hover:bg-lime-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500 lg:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RadioTower className="h-4 w-4" aria-hidden="true" />
            )}
            {visibleAnalysis ? "Refresh Freight Signal" : "Update Freight Signal"}
          </button>
        </div>

        {!visibleAnalysis && (
          <div className="grid gap-3 border-t border-lime-400/10 p-5 md:grid-cols-3">
            <TelemetryPreview
              label="Margin Signal"
              value="Awaiting Readout"
              description="Interprets net pressure without replacing the calculator."
            />
            <TelemetryPreview
              label="Route Dilution"
              value="Deadhead Context"
              description="Frames unpaid miles against total route efficiency."
            />
            <TelemetryPreview
              label="Dispatch Quality"
              value="Operational Lens"
              description="Highlights questions to resolve before committing."
            />
          </div>
        )}

        {status && (
          <p className="border-t border-lime-400/10 px-5 py-4 text-sm leading-6 text-slate-400">
            {status}
          </p>
        )}

        {visibleAnalysis && (
          <div className="grid gap-4 border-t border-lime-400/10 p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <FreightBlock
                title="Signal Readout"
                body={visibleAnalysis.signalReadout}
              />
              <FreightBlock
                title="Margin Pressure"
                body={visibleAnalysis.marginPressure}
              />
              <FreightBlock
                title="Broker Traffic"
                body={visibleAnalysis.brokerTraffic}
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
      </div>
    </section>
  );
}

function TelemetryPreview({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-lime-400/10 bg-[#06160E] p-4">
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-lime-300">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-slate-100">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function FreightBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-lime-400/15 bg-[#06160E] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-300">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}
