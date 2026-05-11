import type { Metadata } from "next";
import Link from "next/link";

import { DataSources } from "@/components/legal/data-sources";
import { SiteFooter } from "@/components/legal/site-footer";
import { EIA_OPEN_DATA_URL } from "@/config/data-providers";

export const metadata: Metadata = {
  title: "Terms of Service | Karpilo LoadIQ",
  description:
    "Terms of Service for Karpilo LoadIQ, including operational estimates, external data sources, and fuel data limitations.",
};

const lastUpdated = "May 11, 2026";

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">
            Last Updated: {lastUpdated}. These terms describe how LoadIQ should
            be used as an informational trucking profitability decision-support
            platform.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-6 px-6 py-12 md:px-10">
        <LegalSection title="Informational Decision Support">
          <p>
            Karpilo LoadIQ provides estimates, projections, comparisons, and
            operational calculations based on user-provided inputs and available
            reference data. LoadIQ does not guarantee profitability, business
            success, freight availability, operational performance, income,
            margin, route cost, or fuel cost outcomes.
          </p>
          <p>
            LoadIQ is not financial, legal, accounting, tax, dispatch,
            investment, regulatory, or safety advice. Users remain solely
            responsible for verifying freight, routes, rates, costs, compliance
            obligations, and business decisions before accepting or running a
            load.
          </p>
        </LegalSection>

        <LegalSection title="Fuel Data and EIA Attribution">
          <p>
            Fuel pricing data may include publicly available datasets provided
            by the U.S. Energy Information Administration (EIA). EIA data is
            provided for informational estimation purposes only and does not
            imply endorsement by EIA or any government agency.
          </p>
          <p>
            EIA diesel data may be weekly, delayed, revised, national or
            regional in scope, and different from real-time pump prices,
            carrier-specific fuel programs, taxes, fees, discounts, or actual
            purchased fuel. Users should manually verify and override fuel costs
            when actual pricing is known.
          </p>
          <p>
            Learn more about EIA Open Data at{" "}
            <a
              href={EIA_OPEN_DATA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-sky-300 transition hover:text-sky-200"
            >
              eia.gov/opendata
              <span className="sr-only"> opens in a new tab</span>
            </a>
            .
          </p>
        </LegalSection>

        <LegalSection title="External Provider Data">
          <p>
            LoadIQ may use third-party or publicly available operational
            datasets to support functionality such as fuel references, routing,
            weather, mapping, compliance context, tolling, or market analytics.
            These sources may be unavailable, incomplete, delayed, inaccurate,
            revised, or subject to provider changes outside LoadIQ&apos;s control.
          </p>
          <p>
            Karpilo Endeavor Technologies LLC is not responsible for third-party
            provider outages, API failures, delayed datasets, data revisions,
            regional variation, or user-entered data inaccuracies.
          </p>
        </LegalSection>

        <LegalSection title="Operational Risk and User Responsibility">
          <p>
            Trucking operations are inherently variable. Profitability may be
            affected by market conditions, route changes, detention, deadhead,
            equipment condition, maintenance, weather, fuel volatility, freight
            availability, broker or customer behavior, dispatch decisions,
            carrier policies, and other conditions outside LoadIQ&apos;s control.
          </p>
          <p>
            Past profitability, estimated profitability, historical performance,
            and platform-generated comparisons do not predict future results.
            Users are responsible for independently evaluating whether a load,
            lane, customer, rate, or business decision is appropriate for their
            operation.
          </p>
        </LegalSection>

        <LegalSection title="No Warranties">
          <p>
            LoadIQ is provided on an informational and availability-dependent
            basis. To the fullest extent permitted by law, Karpilo Endeavor
            Technologies LLC disclaims warranties regarding data accuracy,
            uninterrupted availability, fitness for a particular business
            outcome, and profitability results.
          </p>
        </LegalSection>

        <LegalSection title="Limitation of Liability">
          <p>
            Karpilo Endeavor Technologies LLC, Karpilo LoadIQ, and their
            affiliates, operators, developers, contractors, and licensors shall
            not be liable for operational losses, lost revenue, lost freight
            opportunities, downtime, business interruption, dispatch decisions,
            indirect damages, consequential damages, fuel pricing inaccuracies,
            mileage inaccuracies, routing inaccuracies, third-party API
            failures, market fluctuations, or user-entered data inaccuracies.
          </p>
        </LegalSection>

        <DataSources showPlanned />
      </section>

      <SiteFooter />
    </main>
  );
}

function LegalSection({
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
