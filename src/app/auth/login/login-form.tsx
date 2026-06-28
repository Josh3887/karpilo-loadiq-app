"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ANALYTICS_EVENTS, trackAnalyticsEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase-client";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("Signing in...");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Signed in. Opening app...");
    void trackAnalyticsEvent(ANALYTICS_EVENTS.USER_SIGNED_IN, {
      route: "/auth/login",
    });
    const nextPath = getSafeRedirectPath(
      new URLSearchParams(window.location.search).get("next")
    );
    router.push(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="mt-6 space-y-4">
      <input
        type="email"
        placeholder="Email"
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none focus:border-sky-400"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none focus:border-sky-400"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <button
        type="submit"
        className="w-full rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14]"
      >
        Sign In
      </button>

      {status && <p className="text-sm text-slate-400">{status}</p>}

      <p className="text-sm text-slate-400">
        <Link href="/auth/forgot-password" className="text-sky-400">
          Forgot password?
        </Link>
      </p>

      <p className="text-sm text-slate-400">
        Need access?{" "}
        <Link href="/request-access" className="text-sky-400">
          Request controlled access
        </Link>
      </p>

      <p className="border-t border-slate-800 pt-4 text-sm text-slate-400">
        Founder/admin?{" "}
        <Link href="/admin/login" className="text-sky-400">
          Founder/Admin access
        </Link>
      </p>
    </form>
  );
}

function getSafeRedirectPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value)
  ) {
    return "/dashboard";
  }

  return value;
}
