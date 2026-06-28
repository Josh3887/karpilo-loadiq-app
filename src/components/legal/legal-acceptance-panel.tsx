"use client";

import Link from "next/link";
import { useState } from "react";

import { acknowledgeLaunchLegalBundle } from "@/services/legal-acknowledgments";

export function LegalAcceptancePanel() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedSubscription, setAcceptedSubscription] = useState(false);
  const [status, setStatus] = useState("");
  const canAccept = acceptedTerms && acceptedPrivacy && acceptedSubscription;

  async function handleAccept() {
    if (!canAccept) return;

    try {
      setStatus("Recording legal acknowledgements...");
      await acknowledgeLaunchLegalBundle();
      setStatus("Legal acknowledgements recorded.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to record legal acknowledgements."
      );
    }
  }

  return (
    <section className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">
        Legal Acceptance
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-100">
        Review launch policies before using paid workflows.
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        These acknowledgements support app store, Stripe, and subscription
        compliance. The operational disclaimer remains mandatory before
        calculating freight.
      </p>

      <div className="mt-5 grid gap-3">
        <AcceptanceCheckbox
          checked={acceptedTerms}
          onChange={setAcceptedTerms}
          label="I agree to the Terms of Service."
          href="/terms"
          linkLabel="Terms"
        />
        <AcceptanceCheckbox
          checked={acceptedPrivacy}
          onChange={setAcceptedPrivacy}
          label="I acknowledge the Privacy Policy, including data retention and account deletion disclosures."
          href="/privacy"
          linkLabel="Privacy"
        />
        <AcceptanceCheckbox
          checked={acceptedSubscription}
          onChange={setAcceptedSubscription}
          label="I understand subscription auto-renewal, cancellation, refund, restore purchase, and billing platform disclosures."
          href="/subscription-terms"
          linkLabel="Subscription Terms"
        />
      </div>

      <button
        type="button"
        disabled={!canAccept}
        onClick={handleAccept}
        className="mt-5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
      >
        Accept Legal Terms
      </button>

      {status && <p className="mt-4 text-sm leading-6 text-slate-400">{status}</p>}
    </section>
  );
}

function AcceptanceCheckbox({
  checked,
  onChange,
  label,
  href,
  linkLabel,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm leading-6 text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-sky-400"
      />
      <span>
        {label}{" "}
        <Link
          href={href}
          className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
        >
          {linkLabel}
        </Link>
      </span>
    </label>
  );
}
