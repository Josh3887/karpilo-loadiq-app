import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";

export function PortalHeader({ userEmail }: { userEmail?: string | null }) {
  return (
    <header className="border-b border-white/10 bg-[#060B14]/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/portal" className="flex items-center gap-4">
          <LoadIqMark size="md" />
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-300">
              {BRAND.productName}
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Controlled App Portal
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {userEmail ? (
            <p className="max-w-[18rem] truncate text-sm text-slate-400">
              {userEmail}
            </p>
          ) : null}
          <Link
            href="https://karpilo-liq.com"
            className="rounded-lg border border-white/10 bg-white/[0.035] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-200 hover:border-sky-400/30"
          >
            Website
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
