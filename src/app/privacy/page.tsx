import type { Metadata } from "next";
import Link from "next/link";

import { DataSources } from "@/components/legal/data-sources";
import { SiteFooter } from "@/components/legal/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Karpilo LoadIQ",
  description:
    "Privacy Policy for Karpilo LoadIQ, including third-party operational datasets and EIA fuel data handling.",
};

const lastUpdated = "May 11, 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#060B14] text-slate-100">
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_48%)]">
        <div className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20">
          <Link
            href="/"
            className="text-xs font-black uppercase tracking-[0.22em] text-sky-300 transition hover:text-sky-200"
          >
            Karpilo LoadIQ
          </Link>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">
            Last Updated: {lastUpdated}. This policy explains how LoadIQ handles
            account, operational, support, and third-party data dependencies.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-6 py-12 md:px-10">
        <PrivacySection title="Information You Provide">
          <p>
            LoadIQ may collect account information, profile settings, trucking
            operation assumptions, saved load details, calculator inputs,
            support messages, and billing or subscription status needed to
            provide the service.
          </p>
          <p>
            Operational information can include pickup and delivery details,
            route mileage, fuel assumptions, pay structure templates,
            overhead settings, post-trip actuals, facility notes, and private
            ratings you choose to save.
          </p>
        </PrivacySection>

        <PrivacySection title="Public Datasets and Third-Party APIs">
          <p>
            LoadIQ may utilize publicly available operational datasets and
            third-party APIs to support platform functionality. These sources
            may include fuel reference data, and future sources may support
            routing, weather, mapping, tolling, telematics, safety, compliance,
            or market analytics.
          </p>
          <p>
            Public or third-party datasets are used to support informational
            estimates and platform functionality. They are not used to sell your
            personal information.
          </p>
        </PrivacySection>

        <PrivacySection title="EIA Fuel Data Handling">
          <p>
            LoadIQ may use publicly available U.S. Energy Information
            Administration (EIA) Open Data to provide estimated diesel fuel
            reference values. LoadIQ&apos;s EIA fuel reference lookup does not
            require sending your personal account, saved load, driver profile,
            support messages, or private business notes to EIA.
          </p>
          <p>
            Fuel estimates may be cached by LoadIQ so the application can
            reduce external API calls, improve reliability, and preserve the
            estimate used for a load comparison.
          </p>
        </PrivacySection>

        <PrivacySection title="How Information Is Used">
          <p>
            Information is used to operate LoadIQ, calculate estimates, save
            user-owned history, personalize profitability assumptions, provide
            support, protect the service, enforce plan limits, and improve
            product reliability.
          </p>
          <p>
            LoadIQ may use aggregated or de-identified operational patterns to
            improve product quality, but private user data should remain
            user-owned and access-controlled.
          </p>
        </PrivacySection>

        <PrivacySection title="Security and User Isolation">
          <p>
            LoadIQ is designed around user-owned records and authenticated
            access controls. Saved loads, settings, notes, ratings, support
            messages, subscription records, and profitability history should be
            isolated to the owning user except where administrative access is
            required to operate or support the service.
          </p>
        </PrivacySection>

        <PrivacySection title="Contact">
          <p>
            Questions about this policy or data handling can be sent to{" "}
            <a
              href="mailto:support@karpiloloadiq.com"
              className="font-bold text-sky-300 transition hover:text-sky-200"
            >
              support@karpiloloadiq.com
            </a>
            .
          </p>
        </PrivacySection>

        <DataSources showPlanned />
      </section>

      <SiteFooter />
    </main>
  );
}

function PrivacySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/85 p-6 shadow-[0_0_28px_rgba(56,189,248,0.05)]">
      <h2 className="text-xl font-black text-slate-100">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-slate-400">
        {children}
      </div>
    </section>
  );
}
