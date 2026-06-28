import Link from "next/link";

export function BackToDashboardLink({ label = "Dashboard" }: { label?: string }) {
  return (
    <Link
      href="/dashboard"
      className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-400/20"
    >
      {label}
    </Link>
  );
}
