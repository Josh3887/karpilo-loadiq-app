"use client";

import { useState } from "react";

import { usePreviewMode } from "@/components/preview/preview-mode-provider";

export function CustomerPortalButton() {
  const preview = usePreviewMode();
  const [status, setStatus] = useState("");

  async function openPortal() {
    if (preview.enabled) {
      preview.explain("stripe-portal");
      return;
    }

    setStatus("Opening Stripe customer portal...");

    const response = await fetch("/api/billing/portal", {
      method: "POST",
    });
    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };

    if (!response.ok || !data.url) {
      setStatus(data.error ?? "Unable to open Stripe customer portal.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openPortal}
        className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
      >
        Manage Subscription
      </button>
      {status && <p className="text-sm text-slate-400">{status}</p>}
    </div>
  );
}
