"use client";

import { useEffect } from "react";
import Link from "next/link";

import { captureSentryRouteError } from "@/components/observability/sentry-route-error";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({
  error,
  reset,
}: DashboardErrorProps) {
  useEffect(() => {
    captureSentryRouteError({ error, boundary: "dashboard" });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060B14] px-4 text-slate-100">
      <div className="w-full max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-red-300">
          Dashboard Fault
        </p>

        <h1 className="text-3xl font-black">Operational data did not load.</h1>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          This is usually a temporary Supabase, auth, or network issue. Retry
          first, then check support if it repeats.
        </p>

        {error.digest && (
          <p className="mt-4 text-xs text-slate-500">Digest: {error.digest}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
          >
            Retry
          </button>

          <Link
            href="/dashboard/support"
            className="rounded-xl border border-slate-700 bg-[#060B14] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
          >
            Support
          </Link>
        </div>
      </div>
    </main>
  );
}
