import type { Metadata } from "next";
import Link from "next/link";

import { AccountDeletionRequestForm } from "@/components/legal/account-deletion-request-form";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { LEGAL_CONTACT_EMAIL } from "@/content/legal/billing-disclosures";

export const metadata: Metadata = {
  title: "Account Deletion | Karpilo LoadIQ",
  description:
    "Request deletion of a Karpilo LoadIQ account and associated app data.",
};

export default function AccountDeletionPage() {
  return (
    <LegalPageShell
      eyebrow="Karpilo LoadIQ"
      title="Account Deletion"
      lastUpdated="May 11, 2026"
      description="Use this page to request account and associated app data deletion for Karpilo LoadIQ."
    >
      <div className="grid gap-6">
        <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/85 p-6">
          <h2 className="text-xl font-black text-slate-100">
            Before requesting deletion
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-400">
            <p>
              If you have an active subscription, cancel it through the platform
              where it was purchased before requesting account deletion. Stripe,
              Apple, and Google may each control their own billing and
              cancellation systems.
            </p>
            <p>
              If you cannot sign in, email{" "}
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}?subject=Karpilo%20LoadIQ%20Account%20Deletion%20Request`}
                className="font-bold text-sky-300 underline decoration-sky-400/40 underline-offset-4"
              >
                {LEGAL_CONTACT_EMAIL}
              </a>{" "}
              with the account email and deletion request. This page is the web
              resource for app store account deletion disclosures.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/legal"
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-300"
            >
              In-App Legal Hub
            </Link>
            <Link
              href="/privacy"
              className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300"
            >
              Privacy Policy
            </Link>
          </div>
        </section>

        <AccountDeletionRequestForm />
      </div>
    </LegalPageShell>
  );
}
