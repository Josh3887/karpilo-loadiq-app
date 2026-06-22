import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const SEVERITIES = ["debug", "info", "warning", "error", "critical"] as const;
const SOURCES = ["app", "dashboard", "admin", "api", "server", "client"] as const;
const DATE_WINDOWS = ["24h", "7d", "30d"] as const;
const RESOLVED_STATUSES = ["open", "resolved", "all"] as const;

export type DiagnosticSeverityFilter = (typeof SEVERITIES)[number] | "all";
export type DiagnosticSourceFilter = (typeof SOURCES)[number] | "all";
export type DiagnosticDateWindow = (typeof DATE_WINDOWS)[number];
export type DiagnosticResolvedStatus = (typeof RESOLVED_STATUSES)[number];

export type DiagnosticEventFilters = {
  severity: DiagnosticSeverityFilter;
  source: DiagnosticSourceFilter;
  window: DiagnosticDateWindow;
  resolved: DiagnosticResolvedStatus;
};

export type AdminDiagnosticEvent = {
  id: string;
  createdAt: string;
  severity: string;
  source: string;
  environment: string;
  route: string | null;
  userId: string | null;
  releaseVersion: string | null;
  message: string;
  digest: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
};

export const DIAGNOSTIC_FILTER_OPTIONS = {
  severities: ["all", ...SEVERITIES],
  sources: ["all", ...SOURCES],
  windows: DATE_WINDOWS,
  resolvedStatuses: RESOLVED_STATUSES,
} as const;

function getFirstParam(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
) {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }

  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function isOption<T extends readonly string[]>(
  value: string | undefined,
  options: T,
): value is T[number] {
  return Boolean(value && options.includes(value));
}

export function parseDiagnosticEventFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): DiagnosticEventFilters {
  const severity = getFirstParam(params, "severity");
  const source = getFirstParam(params, "source");
  const window = getFirstParam(params, "window");
  const resolved = getFirstParam(params, "resolved");

  return {
    severity: isOption(severity, DIAGNOSTIC_FILTER_OPTIONS.severities)
      ? severity
      : "all",
    source: isOption(source, DIAGNOSTIC_FILTER_OPTIONS.sources) ? source : "all",
    window: isOption(window, DIAGNOSTIC_FILTER_OPTIONS.windows) ? window : "24h",
    resolved: isOption(resolved, DIAGNOSTIC_FILTER_OPTIONS.resolvedStatuses)
      ? resolved
      : "open",
  };
}

export function getDiagnosticFilterHref(filters: DiagnosticEventFilters) {
  const params = new URLSearchParams();

  if (filters.severity !== "all") params.set("severity", filters.severity);
  if (filters.source !== "all") params.set("source", filters.source);
  if (filters.window !== "24h") params.set("window", filters.window);
  if (filters.resolved !== "open") params.set("resolved", filters.resolved);

  const query = params.toString();
  return query ? `/admin/diagnostics?${query}` : "/admin/diagnostics";
}

function getWindowStart(window: DiagnosticDateWindow) {
  const now = Date.now();
  const durationMs =
    window === "24h"
      ? 24 * 60 * 60 * 1000
      : window === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;

  return new Date(now - durationMs).toISOString();
}

export async function readAdminDiagnosticEvents(filters: DiagnosticEventFilters) {
  const supabaseAdmin = createSupabaseAdminClient();
  let query = supabaseAdmin
    .from("diagnostic_events")
    .select(
      "id,created_at,severity,source,environment,route,user_id,release_version,message,digest,resolved_at,resolved_by,resolution_note",
    )
    .gte("created_at", getWindowStart(filters.window))
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters.severity !== "all") {
    query = query.eq("severity", filters.severity);
  }

  if (filters.source !== "all") {
    query = query.eq("source", filters.source);
  }

  if (filters.resolved === "open") {
    query = query.is("resolved_at", null);
  }

  if (filters.resolved === "resolved") {
    query = query.not("resolved_at", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`ADMIN_DIAGNOSTIC_EVENTS_READ_FAILED: ${error.message}`);
  }

  return (data ?? []).map((event) => ({
    id: event.id,
    createdAt: event.created_at,
    severity: event.severity,
    source: event.source,
    environment: event.environment,
    route: event.route,
    userId: event.user_id,
    releaseVersion: event.release_version,
    message: event.message,
    digest: event.digest,
    resolvedAt: event.resolved_at,
    resolvedBy: event.resolved_by,
    resolutionNote: event.resolution_note,
  })) satisfies AdminDiagnosticEvent[];
}
