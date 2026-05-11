import Link from "next/link";
import { redirect } from "next/navigation";

import {
  FOUNDER_ACCESS,
  INTERNAL_FOUNDER_PLANS,
  PUBLIC_PRICING_PLANS,
  formatPriceLabel,
} from "@/config/pricing";
import {
  canClaimFounderAccess,
  founderSeatLabel,
} from "@/domains/billing/founder-access";
import { PLAN_LIMITS } from "@/domains/billing/plan-limits";
import { createClient } from "@/lib/supabase-server";

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
  ] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier,status,current_period_end")
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
    ]);

  const activeTier =
    subscription?.tier === "pro" || subscription?.tier === "founder"
      ? subscription.tier
      : "free";
  const canSeeFounderPricing = activeTier === "founder" || Boolean(founderAccess);
  const founderSeatsClaimed = founderClaimCount.count ?? 0;
  const canClaimFounder =
    canSeeFounderPricing &&
    canClaimFounderAccess({
      hasAccess: canSeeFounderPricing,
      claimedSeats: founderSeatsClaimed,
    });

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
          <Metric label="Current Plan" value={activeTier} />
          <Metric
            label="Calculations"
            value={String(calculationCount.count ?? 0)}
          />
          <Metric label="Saved Loads" value={String(savedLoadCount.count ?? 0)} />
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {PUBLIC_PRICING_PLANS.map((publicPlan) => {
            const plan = PLAN_LIMITS[publicPlan.tier];
            const isActive =
              activeTier === publicPlan.tier &&
              (publicPlan.tier === "free" || activeTier !== "founder");

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

              {publicPlan.tier !== "free" && activeTier === "free" && (
                <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm leading-6 text-sky-100">
                  Stripe checkout is the next wiring step. Plan selection is
                  modeled here without faking payment processing.
                </div>
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
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-sky-300">
                      Eligible when checkout is wired
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
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
