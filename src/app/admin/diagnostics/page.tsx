import Link from "next/link";
import { redirect } from "next/navigation";

import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  DIAGNOSTIC_FILTER_OPTIONS,
  getDiagnosticFilterHref,
  parseDiagnosticEventFilters,
  readAdminDiagnosticEvents,
  type AdminDiagnosticEvent,
  type DiagnosticEventFilters,
} from "@/lib/admin/diagnostic-events";
import { getOwnerOverrideDiagnostics } from "@/domains/billing/owner-access";
import { getElevatedSessionStatus } from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";

type AdminDiagnosticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncate(value: string | null, maxLength: number) {
  if (!value) return "None";
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function optionLabel(value: string) {
  if (value === "all") return "All";
  if (value === "24h") return "Last 24 hours";
  if (value === "7d") return "Last 7 days";
  if (value === "30d") return "Last 30 days";
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function buildApiHref(filters: DiagnosticEventFilters) {
  return getDiagnosticFilterHref(filters).replace(
    "/admin/diagnostics",
    "/api/admin/diagnostic-events",
  );
}

export default async function AdminDiagnosticsPage({
  searchParams,
}: AdminDiagnosticsPageProps) {
  const rawSearchParams = await searchParams;
  const filters = parseDiagnosticEventFilters(rawSearchParams);
  const result = await requireAdminAccess(["admin", "developer", "owner"]);

  if (!result.ok && result.status === 401) {
    redirect("/admin/login");
  }

  if (!result.ok) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_diagnostics_page_access_denied",
      eventType: "admin_diagnostics_page_access",
      status: "blocked",
      targetUserId: result.user?.id,
    });

    return (
      <main className="min-h-screen bg-[#060B14] px-6 py-10 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">
            Diagnostics Access
          </p>
          <h1 className="mt-3 text-2xl font-black">Access denied</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Diagnostic events require elevated admin, developer, or owner
            access.
          </p>
        </section>
      </main>
    );
  }

  const elevatedStatus = await getElevatedSessionStatus(result.access);

  if (!elevatedStatus.elevated) {
    redirect("/admin/elevated");
  }

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_diagnostics_page_access",
    eventType: "admin_diagnostics_page_access",
    status: "success",
    metadata: { filters },
  });
  const ownerDiagnostics = getOwnerOverrideDiagnostics(result.user.email);

  let events: AdminDiagnosticEvent[] = [];
  let readError: string | null = null;

  try {
    events = await readAdminDiagnosticEvents(filters);
  } catch (error) {
    console.error("ADMIN_DIAGNOSTICS_PAGE_READ_ERROR:", error);
    readError = "Unable to read diagnostic events.";
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
              Karpilo LoadIQ Control Plane
            </p>
            <h1 className="mt-3 text-3xl font-black">Diagnostics</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Elevated operational view of sanitized diagnostic events captured
              by the internal diagnostics foundation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-slate-700 bg-[#0B1220] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-200 transition hover:border-sky-400/50"
            >
              Admin
            </Link>
            <Link
              href={buildApiHref(filters)}
              className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-100 transition hover:border-sky-300/60"
            >
              JSON
            </Link>
          </div>
        </div>

        <form
          action="/admin/diagnostics"
          className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-[#0B1220] p-4 md:grid-cols-5"
        >
          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Severity
            <select
              name="severity"
              defaultValue={filters.severity}
              className="h-11 rounded-xl border border-slate-700 bg-[#060B14] px-3 text-sm font-bold normal-case tracking-normal text-slate-100"
            >
              {DIAGNOSTIC_FILTER_OPTIONS.severities.map((severity) => (
                <option key={severity} value={severity}>
                  {optionLabel(severity)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Source
            <select
              name="source"
              defaultValue={filters.source}
              className="h-11 rounded-xl border border-slate-700 bg-[#060B14] px-3 text-sm font-bold normal-case tracking-normal text-slate-100"
            >
              {DIAGNOSTIC_FILTER_OPTIONS.sources.map((source) => (
                <option key={source} value={source}>
                  {optionLabel(source)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Date
            <select
              name="window"
              defaultValue={filters.window}
              className="h-11 rounded-xl border border-slate-700 bg-[#060B14] px-3 text-sm font-bold normal-case tracking-normal text-slate-100"
            >
              {DIAGNOSTIC_FILTER_OPTIONS.windows.map((window) => (
                <option key={window} value={window}>
                  {optionLabel(window)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Status
            <select
              name="resolved"
              defaultValue={filters.resolved}
              className="h-11 rounded-xl border border-slate-700 bg-[#060B14] px-3 text-sm font-bold normal-case tracking-normal text-slate-100"
            >
              {DIAGNOSTIC_FILTER_OPTIONS.resolvedStatuses.map((status) => (
                <option key={status} value={status}>
                  {optionLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-sky-400 px-4 text-xs font-black uppercase tracking-[0.16em] text-[#060B14]"
            >
              Apply
            </button>
          </div>
        </form>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <DiagnosticMetric
            label="Owner override configured"
            value={ownerDiagnostics.ownerOverrideConfigured ? "true" : "false"}
          />
          <DiagnosticMetric
            label="Owner override matched"
            value={ownerDiagnostics.ownerOverrideMatched ? "true" : "false"}
          />
        </section>

        {readError && (
          <p className="mt-6 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
            {readError}
          </p>
        )}

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1220]">
          <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Digest</th>
                <th className="px-4 py-3">Release</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={8}>
                    No diagnostic events match the current filters.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-b border-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      {formatDate(event.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-bold text-sky-100">
                      {event.severity}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{event.source}</td>
                    <td className="max-w-[180px] px-4 py-3 text-slate-300">
                      {truncate(event.route, 48)}
                    </td>
                    <td className="max-w-[360px] px-4 py-3 text-slate-200">
                      {truncate(event.message, 120)}
                    </td>
                    <td className="max-w-[180px] px-4 py-3 font-mono text-xs text-slate-400">
                      {truncate(event.digest, 44)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {truncate(event.releaseVersion, 28)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {event.resolvedAt ? "Resolved" : "Open"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function DiagnosticMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-4">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-slate-100">{value}</div>
    </div>
  );
}
