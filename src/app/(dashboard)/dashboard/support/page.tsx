import Link from "next/link";
import { redirect } from "next/navigation";

import { SupportTicketForm } from "@/components/support/support-ticket-form";
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              Support
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Practical help for freight profitability assumptions, saved loads,
              and operational modeling.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300 hover:bg-sky-400/20"
          >
            Dashboard
          </Link>
        </header>

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
            href="https://www.karpiloloadiq.com"
            className="mt-4 inline-flex rounded-xl border border-red-300/25 bg-[#060B14] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-red-200 hover:border-red-200"
          >
            Product Updates
          </Link>
        </section>
      </div>
    </main>
  );
}
