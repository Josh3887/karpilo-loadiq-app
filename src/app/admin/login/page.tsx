import Link from "next/link";

import { AdminPasswordlessLoginForm } from "@/components/admin/admin-passwordless-login-form";
import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="w-full rounded-2xl border border-sky-400/20 bg-[#0B1220] p-6 shadow-[0_0_34px_rgba(56,189,248,0.1)]">
          <LoadIqMark size="lg" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
            {BRAND.productName}
          </p>
          <h1 className="mt-2 text-3xl font-black">
            Admin Control Plane Login
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Passwordless founder/admin entry. Authorized identities receive a
            Supabase sign-in link, then complete elevated challenge
            verification.
          </p>

          <AdminPasswordlessLoginForm />

          <p className="mt-5 text-sm text-slate-400">
            Regular driver access remains at{" "}
            <Link href="/auth/login" className="text-sky-300">
              app login
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
