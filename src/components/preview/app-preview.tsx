"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useState } from "react";
import {
  BadgeDollarSign,
  FileText,
  Gauge,
  History,
  Save,
  Settings,
  Truck,
  X,
} from "lucide-react";

import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { BRAND } from "@/config/brand";

type PreviewStation = "calculator" | "history" | "settings" | "billing";

const stations: Array<{
  id: PreviewStation;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    id: "calculator",
    label: "Calculator",
    description: "Estimate true RPM, fuel pressure, and net outcome.",
    icon: Gauge,
  },
  {
    id: "history",
    label: "History",
    description: "Review saved load decisions and operational references.",
    icon: History,
  },
  {
    id: "settings",
    label: "Settings",
    description: "Tune account, expense, and vehicle assumptions.",
    icon: Settings,
  },
  {
    id: "billing",
    label: "Billing",
    description: "Manage entitlement, subscription, and billing rail.",
    icon: BadgeDollarSign,
  },
];

const stationDetails = {
  calculator: {
    title: "Load Calculator Preview",
    body: "The calculator combines revenue, loaded miles, deadhead, fuel, MPG, overhead, dispatch, factoring, and reserves into freight profitability intelligence.",
    required: "Gold, Pilot, Legacy Launch, or Platinum access is required to run live calculations.",
  },
  history: {
    title: "Load History Preview",
    body: "Saved rows use a system Load ID, an editable Trip Number, and pickup/delivery city-state lanes so drivers can find the right decision fast.",
    required: "Active access is required to save or export load history.",
  },
  settings: {
    title: "Settings Preview",
    body: "Settings keep account identity, expense defaults, billing profile, and vehicle assumptions separated by Supabase user identity.",
    required: "Sign in to edit settings tied to your own account.",
  },
  billing: {
    title: "Billing Preview",
    body: "Billing uses entitlement status as the access brain and provider as the payment rail.",
    required: "Stripe portal and checkout actions are disabled in preview.",
  },
} satisfies Record<PreviewStation, { title: string; body: string; required: string }>;

export function AppPreview() {
  const [station, setStation] = useState<PreviewStation>("calculator");
  const [modal, setModal] = useState<PreviewStation | null>(null);
  const activeStation = stationDetails[station];

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-5 text-slate-100">
      <div className="mx-auto max-w-lg pb-8">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <LoadIqMark />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">
                {BRAND.productName}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Read-Only Preview
              </h1>
            </div>
          </div>
          <Link
            href="/auth/login"
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-300"
          >
            Sign In
          </Link>
        </header>

        <section className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          Preview mode is local and read-only. Saves, billing, exports, profile
          edits, and production data mutations are blocked.
        </section>

        <nav className="mt-5 grid grid-cols-2 gap-3">
          {stations.map((item) => {
            const Icon = item.icon;
            const active = station === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStation(item.id)}
                className={
                  active
                    ? "rounded-2xl border border-sky-400/40 bg-sky-400/10 p-4 text-left text-sky-100"
                    : "rounded-2xl border border-slate-800 bg-[#0B1220] p-4 text-left text-slate-300"
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <div className="mt-3 text-xs font-black uppercase tracking-[0.16em]">
                  {item.label}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {item.description}
                </p>
              </button>
            );
          })}
        </nav>

        <section className="mt-5 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_28px_rgba(56,189,248,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
            {activeStation.title}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {activeStation.body}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {activeStation.required}
          </p>

          <div className="mt-5 grid gap-3">
            <PreviewAction
              icon={Save}
              label="Try Protected Save"
              onClick={() => setModal(station)}
            />
            <PreviewAction
              icon={FileText}
              label="Try Export / Report"
              onClick={() => setModal(station)}
            />
            <PreviewAction
              icon={Truck}
              label="Try Profile Mutation"
              onClick={() => setModal(station)}
            />
          </div>
        </section>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/70 px-4 py-5 backdrop-blur-sm">
          <section className="mx-auto w-full max-w-md rounded-2xl border border-sky-400/25 bg-[#08111F] p-5 shadow-[0_0_45px_rgba(56,189,248,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
                  Preview Blocked
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-100">
                  {stationDetails[modal].title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-300"
                aria-label="Close preview explanation"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {stationDetails[modal].body}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {stationDetails[modal].required}
            </p>
            <Link
              href="/auth/login"
              className="mt-5 inline-flex rounded-xl bg-sky-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#060B14]"
            >
              Sign In For Live Access
            </Link>
          </section>
        </div>
      )}
    </main>
  );
}

function PreviewAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-left text-sm font-bold text-slate-200 transition hover:border-sky-400/35 hover:text-sky-200"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-sky-300" aria-hidden="true" />
        {label}
      </span>
      <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
        Blocked
      </span>
    </button>
  );
}
