import Link from "next/link";

import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";

export default function HomePage() {
  const featureBlocks = [
    {
      title: "Load Profit Checks",
      body:
        "Compare gross revenue, deadhead, fuel, reserves, dispatch fees, factoring, overhead, break-even RPM, and daily net before a load occupies the truck.",
    },
    {
      title: "Equipment Fit",
      body:
        "Build a profile for van, reefer, flatbed, step deck, conestoga, tanker, hot-shot, specialized, and other transport setups with dimensions, payload, and capability context.",
    },
    {
      title: "Route and Fuel Awareness",
      body:
        "Tie active loads to MPG, tank count, tank size, fuel price, trip miles, load status, and saved snapshots so operators can monitor range and planning pressure.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#060B14] text-slate-100">
      <section
        className="relative flex min-h-[92vh] items-center bg-cover bg-center px-4 py-10"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(6,11,20,0.96), rgba(6,11,20,0.78), rgba(6,11,20,0.5)), url('/brand/karpiloendeavortech.jpeg')",
        }}
      >
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-3xl">
            <LoadIqMark size="lg" />

            <p className="mt-8 text-xs font-black uppercase tracking-[0.26em] text-sky-300">
              {BRAND.companyName}
            </p>

            <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[1.02] text-white sm:text-6xl">
              {BRAND.productName}
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Freight decision support for owner-operators who need load math,
              vehicle context, fuel awareness, saved history, and operating
              settings inside the controlled-access LoadIQ app.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-400 px-5 text-sm font-black uppercase tracking-[0.16em] text-[#060B14] shadow-[0_0_28px_rgba(56,189,248,0.28)] transition hover:bg-sky-300"
              >
                Login
              </Link>

              <Link
                href="/request-access"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 px-5 text-sm font-black uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-400/20"
              >
                Request Access
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-600 bg-black/25 px-5 text-sm font-black uppercase tracking-[0.16em] text-slate-100 transition hover:border-sky-400/50 hover:text-sky-200"
              >
                Open App
              </Link>

              <Link
                href="/portal"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-700 bg-black/20 px-5 text-sm font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-sky-400/40 hover:text-sky-200"
              >
                Account Portal
              </Link>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
              Public signup is not available. Access is controlled for beta,
              legacy, and founding operator launch phases.
            </p>
          </div>

          <div className="grid gap-3">
            {featureBlocks.map((feature) => (
              <article
                key={feature.title}
                className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur"
              >
                <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#09111D] px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm leading-6 text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            Authenticated app access is required for saved loads, vehicle
            profiles, billing, support, and operating history.
          </p>
          <p className="font-semibold text-slate-200">
            Public product information stays concise; operator workflows stay
            inside the app.
          </p>
        </div>
      </section>
    </main>
  );
}
