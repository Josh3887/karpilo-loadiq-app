import "server-only";

import {
  type AnalyticsEventName,
  type AnalyticsProperties,
  isAnalyticsEventName,
  sanitizeAnalyticsProperties,
} from "@/lib/analytics";

export type PostHogAnalyticsStatus = {
  enabled: boolean;
  configured: boolean;
  host: string;
  dashboardUrl: string | null;
  environment: string;
  appVersion: string;
};

type CaptureServerAnalyticsEventInput = {
  event: AnalyticsEventName;
  distinctId: string;
  properties?: AnalyticsProperties;
};

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";

export function getPostHogAnalyticsStatus(): PostHogAnalyticsStatus {
  return {
    enabled:
      process.env.POSTHOG_ENABLED === "true" ||
      process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true",
    configured: Boolean(getPostHogProjectToken()),
    host: getPostHogHost(),
    dashboardUrl: process.env.POSTHOG_DASHBOARD_URL ?? null,
    environment:
      process.env.NEXT_PUBLIC_APP_ENV ??
      process.env.APP_ENV ??
      process.env.NODE_ENV ??
      "unknown",
    appVersion:
      process.env.NEXT_PUBLIC_APP_VERSION ??
      process.env.VERCEL_GIT_COMMIT_SHA ??
      "development",
  };
}

export async function captureServerAnalyticsEvent({
  event,
  distinctId,
  properties,
}: CaptureServerAnalyticsEventInput) {
  const status = getPostHogAnalyticsStatus();
  const projectToken = getPostHogProjectToken();

  if (!status.enabled || !status.configured || !projectToken) return;
  if (!isAnalyticsEventName(event)) return;

  const payloadProperties = sanitizeAnalyticsProperties({
    ...properties,
    environment: status.environment,
    app_version: status.appVersion,
  });

  try {
    await fetch(`${status.host}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: projectToken,
        event,
        distinct_id: distinctId,
        properties: payloadProperties,
      }),
    });
  } catch {
    // Internal analytics must not affect customer-facing workflows.
  }
}

function getPostHogProjectToken() {
  return (
    process.env.POSTHOG_PROJECT_TOKEN ??
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
    process.env.NEXT_PUBLIC_POSTHOG_KEY
  );
}

function getPostHogHost() {
  return (
    process.env.POSTHOG_HOST ??
    process.env.NEXT_PUBLIC_POSTHOG_HOST ??
    DEFAULT_POSTHOG_HOST
  ).replace(/\/$/, "");
}
