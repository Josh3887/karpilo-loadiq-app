import { redirect } from "next/navigation";

import { BackToDashboardLink } from "@/components/dashboard/back-to-dashboard-link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { OperatorBadges } from "@/components/dashboard/operator-badges";
import { OperationalProfileForm } from "@/components/dashboard/operational-profile-form";
import { OverheadManager } from "@/components/dashboard/overhead-manager";
import { getOperatorProgramStatus } from "@/domains/billing/operator-program";
import { createClient } from "@/lib/supabase-server";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const operatorStatus = await getOperatorProgramStatus(user.id);

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Operational Profile
            </h1>
            <OperatorBadges badges={operatorStatus.badges} />

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Centralize your driver profile, target profitability, truck
              assumptions, pay templates, and recurring overhead.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <DashboardNav />
            <BackToDashboardLink />
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-6 shadow-[0_0_25px_rgba(56,189,248,0.08)]">
          <OperationalProfileForm />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-6 shadow-[0_0_25px_rgba(56,189,248,0.08)]">
          <OverheadManager />
        </section>
      </div>
    </main>
  );
}
