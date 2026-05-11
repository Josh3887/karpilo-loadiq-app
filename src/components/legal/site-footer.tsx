import Link from "next/link";

import { DataSources } from "@/components/legal/data-sources";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#060B14] px-6 py-8 text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:px-4">
        <DataSources compact />

        <div className="flex flex-col gap-4 text-xs leading-5 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 Karpilo Endeavor Technologies LLC. Karpilo LoadIQ is an
            informational decision-support platform.
          </p>

          <nav
            aria-label="Legal navigation"
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            <Link
              href="/terms"
              className="font-bold text-slate-400 transition hover:text-sky-300"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="font-bold text-slate-400 transition hover:text-sky-300"
            >
              Privacy
            </Link>
            <Link
              href="/refund-policy"
              className="font-bold text-slate-400 transition hover:text-sky-300"
            >
              Refund Policy
            </Link>
            <Link
              href="/subscription-terms"
              className="font-bold text-slate-400 transition hover:text-sky-300"
            >
              Subscription Terms
            </Link>
            <Link
              href="/legal"
              className="font-bold text-slate-400 transition hover:text-sky-300"
            >
              Legal
            </Link>
            <Link
              href="/account-deletion"
              className="font-bold text-slate-400 transition hover:text-sky-300"
            >
              Account Deletion
            </Link>
            <a
              href="https://www.eia.gov/opendata/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-400 transition hover:text-sky-300"
            >
              EIA Open Data
              <span className="sr-only"> opens in a new tab</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
