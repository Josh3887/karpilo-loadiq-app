import type { Metadata } from "next";

import { DataSources } from "@/components/legal/data-sources";
import { LegalContent } from "@/components/legal/legal-content";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import {
  PRIVACY_POLICY_LAST_UPDATED,
  PRIVACY_POLICY_SECTIONS,
} from "@/content/legal/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Karpilo LoadIQ",
  description:
    "Privacy Policy for Karpilo LoadIQ, including third-party operational datasets and EIA fuel data handling.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Karpilo LoadIQ"
      title="Privacy Policy"
      lastUpdated={PRIVACY_POLICY_LAST_UPDATED}
      description="This policy explains how LoadIQ handles account, operational, support, billing, analytics, third-party, retention, and deletion data."
    >
      <div className="grid gap-6">
        <LegalContent sections={PRIVACY_POLICY_SECTIONS} />
        <DataSources showPlanned />
      </div>
    </LegalPageShell>
  );
}
