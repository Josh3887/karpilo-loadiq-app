"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase-client";

type RecoveryState = "checking" | "ready" | "missing" | "updated";

function getPasswordScore(password: string) {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return score;
}

function getPasswordHelp(score: number) {
  if (score >= 4) return "Strong password";
  if (score >= 3) return "Good password";
  if (score >= 2) return "Add length, numbers, or symbols";
  return "Use at least 12 characters with mixed character types";
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [recoveryState, setRecoveryState] =
    useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordScore = useMemo(() => getPasswordScore(password), [password]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setRecoveryState(data.session ? "ready" : "missing");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoveryState("ready");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("");

    if (passwordScore < 3) {
      setError("Choose a stronger password before continuing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError("Unable to update password. Request a fresh reset link.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      setRecoveryState("updated");
      setStatus("Password updated. Redirecting to login...");
      window.setTimeout(() => router.push("/auth/login"), 1200);
    } catch {
      setError("Password update is unavailable. Try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (recoveryState === "checking") {
    return <p className="mt-6 text-sm text-slate-400">Checking recovery link...</p>;
  }

  if (recoveryState === "missing") {
    return (
      <div className="mt-6 rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50">
        This reset page needs a valid Supabase recovery session. Request a fresh
        reset email and open the link from the same browser.
        <div className="mt-4">
          <Link href="/auth/forgot-password" className="font-bold text-amber-100">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          New password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none focus:border-sky-400"
        />
      </label>

      <div className="rounded-xl border border-slate-800 bg-[#060B14] p-3 text-sm text-slate-400">
        {getPasswordHelp(passwordScore)}
      </div>

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
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting || recoveryState === "updated"}
        className="w-full rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Updating..." : "Update Password"}
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
    </form>
  );
}
