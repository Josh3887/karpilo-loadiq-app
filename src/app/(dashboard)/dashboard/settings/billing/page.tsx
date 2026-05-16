import Link from "next/link";
import { redirect } from "next/navigation";

import { PaymentAccessActions } from "@/components/billing/payment-access-actions";
import {
  SettingsMetric,
  SettingsPageShell,
  SettingsPanel,
  StatusPill,
} from "@/components/settings/settings-shell";
import { BILLING_EMAIL } from "@/config/billing";
import { formatPlanTierLabel } from "@/domains/billing/plan-limits";
import { getServerPaymentAccess } from "@/domains/billing/server-entitlements";
import { getPreviewPaymentAccess } from "@/lib/preview-data";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase-server";
import { getUserReservationAndLockState } from "@/services/reservations";

export default async function BillingSettingsPage() {
  const previewMode = await isPreviewModeEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !previewMode) {
    redirect("/auth/login");
  }

  if (previewMode && !user) {
    return (
      <BillingSettingsContent
        paymentAccess={getPreviewPaymentAccess()}
        reservationState={{ reservations: [], locks: [] }}
      />
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  const [paymentAccess, reservationState] = await Promise.all([
    getServerPaymentAccess(user.id),
    getUserReservationAndLockState(user.id),
  ]);

  return (
    <BillingSettingsContent
      paymentAccess={paymentAccess}
      reservationState={reservationState}
    />
  );
}

function BillingSettingsContent({
  paymentAccess,
  reservationState,
}: {
  paymentAccess: Awaited<ReturnType<typeof getServerPaymentAccess>>;
  reservationState: Awaited<ReturnType<typeof getUserReservationAndLockState>>;
}) {
  const lifecycleDate =
    paymentAccess.canceledAt ??
    paymentAccess.currentPeriodEnd ??
    paymentAccess.trialEnd;

  return (
    <SettingsPageShell
      title="Billing Command"
      description="One entitlement brain, multiple payment rails. Stripe, Apple, Google, manual, or unknown provider states all feed the same access decision."
      actions={
        <StatusPill tone={paymentAccess.hasActiveAccess ? "green" : "red"}>
          {formatStatus(paymentAccess.entitlementStatus)}
        </StatusPill>
      }
    >
      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SettingsMetric
          label="Current Plan"
          value={formatPlanTierLabel(paymentAccess.tier)}
          detail="Resolved from subscription entitlement"
          tone="blue"
        />
        <SettingsMetric
          label="Entitlement"
          value={formatStatus(paymentAccess.entitlementStatus)}
          detail={paymentAccess.hasActiveAccess ? "Access active" : "Needs billing setup"}
          tone={paymentAccess.hasActiveAccess ? "green" : "red"}
        />
        <SettingsMetric
          label="Billing Provider"
          value={formatStatus(paymentAccess.billingProvider)}
          detail={paymentAccess.hasStripeCustomer ? "Stripe customer linked" : "No Stripe customer link"}
        />
        <SettingsMetric
          label="Lifecycle Date"
          value={formatDate(lifecycleDate)}
          detail={paymentAccess.cancelAtPeriodEnd ? "Cancel at period end" : "Renewal or trial marker"}
        />
      </section>

      <SettingsPanel
        title="Payment Access"
        description="Use the correct payment rail for the account. Stripe-managed users go to Stripe; Apple and Google users stay with their app-store subscription manager."
      >
        <PaymentAccessActions
          paymentAccess={paymentAccess}
          billingEmail={BILLING_EMAIL}
        />
      </SettingsPanel>

      {(reservationState.reservations.length > 0 ||
        reservationState.locks.length > 0) && (
        <SettingsPanel
          title="Pricing Lock State"
          description="Reservation and pricing lock records remain separate from the payment provider and are not overwritten here."
          kicker="Rollout Access"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {reservationState.reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm text-slate-300"
              >
                <div className="break-words font-black text-slate-100">
                  {reservation.cohort} reservation
                </div>
                <div className="mt-2 break-words [overflow-wrap:anywhere]">
                  Code {reservation.code} · {reservation.status}
                </div>
                <div className="mt-1 break-words text-slate-500">
                  ${reservation.monthly_price}/mo · $
                  {reservation.annual_price}/yr
                </div>
              </div>
            ))}
            {reservationState.locks.map((lock) => (
              <div
                key={lock.id}
                className="min-w-0 overflow-hidden rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm text-sky-100"
              >
                <div className="break-words font-black text-slate-100">
                  {lock.cohort} pricing lock
                </div>
                <div className="mt-2 break-words [overflow-wrap:anywhere]">
                  {lock.lock_status} via {lock.billing_provider}
                </div>
                <div className="mt-1 break-words text-sky-200/75">
                  ${lock.monthly_price}/mo · ${lock.annual_price}/yr
                </div>
              </div>
            ))}
          </div>
        </SettingsPanel>
      )}

      <SettingsPanel
        title="Plan Catalog"
        description="Plan selection, checkout, and full pricing details stay in the existing billing route."
      >
        <Link
          href="/dashboard/billing"
          className="inline-flex rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Open Billing & Plan
        </Link>
      </SettingsPanel>
    </SettingsPageShell>
  );
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
