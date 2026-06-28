import "server-only";

import { APP_VERSION } from "@/config/app-policies";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Json } from "@/types/supabase";

export const DIAGNOSTIC_SEVERITIES = [
  "debug",
  "info",
  "warning",
  "error",
  "critical",
] as const;

export const DIAGNOSTIC_SOURCES = [
  "app",
  "dashboard",
  "admin",
  "api",
  "server",
  "client",
] as const;

export type DiagnosticSeverity = (typeof DIAGNOSTIC_SEVERITIES)[number];
export type DiagnosticSource = (typeof DIAGNOSTIC_SOURCES)[number];

type DiagnosticEventInput = {
  severity?: unknown;
  source?: unknown;
  environment?: unknown;
  route?: unknown;
  userId?: string | null;
  sessionId?: unknown;
  releaseVersion?: unknown;
  message?: unknown;
  stack?: unknown;
  digest?: unknown;
  metadata?: unknown;
};

type SanitizedDiagnosticEvent = {
  severity: DiagnosticSeverity;
  source: DiagnosticSource;
  environment: string;
  route: string | null;
  userId: string | null;
  sessionId: string | null;
  releaseVersion: string | null;
  message: string;
  stack: string | null;
  digest: string | null;
  metadata: Record<string, Json>;
};

const MAX_METADATA_DEPTH = 3;
const MAX_METADATA_KEYS = 30;
const MAX_METADATA_ARRAY_LENGTH = 20;

const sensitiveKeyPattern =
  /authorization|cookie|password|secret|token|api[_-]?key|service[_-]?role|email|phone|client[_-]?secret|access[_-]?token|refresh[_-]?token|id[_-]?token|session/i;

const sensitiveQueryParamPattern =
  /([?&](?:code|token|state|session|secret|key|email|client_secret|access_token|refresh_token|id_token|password|redirect|next)=)[^&#\s"'<>]+/gi;

const sensitiveValuePatterns: Array<[RegExp, string]> = [
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]"],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]"],
  [
    /(authorization|cookie|set-cookie|password|secret|token|api[_-]?key|client[_-]?secret|access[_-]?token|refresh[_-]?token|id[_-]?token)\s*[:=]\s*["']?[^"'\s,;]+/gi,
    "$1=[redacted]",
  ],
  [
    /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
    "[redacted-jwt]",
  ],
  [/\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9_]{8,}\b/g, "[redacted-key]"],
  [
    /\b(?:cs|seti|pi|pm|cus|sub)_(?:live|test)?_?[A-Za-z0-9_]{8,}\b/g,
    "[redacted-provider-id]",
  ],
];

function isDiagnosticSeverity(value: unknown): value is DiagnosticSeverity {
  return (
    typeof value === "string" &&
    DIAGNOSTIC_SEVERITIES.includes(value as DiagnosticSeverity)
  );
}

function isDiagnosticSource(value: unknown): value is DiagnosticSource {
  return (
    typeof value === "string" &&
    DIAGNOSTIC_SOURCES.includes(value as DiagnosticSource)
  );
}

function redactSensitiveText(value: string) {
  const withoutUrlSecrets = value
    .replace(/(https?:\/\/[^\s"'<>?#]+)\?[^#\s"'<>]*/gi, "$1?[redacted]")
    .replace(sensitiveQueryParamPattern, "$1[redacted]");

  return sensitiveValuePatterns.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    withoutUrlSecrets,
  );
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;

  const cleaned = redactSensitiveText(value).trim();
  if (!cleaned) return null;

  return cleaned.slice(0, maxLength);
}

function cleanRoute(value: unknown) {
  const route = cleanString(value, 300);
  if (!route) return null;

  try {
    const parsed = route.startsWith("/")
      ? new URL(route, "https://app.karpilo-liq.com")
      : new URL(route);

    return parsed.pathname.slice(0, 300);
  } catch {
    return route.split("?")[0]?.split("#")[0]?.slice(0, 300) || null;
  }
}

function sanitizeMetadataValue(value: unknown, depth: number): Json | undefined {
  if (value === null) return null;

  if (typeof value === "string") {
    return cleanString(value, 500) ?? "";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_METADATA_DEPTH) return undefined;

    return value
      .slice(0, MAX_METADATA_ARRAY_LENGTH)
      .map((item) => sanitizeMetadataValue(item, depth + 1))
      .filter((item): item is Json => item !== undefined);
  }

  if (typeof value === "object") {
    if (depth >= MAX_METADATA_DEPTH) return undefined;

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !sensitiveKeyPattern.test(key))
        .slice(0, MAX_METADATA_KEYS)
        .map(([key, item]) => [
          cleanString(key, 80) ?? "field",
          sanitizeMetadataValue(item, depth + 1),
        ])
        .filter((entry): entry is [string, Json] => entry[1] !== undefined),
    );
  }

  return undefined;
}

function sanitizeMetadata(value: unknown) {
  const sanitized = sanitizeMetadataValue(value, 0);

  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    return {};
  }

  return sanitized as Record<string, Json>;
}

function getDefaultEnvironment() {
  return (
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "unknown"
  ).slice(0, 80);
}

export function sanitizeDiagnosticEventInput(
  input: DiagnosticEventInput,
): SanitizedDiagnosticEvent | null {
  const message = cleanString(input.message, 1000);

  if (!message) return null;

  return {
    severity: isDiagnosticSeverity(input.severity) ? input.severity : "error",
    source: isDiagnosticSource(input.source) ? input.source : "client",
    environment:
      cleanString(input.environment, 80) ?? getDefaultEnvironment(),
    route: cleanRoute(input.route),
    userId: input.userId ?? null,
    sessionId: cleanString(input.sessionId, 200),
    releaseVersion:
      cleanString(input.releaseVersion, 120) ?? APP_VERSION,
    message,
    stack: cleanString(input.stack, 8000),
    digest: cleanString(input.digest, 200),
    metadata: sanitizeMetadata(input.metadata),
  };
}

export async function writeDiagnosticEvent(input: DiagnosticEventInput) {
  const event = sanitizeDiagnosticEventInput(input);

  if (!event) {
    return { ok: false as const, reason: "invalid_payload" as const };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.from("diagnostic_events").insert({
    event_type: "app_error",
    severity: event.severity,
    source: event.source,
    environment: event.environment,
    route: event.route,
    user_id: event.userId,
    session_id: event.sessionId,
    release_version: event.releaseVersion,
    message: event.message,
    stack: event.stack,
    digest: event.digest,
    metadata: event.metadata,
  });

  if (error) {
    console.error("DIAGNOSTIC_EVENT_INSERT_ERROR:", error);
    return { ok: false as const, reason: "insert_failed" as const };
  }

  return { ok: true as const };
}
