"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, Mail } from "lucide-react";

import { createClient } from "@/lib/supabase-client";

export function AccountSecurityPanel({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [logoutStatus, setLogoutStatus] = useState("");

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || normalizedEmail === currentEmail.toLowerCase()) {
      setEmailStatus("Enter a new email address before saving.");
      return;
    }

    setEmailStatus("Saving email update...");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      email: normalizedEmail,
    });

    if (error) {
      setEmailStatus(error.message);
      return;
    }

    setEmailStatus("Email update requested. Check the new inbox to confirm it.");
    router.refresh();
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setPasswordStatus("Use at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordStatus("Passwords do not match.");
      return;
    }

    setPasswordStatus("Saving password update...");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setPasswordStatus(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setPasswordStatus("Password updated.");
    router.refresh();
  }

  async function handleLogout() {
    setLogoutStatus("Signing out...");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <form
        onSubmit={handleEmailSubmit}
        className="rounded-2xl border border-slate-800 bg-[#060B14] p-5"
      >
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-sky-300" aria-hidden="true" />
          <h3 className="text-lg font-black text-slate-100">Email Control</h3>
        </div>
        <label className="mt-5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Account Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#0B1220] px-4 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          autoComplete="email"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Update Email
        </button>
        {emailStatus && (
          <p className="mt-3 text-sm leading-6 text-slate-400">{emailStatus}</p>
        )}
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-2xl border border-slate-800 bg-[#060B14] p-5"
      >
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-sky-300" aria-hidden="true" />
          <h3 className="text-lg font-black text-slate-100">Password Control</h3>
        </div>
        <label className="mt-5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          New Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#0B1220] px-4 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          autoComplete="new-password"
        />
        <label className="mt-4 block text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#0B1220] px-4 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          autoComplete="new-password"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Update Password
        </button>
        <Link
          href="/auth/forgot-password"
          className="mt-4 block text-sm font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
        >
          Forgot password
        </Link>
        {passwordStatus && (
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {passwordStatus}
          </p>
        )}
      </form>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5 text-red-300" aria-hidden="true" />
          <h3 className="text-lg font-black text-slate-100">Session Control</h3>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-400">
          End this browser session and return to the Karpilo LoadIQ login screen.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-red-200 transition hover:bg-red-500/20"
        >
          Logout
        </button>
        {logoutStatus && (
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {logoutStatus}
          </p>
        )}
      </div>
    </div>
  );
}
