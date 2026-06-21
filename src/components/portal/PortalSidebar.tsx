"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const portalLinks = [
  { label: "Portal", href: "/portal", icon: LayoutDashboard },
  { label: "Billing", href: "/portal/billing", icon: CreditCard },
  { label: "Settings", href: "/portal/settings", icon: Settings },
  { label: "Fit Check", href: "/portal/fit-check", icon: ClipboardCheck },
] as const;

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {portalLinks.map((link) => {
        const Icon = link.icon;
        const active =
          pathname === link.href ||
          (link.href !== "/portal" && pathname?.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 text-sm font-bold transition ${
              active
                ? "border-sky-400/40 bg-sky-400/15 text-sky-100"
                : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-sky-400/30 hover:text-sky-100"
            }`}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
