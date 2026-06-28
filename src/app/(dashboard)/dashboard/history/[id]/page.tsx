import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AtlasRouteIntelligenceSurface } from "@/components/ai/atlas-route-intelligence-surface";
import { SavedLoadActions } from "@/components/dashboard/saved-load-actions";
import { EntityNoteForm } from "@/components/dashboard/entity-note-form";
import { createClient } from "@/lib/supabase-server";
import {
  formatRoutePoint,
  SavedLoadStopRecord,
} from "@/services/route-intelligence";
import {
  getExpenseCategoryLabel,
  normalizeSavedLoadActuals,
} from "@/services/post-trip-actuals";
import { PostTripActualExpense, SavedLoadActuals } from "@/types/saved-load";
import { LoadInput } from "@/types/load";

import {
  formatCurrency,
  formatFuelPrice,
  formatPercent,
  formatRpm,
} from "@/utils/format";

type LoadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LoadDetailPage({
  params,
}: LoadDetailPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
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

  const resultSnapshot = load.result_snapshot as {
    fuelPercentOfGross?: number;
    profitMarginPercent?: number;
    totalTripCost?: number;
    deadheadPercent?: number;
    dispatchDays?: number;
    deadheadDays?: number;
  } | null;
  const inputSnapshot = load.input_snapshot as Partial<LoadInput> | null;
  const snapshotFuelPercent = Number(resultSnapshot?.fuelPercentOfGross);
  const snapshotMarginPercent = Number(resultSnapshot?.profitMarginPercent);
  const fuelPercent = Number.isFinite(snapshotFuelPercent)
    ? snapshotFuelPercent
    : Number(load.gross_revenue) > 0
      ? (Number(load.fuel_cost) / Number(load.gross_revenue)) * 100
      : 0;

  const marginPercent = Number.isFinite(snapshotMarginPercent)
    ? snapshotMarginPercent
    : Number(load.gross_revenue) > 0
      ? (Number(load.estimated_net) / Number(load.gross_revenue)) * 100
      : 0;
  const actualNet =
    load.actual_net === null || load.actual_net === undefined
      ? null
      : Number(load.actual_net);
  const estimateVariance =
    actualNet === null
      ? null
      : actualNet - Number(load.estimated_net);
  const actuals = load.actuals_snapshot as Partial<SavedLoadActuals> | null;
  const originOdometerFromInput = Number(inputSnapshot?.originOdometer ?? 0);
  const actualsForForm: Partial<SavedLoadActuals> | null =
    originOdometerFromInput > 0 && !actuals?.originOdometer
      ? {
          ...(actuals ?? {}),
          originOdometer: originOdometerFromInput,
          odometerValidation: {
            originOdometer: originOdometerFromInput,
            capturedAtStatus:
              load.load_run_status ?? load.was_run_status ?? undefined,
            warnings: [],
          },
        }
      : actuals;
  const estimatedTripCost = Number(
    resultSnapshot?.totalTripCost ?? load.operational_cost ?? 0
  );
  const actualSummary = normalizeSavedLoadActuals(actuals, {
    grossRevenue: Number(load.gross_revenue),
    estimatedTripCost,
    totalTripMiles: Number(load.total_miles),
    paidLoadedMiles: Number(load.loaded_miles),
  });
  const estimatedTotalRouteMiles =
    inputSnapshot?.routeEstimate?.totalEstimate?.estimatedMiles ??
    (inputSnapshot?.routeLoadedMiles || inputSnapshot?.routeDeadheadMiles
      ? Number(inputSnapshot?.routeLoadedMiles ?? 0) +
        Number(inputSnapshot?.routeDeadheadMiles ?? 0)
      : Number(load.total_miles));
  const savedDeadheadPercent =
    Number(load.total_miles) > 0
      ? (Number(load.deadhead_miles) / Number(load.total_miles)) * 100
      : 0;
  const { data: stops } = await supabase
    .from("saved_load_stops")
    .select("*")
    .eq("saved_load_id", id)
    .eq("user_id", user.id)
    .order("stop_sequence", { ascending: true });
  const routeStops = (stops ?? []) as SavedLoadStopRecord[];

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Load Intelligence Detail
            </h1>

            <p className="mt-3 text-sm text-slate-400">
              Load #{formatLoadId(load)} · Trip #{formatTripNumber(load)} ·{" "}
              {formatLane(load)}
            </p>
          </div>

          <Link
            href="/dashboard/history"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 hover:bg-sky-400/20"
          >
            Back to History
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-3">
          <MetricCard
            label="Gross Revenue"
            value={formatCurrency(Number(load.gross_revenue))}
          />

          <MetricCard
            label="Estimated Net"
            value={formatCurrency(Number(load.estimated_net))}
          />

          <MetricCard
            label="Actual Net"
            value={
              actualNet === null
                ? "Not posted"
                : formatCurrency(actualNet)
            }
          />

          <MetricCard
            label="Variance"
            value={
              estimateVariance === null
                ? "Pending"
                : formatCurrency(estimateVariance)
            }
          />

          <MetricCard
            label="True RPM"
            value={formatRpm(Number(load.true_rpm))}
          />

          <MetricCard
            label="Fuel Cost"
            value={formatCurrency(Number(load.fuel_cost))}
          />

          <MetricCard
            label="Fuel Estimate"
            value={
              load.estimated_fuel_price
                ? formatFuelPrice(Number(load.estimated_fuel_price))
                : "Not stored"
            }
          />

          <MetricCard
            label="Fuel Source"
            value={
              load.fuel_override
                ? "User Override"
                : load.fuel_estimate_source ?? "Manual"
            }
          />

          <MetricCard
            label="Actual Fuel"
            value={
              load.actual_fuel_price
                ? formatFuelPrice(Number(load.actual_fuel_price))
                : "Pending"
            }
          />

          <MetricCard
            label="Fuel %"
            value={formatPercent(fuelPercent)}
          />

          <MetricCard
            label="Margin %"
            value={formatPercent(marginPercent)}
          />

          <MetricCard
            label="Profitability Score"
            value={`${load.profitability_score}/100`}
          />

          <MetricCard
            label="Profitability Band"
            value={load.profitability_band}
          />

          <MetricCard
            label="Total Miles"
            value={Number(load.total_miles).toFixed(0)}
          />

          <MetricCard
            label="Status"
            value={load.status ?? "estimated"}
          />
        </section>

        {actualNet !== null && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
              Actual Trip Result
            </h2>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <BreakdownRow
                label="Estimated Trip Cost"
                value={formatCurrency(estimatedTripCost)}
              />
              <BreakdownRow
                label="Actual Expense Total"
                value={formatCurrency(actualSummary.actualExpenseTotal ?? 0)}
              />
              <BreakdownRow
                label="Estimated vs Actual Delta"
                value={formatCurrency(actualSummary.estimatedVsActualDelta ?? 0)}
              />
              <BreakdownRow
                label="Actual Net Profit"
                value={formatCurrency(actualSummary.actualNetProfit ?? 0)}
              />
              <BreakdownRow
                label="Actual Profit / Mile"
                value={formatRpm(actualSummary.actualProfitPerMile ?? 0)}
              />
              <BreakdownRow
                label="Actual Fuel $/Gal"
                value={formatFuelPrice(actualSummary.actualFuelPrice)}
              />
              {actualSummary.odometerValidation?.actualTotalMiles && (
                <BreakdownRow
                  label="Actual Odometer Miles"
                  value={`${Number(
                    actualSummary.odometerValidation.actualTotalMiles
                  ).toLocaleString()} mi`}
                />
              )}
            </div>

            {actualSummary.postTripActualExpenses &&
              actualSummary.postTripActualExpenses.length > 0 && (
                <div className="mt-5 space-y-3">
                  {actualSummary.postTripActualExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
                            {getExpenseCategoryLabel(expense.expenseCategory)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-100">
                            {expense.expenseSubcategory}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {[expense.vendorName, formatExpenseLocation(expense), expense.date]
                              .filter(Boolean)
                              .join(" · ") || "No vendor/location/date provided"}
                          </p>
                        </div>
                        <p className="text-sm font-black text-slate-100">
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                      {(expense.pricePerGallon || expense.quantityGallons) && (
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          {formatFuelPrice(Number(expense.pricePerGallon ?? 0))} ×{" "}
                          {Number(expense.quantityGallons ?? 0).toFixed(2)} gal
                        </p>
                      )}
                      {expense.notes && (
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                          {expense.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {actuals?.notes && (
              <p className="mt-4 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm leading-6 text-slate-300">
                {actuals.notes}
              </p>
            )}
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
          <AtlasRouteIntelligenceSurface
            deadheadOrigin={formatDeadheadOrigin(load)}
            pickup={formatCityState(load.pickup_city, load.pickup_state)}
            delivery={formatCityState(load.delivery_city, load.delivery_state)}
            loadedMiles={Number(load.loaded_miles)}
            deadheadMiles={Number(load.deadhead_miles)}
            totalMiles={Number(load.total_miles)}
            deadheadPercent={Number(
              resultSnapshot?.deadheadPercent ?? savedDeadheadPercent
            )}
            routeStopCount={Number(load.route_stop_count ?? routeStops.length ?? 0)}
            stopOffCount={routeStops.filter((stop) => stop.stop_type === "stop_off").length}
            dispatchDays={Number(resultSnapshot?.dispatchDays ?? 0)}
            deadheadDays={Number(resultSnapshot?.deadheadDays ?? 0)}
            pickupDate={inputSnapshot?.pickupDate}
            deliveryDate={inputSnapshot?.deliveryDate}
            deadheadStartDate={inputSnapshot?.deadheadStartDate}
            deadheadEndDate={inputSnapshot?.deadheadEndDate}
            estimatedLoadWeightLbs={Number(load.estimated_load_weight_lbs ?? 0)}
            routeModelVersion={load.route_model_version ?? "Legacy load"}
            reserveMode={formatReserveMode(load.reserve_allocation_mode)}
            targetRpmSnapshot={formatRpm(Number(load.target_true_rpm_snapshot ?? load.true_rpm))}
          />

          {routeStops.length > 0 && (
            <div className="mt-5 space-y-3">
              {routeStops.map((stop) => (
                <div
                  key={stop.id ?? `${stop.stop_type}-${stop.stop_sequence}`}
                  className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
                        {stop.stop_sequence}. {formatStopType(stop.stop_type)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-100">
                        {formatRoutePoint(stop) || "Location pending"}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {stop.miles_from_previous
                        ? `${Number(stop.miles_from_previous).toFixed(0)} mi from previous`
                        : "Miles not modeled"}
                    </p>
                  </div>
                  {(stop.stop_revenue || stop.stop_expense || stop.notes) && (
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {stop.stop_revenue
                        ? `Revenue ${formatCurrency(Number(stop.stop_revenue))}. `
                        : ""}
                      {stop.stop_expense
                        ? `Expense ${formatCurrency(Number(stop.stop_expense))}. `
                        : ""}
                      {stop.notes ?? ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {Array.isArray(load.warnings) &&
          load.warnings.length > 0 && (
            <section className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
              <h2 className="mb-4 text-lg font-bold text-red-300">
                Operational Warnings
              </h2>

              <div className="space-y-3">
                {load.warnings.map(
                  (
                    warning: {
                      message: string;
                    },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="rounded-xl border border-red-500/10 bg-[#060B14] p-4 text-sm text-slate-300"
                    >
                      {warning.message}
                    </div>
                  )
                )}
              </div>
            </section>
          )}

        <SavedLoadActions
          loadId={id}
          initialActuals={actualsForForm}
          grossRevenue={Number(load.gross_revenue)}
          estimatedTripCost={estimatedTripCost}
          totalTripMiles={Number(load.total_miles)}
          paidLoadedMiles={Number(load.loaded_miles)}
          estimatedTotalRouteMiles={estimatedTotalRouteMiles}
          loadStatus={load.status}
          loadRunStatus={load.load_run_status ?? load.was_run_status}
        />
        <EntityNoteForm savedLoadId={id} />
      </div>
    </main>
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

type MetricCardProps = {
  label: string;
  value: string;
};

function MetricCard({
  label,
  value,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>

      <div className="mt-3 text-2xl font-black text-slate-100">
        {value}
      </div>
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

function formatCityState(
  city?: string | null,
  state?: string | null,
  zip?: string | null
) {
  return [city, state, zip].filter(Boolean).join(", ");
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

function formatExpenseLocation(expense: PostTripActualExpense) {
  return (
    [expense.city, expense.state].filter(Boolean).join(", ") ||
    expense.location ||
    ""
  );
}
