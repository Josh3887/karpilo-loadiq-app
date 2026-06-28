import Link from "next/link";

import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";

import { LoginForm } from "@/app/auth/login/login-form";

export const metadata = {
  title: "Login | Karpilo LoadIQ App",
  description: "Sign in to the controlled Karpilo LoadIQ app.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-8 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
        <section className="rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
          <LoadIqMark size="lg" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
            {BRAND.productName}
          </p>
          <h1 className="mt-2 text-3xl font-black">Login</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Access the controlled LoadIQ app. Account-side profile, billing,
            settings, and Fit Check tools remain available through the account
            portal.
          </p>
          <LoginForm />
          <Link
            href="/request-access"
            className="mt-4 block rounded-xl border border-slate-700 bg-[#060B14] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-slate-200 transition hover:border-sky-400/50 hover:text-sky-200"
          >
            Request Access
          </Link>
        </section>
      </div>
    </main>
  );
}
