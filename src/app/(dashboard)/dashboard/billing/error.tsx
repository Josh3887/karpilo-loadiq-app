"use client";

import { SentryRouteError } from "@/components/observability/sentry-route-error";

export default function BillingError({
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
      boundary="dashboard-billing"
      feature="billing"
      title="Billing status did not load."
      message="Retry the billing route. Entitlements, pricing, and payment rails remain unchanged."
      actionHref="/dashboard"
      actionLabel="Dashboard"
    />
  );
}
