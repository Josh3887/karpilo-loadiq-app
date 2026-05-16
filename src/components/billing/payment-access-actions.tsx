"use client";

import { useState } from "react";
import Link from "next/link";
import { AppWindow, BadgeDollarSign, Mail } from "lucide-react";

import { usePreviewMode } from "@/components/preview/preview-mode-provider";
import {
  BILLING_MANAGEMENT_URLS,
  type PaymentRailManagementUrl,
} from "@/config/billing";
import type { PaymentAccess } from "@/domains/billing/entitlement-service";

type PaymentAccessActionsProps = {
  paymentAccess: PaymentAccess;
  billingEmail: string;
};

const providerLabels = {
  stripe: "Stripe",
  apple: "Apple App Store",
  google: "Google Play",
  manual: "Manual",
  unknown: "Unknown",
} as const;

export function PaymentAccessActions({
  paymentAccess,
  billingEmail,
}: PaymentAccessActionsProps) {
  const preview = usePreviewMode();
  const [status, setStatus] = useState("");
  const provider = paymentAccess.billingProvider;
  const canStartAppSubscription =
    (provider === "stripe" || provider === "unknown") &&
    !paymentAccess.hasActiveAccess;

  async function openStripePortal() {
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
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#060B14] p-5 lg:col-span-2">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="break-words text-xs font-bold uppercase leading-5 tracking-[0.22em] text-sky-300">
              Payment Rail
            </p>
            <h3 className="mt-2 break-words text-2xl font-black text-slate-100">
              {providerLabels[provider]}
            </h3>
            <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-400">
              Entitlement status controls access. The billing provider only
              decides where payment changes are managed.
            </p>
          </div>
          <BadgeDollarSign
            className="h-8 w-8 shrink-0 text-sky-300"
            aria-hidden="true"
          />
        </div>

        <div className="mt-5 flex min-w-0 flex-wrap gap-3">
          {paymentAccess.hasStripeCustomer && (
            <button
              type="button"
              onClick={openStripePortal}
              className="max-w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase leading-5 tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
            >
              Manage Stripe Billing
            </button>
          )}

          {provider === "apple" && (
            <StoreLink href={BILLING_MANAGEMENT_URLS.apple}>
              Manage in App Store
            </StoreLink>
          )}

          {provider === "google" && (
            <StoreLink href={BILLING_MANAGEMENT_URLS.google}>
              Manage in Google Play
            </StoreLink>
          )}

          {canStartAppSubscription && (
            preview.enabled ? (
              <button
                type="button"
                onClick={() => preview.explain("billing-command")}
                className="max-w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase leading-5 tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
              >
                Start Subscription
              </button>
            ) : (
              <Link
                href="/dashboard/billing"
                className="max-w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase leading-5 tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
              >
                Start Subscription
              </Link>
            )
          )}

          {paymentAccess.canContinueTrial && (
            <Link
              href="/dashboard"
              className="max-w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-xs font-black uppercase leading-5 tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-400/20"
            >
              Continue Trial
            </Link>
          )}

          <a
            href={`mailto:${billingEmail}`}
            onClick={(event) => {
              if (!preview.enabled) return;
              event.preventDefault();
              preview.explain("billing-command");
            }}
            className="max-w-full rounded-xl border border-slate-700 bg-[#0B1220] px-5 py-3 text-xs font-black uppercase leading-5 tracking-[0.18em] text-slate-200 transition hover:border-sky-400/40 hover:text-sky-200"
          >
            Billing Support
          </a>
        </div>

        {status && (
          <p className="mt-4 break-words text-sm text-slate-400 [overflow-wrap:anywhere]">
            {status}
          </p>
        )}
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#060B14] p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Mail className="h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
          <h3 className="min-w-0 break-words text-lg font-black text-slate-100">
            Billing Support
          </h3>
        </div>
        <p className="mt-4 break-words text-sm leading-6 text-slate-400">
          Use the dedicated billing channel for invoices, refunds, subscription
          questions, and payment rail issues.
        </p>
        <a
          href={`mailto:${billingEmail}`}
          onClick={(event) => {
            if (!preview.enabled) return;
            event.preventDefault();
            preview.explain("billing-command");
          }}
          className="mt-4 inline-flex max-w-full items-center gap-2 break-words text-sm font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4 [overflow-wrap:anywhere]"
        >
          <AppWindow className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words [overflow-wrap:anywhere]">
            {billingEmail}
          </span>
        </a>
      </div>
    </div>
  );
}

function StoreLink({
  href,
  children,
}: {
  href: PaymentRailManagementUrl;
  children: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="max-w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase leading-5 tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
    >
      {children}
    </a>
  );
}
