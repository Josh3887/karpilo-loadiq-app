import type { Metadata } from "next";

import { LegalContent } from "@/components/legal/legal-content";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  REFUND_POLICY_LAST_UPDATED,
  REFUND_POLICY_SECTIONS,
} from "@/content/legal/refund-policy";

export const metadata: Metadata = {
  title: "Refund Policy | Karpilo LoadIQ",
  description:
    "Refund Policy for Karpilo LoadIQ subscriptions, Stripe website billing, Apple App Store purchases, Google Play purchases, pilot access, and promotional pricing.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Karpilo LoadIQ"
      title="Refund Policy"
      lastUpdated={REFUND_POLICY_LAST_UPDATED}
      description="This policy explains refund handling for digital subscription access, direct website billing, Apple App Store purchases, Google Play purchases, pilot access, and promotional pricing."
    >
      <LegalContent sections={REFUND_POLICY_SECTIONS} />
    </LegalPageShell>
  );
}
