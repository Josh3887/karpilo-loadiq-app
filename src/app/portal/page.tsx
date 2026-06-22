import { BillingStatusCard } from "@/components/billing/BillingStatusCard";
import { LockedFeatureCard } from "@/components/portal/LockedFeatureCard";
import { formatAccessStatus, formatLaunchPhase, formatPlanKey } from "@/lib/portal/access";
import { getAuthenticatedPortalContext } from "@/lib/portal/server";

export const metadata = {
  title: "Portal | Karpilo LoadIQ App",
  description: "Primitive controlled Karpilo LoadIQ app portal dashboard.",
};

const lockedFeatures = [
  {
    title: "Calculator",
    featureKey: "calculator",
    description:
      "Full load calculator access remains locked outside this primitive portal surface.",
    scaffoldKeys: ["mileage"],
  },
  {
    title: "Reports",
    featureKey: "reports",
    description:
      "Saved reports and exports remain gated until entitlement and launch readiness are confirmed.",
  },
  {
    title: "Maps",
    featureKey: "maps",
    description:
      "Maps and routing context are not exposed as operational routing authority.",
    scaffoldKeys: ["maps", "mileage"],
  },
  {
    title: "AI Insights",
    featureKey: "ai_insights",
    description:
      "Atlas and AI insight surfaces remain governed internal/app features, not public claims.",
    scaffoldKeys: ["ai"],
  },
  {
    title: "Fleet Tools",
    featureKey: "fleet_tools",
    description:
      "FleetOS and fleet-management capabilities are not LoadIQ portal features in this task.",
  },
] as const;

export default async function PortalPage() {
  const { state } = await getAuthenticatedPortalContext();

  return (
    <>
      <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Access"
          value={formatAccessStatus(state.access?.status)}
        />
        <Metric
          label="Launch Phase"
          value={formatLaunchPhase(state.access?.launch_phase)}
        />
        <Metric
          label="Plan Interest"
          value={formatPlanKey(state.profile?.plan_interest ?? state.access?.plan_interest)}
        />
        <Metric
          label="Fit Check"
          value={state.latestFitCheck ? "Saved" : "Not started"}
        />
      </section>

      <BillingStatusCard state={state} />

      <section>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          Locked Product Areas
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lockedFeatures.map((feature) => (
            <LockedFeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0B1220] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}
