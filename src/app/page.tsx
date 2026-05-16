import Link from "next/link";

import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-center">
        <div className="rounded-3xl border border-slate-800 bg-[#0B1220]/95 p-6 shadow-[0_0_35px_rgba(56,189,248,0.12)]">
          <LoadIqMark size="lg" />

          <p className="mt-6 text-xs font-black uppercase tracking-[0.26em] text-sky-300">
            {BRAND.productName}
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight text-white">
            Freight command built for the phone in your hand.
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            Sign in to analyze loads, review history, manage operating
            settings, and keep subscription access tied to your Karpilo LoadIQ
            account.
          </p>

          <div className="mt-7 grid gap-3">
            <Link
              href="/auth/login"
              className="rounded-xl bg-sky-400 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-[#060B14] shadow-[0_0_28px_rgba(56,189,248,0.3)] transition hover:bg-sky-300"
            >
              Sign In
            </Link>

            <Link
              href="/preview"
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-sky-300 transition hover:bg-sky-400/20"
            >
              Preview App
            </Link>

            <Link
              href="/auth/register"
              className="rounded-xl border border-slate-700 bg-[#060B14] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-slate-200 transition hover:border-sky-400/50 hover:text-sky-200"
            >
              Create Access
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-5 text-slate-500">
            Create an APP account here for authenticated operating access.
            Pilot reservations, launch pricing, and public product information
            remain available on the website.
          </div>
        </div>
      </section>
    </main>
  );
}
