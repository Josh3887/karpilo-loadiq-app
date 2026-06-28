"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ElevatedAuthPanelProps = {
  email: string | null | undefined;
  role: string;
  initialStatus: ElevatedStatus;
  successRedirectTo?: string;
};

type ElevatedStatus = {
  elevated: boolean;
  expiresAt?: string | null;
  reason?: string;
};

async function readJson(response: Response) {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    message?: string;
    elevated?: boolean;
    expiresAt?: string | null;
  };

  if (!response.ok) {
    throw new Error(body.error || "Request failed.");
  }

  return body;
}

export function ElevatedAuthPanel({
  email,
  role,
  initialStatus,
  successRedirectTo,
}: ElevatedAuthPanelProps) {
  const router = useRouter();
  const [challenge, setChallenge] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<ElevatedStatus>(initialStatus);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function requestChallenge() {
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const body = await readJson(
        await fetch("/api/admin/elevated/challenge", {
          method: "POST",
        }),
      );
      setMessage(body.message || "Challenge email sent.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request challenge.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function verifyChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const body = await readJson(
        await fetch("/api/admin/elevated/verify-challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challenge }),
        }),
      );
      setChallenge("");
      setMessage(body.message || "Challenge verified. Token email sent.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to verify challenge.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function verifyToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      const body = await readJson(
        await fetch("/api/admin/elevated/verify-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }),
      );
      setToken("");
      setStatus({ elevated: Boolean(body.elevated), expiresAt: body.expiresAt });
      setMessage("Elevated session active.");
      if (successRedirectTo) {
        router.push(successRedirectTo);
      }
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to verify token.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function revokeSession() {
    setIsBusy(true);
    setError("");
    setMessage("");

    try {
      await readJson(
        await fetch("/api/admin/elevated/revoke", {
          method: "POST",
        }),
      );
      setStatus({ elevated: false, reason: "revoked" });
      setMessage("Elevated session revoked.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to revoke elevated session.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
        Elevated Verification Required
      </p>
      <h2 className="mt-3 text-2xl font-black">Founder/admin challenge</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Normal role access is verified for {email || "this account"} as {role}.
        Elevated control-plane access requires an emailed challenge and
        short-lived token.
      </p>

      <div className="mt-5 rounded-xl border border-white/10 bg-[#060B14] p-4 text-sm text-slate-300">
        <p>
          Status:{" "}
          <span className="font-bold text-sky-200">
            {status?.elevated ? "Elevated" : "Not elevated"}
          </span>
        </p>
        {status?.expiresAt && (
          <p className="mt-1 text-slate-400">Expires: {status.expiresAt}</p>
        )}
      </div>

      <div className="mt-5 grid gap-4">
        <button
          type="button"
          onClick={requestChallenge}
          disabled={isBusy}
          className="rounded-xl bg-sky-400 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#060B14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Request Challenge
        </button>

        <form onSubmit={verifyChallenge} className="grid gap-3">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Challenge
            <input
              value={challenge}
              onChange={(event) => setChallenge(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none focus:border-sky-400"
              autoComplete="one-time-code"
            />
          </label>
          <button
            type="submit"
            disabled={isBusy || !challenge}
            className="rounded-xl border border-sky-300/35 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Verify Challenge
          </button>
        </form>

        <form onSubmit={verifyToken} className="grid gap-3">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Short-lived token
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none focus:border-sky-400"
              autoComplete="one-time-code"
            />
          </label>
          <button
            type="submit"
            disabled={isBusy || !token}
            className="rounded-xl border border-emerald-300/35 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Verify Token
          </button>
        </form>

        <button
          type="button"
          onClick={revokeSession}
          disabled={isBusy}
          className="rounded-xl border border-red-300/30 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Revoke Elevated Session
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
