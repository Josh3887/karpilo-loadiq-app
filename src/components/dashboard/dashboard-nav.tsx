import Link from "next/link";

const navItems = [
  ["Analyze", "/dashboard"],
  ["History", "/dashboard/history"],
  ["Billing", "/dashboard/billing"],
  ["Settings", "/dashboard/settings"],
] as const;

const utilityItems = [
  ["Templates", "/dashboard/templates"],
  ["Support", "/dashboard/support"],
] as const;

export function DashboardNav() {
  return (
    <>
      <nav className="hidden flex-wrap items-center gap-3 md:flex">
        {[...navItems, ...utilityItems].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-slate-700 bg-[#0B1220] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
          >
            {label}
          </Link>
        ))}
      </nav>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-2 rounded-2xl border border-slate-800 bg-[#08111F]/95 p-2 shadow-[0_0_30px_rgba(2,6,23,0.75)] backdrop-blur md:hidden">
        {navItems.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="flex h-12 items-center justify-center rounded-xl text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-300 transition hover:bg-sky-400/10 hover:text-sky-300"
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
