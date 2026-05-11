"use client";

import { useState } from "react";

import { ThemedSelect } from "@/components/ui/themed-select";
import {
  createSupportTicket,
  SupportTicketPayload,
} from "@/services/support-tickets";

const ticketCategories = [
  { label: "General Support", value: "support" },
  { label: "Bug or Glitch", value: "bug" },
  { label: "Refund Request", value: "refund" },
  { label: "Billing", value: "billing" },
  { label: "Feature Request", value: "feature" },
];

export function SupportTicketForm() {
  const [ticket, setTicket] = useState<SupportTicketPayload>({
    category: "support",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  async function handleSubmit() {
    try {
      setStatus("Sending support request...");
      await createSupportTicket(ticket);
      setTicket({ category: "support", subject: "", message: "" });
      setStatus("Support request received. We will reply through support@karpiloloadiq.com.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send support request.");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
      <h2 className="text-lg font-bold text-slate-100">Contact Support</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Use this for support, refund requests, billing questions, bugs, or
        product feedback. Email fallback: support@karpiloloadiq.com.
      </p>

      <div className="mt-5 grid gap-4">
        <ThemedSelect
          label="Request Type"
          value={ticket.category}
          onChange={(value) =>
            setTicket((prev) => ({
              ...prev,
              category: value as SupportTicketPayload["category"],
            }))
          }
          options={ticketCategories}
        />

        <Field
          label="Subject"
          value={ticket.subject}
          onChange={(value) => setTicket((prev) => ({ ...prev, subject: value }))}
        />

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Message
          </span>
          <textarea
            value={ticket.message}
            onChange={(event) =>
              setTicket((prev) => ({ ...prev, message: event.target.value }))
            }
            className="min-h-32 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!ticket.subject || !ticket.message}
        className="mt-5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send Request
      </button>

      {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}
