import { BillingStatusCard } from "@/components/billing/BillingStatusCard";
import { getAuthenticatedPortalContext } from "@/lib/portal/server";

export const metadata = {
  title: "Billing | Karpilo LoadIQ App",
  description: "Primitive Karpilo LoadIQ app portal billing status.",
};

export default async function PortalBillingPage() {
  const { state } = await getAuthenticatedPortalContext();

  return (
    <div className="space-y-4">
      <BillingStatusCard state={state} />
      <section className="rounded-lg border border-red-400/25 bg-red-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">
          Checkout Status
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Public checkout is unavailable. Billing activation must remain
          server-authoritative and tied to controlled access approval, plan
          interest, launch phase, and payment-provider readiness.
        </p>
      </section>
    </div>
  );
}
