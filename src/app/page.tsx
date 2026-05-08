import Link from "next/link";

export default function HomePage() {
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
                href="/dashboard"
                className="flex items-center justify-center rounded-xl bg-sky-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14] shadow-[0_0_35px_rgba(56,189,248,0.35)] transition hover:bg-sky-300"
              >
                Launch Intelligence
              </Link>

              <button className="rounded-xl border border-slate-700 bg-[#0B1220] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-slate-200 transition hover:border-sky-400 hover:text-sky-300">
                Subscription Preview
              </button>
            </div>
          </div>

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Deadhead Analysis"
              description="Identify hidden profitability erosion caused by unpaid repositioning miles."
            />

            <FeatureCard
              title="True RPM Intelligence"
              description="See actual operational RPM after deadhead exposure and operating costs."
            />

            <FeatureCard
              title="Operational Risk Detection"
              description="Instantly detect dangerous freight before margin collapse occurs."
            />
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

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        Karpilo LoadIQ — Freight intelligence built by the mile.
      </footer>
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