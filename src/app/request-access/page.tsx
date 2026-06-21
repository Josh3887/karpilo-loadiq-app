import Link from "next/link";

import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";
import { LAUNCH_PHASES, formatLaunchPhase } from "@/lib/portal/access";

export const metadata = {
  title: "Request Access | Karpilo LoadIQ App",
  description:
    "Controlled Karpilo LoadIQ app access request status and signup unavailable notice.",
};

export default function RequestAccessPage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <LoadIqMark size="lg" />
        <section className="mt-8 rounded-2xl border border-slate-800 bg-[#0B1220] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">
            Controlled Access
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">
            Public signup is not available at this time.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            Karpilo LoadIQ is currently preparing controlled access for beta,
            legacy, and founding operator launch phases. Request routing is
            intentionally limited until approval, billing, policy, support, and
            app readiness gates are complete.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {LAUNCH_PHASES.map((phase) => (
              <div
                key={phase}
                className="rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Phase
                </p>
                <p className="mt-2 text-sm font-black text-white">
                  {formatLaunchPhase(phase)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-sky-400 px-5 text-sm font-black uppercase tracking-[0.16em] text-[#060B14] transition hover:bg-sky-300"
            >
              Login
            </Link>
            <Link
              href="https://karpilo-liq.com/launch"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 px-5 text-sm font-black uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-400/20"
            >
              View Launch Page
            </Link>
            <Link
              href="/not-available"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-700 bg-black/25 px-5 text-sm font-black uppercase tracking-[0.16em] text-slate-100 transition hover:border-sky-400/50 hover:text-sky-200"
            >
              Signup Status
            </Link>
          </div>
        </section>

        <p className="mt-6 text-sm leading-6 text-slate-500">
          {BRAND.productName} is not a dispatch service, broker, carrier, ELD,
          tax advisor, legal advisor, compliance service, insurance advisor, or
          guaranteed-profit system.
        </p>
      </div>
    </main>
  );
}
