"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BadgeDollarSign, X } from "lucide-react";

import { BILLING_MANAGEMENT_URLS } from "@/config/billing";
import type { PaymentAccess } from "@/domains/billing/entitlement-service";

type PaymentSetupModalProps = {
  paymentAccess: PaymentAccess;
  billingEmail: string;
};

export function PaymentSetupModal({
  paymentAccess,
  billingEmail,
}: PaymentSetupModalProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState("");

  const canRemindLater =
    paymentAccess.entitlementStatus !== "past_due" &&
    paymentAccess.entitlementStatus !== "blocked";
  const canStartAppSubscription =
    (paymentAccess.billingProvider === "stripe" ||
      paymentAccess.billingProvider === "unknown") &&
    !paymentAccess.hasActiveAccess;
  const isBillingSurface =
    pathname === "/dashboard/billing" ||
    pathname.startsWith("/dashboard/settings/billing");

  if (!open || isBillingSurface || !paymentAccess.shouldPromptForBillingSetup) {
    return null;
  }

  async function openStripePortal() {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 py-5 backdrop-blur-sm md:items-center">
      <section className="w-full max-w-xl rounded-2xl border border-sky-400/25 bg-[#08111F] p-5 shadow-[0_0_45px_rgba(56,189,248,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-3 text-sky-200">
              <BadgeDollarSign className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
                Billing Setup
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-100">
                Activate Karpilo LoadIQ Access
              </h2>
            </div>
          </div>
          {canRemindLater && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Remind me later"
              className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300 transition hover:border-sky-400/40 hover:text-sky-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-300">
          Complete billing setup to activate or preserve your Karpilo LoadIQ
          subscription access. Eligible paid tiers include a 7-day trial where
          supported by the payment provider, then become part of your operating
          overhead visibility.
        </p>

        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm leading-6 text-red-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              Current entitlement status:{" "}
              <strong className="capitalize">
                {paymentAccess.entitlementStatus}
              </strong>
              .
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {canStartAppSubscription && (
            <Link
              href="/dashboard/billing"
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
            >
              Start Subscription
            </Link>
          )}

          {paymentAccess.billingProvider === "apple" && (
            <a
              href={BILLING_MANAGEMENT_URLS.apple}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
            >
              Manage in App Store
            </a>
          )}

          {paymentAccess.billingProvider === "google" && (
            <a
              href={BILLING_MANAGEMENT_URLS.google}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
            >
              Manage in Google Play
            </a>
          )}

          {paymentAccess.canContinueTrial && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-400/20"
            >
              Continue Trial
            </button>
          )}

          {paymentAccess.hasStripeCustomer && (
            <button
              type="button"
              onClick={openStripePortal}
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
            >
              Manage Billing
            </button>
          )}

          {canRemindLater && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-700 bg-[#0B1220] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200"
            >
              Remind Me Later
            </button>
          )}
        </div>

        <a
          href={`mailto:${billingEmail}`}
          className="mt-5 inline-flex text-sm font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
        >
          Billing help: {billingEmail}
        </a>

        {status && <p className="mt-3 text-sm text-slate-400">{status}</p>}
      </section>
    </div>
  );
}
