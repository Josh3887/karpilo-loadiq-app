import Link from "next/link";
import { redirect } from "next/navigation";

import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { OperatorBadges } from "@/components/dashboard/operator-badges";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { BRAND } from "@/config/brand";
import { getOperatorProgramStatus } from "@/domains/billing/operator-program";
import { createClient } from "@/lib/supabase-server";

export default async function OnboardingPage() {
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
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <LoadIqMark />
            <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              {BRAND.productName}
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Operator Setup
            </h1>
            <OperatorBadges badges={operatorStatus.badges} />
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              A short setup makes the calculator faster and keeps recurring
              business assumptions out of the load screen.
            </p>
            </div>
          </div>

          <Link
            href="/dashboard/settings"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 hover:bg-sky-400/20"
          >
            Settings
          </Link>
        </header>

        <OnboardingChecklist operatorStatus={operatorStatus} />
      </div>
    </main>
  );
}
