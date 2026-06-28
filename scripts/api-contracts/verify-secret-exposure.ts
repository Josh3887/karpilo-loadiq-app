export const verifySecretExposureScaffold = {
  status: "scaffold",
  purpose:
    "Future check that committed files do not contain provider keys, tokens, webhook secrets, service-role keys, or sensitive operational payloads.",
  telemetryExclusions: ["Sentry", "PostHog", "client bundles", "snapshots"],
  liveProviderAccess: false,
} as const;

