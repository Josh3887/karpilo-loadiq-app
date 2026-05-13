"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { REQUIRED_APP_POLICIES } from "@/config/app-policies";
import {
  acceptRequiredAppPolicies,
  acknowledgeDriverSafety,
} from "@/services/app-policy-client";

type AppAccessGateProps = {
  requiresPolicyAcceptance: boolean;
  requiresSafetyReminder: boolean;
};

export function AppAccessGate({
  requiresPolicyAcceptance,
  requiresSafetyReminder,
}: AppAccessGateProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);
  const [policiesAcknowledged, setPoliciesAcknowledged] = useState(false);
  const [error, setError] = useState("");

  async function acceptPolicies() {
    if (!policiesAcknowledged || accepting) return;

    setAccepting(true);
    setError("");

    try {
      await acceptRequiredAppPolicies();
      router.refresh();
    } catch (acceptanceError) {
      setError(
        acceptanceError instanceof Error
          ? acceptanceError.message
          : "Unable to record policy acceptance."
      );
      setAccepting(false);
    }
  }

  async function acceptSafetyReminder() {
    if (!safetyAcknowledged || accepting) return;

    setAccepting(true);
    setError("");

    try {
      await acknowledgeDriverSafety();
      router.refresh();
    } catch (safetyError) {
      setError(
        safetyError instanceof Error
          ? safetyError.message
          : "Unable to record driver safety acknowledgement."
      );
      setAccepting(false);
    }
  }

  if (!requiresPolicyAcceptance && !requiresSafetyReminder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#020617]/95 px-4 py-5 text-slate-100 backdrop-blur-md sm:items-center sm:justify-center">
      <section className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-sky-400/30 bg-[#07111f] shadow-[0_0_60px_rgba(56,189,248,0.18)]">
        <header className="border-b border-slate-700/70 bg-[#0a1728] px-5 py-5 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-300">
            Required app acknowledgement
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-50 sm:text-3xl">
            {requiresPolicyAcceptance
              ? "Review and accept LoadIQ operating policies."
              : "Monthly driver safety reminder."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {requiresPolicyAcceptance
              ? "These policies are required before using the dashboard, calculator, saved loads, profile, or billing tools."
              : "Do not interact with LoadIQ while driving unless you are safely parked or using lawful hands-free methods."}
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {requiresPolicyAcceptance ? (
            <div className="grid gap-3">
              {REQUIRED_APP_POLICIES.map((policy) => (
                <article
                  key={policy.key}
                  className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-100">
                        {policy.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {policy.summary}
                      </p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      {policy.version}
                    </span>
                  </div>
                  {policy.href ? (
                    <Link
                      href={policy.href}
                      target="_blank"
                      className="mt-3 inline-flex text-xs font-bold uppercase tracking-[0.16em] text-sky-300 underline decoration-sky-400/40 underline-offset-4"
                    >
                      Open policy
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm leading-7 text-red-50">
              LoadIQ is built for freight decisions, not in-motion interaction.
              Pull over safely before typing, reviewing detailed calculations,
              changing profile settings, or managing billing. Follow all
              applicable hands-free, distracted-driving, employer, carrier, and
              road-safety rules.
            </div>
          )}
        </div>

        <footer className="border-t border-slate-700/70 bg-[#081322] px-5 py-4 sm:px-7">
          <label className="flex items-start gap-3 rounded-xl border border-slate-700/70 bg-slate-950/40 p-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={
                requiresPolicyAcceptance
                  ? policiesAcknowledged
                  : safetyAcknowledged
              }
              onChange={(event) =>
                requiresPolicyAcceptance
                  ? setPoliciesAcknowledged(event.target.checked)
                  : setSafetyAcknowledged(event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-sky-400/60 bg-slate-950 text-sky-400 accent-sky-400"
            />
            <span>
              {requiresPolicyAcceptance
                ? "I have reviewed and agree to all required LoadIQ app policies, disclosures, and limitations."
                : "I acknowledge this safety reminder and will only interact with LoadIQ when it is lawful and safe."}
            </span>
          </label>

          {error ? (
            <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={
                requiresPolicyAcceptance ? acceptPolicies : acceptSafetyReminder
              }
              disabled={
                accepting ||
                (requiresPolicyAcceptance
                  ? !policiesAcknowledged
                  : !safetyAcknowledged)
              }
              className="rounded-xl border border-sky-300/60 bg-sky-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.25)] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {accepting ? "Recording..." : "Accept & Continue"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
