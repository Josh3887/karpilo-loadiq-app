"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, RadioTower } from "lucide-react";

import type {
  LoadIqAiLoadAnalysisInput,
  LoadIqAiLoadAnalysisOutput,
} from "@/types/ai-load-analysis";

type IationCoreFreightPanelProps = {
  payload: LoadIqAiLoadAnalysisInput | null;
};

type AiResponse = {
  analysis?: LoadIqAiLoadAnalysisOutput;
  error?: string;
};

export function IationCoreFreightPanel({
  payload,
}: IationCoreFreightPanelProps) {
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
        "iAtion Core needs complete calculated load values to generate a freight intelligence readout."
      );
      return;
    }

    setLoading(true);
    setStatus("Reading freight signal...");

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
            ? "iAtion Core is not configured on this server."
            : "iAtion Core freight intelligence is temporarily unavailable."
        );
        return;
      }

      setAnalysis(data.analysis);
      setAnalysisPayloadKey(payloadKey);
      setStatus("");
    } catch {
      setStatus("iAtion Core freight intelligence is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-sky-400/25 bg-[#050B14] p-4">
        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-sky-300/25 bg-sky-400/10 shadow-[0_0_24px_rgba(56,189,248,0.16)]">
            <Image
              src="/brand/iation-core-freight-intelligence-icon.webp"
              alt="iAtion Core freight intelligence"
              fill
              sizes="56px"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              iAtion Core
            </p>
            <h3 className="mt-1 text-xl font-black text-slate-50">
              Freight Intelligence
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Interprets calculated load data, margin pressure, broker traffic,
              road signals, and operational significance. Calculator values
              remain authoritative.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={requestIntelligence}
          disabled={loading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RadioTower className="h-4 w-4" aria-hidden="true" />
          )}
          {visibleAnalysis
            ? "Refresh iAtion Core"
            : "Generate iAtion Core Readout"}
        </button>
      </div>

      {status && <p className="text-sm leading-6 text-slate-400">{status}</p>}

      {visibleAnalysis && (
        <div className="grid gap-4">
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

          <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-sky-300">
              Driver Questions
            </div>
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              {visibleAnalysis.driverQuestions.map((question) => (
                <li key={question}>- {question}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4 text-xs leading-6 text-slate-500">
            Confidence: {visibleAnalysis.confidence}.{" "}
            {visibleAnalysis.intelligenceDisclaimer}
          </div>
        </div>
      )}
    </div>
  );
}

function FreightBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}
