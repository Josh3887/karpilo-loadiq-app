"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase-client";

export function RegisterForm() {
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
    <form onSubmit={handleRegister} className="mt-6 space-y-4">
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

      {status && <p className="text-sm text-slate-400">{status}</p>}

      <p className="text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-sky-400">
          Sign in
        </Link>
      </p>
    </form>
  );
}
