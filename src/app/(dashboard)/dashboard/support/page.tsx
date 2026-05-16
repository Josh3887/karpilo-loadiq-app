import Link from "next/link";
import { redirect } from "next/navigation";

import { BackToDashboardLink } from "@/components/dashboard/back-to-dashboard-link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { SupportTicketForm } from "@/components/support/support-ticket-form";
import { CONTACT_EMAILS } from "@/config/contact";
import { LOADIQ_URLS } from "@/config/loadiq";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase-server";

const faqs = [
  [
    "Why does LoadIQ call these estimates?",
    "Because real load profitability depends on actual dispatch, traffic, fuel stops, accessorial approval, repairs, delays, and settlement deductions. LoadIQ explains the assumptions it can see.",
  ],
  [
    "What should I enter as overhead?",
    "Use your best weekly or per-trip operating burden: truck payment, insurance, trailer, ELD, permits, services, and recurring business costs. The settings page helps convert active overhead items into weekly burn.",
  ],
  [
    "How should I model reimbursed tolls or lumpers?",
    "Add the item as an expense and mark it reimbursed when you expect it to come back. Keep proof because reimbursement timing still affects cash flow.",
  ],
  [
    "Does this replace an accountant or dispatcher?",
    "No. It is a decision-support tool for load economics. It should be used alongside settlement statements, carrier agreements, tax guidance, and operating records.",
  ],
] as const;

export default async function SupportPage() {
  const previewMode = await isPreviewModeEnabled();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !previewMode) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 break-words text-xs font-bold uppercase leading-5 tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="break-words text-3xl font-black tracking-tight md:text-5xl">
              Support
            </h1>

            <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-400 md:text-base">
              Practical help for freight profitability assumptions, saved loads,
              and operational modeling.
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
            <DashboardNav />
            <BackToDashboardLink />
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <ContactCard
            title="Support"
            email={CONTACT_EMAILS.support}
            body="Customer support, account issues, deletion requests, billing support, app issues, and privacy requests."
          />
          <ContactCard
            title="Recommendations / Feedback"
            email={CONTACT_EMAILS.feedback}
            body="Driver feedback, feature recommendations, operational workflow suggestions, and founder-era product notes."
          />
        </section>

        <section className="space-y-4">
          {faqs.map(([question, answer]) => (
            <article
              key={question}
              className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]"
            >
              <h2 className="text-lg font-bold text-slate-100">{question}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">{answer}</p>
            </article>
          ))}
        </section>

        <div className="mt-6">
          <SupportTicketForm />
        </div>

        <section className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
          <h2 className="text-lg font-bold text-slate-100">
            Legal, privacy, and account requests
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            For privacy, data retention, restore purchase, subscription, or
            account deletion requests, use the legal hub or email{" "}
            <span className="break-words font-semibold text-sky-200 [overflow-wrap:anywhere]">
              {CONTACT_EMAILS.support}
            </span>
            .
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dashboard/legal"
              className="rounded-xl border border-sky-400/30 bg-[#060B14] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300"
            >
              Legal Hub
            </Link>
            <Link
              href="/account-deletion"
              className="rounded-xl border border-red-300/25 bg-[#060B14] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-red-200"
            >
              Account Deletion
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <h2 className="text-lg font-bold text-red-200">
            Escalation Preparation
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Before requesting support, capture the load number, route, entered
            assumptions, expected settlement, and a screenshot of the result.
            This keeps support lightweight and preserves founder time during a
            launch spike.
          </p>
          <Link
            href={LOADIQ_URLS.website}
            className="mt-4 inline-flex rounded-xl border border-red-300/25 bg-[#060B14] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-red-200 hover:border-red-200"
          >
            Product Updates
          </Link>
        </section>
      </div>
    </main>
  );
}

function ContactCard({
  title,
  email,
  body,
}: {
  title: string;
  email: string;
  body: string;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
      <p className="break-words text-xs font-black uppercase leading-5 tracking-[0.2em] text-sky-300">
        {title}
      </p>
      <p className="mt-2 break-words text-lg font-black text-slate-100 [overflow-wrap:anywhere]">
        {email}
      </p>
      <p className="mt-3 break-words text-sm leading-6 text-slate-400">
        {body}
      </p>
    </article>
  );
}
