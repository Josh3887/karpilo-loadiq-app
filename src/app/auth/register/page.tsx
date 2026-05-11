"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase-client";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("Creating account...");
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard/onboarding`,
      },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    if (data.session) {
      setStatus("Account created. Opening profile setup...");
      router.push("/dashboard/onboarding");
      router.refresh();
      return;
    }

    setStatus(
      "Account created. Check your email, then sign in to finish profile setup."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060B14] px-4 text-slate-100">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0B1220] p-6 shadow-[0_0_30px_rgba(56,189,248,0.08)]"
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-400">
          Karpilo LoadIQ
        </p>

        <h1 className="text-3xl font-black">Create Account</h1>

        <p className="mt-2 text-sm text-slate-400">
          Start building your freight profitability history.
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
            Create Account
          </button>
        </div>

        {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}

        <p className="mt-6 text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-sky-400">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
