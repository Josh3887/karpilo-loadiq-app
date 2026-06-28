"use client";

import * as Sentry from "@sentry/nextjs";

export function SentryTestButton({ feature }: { feature: string }) {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <button
      type="button"
      onClick={() => {
        Sentry.withScope((scope) => {
          scope.setTag("feature", feature);
          scope.setTag("test", "development_only");
          Sentry.captureException(new Error("LoadIQ Sentry development test"));
        });
      }}
      className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-400/20"
    >
      Send Development Test Error
    </button>
  );
}
