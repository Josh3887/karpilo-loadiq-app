"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";

type AtlasOutputReportActionProps = {
  featureKey: string;
  usageEventId?: string | null;
  cacheKey?: string | null;
};

const REPORT_REASONS = [
  { value: "incorrect", label: "Incorrect context" },
  { value: "unsafe", label: "Unsafe implication" },
  { value: "privacy", label: "Privacy concern" },
  { value: "offensive", label: "Inappropriate output" },
  { value: "other", label: "Other issue" },
];

export function AtlasOutputReportAction({
  featureKey,
  usageEventId,
  cacheKey,
}: AtlasOutputReportActionProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("incorrect");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!usageEventId && !cacheKey) {
    return null;
  }

  async function submitReport() {
    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/ai/report-output", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          featureKey,
          usageEventId,
          cacheKey,
          reason,
          details,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setStatus(data.message || "Atlas output reporting is unavailable.");
        return;
      }

      setStatus("Atlas output report received.");
      setDetails("");
      setOpen(false);
    } catch {
      setStatus("Atlas output reporting is unavailable.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400 transition hover:text-white"
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        Report Atlas output
      </button>

      {open && (
        <div className="mt-4 grid gap-3">
          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Reason
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-sm normal-case tracking-normal text-slate-200"
            >
              {REPORT_REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Details
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1200}
              rows={3}
              className="resize-none rounded-lg border border-white/10 bg-[#050B14] px-3 py-2 text-sm normal-case tracking-normal text-slate-200"
              placeholder="Optional context for review."
            />
          </label>

          <button
            type="button"
            onClick={submitReport}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            {submitting && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Submit report
          </button>
        </div>
      )}

      {status && <p className="mt-3 text-xs leading-5 text-slate-500">{status}</p>}
    </div>
  );
}
