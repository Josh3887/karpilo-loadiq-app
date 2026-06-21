"use client";

import Link from "next/link";

export function RegisterForm() {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4">
        <p className="text-sm leading-6 text-red-100">
          Public signup is not available at this time. Karpilo LoadIQ is
          preparing controlled access for beta, legacy, and founding operator
          launch phases.
        </p>
      </div>
      <Link
        href="/request-access"
        className="block w-full rounded-xl border border-slate-700 bg-[#060B14] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-slate-200 transition hover:border-sky-400/50 hover:text-sky-200"
      >
        Request Access
      </Link>
      <p className="text-sm leading-6 text-slate-400">
        Already have access?{" "}
        <Link href="/login" className="font-bold text-sky-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
