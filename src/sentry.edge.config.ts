import * as Sentry from "@sentry/nextjs";

import {
  getSentryEnvironment,
  getSentryRelease,
  getSentryTraceSampleRate,
  sentryBeforeSend,
} from "@/lib/sentry-config";

const sentryDsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: getSentryEnvironment(),
  release: getSentryRelease(),
  sendDefaultPii: false,
  beforeSend: sentryBeforeSend,
  tracesSampleRate: getSentryTraceSampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE ??
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
  ),
  initialScope: {
    tags: {
      product: "loadiq_app",
      runtime: "edge",
    },
  },
});
