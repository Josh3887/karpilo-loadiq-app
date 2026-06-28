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
  LOADIQ_LAUNCH_PRICING_PHASES,
  PILOT_ACCESS,
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
import type { PaymentAccess } from "@/domains/billing/entitlement-service";
import type { InternalBillingTestHarnessSnapshot } from "@/domains/billing/internal-test-harness-types";
import { getServerEntitlementState } from "@/domains/billing/server-entitlements";
import { StripeCheckoutPlanId } from "@/config/stripe";
import {
  getPreviewPaymentAccess,
  PREVIEW_OPERATOR_STATUS,
} from "@/lib/preview-data";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase-server";
import { getUserReservationAndLockState } from "@/services/reservations";

type LaunchPricingPhase = (typeof LOADIQ_LAUNCH_PRICING_PHASES)[number];

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
    { data: founderAccess },
    founderClaimCount,
    operatorStatus,
    reservationState,
    entitlementState,
  ] =
    await Promise.all([
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
      getOperatorProgramStatus(user.id),
      getUserReservationAndLockState(user.id),
      getServerEntitlementState(user.id, user.email),
    ]);

  const paymentAccess = entitlementState.paymentAccess;
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
      calculationCount={entitlementState.usage.monthlyCalculations}
      savedLoadCount={entitlementState.usage.savedLoads}
      billingTestHarness={entitlementState.billingTestHarness}
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
              Pricing follows the public launch architecture: Founding 50 Pilot,
              Launch 500, then Standard Public Access. Checkout remains
              provider-controlled and must be backed by server-authoritative
              eligibility before any discounted access is granted.
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
              "Commercial tiers describe decision-support depth. Pilot and Legacy Launch records preserve rollout pricing or lifetime pricing rules where assigned; entitlement enforcement remains unchanged."}
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

        <section
          data-preview-explain="subscription-tile"
          className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                Launch Pricing Authority
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-100">
                Current pricing follows the website launch plan.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Pilot and Legacy Launch are rollout programs, not commercial
                tier names. If launch-state validation, slot validation, or
                payment sync cannot be proven, checkout must stay waitlist-only.
              </p>
            </div>
            <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm leading-6 text-sky-100">
              Standard Public Access is{" "}
              {formatPriceLabel(PUBLIC_PRICING_PLANS[0].price, "month")} or{" "}
              {formatPriceLabel(PUBLIC_PRICING_PLANS[1].price, "year")}; no
              lifetime lock applies.
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {LOADIQ_LAUNCH_PRICING_PHASES.map((phase) => (
              <LaunchPricingCard key={phase.id} phase={phase} />
            ))}
          </div>
        </section>

        <section
          data-preview-explain="stripe-checkout"
          className="mt-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
            Provider-Controlled Checkout
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Existing checkout controls remain wired to the current provider plan
            IDs. Price, trial, invoice, and renewal details remain controlled by
            the payment provider, but the app-side amount language now follows
            the current website pricing architecture.
          </p>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {PUBLIC_PRICING_PLANS.map((publicPlan) => {
              const plan = PLAN_LIMITS[publicPlan.tier];
              const isActive = activeTier === publicPlan.tier;
              const checkoutLabel =
                publicPlan.interval === "month"
                  ? "Existing monthly checkout"
                  : "Existing annual checkout";

              return (
                <div
                  key={publicPlan.id}
                  className="rounded-2xl border border-slate-800 bg-[#060B14] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-100">
                        {checkoutLabel}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Uses the existing provider-controlled plan ID mapped to
                        current Standard Public Access language.
                      </p>
                    </div>

                    {isActive && (
                      <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-300">
                    <PlanLine
                      label="Price"
                      value={formatPriceLabel(
                        publicPlan.price,
                        publicPlan.interval
                      )}
                    />
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
                        Checkout opens the existing provider-controlled plan for
                        Standard Public Access. Final trial, invoice, renewal,
                        and cancellation details are controlled by the payment
                        provider.
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
                internally. Legacy Launch preserves lifetime pricing lock while
                the subscription remains active and in good standing within the
                purchased entitlement scope.
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
            {PILOT_ACCESS.publicTeaser} Approved pilot operators receive locked
            pricing at {formatPriceLabel(PILOT_ACCESS.monthlyPrice, "month")} or{" "}
            {formatPriceLabel(PILOT_ACCESS.annualPrice, "year")} for the first{" "}
            {PILOT_ACCESS.maxSeats} approved users. Pilot checkout must be
            server-validated before payment, and pricing stays protected only
            while the account remains active and in good standing.
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

function LaunchPricingCard({ phase }: { phase: LaunchPricingPhase }) {
  return (
    <div
      className={
        phase.id === "standard_active"
          ? "rounded-2xl border border-sky-400/35 bg-[#060B14] p-4 shadow-[0_0_35px_rgba(56,189,248,0.14)]"
          : "rounded-2xl border border-slate-800 bg-[#060B14] p-4"
      }
    >
      <div className="flex min-h-[94px] flex-col justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            {phase.statusLabel}
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-100">
            {phase.name}
          </h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          {phase.disclosure}
        </p>
      </div>

      <div className="mt-5 space-y-2 rounded-xl border border-slate-800 bg-[#0B1220] p-4 text-sm text-slate-300">
        <PlanLine
          label="Monthly"
          value={formatPriceLabel(phase.monthlyPrice, "month")}
        />
        <PlanLine
          label="Annual"
          value={formatPriceLabel(phase.annualPrice, "year")}
        />
        <PlanLine
          label="Slots"
          value={phase.slotLimit === null ? "Uncapped" : String(phase.slotLimit)}
        />
        <PlanLine
          label="Lifetime lock"
          value={phase.lifetimePricing ? "Eligible" : "No"}
        />
      </div>

      <div className="mt-5 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm leading-6 text-sky-100">
        {phase.paymentMode}
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
