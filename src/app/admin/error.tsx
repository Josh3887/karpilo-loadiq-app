"use client";

import { SentryRouteError } from "@/components/observability/sentry-route-error";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SentryRouteError
      error={error}
      reset={reset}
      boundary="admin"
      feature="admin"
      title="Admin control plane did not load."
      message="Retry the admin operation. If it repeats, check the admin diagnostics route and deployment health."
      actionHref="/admin"
      actionLabel="Admin Home"
    />
  );
}
