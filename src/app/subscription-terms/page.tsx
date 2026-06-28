import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/legal-content";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  SUBSCRIPTION_TERMS_LAST_UPDATED,
  SUBSCRIPTION_TERMS_SECTIONS,
} from "@/content/legal/subscription-terms";

export const metadata: Metadata = {
  title: "Subscription Terms | Karpilo LoadIQ",
  description:
    "Subscription terms for Karpilo LoadIQ recurring billing, cancellations, platform purchases, failed payments, pilot pricing, and future plan governance.",
};

export default function SubscriptionTermsPage() {
  return (
    <LegalPageShell
      eyebrow="Karpilo LoadIQ"
      title="Subscription Terms"
      lastUpdated={SUBSCRIPTION_TERMS_LAST_UPDATED}
      description="These terms explain recurring billing, cancellation effects, payment platform handling, plan access, failed payments, and promotional subscription rules."
    >
      <LegalContent sections={SUBSCRIPTION_TERMS_SECTIONS} />
    </LegalPageShell>
  );
}
