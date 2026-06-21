import {
  formatAccessStatus,
  formatLaunchPhase,
  formatPlanKey,
  type AccessStatus,
  type LaunchPhase,
  type PlanKey,
} from "@/lib/portal/access";

export function AccessStatusBanner({
  status,
  launchPhase,
  planInterest,
}: {
  status?: AccessStatus | null;
  launchPhase?: LaunchPhase | null;
  planInterest?: PlanKey | null;
}) {
  return (
    <section className="rounded-lg border border-sky-400/25 bg-sky-400/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
        Controlled Access Status
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <StatusItem label="Access" value={formatAccessStatus(status)} />
        <StatusItem label="Launch Phase" value={formatLaunchPhase(launchPhase)} />
        <StatusItem label="Plan Interest" value={formatPlanKey(planInterest)} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">
        Public signup is not available at this time. Karpilo LoadIQ is
        preparing controlled access for beta, legacy, and founding operator
        launch phases.
      </p>
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}
