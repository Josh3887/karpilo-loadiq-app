import type { Metadata } from "next";
import Link from "next/link";

import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: `Forgot Password | ${BRAND.productName}`,
  description: `Request a secure ${BRAND.productName} password reset email.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
          <LoadIqMark size="lg" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
            {BRAND.productName}
          </p>
          <h1 className="mt-2 text-3xl font-black">Reset Password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter your account email. If it matches an account, Supabase will
            send a secure recovery link.
          </p>
          <ForgotPasswordForm />
          <p className="mt-5 text-sm text-slate-400">
            Remembered it?{" "}
            <Link href="/auth/login" className="text-sky-400">
              Back to login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
