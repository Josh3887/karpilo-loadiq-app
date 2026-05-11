"use client";

import Link from "next/link";
import { useState } from "react";

import { CHECKOUT_ACKNOWLEDGEMENT_TEXT } from "@/content/legal/billing-disclosures";
import { StripeCheckoutPlanId } from "@/config/stripe";

type CheckoutAcknowledgementProps = {
  label?: string;
  planId?: StripeCheckoutPlanId;
};

export function CheckoutAcknowledgement({
  label = "Checkout pending",
  planId,
}: CheckoutAcknowledgementProps) {
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");

  async function startCheckout() {
    if (!accepted || !planId) return;

    setStatus("Opening Stripe checkout...");
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planId }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };

    if (!response.ok || !data.url) {
      setStatus(data.error ?? "Unable to start Stripe checkout.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="mt-6 space-y-3 rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-300">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 h-4 w-4 accent-sky-400"
        />
        <span>
          {CHECKOUT_ACKNOWLEDGEMENT_TEXT}{" "}
          <Link
            href="/terms"
            className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
          >
            Terms
          </Link>
          ,{" "}
          <Link
            href="/privacy"
            className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
          >
            Privacy Policy
          </Link>
          ,{" "}
          <Link
            href="/refund-policy"
            className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
          >
            Refund Policy
          </Link>
          , and{" "}
          <Link
            href="/subscription-terms"
            className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
          >
            Subscription Terms
          </Link>
          .
        </span>
      </label>

      <button
        type="button"
        disabled={!accepted || !planId}
        onClick={startCheckout}
        className="w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
      >
        {label}
      </button>

      {!planId && (
        <p className="text-xs leading-5 text-slate-500">
          Checkout is unavailable until a Stripe plan ID is connected here.
        </p>
      )}

      {status && <p className="text-sm leading-6 text-slate-400">{status}</p>}
    </div>
  );
}
