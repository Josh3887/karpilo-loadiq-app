import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
};

const sentryRelease =
  process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA;

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  release: sentryRelease
    ? {
        name: sentryRelease,
      }
    : undefined,
});
