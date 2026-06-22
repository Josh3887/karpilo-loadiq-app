import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  ANALYTICS_EVENTS,
  APPROVED_ANALYTICS_EVENTS,
  PROTECTED_ANALYTICS_DATA_TYPES,
} from "@/lib/analytics";
import {
  captureServerAnalyticsEvent,
  getPostHogAnalyticsStatus,
} from "@/lib/analytics-server";
import { writeAdminAuditEvent } from "@/lib/admin/audit";
import { getElevatedSessionStatus } from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";

export const metadata = {
  title: "PostHog Analytics | Karpilo LoadIQ Admin",
  description: "Internal PostHog product analytics status for Karpilo LoadIQ.",
};

export default async function AdminPostHogPage() {
  const result = await requireAdminAccess(["admin", "developer", "owner"]);

  if (!result.ok && result.status === 401) {
    redirect("/admin/login");
  }

  if (!result.ok) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_posthog_access_denied",
      eventType: ANALYTICS_EVENTS.ADMIN_DEVELOPER_TOOLS_VIEWED,
      status: "blocked",
    });

    return (
      <main className="min-h-screen bg-[#060B14] px-6 py-10 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">
            Admin Access
          </p>
          <h1 className="mt-3 text-2xl font-black">Access denied</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            PostHog analytics status requires admin, developer, or owner access.
          </p>
        </section>
      </main>
    );
  }

  const elevatedStatus = await getElevatedSessionStatus(result.access);

  if (!elevatedStatus.elevated) {
    redirect("/admin/elevated");
  }

  const status = getPostHogAnalyticsStatus();

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_posthog_page_access",
    eventType: ANALYTICS_EVENTS.ADMIN_DEVELOPER_TOOLS_VIEWED,
    status: "success",
    metadata: {
      posthog_enabled: status.enabled,
      posthog_configured: status.configured,
    },
  });

  await captureServerAnalyticsEvent({
    event: ANALYTICS_EVENTS.ADMIN_DEVELOPER_TOOLS_VIEWED,
    distinctId: result.access.user.id,
    properties: {
      account_role: result.access.highestRole,
      route: "/admin/posthog",
    },
  });
  await captureServerAnalyticsEvent({
    event: ANALYTICS_EVENTS.POSTHOG_STATUS_VIEWED,
    distinctId: result.access.user.id,
    properties: {
      account_role: result.access.highestRole,
      route: "/admin/posthog",
    },
  });

  return (
    <main className="min-h-screen bg-[#060B14] px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-sky-400/20 bg-[#0B1220] p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
            Internal Developer Tools
          </p>
          <h1 className="mt-3 text-3xl font-black">PostHog analytics status</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            PostHog is internal product analytics for launch testing and
            operator/developer visibility. It is not a client-facing LoadIQ
            feature and does not replace billing, entitlement, calculator,
            support, or AI governance systems.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusTile label="Enabled" value={status.enabled ? "Yes" : "No"} />
          <StatusTile
            label="Configured"
            value={status.configured ? "Token present" : "Missing token"}
          />
          <StatusTile label="Environment" value={status.environment} />
          <StatusTile label="App Version" value={status.appVersion} />
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#0B1220] p-6">
          <h2 className="text-lg font-black text-white">Configuration</h2>
          <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <ConfigRow label="Host" value={status.host} />
            <ConfigRow
              label="Dashboard"
              value={
                status.dashboardUrl ? (
                  <Link
                    href={status.dashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
                  >
                    Open configured PostHog dashboard
                  </Link>
                ) : (
                  "POSTHOG_DASHBOARD_URL not configured"
                )
              }
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0B1220] p-6">
          <h2 className="text-lg font-black text-white">Approved events</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {APPROVED_ANALYTICS_EVENTS.map((event) => (
              <code
                key={event}
                className="rounded-lg border border-white/10 bg-[#060B14] px-3 py-2 text-xs font-bold text-sky-100"
              >
                {event}
              </code>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
          <h2 className="text-lg font-black text-red-100">Protected data</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PROTECTED_ANALYTICS_DATA_TYPES.map((item) => (
              <p key={item} className="rounded-lg bg-red-950/30 px-3 py-2 text-sm text-red-100">
                {item}
              </p>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1220] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 break-words text-lg font-black text-white">{value}</p>
    </div>
  );
}

function ConfigRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#060B14] p-4">
      <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 break-words text-slate-200">{value}</dd>
    </div>
  );
}
