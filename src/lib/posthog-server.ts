import "server-only";

import type { AnalyticsEventName, AnalyticsProperties } from "@/lib/analytics";
import { captureServerAnalyticsEvent } from "@/lib/analytics-server";

export type PostHogServerEvent = {
  distinctId: string;
  event: AnalyticsEventName;
  properties?: AnalyticsProperties;
};

export function createPostHogServerClient() {
  return null;
}

export async function capturePostHogServerEvent(event: PostHogServerEvent) {
  await captureServerAnalyticsEvent({
    event: event.event,
    distinctId: event.distinctId,
    properties: event.properties,
  });
}
