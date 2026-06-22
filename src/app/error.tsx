"use client";

import { useEffect } from "react";

import { captureSentryRouteError } from "@/components/observability/sentry-route-error";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    captureSentryRouteError({ error, boundary: "app" });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060B14] px-4 text-slate-100">
      <div className="w-full max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-red-300">
          Karpilo LoadIQ Fault
        </p>

        <h1 className="text-3xl font-black">Something stalled.</h1>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          The app hit an unexpected error. Retry the operation, then capture the
          route and action if it repeats.
        </p>

        {error.digest && (
          <p className="mt-4 text-xs text-slate-500">Digest: {error.digest}</p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
