import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutAcknowledgement } from "@/components/billing/checkout-acknowledgement";
import { CustomerPortalButton } from "@/components/billing/customer-portal-button";
import { InternalBillingTestHarnessPanel } from "@/components/billing/internal-billing-test-harness-panel";
import { OperatorBadges } from "@/components/dashboard/operator-badges";
import {
  FOUNDER_ACCESS,
  FUTURE_PLATFORM_FEATURE_SCOPE,
  INTERNAL_FOUNDER_PLANS,
  INTERNAL_PILOT_PLANS,
  PILOT_ACCESS,
  PLATINUM_ACCESS,
  PUBLIC_PRICING_PLANS,
  formatPriceLabel,
} from "@/config/pricing";
import { getOperatorProgramStatus } from "@/domains/billing/operator-program";
import {
  canClaimFounderAccess,
  founderSeatLabel,
} from "@/domains/billing/founder-access";
import {
  PLAN_LIMITS,
  formatPlanTierLabel,
} from "@/domains/billing/plan-limits";
import {
  type PaymentAccess,
  resolvePaymentAccess,
} from "@/domains/billing/entitlement-service";
import {
  getInternalBillingTestHarnessSnapshot,
  resolveInternalBillingTestSubscription,
} from "@/domains/billing/internal-test-harness";
import type { InternalBillingTestHarnessSnapshot } from "@/domains/billing/internal-test-harness-types";
import { StripeCheckoutPlanId } from "@/config/stripe";
import {
  getPreviewPaymentAccess,
  PREVIEW_OPERATOR_STATUS,
} from "@/lib/preview-data";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase-server";
import { getUserReservationAndLockState } from "@/services/reservations";

export default async function BillingPage() {
  const previewMode = await isPreviewModeEnabled();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !previewMode) {
    redirect("/auth/login");
  }

  if (!user && previewMode) {
    return (
      <BillingContent
        paymentAccess={getPreviewPaymentAccess()}
        operatorStatus={PREVIEW_OPERATOR_STATUS}
        reservationState={{ reservations: [], locks: [] }}
        founderAccess={null}
        founderSeatsClaimed={0}
        canSeeFounderPricing={false}
        canClaimFounder={false}
        canSeePilotPricing={false}
        calculationCount={0}
        savedLoadCount={0}
      />
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  const [
    { data: subscription },
    { data: founderAccess },
    founderClaimCount,
    calculationCount,
    savedLoadCount,
    operatorStatus,
    reservationState,
    billingTestHarness,
  ] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select(
          "tier,status,provider,provider_customer_id,provider_subscription_id,current_period_end,trial_end,trial_duration_days,trial_status,billing_starts_at,lifetime_price_lock,future_feature_access_scope,cohort_phase,cohort_cap,price_subject_to_change,entitlement_status,cancel_at_period_end,canceled_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("founder_pricing_access")
        .select("id, code, is_active, redeemed_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("founder_pricing_access")
        .select("id", { count: "exact", head: true })
        .not("redeemed_at", "is", null),
      supabase
        .from("usage_events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("event_name", "calculation_created"),
      supabase
        .from("saved_loads")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      getOperatorProgramStatus(user.id),
      getUserReservationAndLockState(user.id),
      getInternalBillingTestHarnessSnapshot(user.email),
    ]);

  const effectiveSubscription =
    resolveInternalBillingTestSubscription(billingTestHarness) ?? subscription;
  const paymentAccess = resolvePaymentAccess(effectiveSubscription, {
    monthlyCalculations: calculationCount.count ?? 0,
    savedLoads: savedLoadCount.count ?? 0,
  });
  const activeTier = paymentAccess.tier;
  const canSeeFounderPricing =
    activeTier === "launch500" || Boolean(founderAccess);
  const founderSeatsClaimed = founderClaimCount.count ?? 0;
  const canClaimFounder =
    canSeeFounderPricing &&
    canClaimFounderAccess({
      hasAccess: canSeeFounderPricing,
      claimedSeats: founderSeatsClaimed,
    });
  const canSeePilotPricing =
    operatorStatus.pilotUser || operatorStatus.foundingOperator;

  return (
    <BillingContent
      paymentAccess={paymentAccess}
      operatorStatus={operatorStatus}
      reservationState={reservationState}
      founderAccess={founderAccess}
      founderSeatsClaimed={founderSeatsClaimed}
      canSeeFounderPricing={canSeeFounderPricing}
      canClaimFounder={canClaimFounder}
      canSeePilotPricing={canSeePilotPricing}
      calculationCount={calculationCount.count ?? 0}
      savedLoadCount={savedLoadCount.count ?? 0}
      billingTestHarness={billingTestHarness}
    />
  );
}

function BillingContent({
  paymentAccess,
  operatorStatus,
  reservationState,
  founderAccess,
  founderSeatsClaimed,
  canSeeFounderPricing,
  canClaimFounder,
  canSeePilotPricing,
  calculationCount,
  savedLoadCount,
  billingTestHarness,
}: {
  paymentAccess: PaymentAccess;
  operatorStatus: Awaited<ReturnType<typeof getOperatorProgramStatus>>;
  reservationState: Awaited<ReturnType<typeof getUserReservationAndLockState>>;
  founderAccess: { id: string; code: string; is_active: boolean; redeemed_at: string | null } | null;
  founderSeatsClaimed: number;
  canSeeFounderPricing: boolean;
  canClaimFounder: boolean;
  canSeePilotPricing: boolean;
  calculationCount: number;
  savedLoadCount: number;
  billingTestHarness?: InternalBillingTestHarnessSnapshot | null;
}) {
  void founderAccess;
  const activeTier = paymentAccess.tier;
  const hasLifetimeDisplay =
    paymentAccess.lifetimePriceLock ||
    activeTier === "pilot" ||
    activeTier === "launch500";
  const futureFeatureScope =
    paymentAccess.futureFeatureAccessScope ??
    (hasLifetimeDisplay ? FUTURE_PLATFORM_FEATURE_SCOPE : null);
  const lifecycleDate =
    paymentAccess.billingStartsAt ??
    paymentAccess.trialEnd ??
    paymentAccess.currentPeriodEnd;

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Billing & Plan
            </h1>
            <OperatorBadges badges={operatorStatus.badges} />

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Treat subscription cost as operational overhead: Karpilo LoadIQ is
              built to expose deadhead, fuel variance, break-even pressure, and
              margin leakage before they quietly absorb trip value.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 hover:bg-sky-400/20"
          >
            Dashboard
          </Link>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Metric label="Current Plan" value={formatPlanTierLabel(activeTier)} />
          <Metric
            label="Entitlement"
            value={formatStatus(paymentAccess.entitlementStatus)}
          />
          <Metric
            label="Trial / Billing"
            value={formatTrialBillingLabel(paymentAccess)}
          />
          <Metric label="Calculations" value={String(calculationCount)} />
          <Metric label="Saved Loads" value={String(savedLoadCount)} />
        </section>

        <InternalBillingTestHarnessPanel harness={billingTestHarness} />

        <section className="mb-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
            Entitlement Metadata
          </p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2 lg:grid-cols-4">
            <PlanLine
              label="Billing starts"
              value={formatDate(lifecycleDate)}
            />
            <PlanLine
              label="Lifetime lock"
              value={hasLifetimeDisplay ? "Protected" : "Not active"}
            />
            <PlanLine
              label="Cohort"
              value={formatCohort(paymentAccess)}
            />
            <PlanLine
              label="Price status"
              value={hasLifetimeDisplay || paymentAccess.priceSubjectToChange === false ? "Locked where eligible" : "Subject to change"}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            {futureFeatureScope ??
              "Gold access is designed as complete operational visibility. Pilot and Legacy Launch records can preserve lifetime pricing and future released platform feature access when assigned."}
          </p>
        </section>

        {paymentAccess.hasStripeCustomer && (
          <section className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                  Stripe Billing
                </p>
                <p className="mt-2 break-words text-sm leading-6 text-slate-300">
                  Manage payment methods, invoices, renewals, and cancellation
                  through Stripe customer portal.
                </p>
              </div>
              <CustomerPortalButton />
            </div>
          </section>
        )}

        {(reservationState.reservations.length > 0 ||
          reservationState.locks.length > 0) && (
          <section className="mb-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              Supabase entitlement record
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-3">
          {PUBLIC_PRICING_PLANS.map((publicPlan) => {
            const plan = PLAN_LIMITS[publicPlan.tier];
            const isActive = activeTier === publicPlan.tier;

            const isFeatured =
              "featured" in publicPlan && Boolean(publicPlan.featured);

            return (
            <div
              key={publicPlan.id}
              data-preview-explain="subscription-tile"
              className={
                isFeatured
                  ? "rounded-2xl border border-sky-400/35 bg-[#0B1220]/95 p-5 shadow-[0_0_35px_rgba(56,189,248,0.14)]"
                  : "rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-100">
                    {publicPlan.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {publicPlan.description}
                  </p>
                </div>

                {isActive && (
                  <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                    Active
                  </span>
                )}
              </div>

              <div className="mt-6 text-3xl font-black text-slate-100">
                {formatPriceLabel(publicPlan.price, publicPlan.interval)}
              </div>

              {"savingsLabel" in publicPlan && publicPlan.savingsLabel && (
                <p className="mt-2 text-sm text-sky-300">
                  {publicPlan.savingsLabel}
                </p>
              )}

              <div className="mt-6 space-y-2 text-sm text-slate-300">
                {publicPlan.bullets.map((bullet) => (
                  <div key={bullet} className="border-b border-slate-800 pb-2">
                    {bullet}
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <PlanLine
                  label="Calculations"
                  value={String(plan.monthlyCalculations)}
                />
                <PlanLine label="Saved loads" value={String(plan.savedLoads)} />
                <PlanLine label="Exports" value={plan.exports ? "Yes" : "No"} />
                <PlanLine
                  label="Advanced analytics"
                  value={plan.advancedAnalytics ? "Yes" : "No"}
                />
                <PlanLine
                  label="Comparisons"
                  value={plan.comparisons ? "Yes" : "No"}
                />
              </div>

              {activeTier === "no_access" && (
                <>
                  <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm leading-6 text-sky-100">
                    Eligible paid tiers include a 7-day trial where supported
                    by the payment provider. Gold is the complete operational
                    tier; Pilot and Legacy Launch pricing stay protected by
                    assigned entitlement records.
                  </div>

                  {billingTestHarness?.enabled ? (
                    <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                      Stripe checkout is disabled while developer billing
                      simulation is active. Disable the harness to test live
                      checkout behavior.
                    </div>
                  ) : (
                    <CheckoutAcknowledgement
                      label="Agree & Open Checkout"
                      planId={publicPlan.id as StripeCheckoutPlanId}
                    />
                  )}
                </>
              )}
            </div>
          );
          })}
        </section>

        <section
          data-preview-explain="ifta-estimate"
          className="mt-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="break-words text-xs font-bold uppercase leading-5 tracking-[0.22em] text-sky-300">
                Planned Tier
              </p>
              <h2 className="mt-2 break-words text-2xl font-black text-slate-100">
                {PLATINUM_ACCESS.name}
              </h2>
              <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-300">
                Platinum is a coming-soon premium intelligence layer for
                advanced trend visibility, maintenance pattern awareness,
                out-of-route expense context, repair trends, receipt
                intelligence, and operational anomaly awareness. It is not wired
                to checkout yet, and Gold remains the complete operational tier.
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-sky-400/20 bg-[#060B14] p-4 text-sm text-sky-100">
              <div className="break-words text-2xl font-black">
                {formatPriceLabel(PLATINUM_ACCESS.monthlyPrice, "month")}
              </div>
              <div className="mt-1 break-words text-sky-200/75 [overflow-wrap:anywhere]">
                {formatPriceLabel(PLATINUM_ACCESS.annualPrice, "year")} ·{" "}
                {PLATINUM_ACCESS.pricingModel}
              </div>
              <div className="mt-2 text-xs leading-5 text-sky-100/80">
                7-day free trial planned. Prices subject to change.
              </div>
              <div className="mt-3 inline-flex max-w-full rounded-full border border-red-400/25 bg-red-500/10 px-3 py-1 text-xs font-black uppercase leading-5 tracking-[0.16em] text-red-100">
                Coming Soon
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {PLATINUM_ACCESS.features.map((feature) => (
              <div
                key={feature}
                className="min-w-0 break-words rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-sm text-slate-300"
              >
                {feature}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
            Platinum intelligence is planning support only. It does not
            guarantee savings, repairs, dispatch outcomes, legal compliance, tax
            treatment, or mechanical performance. IFTA support remains
            estimation assistance, not filing or jurisdictional certification.
          </div>
        </section>

        <section
          data-preview-explain="subscription-tile"
          className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-5"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-200">
                Early operator program
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-100">
                {FOUNDER_ACCESS.name}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                {FOUNDER_ACCESS.publicTeaser} Claimed seats are tracked
                internally. Legacy Launch preserves lifetime pricing lock and
                future released Karpilo LoadIQ platform feature access while the
                subscription remains active.
              </p>
            </div>

            <div className="rounded-xl border border-red-300/20 bg-[#060B14] p-4 text-sm text-red-100">
              {founderSeatLabel(founderSeatsClaimed)}
            </div>
          </div>

          {canSeeFounderPricing && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {INTERNAL_FOUNDER_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4"
                >
                  <div className="text-sm font-bold text-slate-100">
                    {plan.name}
                  </div>
                  <div className="mt-2 text-2xl font-black text-sky-200">
                    {formatPriceLabel(plan.price, plan.interval)}
                  </div>
                  {canClaimFounder && (
                    <CheckoutAcknowledgement
                      label="Agree & Open Checkout"
                      planId={
                        plan.interval === "month"
                          ? "launch500-monthly"
                          : "launch500-annual"
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          data-preview-explain="subscription-tile"
          className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
            Pilot program
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-100">
            {PILOT_ACCESS.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {PILOT_ACCESS.publicTeaser} Approved pilot operators receive
            locked pricing at ${PILOT_ACCESS.monthlyPrice}/month for the first{" "}
            {PILOT_ACCESS.maxSeats} approved users, with a 7-day trial where
            supported by the payment provider. Pilot pricing and future
            released Karpilo LoadIQ platform feature access stay protected while
            the subscription remains active. It is not transferable and is lost
            if canceled, lapsed, revoked, or deleted.
          </p>
          {canSeePilotPricing ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {INTERNAL_PILOT_PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-xl border border-sky-400/20 bg-[#060B14] p-4"
                >
                  <div className="text-sm font-bold text-slate-100">
                    {plan.name}
                  </div>
                  <div className="mt-2 text-2xl font-black text-sky-200">
                    {formatPriceLabel(plan.price, plan.interval)}
                  </div>
                  <CheckoutAcknowledgement
                    label="Agree & Open Pilot Checkout"
                    planId={
                      plan.interval === "month" ? "pilot-monthly" : "pilot-annual"
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-sky-400/20 bg-[#060B14] p-4 text-sm leading-6 text-sky-100">
              Pilot checkout appears only after founder pilot eligibility is
              assigned in Supabase.
            </div>
          )}
          <div className="mt-4 rounded-xl border border-sky-400/20 bg-[#060B14] p-4 text-sm text-sky-100">
            Internal cap: {PILOT_ACCESS.maxSeats} operators.
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
            Cancellation and refund guidance
          </p>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-300 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
              Canceling a subscription stops future billing through the
              applicable platform. Access usually remains active through the
              paid period unless the account is terminated for policy, security,
              or payment abuse reasons.
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
              Apple and Google purchases may need to be canceled or refunded
              directly through Apple or Google. Direct website billing will use
              the Stripe or website checkout flow once live.
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.16em]">
            <Link
              href="/refund-policy"
              className="text-sky-300 underline decoration-sky-400/40 underline-offset-4"
            >
              Refund Policy
            </Link>
            <Link
              href="/subscription-terms"
              className="text-sky-300 underline decoration-sky-400/40 underline-offset-4"
            >
              Subscription Terms
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      data-preview-explain="subscription-tile"
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5"
    >
      <div className="break-words text-xs uppercase leading-5 tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 break-words text-2xl font-black text-slate-100 [overflow-wrap:anywhere]">
        {value}
      </div>
    </div>
  );
}

function PlanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-800 pb-2">
      <span className="min-w-0 break-words text-slate-400">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-slate-100 [overflow-wrap:anywhere]">
        {value}
      </span>
    </div>
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

function formatTrialBillingLabel(paymentAccess: PaymentAccess) {
  if (paymentAccess.trialStatus) return formatStatus(paymentAccess.trialStatus);
  if (paymentAccess.canContinueTrial) return "trialing";
  if (paymentAccess.billingStartsAt) return "billing scheduled";
  if (paymentAccess.trialDurationDays) {
    return `${paymentAccess.trialDurationDays}-day trial`;
  }
  return "Not set";
}

function formatCohort(paymentAccess: PaymentAccess) {
  const phase = paymentAccess.cohortPhase
    ? formatStatus(paymentAccess.cohortPhase)
    : "Standard";
  return paymentAccess.cohortCap ? `${phase} / ${paymentAccess.cohortCap}` : phase;
}
