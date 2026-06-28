"use client";

import { SentryRouteError } from "@/components/observability/sentry-route-error";

export default function SettingsError({
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
      boundary="dashboard-settings"
      feature="settings"
      title="Settings did not load."
      message="Retry the settings route. Existing profile, billing, and calculator defaults were not changed by this boundary."
      actionHref="/dashboard"
      actionLabel="Dashboard"
    />
  );
}
