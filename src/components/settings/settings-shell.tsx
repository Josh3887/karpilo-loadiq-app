import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeDollarSign,
  ClipboardCheck,
  Gauge,
  RadioTower,
  Settings,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import { BackToDashboardLink } from "@/components/dashboard/back-to-dashboard-link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import type { PreviewExplanationKey } from "@/components/preview/preview-mode-provider";
import { cn } from "@/utils/cn";

export const LOADIQ_SETTINGS_LINKS = [
  {
    title: "Karpilo LoadIQ Command Settings",
    href: "/dashboard/settings",
    description:
      "The operating profile source for account, billing, expenses, vehicle assumptions, FitCheck review, pay templates, and calculator defaults.",
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
    title: "Operating Profile & Vehicle Intelligence",
    href: "/dashboard/settings/vehicle",
    description:
      "Driver targets, truck/equipment profile, fuel assumptions, pay templates, reserves, and calculator defaults.",
    icon: Truck,
    accent: "sky",
  },
  {
    title: "FitCheck Profile Review",
    href: "/dashboard/settings/fitcheck",
    description:
      "Review FitCheck snapshots that can hydrate the Settings operating profile without becoming a separate source of truth.",
    icon: ClipboardCheck,
    accent: "emerald",
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
  eyebrow = "Karpilo LoadIQ Command Center",
  title,
  description,
  children,
  actions,
}: SettingsPageShellProps) {
  return (
    <main className="min-h-screen bg-[#060B14] px-4 pb-24 pt-6 text-slate-100 md:px-8 md:pb-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 break-words text-xs font-bold uppercase leading-5 tracking-[0.3em] text-sky-400">
              {eyebrow}
            </p>
            <h1 className="break-words text-3xl font-black tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-slate-400 md:text-base">
              {description}
            </p>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-3 lg:justify-end">
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
        "group flex min-h-48 min-w-0 max-w-full flex-col justify-between overflow-hidden rounded-2xl border bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)] transition hover:-translate-y-0.5",
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
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-black tracking-tight text-slate-100">
            {title}
          </h2>
          <p className="mt-3 break-words text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-xl border p-3",
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
      <div className="mt-6 flex min-w-0 items-center justify-between gap-4 text-xs font-black uppercase leading-5 tracking-[0.18em] text-sky-300">
        <span className="min-w-0 break-words">{meta ?? "Open station"}</span>
        <RadioTower
          className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
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
  previewExplanation?: PreviewExplanationKey;
};

export function SettingsPanel({
  title,
  description,
  kicker,
  children,
  tone = "default",
  previewExplanation,
}: SettingsPanelProps) {
  return (
    <section
      data-preview-explain={
        previewExplanation ?? inferSettingsPreviewKey(`${title} ${description ?? ""}`)
      }
      className={cn(
        "min-w-0 max-w-full overflow-hidden rounded-2xl border bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)] md:p-6",
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
        <h2 className="break-words text-2xl font-black tracking-tight text-slate-100">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-400">
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
  previewExplanation?: PreviewExplanationKey;
};

export function SettingsMetric({
  label,
  value,
  detail,
  tone = "default",
  previewExplanation,
}: SettingsMetricProps) {
  return (
    <div
      data-preview-explain={previewExplanation ?? inferSettingsPreviewKey(label)}
      className={cn(
        "min-h-32 min-w-0 max-w-full overflow-hidden rounded-2xl border bg-[#060B14] p-4",
        tone === "default" && "border-slate-800",
        tone === "blue" && "border-sky-400/20 bg-sky-400/5",
        tone === "red" && "border-red-500/20 bg-red-500/5",
        tone === "green" && "border-emerald-400/20 bg-emerald-400/5"
      )}
    >
      <div className="break-words text-xs font-bold uppercase leading-5 tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 max-w-full break-words text-xl font-black leading-tight text-slate-100 [overflow-wrap:anywhere] sm:text-2xl">
        {value}
      </div>
      {detail && (
        <p className="mt-2 break-words text-xs leading-5 text-slate-400 [overflow-wrap:anywhere]">
          {detail}
        </p>
      )}
    </div>
  );
}

function inferSettingsPreviewKey(value: string): PreviewExplanationKey {
  const label = value.toLowerCase();

  if (label.includes("billing") || label.includes("subscription")) {
    return "subscription-tile";
  }

  if (label.includes("expense") || label.includes("overhead")) {
    return "overhead-item";
  }

  if (label.includes("vehicle") || label.includes("truck") || label.includes("mpg")) {
    return "vehicle-profile";
  }

  if (label.includes("operator") || label.includes("account") || label.includes("email")) {
    return "operator-identity";
  }

  if (label.includes("ifta") || label.includes("pro")) {
    return "ifta-estimate";
  }

  return "settings-station";
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
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-left text-xs font-black uppercase leading-5 tracking-[0.16em] [overflow-wrap:anywhere]",
        tone === "blue" && "border-sky-400/25 bg-sky-400/10 text-sky-200",
        tone === "red" && "border-red-500/25 bg-red-500/10 text-red-200",
        tone === "green" &&
          "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
        tone === "slate" && "border-slate-700 bg-slate-900 text-slate-200"
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}
