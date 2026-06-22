"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

import { getSentryFeatureFromRoute } from "@/lib/sentry-config";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    const route =
      typeof window === "undefined" ? null : window.location.pathname;

    Sentry.withScope((scope) => {
      scope.setTag("boundary", "global");
      scope.setTag("feature", getSentryFeatureFromRoute(route));

      if (route) {
        scope.setContext("route", { path: route });
      }

      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
