import type { Metadata } from "next";
import Link from "next/link";

import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";

import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: `Set New Password | ${BRAND.productName}`,
  description: `Set a new ${BRAND.productName} password from a secure recovery link.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-8 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
          <LoadIqMark size="lg" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
            {BRAND.productName}
          </p>
          <h1 className="mt-2 text-3xl font-black">Set New Password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use the secure recovery session from your email link to update your
            password.
          </p>
          <ResetPasswordForm />
          <p className="mt-5 text-sm text-slate-400">
            Need another link?{" "}
            <Link href="/auth/forgot-password" className="text-sky-400">
              Request password reset
            </Link>
          </p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
            Security note
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Karpilo LoadIQ never stores reset tokens or password values in app tables.
            Password updates are handled by Supabase Auth through the recovery
            session.
          </p>
        </section>
      </div>
    </main>
  );
}
