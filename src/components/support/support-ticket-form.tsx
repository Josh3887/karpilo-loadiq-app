"use client";

import { useState } from "react";

import { CONTACT_EMAILS } from "@/config/contact";
import { usePreviewMode } from "@/components/preview/preview-mode-provider";
import { ThemedSelect } from "@/components/ui/themed-select";
import { createFeedback } from "@/services/feedback";
import {
  createSupportTicket,
  SupportTicketPayload,
} from "@/services/support-tickets";

const ticketCategories = [
  { label: "General Support", value: "support" },
  { label: "Bug or Glitch", value: "bug" },
  { label: "Refund Request", value: "refund" },
  { label: "Billing", value: "billing" },
  { label: "Privacy or Data", value: "privacy" },
  { label: "Account Deletion", value: "account_deletion" },
  { label: "Recommendation", value: "feature" },
];

type SupportTicketFormProps = {
  title?: string;
  description?: string;
  initialCategory?: SupportTicketPayload["category"];
};

export function SupportTicketForm({
  title = "Contact Support",
  description = `Use support for account, billing, privacy, deletion, and app issues. Recommendations are routed separately for product review. Email fallback: ${CONTACT_EMAILS.support}.`,
  initialCategory = "support",
}: SupportTicketFormProps) {
  const preview = usePreviewMode();
  const [ticket, setTicket] = useState<SupportTicketPayload>({
    category: initialCategory,
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");

  async function handleSubmit() {
    if (preview.enabled) {
      preview.explain("support-ticket");
      return;
    }

    try {
      const isRecommendation = ticket.category === "feature";
      setStatus(
        isRecommendation
          ? "Sending recommendation..."
          : "Sending support request..."
      );

      if (isRecommendation) {
        await createFeedback({
          subject: ticket.subject,
          message: ticket.message,
        });
      } else {
        await createSupportTicket(ticket);
      }

      setTicket({ category: initialCategory, subject: "", message: "" });
      setStatus(
        isRecommendation
          ? `Recommendation received. Product feedback is reviewed separately through ${CONTACT_EMAILS.feedback}.`
          : `Support request received. We will reply through ${CONTACT_EMAILS.support}.`
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to send support request."
      );
    }
  }

  return (
    <section
      data-preview-explain="support-ticket"
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]"
    >
      <h2 className="break-words text-lg font-bold text-slate-100">{title}</h2>
      <p className="mt-2 break-words text-sm leading-6 text-slate-400 [overflow-wrap:anywhere]">
        {description}
      </p>

      <div className="mt-5 grid gap-4">
        <ThemedSelect
          label="Request Type"
          value={ticket.category}
          previewExplanation="support-ticket"
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
            data-preview-explain="support-ticket"
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
        data-preview-explain="support-ticket"
        onClick={handleSubmit}
        disabled={!ticket.subject || !ticket.message}
        className="mt-5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase leading-5 tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {ticket.category === "feature" ? "Send Recommendation" : "Send Request"}
      </button>

      {status && (
        <p className="mt-4 break-words text-sm text-slate-400 [overflow-wrap:anywhere]">
          {status}
        </p>
      )}
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
        data-preview-explain="support-ticket"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}
