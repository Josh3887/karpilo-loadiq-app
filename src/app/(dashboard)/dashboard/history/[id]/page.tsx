import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SavedLoadActions } from "@/components/dashboard/saved-load-actions";
import { EntityNoteForm } from "@/components/dashboard/entity-note-form";
import { createClient } from "@/lib/supabase-server";
import { SavedLoadActuals } from "@/types/saved-load";

import {
  formatCurrency,
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

  const fuelPercent =
    Number(load.gross_revenue) > 0
      ? (Number(load.fuel_cost) /
          Number(load.gross_revenue)) *
        100
      : 0;

  const marginPercent =
    Number(load.gross_revenue) > 0
      ? (Number(load.estimated_net) /
          Number(load.gross_revenue)) *
        100
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
                ? `${formatCurrency(Number(load.estimated_fuel_price))}/gal`
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
                ? `${formatCurrency(Number(load.actual_fuel_price))}/gal`
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
              Actual Cost Breakdown
            </h2>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              <BreakdownRow
                label="Fuel"
                value={formatCurrency(Number(actuals?.fuelCost ?? 0))}
              />
              <BreakdownRow
                label="Actual Fuel $/Gal"
                value={formatCurrency(Number(actuals?.actualFuelPrice ?? 0))}
              />
              <BreakdownRow
                label="Tolls"
                value={formatCurrency(Number(actuals?.tolls ?? 0))}
              />
              <BreakdownRow
                label="Lumpers"
                value={formatCurrency(Number(actuals?.lumpers ?? 0))}
              />
              <BreakdownRow
                label="Maintenance"
                value={formatCurrency(Number(actuals?.maintenance ?? 0))}
              />
              <BreakdownRow
                label="Parking"
                value={formatCurrency(Number(actuals?.parking ?? 0))}
              />
              <BreakdownRow
                label="Other"
                value={formatCurrency(Number(actuals?.other ?? 0))}
              />
            </div>

            {actuals?.notes && (
              <p className="mt-4 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm leading-6 text-slate-300">
                {actuals.notes}
              </p>
            )}
          </section>
        )}

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

        <SavedLoadActions loadId={id} />
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
