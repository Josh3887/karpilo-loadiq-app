import { FitCheckIntake } from "@/components/fitcheck/fitcheck-intake";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { BackToDashboardLink } from "@/components/dashboard/back-to-dashboard-link";

export default function FitCheckPage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 pb-24 pt-6 text-slate-100 md:px-8 md:pb-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ FitCheck
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Full FitCheck Intake
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
              Estimate what the business can currently pay the operator, compare
              it against operator income goals, and identify the lowest
              responsible Karpilo LoadIQ tier for decision support.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DashboardNav />
            <BackToDashboardLink />
          </div>
        </header>
        <FitCheckIntake />
      </div>
    </main>
  );
}
