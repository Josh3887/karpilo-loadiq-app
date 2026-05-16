"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BRAND } from "@/config/brand";
import { createClient } from "@/lib/supabase-client";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Use at least 8 characters for the account password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/dashboard`;
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            source: "app_signup",
            product: BRAND.productName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        setStatus("Account created. Opening dashboard...");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      setStatus(
        "Account creation started. Check your email if confirmation is required, then sign in to the APP."
      );
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Signup is unavailable. Check configuration and retry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleRegister} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Account email
        </span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none focus:border-sky-400"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none focus:border-sky-400"
          placeholder="Minimum 8 characters"
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Confirm password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none focus:border-sky-400"
          placeholder="Re-enter password"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create APP Account"}
      </button>

      {status && (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {status}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </p>
      )}

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
    </form>
  );
}
