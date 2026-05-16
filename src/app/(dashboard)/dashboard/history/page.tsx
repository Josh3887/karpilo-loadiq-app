import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { createClient } from "@/lib/supabase-server";
import { formatCurrency, formatRpm } from "@/utils/format";

type SavedLoad = {
  id: string;
  pickup_zip: string;
  pickup_city: string | null;
  pickup_state: string | null;
  delivery_zip: string;
  delivery_city: string | null;
  delivery_state: string | null;
  gross_revenue: number;
  estimated_net: number;
  true_rpm: number;
  actual_net: number | null;
  profitability_score: number;
  profitability_band: string;
  status: string;
  load_id?: number | null;
  trip_number?: string | null;
  loadiq_load_number: string | null;
  driver_load_number: string | null;
  load_outcome: string | null;
  created_at: string;
};

export default async function LoadHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: loads, error } = await supabase
    .from("saved_loads")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const typedLoads = (loads ?? []) as SavedLoad[];
  const completedOrSavedLoads = typedLoads.filter((load) =>
    ["saved", "accepted", "completed"].includes(load.status ?? "saved")
  );
  const averageTrueRpm =
    completedOrSavedLoads.length > 0
      ? completedOrSavedLoads.reduce(
          (total, load) => total + Number(load.true_rpm),
          0
        ) / completedOrSavedLoads.length
      : 0;

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Load History
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Review saved load decisions and profitability outcomes.
            </p>
          </div>

          <DashboardNav />
        </header>

        <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 pb-24 shadow-[0_0_25px_rgba(56,189,248,0.08)] md:pb-5">
          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <HistoryMetric
              label="Saved/Accepted Loads"
              value={String(completedOrSavedLoads.length)}
            />
            <HistoryMetric
              label="Avg True RPM"
              value={averageTrueRpm > 0 ? formatRpm(averageTrueRpm) : "Pending"}
            />
            <HistoryMetric
              label="Completed"
              value={String(typedLoads.filter((load) => load.status === "completed").length)}
            />
          </div>

          {!loads || loads.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              No saved loads yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="py-3">Load</th>
                    <th className="py-3">Lane</th>
                    <th className="py-3">Gross</th>
                    <th className="py-3">Est. Net</th>
                    <th className="py-3">Actual</th>
                    <th className="py-3">True RPM</th>
                    <th className="py-3">Score</th>
                    <th className="py-3">Band</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Report</th>
                    <th className="py-3">Saved</th>
                  </tr>
                </thead>

                <tbody>
                  {typedLoads.map((load) => {
                    const rpmDelta =
                      averageTrueRpm > 0
                        ? Number(load.true_rpm) - averageTrueRpm
                        : 0;

                    return (
                    <tr
                      key={load.id}
                      className="border-b border-slate-800/80 text-slate-300 transition hover:bg-sky-400/5"
                    >
                      <td className="py-4 font-semibold text-slate-100">
                        <Link href={`/dashboard/history/${load.id}`} className="text-sky-300 hover:text-sky-200">
                          Load #{formatLoadId(load)}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">
                          Trip #{formatTripNumber(load)}
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-slate-100">
                        {formatLane(load)}
                      </td>
                      <td className="py-4">
                        {formatCurrency(Number(load.gross_revenue))}
                      </td>
                      <td className="py-4">
                        {formatCurrency(Number(load.estimated_net))}
                      </td>
                      <td className="py-4">
                        {load.actual_net === null || load.actual_net === undefined
                          ? "Pending"
                          : formatCurrency(Number(load.actual_net))}
                      </td>
                      <td className="py-4">
                        {formatRpm(Number(load.true_rpm))}
                        {averageTrueRpm > 0 && (
                          <div
                            className={
                              rpmDelta < 0
                                ? "mt-1 text-xs text-red-300"
                                : "mt-1 text-xs text-sky-300"
                            }
                          >
                            {rpmDelta >= 0 ? "+" : ""}
                            {formatRpm(rpmDelta)} vs avg
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        {load.profitability_score}/100
                      </td>
                      <td className="py-4 capitalize">
                        {load.profitability_band}
                      </td>
                      <td className="py-4 capitalize text-slate-400">
                        {load.status ?? "estimated"}
                        {load.load_outcome && load.load_outcome !== "unknown" && (
                          <div className="mt-1 text-xs text-slate-500">
                            {load.load_outcome.replaceAll("_", " ")}
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <Link
                          href={`/dashboard/history/${load.id}/report`}
                          className="text-sky-300 hover:text-sky-200"
                        >
                          Print
                        </Link>
                      </td>
                      <td className="py-4 text-slate-500">
                        {new Date(load.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-slate-100">{value}</div>
    </div>
  );
}

function formatLoadId(load: SavedLoad) {
  if (typeof load.load_id === "number") {
    return String(load.load_id);
  }

  const legacyNumber = load.loadiq_load_number?.match(/\d+/)?.[0];
  return legacyNumber ? String(Number(legacyNumber)) : "pending";
}

function formatTripNumber(load: SavedLoad) {
  if (load.trip_number) return load.trip_number;
  if (load.driver_load_number) return load.driver_load_number;
  return `AUTO-${formatLoadId(load)}`;
}

function formatLane(load: SavedLoad) {
  const pickup = formatCityState(load.pickup_city, load.pickup_state);
  const delivery = formatCityState(load.delivery_city, load.delivery_state);

  if (pickup && delivery) return `${pickup} -> ${delivery}`;
  return "Lane pending";
}

function formatCityState(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(", ");
}
