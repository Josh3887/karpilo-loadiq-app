"use client";

import { useState } from "react";
import { AlertTriangle, BrainCircuit, Loader2 } from "lucide-react";

import type {
  LoadIqAiLoadAnalysisInput,
  LoadIqAiLoadAnalysisOutput,
} from "@/types/ai-load-analysis";
import type { LoadInput, LoadResult } from "@/types/load";

type LoadIqEducationalInsightCardProps = {
  input: LoadInput;
  result: LoadResult;
};

type AiResponse = {
  analysis?: LoadIqAiLoadAnalysisOutput;
  error?: string;
};

function regionFrom(city: string, state: string, zip: string) {
  return [city, state, zip].filter(Boolean).join(", ");
}

function buildAiPayload(
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
    pickupRegion: regionFrom(input.pickupCity, input.pickupState, input.pickupZip),
    deliveryRegion: regionFrom(
      input.deliveryCity,
      input.deliveryState,
      input.deliveryZip
    ),
    notes: result.warnings.map((warning) => warning.message).join(" "),
  };
}

export function LoadIqEducationalInsightCard({
  input,
  result,
}: LoadIqEducationalInsightCardProps) {
  const [analysis, setAnalysis] = useState<LoadIqAiLoadAnalysisOutput | null>(
    null
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestInsight() {
    setLoading(true);
    setStatus("Generating educational readout...");

    try {
      const response = await fetch("/api/ai/load-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildAiPayload(input, result)),
      });
      const data = (await response.json().catch(() => ({}))) as AiResponse;

      if (!response.ok || !data.analysis) {
        setStatus(
          data.error === "ai_not_configured"
            ? "Karpilo LoadIQ AI Dev V1 is not configured on this server."
            : "Educational readout is temporarily unavailable."
        );
        return;
      }

      setAnalysis(data.analysis);
      setStatus("");
    } catch {
      setStatus("Educational readout is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-sky-400/25 bg-[#06101F] p-5 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <BrainCircuit
              className="h-5 w-5 shrink-0 text-sky-300"
              aria-hidden="true"
            />
            <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              AI Dev V1
            </div>
          </div>
          <h3 className="mt-2 text-xl font-black text-slate-50">
            Karpilo LoadIQ Educational Readout
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Interprets the calculator output for learning only. The deterministic
            load analysis remains the source of truth.
          </p>
        </div>

        <button
          type="button"
          onClick={requestInsight}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-200 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {analysis ? "Refresh Readout" : "Generate Readout"}
        </button>
      </div>

      {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}

      {analysis && (
        <div className="mt-5 grid gap-4">
          <InsightSection title="LoadIQ Readout" body={analysis.loadiqReadout} />
          <InsightSection title="Margin Lesson" body={analysis.marginLesson} />
          <InsightSection
            title="Negotiation Lens"
            body={analysis.negotiationLens}
          />

          <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-red-200">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Risk Signals
            </div>
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              {analysis.riskSignals.map((signal) => (
                <li key={signal}>• {signal}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-sky-300">
              Driver Questions
            </div>
            <ul className="space-y-2 text-sm leading-6 text-slate-300">
              {analysis.driverQuestions.map((question) => (
                <li key={question}>• {question}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4 text-xs leading-6 text-slate-500">
            Confidence: {analysis.confidence}. {analysis.educationalDisclaimer}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightSection({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4">
      <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-sky-300">
        {title}
      </div>
      <p className="text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}
