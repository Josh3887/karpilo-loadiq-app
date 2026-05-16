"use client";

import { useState } from "react";

const ADMIN_PASSWORDLESS_SUCCESS_MESSAGE =
  "If this email is authorized, check your inbox.";

async function readJson(response: Response) {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
  };

  return body.message || ADMIN_PASSWORDLESS_SUCCESS_MESSAGE;
}

export function AdminPasswordlessLoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/passwordless/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setMessage(await readJson(response));
    } catch {
      setMessage(ADMIN_PASSWORDLESS_SUCCESS_MESSAGE);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        Admin email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base normal-case tracking-normal text-slate-100 outline-none transition focus:border-sky-400"
          autoComplete="email"
          inputMode="email"
        />
      </label>

      <button
        type="submit"
        disabled={isBusy}
        className="w-full rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy ? "Sending Link..." : "Send Admin Link"}
      </button>

      {message && (
        <p className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-3 text-sm leading-6 text-sky-100">
          {message}
        </p>
      )}
    </form>
  );
}
