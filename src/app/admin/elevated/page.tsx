import Link from "next/link";
import { redirect } from "next/navigation";

import { ElevatedAuthPanel } from "@/components/admin/elevated-auth-panel";
import { writeAdminAuditEvent } from "@/lib/admin/audit";
import {
  ELEVATED_ADMIN_ROLES,
  getElevatedSessionStatus,
} from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";

export default async function AdminElevatedPage() {
  const result = await requireAdminAccess(ELEVATED_ADMIN_ROLES);

  if (!result.ok && result.status === 401) {
    redirect("/admin/login");
  }

  if (!result.ok) {
    await writeAdminAuditEvent({
      access: result.access,
      action: "admin_elevated_access_denied",
      eventType: "admin_elevated_access",
      status: "blocked",
      targetUserId: result.user?.id,
    });

    return (
      <main className="min-h-screen bg-[#060B14] px-6 py-10 text-slate-100">
        <section className="mx-auto max-w-3xl rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">
            Elevated Access
          </p>
          <h1 className="mt-3 text-2xl font-black">Access denied</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Elevated admin entry requires backend-governed owner, admin, or
            developer access.
          </p>
        </section>
      </main>
    );
  }

  const elevatedStatus = await getElevatedSessionStatus(result.access);

  if (elevatedStatus.elevated) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-2xl border border-sky-400/20 bg-[#0B1220] p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
          Karpilo LoadIQ Control Plane
        </p>
        <h1 className="mt-3 text-3xl font-black">Elevated verification</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Base Supabase session verified as {result.access.highestRole}. Finish
          the emailed challenge and short-lived token flow to unlock the admin
          control plane.
        </p>

        <ElevatedAuthPanel
          email={result.access.user.email}
          role={result.access.highestRole}
          initialStatus={elevatedStatus}
          successRedirectTo="/admin"
        />

        <Link
          href="/dashboard"
          className="mt-5 inline-flex text-sm font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
        >
          Return to app dashboard
        </Link>
      </section>
    </main>
  );
}
