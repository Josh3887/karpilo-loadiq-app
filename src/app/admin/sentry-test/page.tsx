import { notFound, redirect } from "next/navigation";

import { SentryTestButton } from "@/components/observability/sentry-test-button";
import { getElevatedSessionStatus } from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";

export const metadata = {
  title: "Sentry Development Test | Karpilo LoadIQ Admin",
};

export default async function AdminSentryTestPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const result = await requireAdminAccess(["admin", "developer", "owner"]);

  if (!result.ok && result.status === 401) {
    redirect("/admin/login");
  }

  if (!result.ok) {
    notFound();
  }

  const elevatedStatus = await getElevatedSessionStatus(result.access);

  if (!elevatedStatus.elevated) {
    redirect("/admin/elevated");
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-2xl border border-amber-400/20 bg-[#0B1220] p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
          Development Only
        </p>
        <h1 className="mt-3 text-3xl font-black">Sentry test capture</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          This route exists only in local development and requires elevated
          admin access. It sends a synthetic exception without user, freight,
          address, financial, billing, or operational payload data.
        </p>
        <div className="mt-6">
          <SentryTestButton feature="admin" />
        </div>
      </section>
    </main>
  );
}
