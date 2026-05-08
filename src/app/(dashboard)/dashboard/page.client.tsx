"use client";

import { DashboardCard } from "@/components/ui/dashboard-card";
import { LoadInputForm } from "@/components/calculator/load-input-form";
import { ResultsPanel } from "@/components/dashboard/results-panel";
import { LogoutButton } from "@/components/auth/logout-button";

import { useLoadCalculator } from "@/hooks/use-load-calculator";

export default function DashboardClientPage() {
  const { result, calculate } = useLoadCalculator();

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-100 md:text-5xl">
              Freight Profitability Command Center
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Analyze load viability, deadhead exposure, fuel pressure,
              margin compression, and true RPM before accepting freight.
            </p>
          </div>

          <LogoutButton />
        </header>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <DashboardCard title="Load Input">
            <LoadInputForm onCalculate={calculate} />
          </DashboardCard>

          <ResultsPanel result={result} />
        </section>
      </div>
    </main>
  );
}