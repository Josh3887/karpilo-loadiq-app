import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountDeletionRequestForm } from "@/components/legal/account-deletion-request-form";
import { LegalAcceptancePanel } from "@/components/legal/legal-acceptance-panel";
import { CustomerPortalButton } from "@/components/billing/customer-portal-button";
import { LEGAL_CONTACT_EMAIL } from "@/content/legal/billing-disclosures";
import { createClient } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Legal Hub | Karpilo LoadIQ",
  description:
    "In-app legal, privacy, subscription, restore purchases, cancellation, and account deletion hub for Karpilo LoadIQ.",
};

const legalLinks = [
  ["Terms", "/terms"],
  ["Privacy", "/privacy"],
  ["Refund Policy", "/refund-policy"],
  ["Subscription Terms", "/subscription-terms"],
  ["Public Legal Center", "/legal"],
  ["Account Deletion", "/account-deletion"],
] as const;

export default async function DashboardLegalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .eq("provider", "stripe")
    .not("provider_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Legal & Compliance Hub
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Privacy, subscriptions, restore purchases, account deletion,
              operational disclaimers, and support access in one place.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 hover:bg-sky-400/20"
          >
            Dashboard
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {legalLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)] transition hover:border-sky-400/40 hover:bg-sky-400/5"
            >
              <div className="text-lg font-black text-slate-100">{label}</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Open {label.toLowerCase()}.
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <LegalAcceptancePanel />

          <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              Subscription Management
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-100">
              Cancel, restore, or manage purchases.
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
              <p>
                Stripe subscriptions are managed through the Stripe customer
                portal when a Stripe customer exists.
              </p>
              <p>
                Apple subscriptions are managed in Apple account subscriptions.
                Google Play subscriptions are managed in Google Play
                subscriptions. Uninstalling the app does not automatically
                cancel a subscription.
              </p>
              <p>
                Restore purchases will apply to future native Apple/Google
                builds. For the web MVP, sign in with the same LoadIQ account
                and use billing support if an entitlement is missing.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {subscription?.provider_customer_id ? <CustomerPortalButton /> : null}
              <a
                href="https://apps.apple.com/account/subscriptions"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-300"
              >
                Apple Subscriptions
              </a>
              <a
                href="https://play.google.com/store/account/subscriptions"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-300"
              >
                Google Play Subscriptions
              </a>
            </div>
          </section>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
            Support Contact
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Legal, privacy, billing, refund, deletion, and restore-purchase
            questions can be sent to{" "}
            <a
              href={`mailto:${LEGAL_CONTACT_EMAIL}`}
              className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
            >
              {LEGAL_CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <div className="mt-6">
          <AccountDeletionRequestForm />
        </div>
      </div>
    </main>
  );
}
