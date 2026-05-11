"use client";

import Link from "next/link";
import { useState } from "react";

import { CHECKOUT_ACKNOWLEDGEMENT_TEXT } from "@/content/legal/billing-disclosures";

type CheckoutAcknowledgementProps = {
  label?: string;
};

export function CheckoutAcknowledgement({
  label = "Checkout pending",
}: CheckoutAcknowledgementProps) {
  const [accepted, setAccepted] = useState(false);

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
        disabled={!accepted}
        className="w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
      >
        {label}
      </button>
    </div>
  );
}
