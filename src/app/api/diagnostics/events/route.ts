import { type NextRequest, NextResponse } from "next/server";

import {
  sanitizeDiagnosticEventInput,
  writeDiagnosticEvent,
} from "@/lib/diagnostics/events";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24_000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const DIGEST_DEDUPE_WINDOW_MS = 5 * 60 * 1000;
const MAX_EVENTS_PER_IP_WINDOW = 30;
const MAX_EVENTS_PER_SESSION_WINDOW = 10;
const MAX_TRACKED_KEYS = 500;

type RateWindow = {
  count: number;
  resetAt: number;
};

const ipRateWindows = new Map<string, RateWindow>();
const sessionRateWindows = new Map<string, RateWindow>();
const digestDedupeWindows = new Map<string, number>();

function jsonResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

function isTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const requestHost = new URL(request.url).host;
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();

    return originHost === requestHost || originHost === forwardedHost;
  } catch {
    return false;
  }
}

function getRequestIpKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function pruneMap<T>(map: Map<string, T>, isExpired: (value: T) => boolean) {
  for (const [key, value] of map) {
    if (isExpired(value)) {
      map.delete(key);
    }
  }

  if (map.size <= MAX_TRACKED_KEYS) return;

  for (const key of map.keys()) {
    map.delete(key);
    if (map.size <= MAX_TRACKED_KEYS) break;
  }
}

function isRateLimited(
  map: Map<string, RateWindow>,
  key: string | null,
  limit: number,
) {
  if (!key) return false;

  const now = Date.now();
  pruneMap(map, (window) => window.resetAt <= now);

  const current = map.get(key);

  if (!current || current.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

function isDuplicateDigest(key: string | null) {
  if (!key) return false;

  const now = Date.now();
  pruneMap(digestDedupeWindows, (expiresAt) => expiresAt <= now);

  const existing = digestDedupeWindows.get(key);
  if (existing && existing > now) return true;

  digestDedupeWindows.set(key, now + DIGEST_DEDUPE_WINDOW_MS);
  return false;
}

async function getAuthenticatedUserId() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  } catch {
    return null;
  }
}

function buildDigestDedupeKey(params: {
  digest: string | null;
  source: string;
  route: string | null;
  sessionId: string | null;
}) {
  if (!params.digest) return null;

  return [
    params.source,
    params.route ?? "unknown-route",
    params.sessionId ?? "anonymous-session",
    params.digest,
  ].join(":");
}

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false as const, status: 415, body: null };
  }

  const text = await request.text();

  if (text.length > MAX_BODY_BYTES) {
    return { ok: false as const, status: 413, body: null };
  }

  try {
    return {
      ok: true as const,
      status: 200,
      body: JSON.parse(text) as Record<string, unknown>,
    };
  } catch {
    return { ok: false as const, status: 400, body: null };
  }
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return jsonResponse({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = await readJsonBody(request);

  if (!parsed.ok) {
    return jsonResponse(
      { error: "Invalid diagnostic payload." },
      { status: parsed.status },
    );
  }

  const userId = await getAuthenticatedUserId();
  const event = sanitizeDiagnosticEventInput({
    severity: parsed.body.severity,
    source: parsed.body.source,
    environment: parsed.body.environment,
    route: parsed.body.route,
    userId,
    sessionId: parsed.body.sessionId,
    releaseVersion: parsed.body.releaseVersion,
    message: parsed.body.message,
    stack: parsed.body.stack,
    digest: parsed.body.digest,
    metadata: parsed.body.metadata,
  });

  if (!event) {
    return jsonResponse({ ok: true }, { status: 202 });
  }

  const ipKey = getRequestIpKey(request);

  if (
    isRateLimited(ipRateWindows, ipKey, MAX_EVENTS_PER_IP_WINDOW) ||
    isRateLimited(
      sessionRateWindows,
      event.sessionId,
      MAX_EVENTS_PER_SESSION_WINDOW,
    ) ||
    isDuplicateDigest(
      buildDigestDedupeKey({
        digest: event.digest,
        source: event.source,
        route: event.route,
        sessionId: event.sessionId,
      }),
    )
  ) {
    return jsonResponse({ ok: true }, { status: 202 });
  }

  try {
    await writeDiagnosticEvent(event);
  } catch (error) {
    console.error("DIAGNOSTIC_EVENT_ROUTE_ERROR:", error);
  }

  return jsonResponse({ ok: true }, { status: 202 });
}
