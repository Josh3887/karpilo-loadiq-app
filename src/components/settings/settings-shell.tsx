import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  Gauge,
  RadioTower,
  Settings,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import { BackToDashboardLink } from "@/components/dashboard/back-to-dashboard-link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { cn } from "@/utils/cn";

export const LOADIQ_SETTINGS_LINKS = [
  {
    title: "LoadIQ Command Settings",
    href: "/dashboard/settings",
    description: "The operator command deck for account, billing, and profile controls.",
    icon: Settings,
    accent: "sky",
  },
  {
    title: "Operator Identity",
    href: "/dashboard/settings/account",
    description: "Email, password, logout, and account status.",
    icon: UserRound,
    accent: "slate",
  },
  {
    title: "Billing Command",
    href: "/dashboard/settings/billing",
    description: "Subscription access, billing rail, entitlement state, and billing support.",
    icon: BadgeDollarSign,
    accent: "emerald",
  },
  {
    title: "Expense Intelligence",
    href: "/dashboard/settings/expenses",
    description: "Overhead, cost categories, deduction assumptions, and expense defaults.",
    icon: Gauge,
    accent: "red",
  },
  {
    title: "Vehicle Intelligence",
    href: "/dashboard/settings/vehicle",
    description: "Truck profile, MPG, reserve assumptions, and equipment defaults.",
    icon: Truck,
    accent: "sky",
  },
] as const;

type SettingsPageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function SettingsPageShell({
  eyebrow = "K-LIQ Command Center",
  title,
  description,
  children,
  actions,
}: SettingsPageShellProps) {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 pb-24 pt-6 text-slate-100 md:px-8 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              {eyebrow}
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {actions}
            <DashboardNav />
            <BackToDashboardLink />
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}

type SettingsNavCardProps = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  meta?: string;
  accent?: "sky" | "red" | "emerald" | "slate";
};

export function SettingsNavCard({
  href,
  title,
  description,
  icon: Icon,
  meta,
  accent = "sky",
}: SettingsNavCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-48 flex-col justify-between rounded-2xl border bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)] transition hover:-translate-y-0.5",
        accent === "red" &&
          "border-red-500/20 hover:border-red-400/40 hover:shadow-[0_0_35px_rgba(239,68,68,0.14)]",
        accent === "emerald" &&
          "border-emerald-400/20 hover:border-emerald-300/40 hover:shadow-[0_0_35px_rgba(52,211,153,0.14)]",
        accent === "sky" &&
          "border-sky-400/20 hover:border-sky-300/45 hover:shadow-[0_0_35px_rgba(56,189,248,0.14)]",
        accent === "slate" &&
          "border-slate-800 hover:border-slate-600 hover:shadow-[0_0_35px_rgba(148,163,184,0.1)]"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-100">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border p-3",
            accent === "red" && "border-red-400/25 bg-red-500/10 text-red-200",
            accent === "emerald" &&
              "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
            accent === "sky" && "border-sky-300/25 bg-sky-400/10 text-sky-200",
            accent === "slate" &&
              "border-slate-700 bg-slate-900/80 text-slate-200"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-4 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
        <span>{meta ?? "Open station"}</span>
        <RadioTower
          className="h-4 w-4 transition group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

type SettingsPanelProps = {
  title: string;
  description?: string;
  kicker?: string;
  children: ReactNode;
  tone?: "default" | "warning" | "success";
};

export function SettingsPanel({
  title,
  description,
  kicker,
  children,
  tone = "default",
}: SettingsPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)] md:p-6",
        tone === "default" && "border-slate-800",
        tone === "warning" && "border-red-500/25 bg-red-500/5",
        tone === "success" && "border-emerald-400/25 bg-emerald-400/5"
      )}
    >
      <div className="mb-5">
        {kicker && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
            {kicker}
          </p>
        )}
        <h2 className="text-2xl font-black tracking-tight text-slate-100">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

type SettingsMetricProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "blue" | "red" | "green";
};

export function SettingsMetric({
  label,
  value,
  detail,
  tone = "default",
}: SettingsMetricProps) {
  return (
    <div
      className={cn(
        "min-h-32 rounded-2xl border bg-[#060B14] p-4",
        tone === "default" && "border-slate-800",
        tone === "blue" && "border-sky-400/20 bg-sky-400/5",
        tone === "red" && "border-red-500/20 bg-red-500/5",
        tone === "green" && "border-emerald-400/20 bg-emerald-400/5"
      )}
    >
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-2xl font-black capitalize text-slate-100">
        {value}
      </div>
      {detail && <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "red" | "green" | "slate";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em]",
        tone === "blue" && "border-sky-400/25 bg-sky-400/10 text-sky-200",
        tone === "red" && "border-red-500/25 bg-red-500/10 text-red-200",
        tone === "green" &&
          "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
        tone === "slate" && "border-slate-700 bg-slate-900 text-slate-200"
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  );
}
