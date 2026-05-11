import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Legal Center | Karpilo LoadIQ",
  description:
    "Legal and billing policy center for Karpilo LoadIQ, including Terms, Privacy Policy, Refund Policy, and Subscription Terms.",
};

const legalLinks = [
  {
    title: "Terms of Service",
    href: "/terms",
    description:
      "General platform use, estimates, data-source limitations, and liability boundaries.",
  },
  {
    title: "Privacy Policy",
    href: "/privacy",
    description:
      "How account, operational, support, and third-party data dependencies are handled.",
  },
  {
    title: "Refund Policy",
    href: "/refund-policy",
    description:
      "Refund eligibility, no-refund conditions, platform billing paths, pilot pricing, and dispute handling.",
  },
  {
    title: "Subscription Terms",
    href: "/subscription-terms",
    description:
      "Recurring billing, auto-renewal, cancellation effects, failed payments, and plan access.",
  },
];

export default function LegalCenterPage() {
  return (
    <LegalPageShell
      eyebrow="Karpilo LoadIQ"
      title="Legal Center"
      lastUpdated="May 11, 2026"
      description="A central reference for LoadIQ policies, billing terms, and platform-specific subscription guidance."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {legalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-800 bg-[#0B1220]/85 p-6 shadow-[0_0_28px_rgba(56,189,248,0.05)] transition hover:border-sky-400/40 hover:bg-sky-400/5"
          >
            <h2 className="text-xl font-black text-slate-100">
              {link.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {link.description}
            </p>
          </Link>
        ))}
      </div>
    </LegalPageShell>
  );
}
