import Link from "next/link";

import { buildScenarioComparisons } from "@/domains/calculator/scenario-comparison";
import { LoadInput } from "@/types/load";
import { formatCurrency, formatRpm } from "@/utils/format";

type ScenarioComparisonPanelProps = {
  input: LoadInput;
  canCompareScenarios: boolean;
};

export function ScenarioComparisonPanel({
  input,
  canCompareScenarios,
}: ScenarioComparisonPanelProps) {
  const comparisons = buildScenarioComparisons(input);
  const visibleComparisons = canCompareScenarios
    ? comparisons
    : comparisons.slice(0, 2);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.18em] text-slate-400">
            Scenario Comparison
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Compare pay structures against the same lane and cost assumptions.
          </p>
        </div>

        {!canCompareScenarios && (
          <Link
            href="/dashboard/billing"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
          >
            Unlock Gold
          </Link>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-180 text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="py-3">Model</th>
              <th className="py-3">Net</th>
              <th className="py-3">True RPM</th>
              <th className="py-3">Break-Even</th>
              <th className="py-3">Daily</th>
              <th className="py-3">Score</th>
            </tr>
          </thead>

          <tbody>
            {visibleComparisons.map((comparison) => (
              <tr
                key={comparison.id}
                className="border-b border-slate-800/80 text-slate-300"
              >
                <td className="py-4">
                  <div className="font-semibold text-slate-100">
                    {comparison.label}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">
                    {comparison.description}
                  </div>
                </td>
                <td
                  className={
                    comparison.result.estimatedNet >= 0
                      ? "py-4 text-emerald-300"
                      : "py-4 text-red-300"
                  }
                >
                  {formatCurrency(comparison.result.estimatedNet)}
                </td>
                <td className="py-4">
                  {formatRpm(comparison.result.trueRpm)}
                </td>
                <td className="py-4">
                  {formatRpm(comparison.result.breakEvenRpm)}
                </td>
                <td className="py-4">
                  {formatCurrency(comparison.result.dailyProfitability)}
                </td>
                <td className="py-4">
                  {comparison.result.profitabilityScore}/100
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!canCompareScenarios && (
        <p className="mt-4 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm leading-6 text-sky-100">
          Active Gold or grandfathered access unlocks the full scenario table,
          including lease split and independent authority assumptions.
        </p>
      )}
    </div>
  );
}
