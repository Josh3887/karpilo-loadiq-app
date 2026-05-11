import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase-server";
import { formatCurrency, formatRpm } from "@/utils/format";

type SavedLoad = {
  id: string;
  pickup_zip: string;
  delivery_zip: string;
  gross_revenue: number;
  estimated_net: number;
  true_rpm: number;
  actual_net: number | null;
  profitability_score: number;
  profitability_band: string;
  status: string;
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
    .select(
      "id, pickup_zip, delivery_zip, gross_revenue, estimated_net, actual_net, true_rpm, profitability_score, profitability_band, status, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

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

          <Link
            href="/dashboard"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 hover:bg-sky-400/20"
          >
            Dashboard
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.08)]">
          {!loads || loads.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              No saved loads yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.18em] text-slate-500">
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
                  {(loads as SavedLoad[]).map((load) => (
                    <tr
                      key={load.id}
                      className="border-b border-slate-800/80 text-slate-300 transition hover:bg-sky-400/5"
                    >
                      <td className="py-4 font-semibold text-slate-100">
                        <Link href={`/dashboard/history/${load.id}`} className="text-sky-300 hover:text-sky-200">
                          {load.pickup_zip} → {load.delivery_zip}
                        </Link>
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
                      </td>
                      <td className="py-4">
                        {load.profitability_score}/100
                      </td>
                      <td className="py-4 capitalize">
                        {load.profitability_band}
                      </td>
                      <td className="py-4 capitalize text-slate-400">
                        {load.status ?? "estimated"}
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
