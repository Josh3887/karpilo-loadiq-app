import Link from "next/link";

import { BRAND } from "@/config/brand";

const WEBSITE_SIGNUP_URL = `${BRAND.urls.website}/signup`;

export function RegisterForm() {
  return (
    <div className="mt-6 space-y-4">
      <a
        href={WEBSITE_SIGNUP_URL}
        className="block w-full rounded-xl bg-sky-400 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-[#060B14] transition hover:bg-sky-300"
      >
        Open Website Signup
      </a>

      <a
        href={`${BRAND.urls.website}/pilot-program`}
        className="block w-full rounded-xl border border-slate-700 bg-[#060B14] px-5 py-4 text-center text-sm font-black uppercase tracking-[0.2em] text-slate-200 transition hover:border-sky-400/50 hover:text-sky-200"
      >
        Pilot Reservation
      </a>

      <p className="text-sm leading-6 text-slate-400">
        Already have access?{" "}
        <Link href="/auth/login" className="font-bold text-sky-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
