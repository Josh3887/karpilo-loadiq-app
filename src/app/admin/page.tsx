import Link from "next/link";
import { redirect } from "next/navigation";

import { writeAdminAuditEvent } from "@/lib/admin/audit";
import { getElevatedSessionStatus } from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";

const adminLinks = [
  ["/api/admin/identity", "Current admin identity"],
  ["/api/admin/audit-events", "Audit events"],
  ["/admin/diagnostics", "Diagnostics"],
  ["/admin/posthog", "PostHog analytics status"],
  ["/api/admin/notification-templates", "Notification templates"],
  ["/api/admin/notification-publications", "Notification publications"],
  ["/api/admin/publication-audiences", "Publication audiences"],
] as const;

export default async function AdminPage() {
  const result = await requireAdminAccess([
    "support",
    "admin",
    "developer",
    "owner",
  ]);

  if (!result.ok && result.status === 401) {
    redirect("/admin/login");
  }

  if (!result.ok) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_page_access_denied",
      eventType: "admin_page_access",
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
            This route requires backend-governed support, admin, developer, or
            owner access.
          </p>
        </section>
      </main>
    );
  }

  await writeAdminAuditEvent({
    access: result.access,
    action: "admin_page_access",
    eventType: "admin_page_access",
    status: "success",
  });

  const elevatedStatus = await getElevatedSessionStatus(result.access);

  if (!elevatedStatus.elevated) {
    redirect("/admin/elevated");
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-2xl border border-sky-400/20 bg-[#0B1220] p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
          Karpilo LoadIQ Control Plane
        </p>
        <h1 className="mt-3 text-3xl font-black">Admin scaffold</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Backend role verified as {result.access.highestRole}. This is a
          functional scaffold only; polished admin UI is intentionally not
          implemented yet. Elevated session expires at{" "}
          {elevatedStatus.expiresAt}.
        </p>

        <div className="mt-6 grid gap-3">
          {adminLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-sky-100 transition hover:border-sky-300/35"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
