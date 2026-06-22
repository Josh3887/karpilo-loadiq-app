import * as Sentry from "@sentry/nextjs";

import {
  getSentryEnvironment,
  getSentryRelease,
  getSentryReplayOnErrorSampleRate,
  getSentryReplaySessionSampleRate,
  getSentryTraceSampleRate,
  sentryBeforeSend,
} from "@/lib/sentry-config";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: getSentryEnvironment(),
  release: getSentryRelease(),
  sendDefaultPii: false,
  beforeSend: sentryBeforeSend,
  tracesSampleRate: getSentryTraceSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
  ),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
  replaysSessionSampleRate: getSentryReplaySessionSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE
  ),
  replaysOnErrorSampleRate: sentryDsn
    ? getSentryReplayOnErrorSampleRate(
        process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE
      )
    : 0,
  initialScope: {
    tags: {
      product: "loadiq_app",
    },
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
