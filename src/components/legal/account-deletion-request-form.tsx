"use client";

import { useState } from "react";

import {
  requestAccountDeletion,
  type AccountDeletionPayload,
} from "@/services/account-deletion";

export function AccountDeletionRequestForm() {
  const [payload, setPayload] = useState<AccountDeletionPayload>({
    contactEmail: "",
    reason: "",
    requestedScope: "account_and_data",
    acknowledgedSubscriptionWarning: false,
  });
  const [status, setStatus] = useState("");

  async function handleSubmit() {
    try {
      setStatus("Submitting account deletion request...");
      await requestAccountDeletion(payload);
      setPayload({
        contactEmail: "",
        reason: "",
        requestedScope: "account_and_data",
        acknowledgedSubscriptionWarning: false,
      });
      setStatus(
        "Deletion request received. Support will review billing, retention, and identity requirements before completion."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to submit account deletion request."
      );
    }
  }

  return (
    <section className="rounded-2xl border border-red-400/25 bg-red-500/10 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-200">
        Account & Data Deletion
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-100">
        Request account deletion
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        This starts a review request for account and associated app data
        deletion. Cancel active subscriptions through Stripe, Apple, or Google
        before deletion so future billing is stopped by the billing platform.
      </p>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Contact Email
          </span>
          <input
            type="email"
            value={payload.contactEmail}
            onChange={(event) =>
              setPayload((prev) => ({
                ...prev,
                contactEmail: event.target.value,
              }))
            }
            className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Request Scope
          </span>
          <select
            value={payload.requestedScope}
            onChange={(event) =>
              setPayload((prev) => ({
                ...prev,
                requestedScope: event.target
                  .value as AccountDeletionPayload["requestedScope"],
              }))
            }
            className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          >
            <option value="account_and_data">Delete account and app data</option>
            <option value="data_only">Delete app data where possible</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Optional Context
          </span>
          <textarea
            value={payload.reason}
            onChange={(event) =>
              setPayload((prev) => ({ ...prev, reason: event.target.value }))
            }
            className="min-h-28 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm leading-6 text-slate-300">
          <input
            type="checkbox"
            checked={payload.acknowledgedSubscriptionWarning}
            onChange={(event) =>
              setPayload((prev) => ({
                ...prev,
                acknowledgedSubscriptionWarning: event.target.checked,
              }))
            }
            className="mt-1 h-4 w-4 accent-red-300"
          />
          <span>
            I understand account deletion does not automatically cancel active
            subscriptions with Stripe, Apple, or Google, and some records may be
            retained for legal, billing, fraud prevention, tax, dispute, or
            security reasons.
          </span>
        </label>
      </div>

      <button
        type="button"
        disabled={
          !payload.contactEmail || !payload.acknowledgedSubscriptionWarning
        }
        onClick={handleSubmit}
        className="mt-5 rounded-xl border border-red-300/40 bg-red-500/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit Deletion Request
      </button>

      {status && <p className="mt-4 text-sm leading-6 text-slate-300">{status}</p>}
    </section>
  );
}
