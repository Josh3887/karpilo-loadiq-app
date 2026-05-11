import Link from "next/link";

import {
  FOUNDER_ACCESS,
  PUBLIC_PRICING_PLANS,
  formatPriceLabel,
} from "@/config/pricing";
import { SiteFooter } from "@/components/legal/site-footer";
import {
  demoComparison,
  demoDisclaimer,
  demoLoad,
  demoResults,
  demoSettings,
} from "@/config/product-demo";
import { PRODUCT_FAQS, PRODUCT_FEATURES } from "@/config/product-features";

export default function HomePage() {
  const heroFeatures = PRODUCT_FEATURES.slice(0, 3);
  const featureCards = PRODUCT_FEATURES.slice(3);

  return (
    <main className="min-h-screen bg-[#060B14] text-slate-100">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_55%)]" />

        <div className="relative mx-auto flex max-w-7xl flex-col px-6 py-24 md:px-10 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
              Karpilo LoadIQ
            </div>

            <h1 className="text-5xl font-black leading-none tracking-tight text-white md:text-7xl">
              Freight Profitability Intelligence
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">
              Tactical load analysis for owner-operators and small fleets.
              Detect margin compression, deadhead risk, fuel exposure,
              and operational viability before accepting freight.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth/register"
                className="flex items-center justify-center rounded-xl bg-sky-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14] shadow-[0_0_35px_rgba(56,189,248,0.35)] transition hover:bg-sky-300"
              >
                Create Account
              </Link>

              <Link
                href="/auth/login"
                className="flex items-center justify-center rounded-xl border border-slate-700 bg-[#0B1220] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-sky-400 hover:text-sky-300"
              >
                Login
              </Link>

              <Link
                href="#loadiq-preview"
                className="flex items-center justify-center rounded-xl border border-slate-700 bg-[#0B1220] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-sky-400 hover:text-sky-300"
              >
                Preview
              </Link>
            </div>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            {heroFeatures.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        id="loadiq-preview"
        className="border-b border-slate-800 bg-[#0B1220]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:px-10 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
              Product Preview
            </p>
            <h2 className="text-4xl font-black tracking-tight text-white">
              See the estimate before you accept the load.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-400">
              {demoResults.summary}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <PreviewStat label="True RPM" value={`$${demoResults.trueRpm}`} />
              <PreviewStat
                label="Projected Net"
                value={`$${demoResults.projectedNet.toLocaleString()}`}
              />
              <PreviewStat
                label="Fuel Estimate"
                value={`$${demoResults.estimatedFuelCost.toLocaleString()}`}
              />
              <PreviewStat
                label="Profit Band"
                value={demoResults.profitabilityBand}
              />
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              {demoDisclaimer}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#060B14] p-5 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
            <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
                  {demoLoad.loadNumber}
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-100">
                  {demoLoad.pickup.city}, {demoLoad.pickup.state} to{" "}
                  {demoLoad.delivery.city}, {demoLoad.delivery.state}
                </h3>
              </div>
              <div className="rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-right">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                  Gross
                </div>
                <div className="mt-1 text-xl font-black text-slate-100">
                  ${demoLoad.flatRateRevenue.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <PreviewStat
                label="Loaded Miles"
                value={String(demoLoad.loadedMiles)}
              />
              <PreviewStat
                label="Deadhead"
                value={String(demoLoad.deadheadMiles)}
              />
              <PreviewStat
                label="Total Miles"
                value={String(demoLoad.totalMiles)}
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-[#0B1220] p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Operating Profile
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {demoSettings.operationType}, {demoSettings.defaultMpg} MPG,{" "}
                    ${demoSettings.weeklyOperationalOverhead}/week overhead
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Estimate vs Actual
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Net variance {demoComparison.variance.netDifference < 0 ? "-" : ""}
                    ${Math.abs(demoComparison.variance.netDifference).toFixed(2)} after
                    actual trip costs.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {demoResults.warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
                >
                  {warning}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-[#0B1220]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:px-10">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-red-400">
              Industry Problem
            </p>

            <h2 className="text-4xl font-black tracking-tight text-white">
              Most loads look profitable until the math is honest.
            </h2>
          </div>

          <div className="space-y-5 text-slate-400">
            <p>
              Deadhead miles, fuel volatility, factoring, dispatch fees,
              and hidden operational overhead silently compress margins.
            </p>

            <p>
              K-LIQ was built to expose the true economics of freight
              before the wheels ever turn.
            </p>

            <p>
              This is not a basic calculator. It is a trucking intelligence layer.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-[#060B14]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
              Built from the app
            </p>
            <h2 className="text-4xl font-black tracking-tight text-white">
              Real operating features, not vague SaaS filler.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-[#0B1220]">
        <div id="subscription-preview" className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
                Pricing
              </p>
              <h2 className="text-4xl font-black tracking-tight text-white">
                Simple public plans. Founder access stays controlled.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-400">
              {FOUNDER_ACCESS.publicTeaser}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PUBLIC_PRICING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-slate-800 bg-[#060B14] p-6 shadow-[0_0_25px_rgba(56,189,248,0.06)]"
              >
                <h3 className="text-2xl font-black text-slate-100">
                  {plan.name}
                </h3>
                <div className="mt-4 text-3xl font-black text-sky-200">
                  {formatPriceLabel(plan.price, plan.interval)}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {plan.description}
                </p>
                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  {plan.bullets.slice(0, 4).map((bullet) => (
                    <div key={bullet} className="border-b border-slate-800 pb-2">
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-800 bg-[#060B14]">
        <div className="mx-auto max-w-5xl px-6 py-20 md:px-10">
          <h2 className="text-4xl font-black tracking-tight text-white">
            Questions drivers ask before trusting the math.
          </h2>
          <div className="mt-8 space-y-4">
            {PRODUCT_FAQS.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-800 bg-[#0B1220]/90 p-5"
              >
                <h3 className="font-bold text-slate-100">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
};

function FeatureCard({
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/90 p-6 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
      <h3 className="text-xl font-bold text-slate-100">
        {title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-slate-400">
        {description}
      </p>
    </div>
  );

}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-slate-100">{value}</div>
    </div>
  );
}
