"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
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

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060B14] px-4 text-slate-100">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-[0_0_30px_rgba(56,189,248,0.08)]"
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
          Karpilo LoadIQ
        </p>

        <h1 className="text-3xl font-black">Login</h1>

        <p className="mt-2 text-sm text-slate-400">
          Access your freight profitability command center.
        </p>

        <div className="mt-6 space-y-4">
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
        </div>

        {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}

        <p className="mt-6 text-sm text-slate-400">
          No account?{" "}
          <Link href="/auth/register" className="text-sky-400">
            Create one
          </Link>
        </p>
      </form>
    </main>
  );
}
