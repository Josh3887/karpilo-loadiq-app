import { CustomerPortalButton } from "@/components/billing/customer-portal-button";
import { formatPlanKey, PLAN_KEYS, type PlanKey } from "@/lib/portal/access";
import type { PortalState } from "@/lib/portal/server";

export function BillingStatusCard({ state }: { state: PortalState }) {
  const hasStripePortal =
    state.paymentAccess.hasStripeCustomer || Boolean(state.billing?.stripe_customer_id);
  const paymentTier = state.paymentAccess.tier;
  const paymentPlan = PLAN_KEYS.includes(paymentTier as PlanKey)
    ? (paymentTier as PlanKey)
    : null;
  const plan =
    state.billing?.plan_key ?? paymentPlan ?? state.access?.plan_interest ?? null;

  return (
    <section className="rounded-lg border border-white/10 bg-[#0B1220] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
        Billing Status
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <BillingMetric label="Current Plan" value={formatPlanKey(plan)} />
        <BillingMetric
          label="Subscription"
          value={
            state.billing?.subscription_status ??
            state.paymentAccess.entitlementStatus ??
            "No active subscription"
          }
        />
        <BillingMetric
          label="Provider"
          value={state.billing?.billing_provider ?? "Not connected"}
        />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">
        Public checkout is not available from this primitive portal. Stripe
        customer portal access appears only when an existing Stripe customer
        record is present and the server route can safely create a portal
        session.
      </p>
      {hasStripePortal ? (
        <div className="mt-4">
          <CustomerPortalButton />
        </div>
      ) : null}
    </section>
  );
}

function BillingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}
