import type { Metadata } from "next";

import { DataSources } from "@/components/legal/data-sources";
import { LegalContent } from "@/components/legal/legal-content";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  TERMS_LAST_UPDATED,
  TERMS_SECTIONS,
} from "@/content/legal/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service | Karpilo LoadIQ",
  description:
    "Terms of Service for Karpilo LoadIQ, including operational estimates, external data sources, subscriptions, acceptable use, IP protection, and liability limitations.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Karpilo LoadIQ"
      title="Terms of Service"
      lastUpdated={TERMS_LAST_UPDATED}
      description="These terms describe how Karpilo LoadIQ may be used as an operational trucking profitability decision-support platform."
    >
      <div className="grid gap-6">
        <LegalContent sections={TERMS_SECTIONS} />
        <DataSources showPlanned />
      </div>
    </LegalPageShell>
  );
}
