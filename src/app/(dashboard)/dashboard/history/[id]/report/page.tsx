import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getServerEntitlements } from "@/domains/billing/server-entitlements";
import { createClient } from "@/lib/supabase-server";
import {
  formatRoutePoint,
  SavedLoadStopRecord,
} from "@/services/route-intelligence";
import {
  getExpenseCategoryLabel,
  normalizeSavedLoadActuals,
} from "@/services/post-trip-actuals";
import { SavedLoadActuals } from "@/types/saved-load";
import {
  formatCurrency,
  formatFuelPrice,
  formatNumber,
  formatPercent,
  formatRpm,
} from "@/utils/format";

type LoadReportPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LoadReportPage({ params }: LoadReportPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const entitlements = await getServerEntitlements(user.id);

  if (!entitlements.canExport) {
    return (
      <main className="min-h-screen bg-[#060B14] px-4 py-8 text-slate-100 print:bg-white print:text-black">
        <div className="mx-auto max-w-3xl rounded-2xl border border-sky-400/20 bg-sky-400/5 p-6 print:border-black print:bg-white">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-300 print:text-black">
            Karpilo LoadIQ
          </p>
          <h1 className="text-3xl font-black">Reports require active access.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 print:text-black">
            Activate Gold, Pilot, Legacy Launch, or Platinum access to
            print/export saved load intelligence reports.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-6 inline-flex rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 print:hidden"
          >
            View Plans
          </Link>
        </div>
      </main>
    );
  }

  const { data: load, error } = await supabase
    .from("saved_loads")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !load) {
    notFound();
  }

  const result = load.result_snapshot as {
    costPerMile?: number;
    breakEvenRpm?: number;
    dailyProfitability?: number;
    fuelPercentOfGross?: number;
    totalTripCost?: number;
    explanations?: string[];
  } | null;
  const actuals = load.actuals_snapshot as Partial<SavedLoadActuals> | null;
  const estimatedTripCost = Number(result?.totalTripCost ?? load.operational_cost ?? 0);
  const actualSummary = normalizeSavedLoadActuals(actuals, {
    grossRevenue: Number(load.gross_revenue),
    estimatedTripCost,
    totalTripMiles: Number(load.total_miles),
  });
  const actualNet =
    load.actual_net === null || load.actual_net === undefined
      ? null
      : Number(load.actual_net);
  const variance =
    actualNet === null ? null : actualNet - Number(load.estimated_net);
  const snapshotFuelPercent = Number(result?.fuelPercentOfGross);
  const { data: stops } = await supabase
    .from("saved_load_stops")
    .select("*")
    .eq("saved_load_id", id)
    .eq("user_id", user.id)
    .order("stop_sequence", { ascending: true });
  const routeStops = (stops ?? []) as SavedLoadStopRecord[];
  const fuelPercent = Number.isFinite(snapshotFuelPercent)
    ? snapshotFuelPercent
    : Number(load.gross_revenue) > 0
      ? (Number(load.fuel_cost) / Number(load.gross_revenue)) * 100
      : 0;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-xl print:shadow-none">
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-300 pb-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-700">
              Karpilo LoadIQ
            </p>
            <h1 className="text-4xl font-black">Load Intelligence Report</h1>
            <p className="mt-2 text-sm text-slate-600">
              Load #{formatLoadId(load)} · Trip #{formatTripNumber(load)} ·{" "}
              {formatLane(load)}
            </p>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <ReportMetric
            label="Gross"
            value={formatCurrency(Number(load.gross_revenue))}
          />
          <ReportMetric
            label="Estimated Net"
            value={formatCurrency(Number(load.estimated_net))}
          />
          <ReportMetric
            label="Actual Net"
            value={actualNet === null ? "Pending" : formatCurrency(actualNet)}
          />
          <ReportMetric
            label="True RPM"
            value={formatRpm(Number(load.true_rpm))}
          />
          <ReportMetric
            label="Break-Even RPM"
            value={formatRpm(Number(result?.breakEvenRpm ?? 0))}
          />
          <ReportMetric
            label="Cost/Mile"
            value={formatRpm(Number(result?.costPerMile ?? 0))}
          />
          <ReportMetric
            label="Fuel %"
            value={formatPercent(fuelPercent)}
          />
          <ReportMetric
            label="Fuel Estimate"
            value={
              load.estimated_fuel_price
                ? formatFuelPrice(Number(load.estimated_fuel_price))
                : "Not stored"
            }
          />
          <ReportMetric
            label="Actual Fuel"
            value={
              load.actual_fuel_price
                ? formatFuelPrice(Number(load.actual_fuel_price))
                : "Pending"
            }
          />
          <ReportMetric
            label="Daily Net"
            value={formatCurrency(Number(result?.dailyProfitability ?? 0))}
          />
          <ReportMetric
            label="Variance"
            value={variance === null ? "Pending" : formatCurrency(variance)}
          />
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Trip Breakdown
            </h2>
            <ReportRow
              label="Total Miles"
              value={`${formatNumber(Number(load.total_miles))} mi`}
            />
            <ReportRow
              label="Fuel Cost"
              value={formatCurrency(Number(load.fuel_cost))}
            />
            <ReportRow
              label="Fuel Source"
              value={
                load.fuel_override
                  ? "User Override"
                  : load.fuel_estimate_source ?? "Manual"
              }
            />
            <ReportRow
              label="Operational Cost"
              value={formatCurrency(Number(load.operational_cost))}
            />
            <ReportRow
              label="Profitability Score"
              value={`${load.profitability_score}/100`}
            />
            <ReportRow label="Status" value={load.status ?? "estimated"} />
          </div>

          <div>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Route Intelligence
            </h2>
            <ReportRow
              label="Deadhead Origin"
              value={formatDeadheadOrigin(load)}
            />
            <ReportRow
              label="Modeled Stops"
              value={`${Number(load.route_stop_count ?? routeStops.length ?? 0)} total`}
            />
            <ReportRow
              label="Estimated Weight"
              value={formatWeight(load.estimated_load_weight_lbs)}
            />
            <ReportRow
              label="Reserve Mode"
              value={formatReserveMode(load.reserve_allocation_mode)}
            />
            <ReportRow
              label="Target RPM Snapshot"
              value={formatRpm(Number(load.target_true_rpm_snapshot ?? load.true_rpm))}
            />
          </div>
        </section>

        {routeStops.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Modeled Route Stops
            </h2>
            <div className="space-y-2">
              {routeStops.map((stop) => (
                <ReportRow
                  key={stop.id ?? `${stop.stop_type}-${stop.stop_sequence}`}
                  label={`${stop.stop_sequence}. ${formatStopType(stop.stop_type)}`}
                  value={formatRoutePoint(stop) || "Location pending"}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
              Actual Trip Result
            </h2>
            <ReportRow
              label="Estimated Trip Cost"
              value={formatCurrency(estimatedTripCost)}
            />
            <ReportRow
              label="Actual Expense Total"
              value={formatCurrency(actualSummary.actualExpenseTotal ?? 0)}
            />
            <ReportRow
              label="Estimated vs Actual Delta"
              value={formatCurrency(actualSummary.estimatedVsActualDelta ?? 0)}
            />
            <ReportRow
              label="Actual Net Profit"
              value={formatCurrency(actualSummary.actualNetProfit ?? 0)}
            />
            <ReportRow
              label="Actual Profit / Mile"
              value={formatRpm(actualSummary.actualProfitPerMile ?? 0)}
            />
            <ReportRow
              label="Actual Fuel $/Gal"
              value={formatFuelPrice(actualSummary.actualFuelPrice)}
            />
          </div>
        </section>

        {actualSummary.postTripActualExpenses &&
          actualSummary.postTripActualExpenses.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                Post-Trip Expenses
              </h2>
              <div className="space-y-2">
                {actualSummary.postTripActualExpenses.map((expense) => (
                  <ReportRow
                    key={expense.id}
                    label={`${getExpenseCategoryLabel(expense.expenseCategory)} · ${expense.expenseSubcategory}`}
                    value={formatCurrency(expense.amount)}
                  />
                ))}
              </div>
            </section>
          )}

        {Array.isArray(result?.explanations) &&
          result.explanations.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                Profit Intelligence
              </h2>
              <div className="space-y-2 text-sm leading-6 text-slate-700">
                {result.explanations.map((explanation) => (
                  <p key={explanation}>{explanation}</p>
                ))}
              </div>
            </section>
          )}

        <section className="mt-8 border-t border-slate-300 pt-4 text-xs leading-5 text-slate-500">
          Karpilo LoadIQ reports are estimates and operational summaries based
          on values entered into the app. Verify against rate confirmations,
          receipts, reimbursements, settlement statements, and professional tax
          or legal guidance.
        </section>
      </div>
    </main>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-black">{value}</div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function formatLoadId(load: {
  load_id?: number | null;
  loadiq_load_number?: string | null;
}) {
  if (typeof load.load_id === "number") return String(load.load_id);
  const legacyNumber = load.loadiq_load_number?.match(/\d+/)?.[0];
  return legacyNumber ? String(Number(legacyNumber)) : "pending";
}

function formatTripNumber(load: {
  trip_number?: string | null;
  driver_load_number?: string | null;
  load_id?: number | null;
  loadiq_load_number?: string | null;
}) {
  if (load.trip_number) return load.trip_number;
  if (load.driver_load_number) return load.driver_load_number;
  return `AUTO-${formatLoadId(load)}`;
}

function formatLane(load: {
  pickup_city?: string | null;
  pickup_state?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
}) {
  const pickup = [load.pickup_city, load.pickup_state].filter(Boolean).join(", ");
  const delivery = [load.delivery_city, load.delivery_state]
    .filter(Boolean)
    .join(", ");

  if (pickup && delivery) return `${pickup} -> ${delivery}`;
  return "Lane pending";
}

function formatDeadheadOrigin(load: {
  deadhead_start_city?: string | null;
  deadhead_start_state?: string | null;
  deadhead_start_zip?: string | null;
}) {
  return (
    formatRoutePoint({
      city: load.deadhead_start_city,
      state: load.deadhead_start_state,
      zip: load.deadhead_start_zip,
    }) || "Not provided"
  );
}

function formatWeight(weight?: number | null) {
  return weight ? `${Number(weight).toLocaleString()} lbs est.` : "Not provided";
}

function formatReserveMode(mode?: string | null) {
  if (mode === "cpm") return "CPM allocation";
  if (mode === "percent") return "Percent allocation";
  if (mode === "flat") return "Flat allocation";
  return "Legacy/unknown";
}

function formatStopType(type: string) {
  if (type === "stop_off") return "Stop-Off";
  if (type === "pickup") return "Pickup";
  if (type === "delivery") return "Delivery";
  return type.replaceAll("_", " ");
}
