export const secretExposureTestScaffold = {
  status: "scaffold",
  futureAssertions: [
    "committed files do not include real provider keys, tokens, webhook secrets, or database service-role values",
    "provider keys are never logged",
    "provider keys are never sent to Sentry, PostHog, client bundles, or snapshots",
  ],
} as const;

