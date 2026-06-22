import { NextResponse } from "next/server";

import {
  type AnalyticsProperties,
  isAnalyticsEventName,
  sanitizeAnalyticsProperties,
} from "@/lib/analytics";
import { captureServerAnalyticsEvent } from "@/lib/analytics-server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type AnalyticsEventRequest = {
  event?: unknown;
  anonymousId?: unknown;
  properties?: unknown;
};

export async function POST(request: Request) {
  const body = await parseAnalyticsEventRequest(request);

  if (!body || !isAnalyticsEventName(body.event)) {
    return NextResponse.json({ ok: true }, { status: 202 });
  }

  const properties = isRecord(body.properties)
    ? sanitizeAnalyticsProperties(body.properties)
    : {};
  const distinctId = await resolveDistinctId(body.anonymousId);

  await captureServerAnalyticsEvent({
    event: body.event,
    distinctId,
    properties: properties as AnalyticsProperties,
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}

async function parseAnalyticsEventRequest(request: Request) {
  try {
    return (await request.json()) as AnalyticsEventRequest;
  } catch {
    return null;
  }
}

async function resolveDistinctId(anonymousId: unknown) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) return user.id;
  } catch {
    // Analytics identity falls back to the anonymous client id.
  }

  if (typeof anonymousId === "string" && anonymousId.length <= 120) {
    return anonymousId;
  }

  return "anonymous";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
