import Link from "next/link";

const navItems = [
  ["History", "/dashboard/history"],
  ["Templates", "/dashboard/templates"],
  ["Billing", "/dashboard/billing"],
  ["Support", "/dashboard/support"],
  ["Legal", "/dashboard/legal"],
  ["Settings", "/dashboard/settings"],
] as const;

export function DashboardNav() {
  return (
    <nav className="flex flex-wrap items-center gap-3">
      {navItems.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="rounded-xl border border-slate-700 bg-[#0B1220] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
