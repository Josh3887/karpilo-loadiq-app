import Link from "next/link";

import { SiteFooter } from "@/components/legal/site-footer";

type LegalPageShellProps = {
  title: string;
  eyebrow: string;
  description: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalPageShell({
  title,
  eyebrow,
  description,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <main className="min-h-screen bg-[#060B14] text-slate-100">
      <section className="border-b border-slate-800 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_48%)]">
        <div className="mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20">
          <Link
            href="/"
            className="text-xs font-black uppercase tracking-[0.22em] text-sky-300 transition hover:text-sky-200"
          >
            {eyebrow}
          </Link>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400">
            Last Updated: {lastUpdated}. {description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 md:px-10">
        {children}
      </section>

      <SiteFooter />
    </main>
  );
}
