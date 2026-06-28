"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { getSentryFeatureFromRoute } from "@/lib/sentry-config";

type SentryRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  boundary: string;
  title: string;
  message: string;
  feature?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function captureSentryRouteError({
  error,
  boundary,
  feature,
}: {
  error: Error & { digest?: string };
  boundary: string;
  feature?: string;
}) {
  const route =
    typeof window === "undefined" ? null : window.location.pathname;

  Sentry.withScope((scope) => {
    scope.setTag("boundary", boundary);
    scope.setTag("feature", feature ?? getSentryFeatureFromRoute(route));

    if (route) {
      scope.setContext("route", { path: route });
    }

    if (error.digest) {
      scope.setExtra("digest", error.digest);
    }

    Sentry.captureException(error);
  });
}

export function SentryRouteError({
  error,
  reset,
  boundary,
  title,
  message,
  feature,
  actionHref,
  actionLabel,
}: SentryRouteErrorProps) {
  useEffect(() => {
    captureSentryRouteError({ error, boundary, feature });
  }, [boundary, error, feature]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060B14] px-4 text-slate-100">
      <div className="w-full max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-red-300">
          Karpilo LoadIQ Fault
        </p>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>

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

          {actionHref && actionLabel ? (
            <a
              href={actionHref}
              className="rounded-xl border border-slate-700 bg-[#060B14] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
            >
              {actionLabel}
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}
