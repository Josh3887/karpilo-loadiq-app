"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calculator,
  CircleDollarSign,
  Headset,
  Settings,
  Truck,
} from "lucide-react";

import { cn } from "@/utils/cn";

const navItems = [
  { label: "Analyze", href: "/dashboard", icon: Calculator },
  { label: "Loads", href: "/dashboard/history", icon: Truck },
  { label: "Billing", href: "/dashboard/billing", icon: CircleDollarSign },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Support", href: "/dashboard/support", icon: Headset },
] as const;

const utilityItems = [
  { label: "Templates", href: "/dashboard/templates" },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden flex-wrap items-center gap-3 md:flex">
        {[...navItems, ...utilityItems].map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition",
                isActive
                  ? "border-sky-400/50 bg-sky-400/10 text-sky-200"
                  : "border-slate-700 bg-[#0B1220] text-slate-300 hover:border-sky-400 hover:text-sky-300"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav className="fixed inset-x-2 bottom-2 z-40 grid grid-cols-5 gap-1 rounded-2xl border border-slate-800 bg-[#08111F]/95 p-1.5 shadow-[0_0_30px_rgba(2,6,23,0.75)] backdrop-blur md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl text-[0.58rem] font-black uppercase tracking-[0.08em] transition",
                isActive
                  ? "bg-sky-400/12 text-sky-200"
                  : "text-slate-300 hover:bg-sky-400/10 hover:text-sky-300"
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
