import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutAcknowledgement } from "@/components/billing/checkout-acknowledgement";
import { CustomerPortalButton } from "@/components/billing/customer-portal-button";
import { OperatorBadges } from "@/components/dashboard/operator-badges";
import {
  FOUNDER_ACCESS,
  INTERNAL_FOUNDER_PLANS,
  INTERNAL_PILOT_PLANS,
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
import { normalizePlanTier } from "@/domains/billing/entitlement-service";
import { StripeCheckoutPlanId } from "@/config/stripe";
import { createClient } from "@/lib/supabase-server";
import { getUserReservationAndLockState } from "@/services/reservations";

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  ] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier,status,current_period_end,provider_customer_id")
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
    ]);

  const activeTier =
    subscription?.status === "active" || subscription?.status === "trialing"
      ? normalizePlanTier(subscription?.tier)
      : "no_access";
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
              Keep the app survivable while protecting serious driver workflows.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 hover:bg-sky-400/20"
          >
            Dashboard
          </Link>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <Metric label="Current Plan" value={formatPlanTierLabel(activeTier)} />
          <Metric
            label="Calculations"
            value={String(calculationCount.count ?? 0)}
          />
          <Metric label="Saved Loads" value={String(savedLoadCount.count ?? 0)} />
        </section>

        {subscription?.provider_customer_id && (
          <section className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                  Stripe Billing
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
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
                  className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm text-slate-300"
                >
                  <div className="font-black text-slate-100">
                    {reservation.cohort} reservation
                  </div>
                  <div className="mt-2">
                    Code {reservation.code} · {reservation.status}
                  </div>
                  <div className="mt-1 text-slate-500">
                    ${reservation.monthly_price}/mo · $
                    {reservation.annual_price}/yr
                  </div>
                </div>
              ))}
              {reservationState.locks.map((lock) => (
                <div
                  key={lock.id}
                  className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm text-sky-100"
                >
                  <div className="font-black text-slate-100">
                    {lock.cohort} pricing lock
                  </div>
                  <div className="mt-2">
                    {lock.lock_status} via {lock.billing_provider}
                  </div>
                  <div className="mt-1 text-sky-200/75">
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
                    Paid access starts when Stripe checkout completes. Pilot
                    and legacy launch pricing stay protected by assigned
                    entitlement records.
                  </div>

                  <CheckoutAcknowledgement
                    label="Agree & Open Checkout"
                    planId={publicPlan.id as StripeCheckoutPlanId}
                  />
                </>
              )}
            </div>
          );
          })}
        </section>

        <section className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-5">
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
                internally and founder pricing stays hidden unless access is
                assigned by invite code or admin action.
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

        <section className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
            Pilot program
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-100">
            {PILOT_ACCESS.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {PILOT_ACCESS.publicTeaser} Approved pilot operators receive
            locked pricing at ${PILOT_ACCESS.monthlyPrice}/month for the first{" "}
            {PILOT_ACCESS.maxSeats} approved users, with
            pricing locked while the subscription remains active. It is not
            transferable and is lost if canceled, lapsed, revoked, or deleted.
            Trial access is not included for pilot access.
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
    <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-2xl font-black capitalize text-slate-100">
        {value}
      </div>
    </div>
  );
}

function PlanLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold capitalize text-slate-100">{value}</span>
    </div>
  );
}
