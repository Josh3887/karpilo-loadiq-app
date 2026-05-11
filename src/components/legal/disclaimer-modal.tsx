"use client";

import { useState } from "react";

import {
  LOADIQ_DISCLAIMER_LAST_UPDATED,
  LOADIQ_DISCLAIMER_TITLE,
  LOADIQ_DISCLAIMER_VERSION,
} from "@/config/legal";

type DisclaimerModalProps = {
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
};

export function DisclaimerModal({
  onAccept,
  onDecline,
}: DisclaimerModalProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canAccept = hasScrolled && hasAcknowledged && !isAccepting;

  async function handleAccept() {
    if (!canAccept) return;

    setIsAccepting(true);
    setErrorMessage("");

    try {
      await onAccept();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to record disclaimer acceptance."
      );
      setIsAccepting(false);
    }
  }

  async function handleDecline() {
    setIsDeclining(true);
    setErrorMessage("");

    try {
      await onDecline();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to leave the secured LoadIQ workspace."
      );
      setIsDeclining(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/95 px-4 py-5 text-slate-100 backdrop-blur-md">
      <section className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-sky-400/30 bg-[#07111f] shadow-[0_0_60px_rgba(56,189,248,0.18)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300 to-transparent" />

        <header className="border-b border-slate-700/70 bg-[#0a1728] px-5 py-5 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-red-300">
            Mandatory legal acknowledgement
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-50 sm:text-3xl">
            {LOADIQ_DISCLAIMER_TITLE}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span className="rounded-full border border-sky-400/20 bg-sky-400/5 px-3 py-1 text-sky-200">
              Version {LOADIQ_DISCLAIMER_VERSION}
            </span>
            <span className="rounded-full border border-slate-600/70 bg-slate-900/60 px-3 py-1">
              Last Updated {LOADIQ_DISCLAIMER_LAST_UPDATED}
            </span>
          </div>
        </header>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 text-sm leading-6 text-slate-300 sm:px-7"
          onScroll={(event) => {
            const element = event.currentTarget;
            const reachedBottom =
              element.scrollTop + element.clientHeight >=
              element.scrollHeight - 16;

            if (reachedBottom) {
              setHasScrolled(true);
            }
          }}
        >
          <div className="space-y-5">
            <section>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-sky-200">
                Informational decision-support tool only
              </h3>
              <p className="mt-2">
                Karpilo LoadIQ is provided solely as an informational
                decision-support and operational forecasting tool for trucking
                profitability review. LoadIQ does not guarantee profitability,
                business success, operational performance, income, margins,
                freight availability, fuel costs, or any business outcome.
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-sky-200">
                Estimates, assumptions, and variability
              </h3>
              <p className="mt-2">
                All calculations, scores, warnings, projections, and outputs are
                speculative estimates based on user-provided inputs, configured
                assumptions, and available data. Route miles may vary. Fuel
                prices fluctuate. Freight rates fluctuate. Market conditions
                fluctuate. Operational costs vary by carrier, equipment,
                geography, maintenance condition, dispatch model, authority
                structure, insurance, trailer arrangement, business model, and
                other conditions outside platform control.
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-sky-200">
                No professional advice
              </h3>
              <p className="mt-2">
                LoadIQ does not provide financial advice, legal advice,
                accounting advice, tax advice, dispatch advice, investment
                advice, regulatory advice, or regulatory guarantees. Users are
                solely responsible for verifying freight decisions, operating
                costs, routes, rate terms, compliance obligations, settlement
                terms, and business assumptions before accepting or rejecting
                any load.
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-sky-200">
                Trucking volatility and no warranty
              </h3>
              <p className="mt-2">
                Trucking is inherently volatile. Profitability can be affected
                by maintenance events, weather, traffic, detention, routing
                changes, fuel movements, brokerage conditions, carrier policy,
                equipment condition, customer behavior, macroeconomic pressure,
                and other variables that LoadIQ cannot control. Past
                profitability does not predict future results. No
                representation or warranty is made regarding the accuracy,
                completeness, reliability, availability, or fitness of LoadIQ
                outputs for any specific freight or business decision.
              </p>
            </section>

            <section className="rounded-xl border border-red-400/30 bg-red-500/10 p-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-red-200">
                Limitation of liability
              </h3>
              <p className="mt-2">
                To the fullest extent permitted by applicable law, Karpilo
                Endeavor Technologies LLC, Karpilo LoadIQ, and their affiliates,
                operators, developers, contractors, licensors, owners, agents,
                and service providers shall not be liable for operational
                losses, lost revenue, lost profit, lost freight opportunities,
                downtime, dispatch decisions, business interruption, indirect
                damages, consequential damages, incidental damages, special
                damages, fuel pricing inaccuracies, mileage inaccuracies,
                routing inaccuracies, user-entered data inaccuracies,
                third-party API failures, data delays, market fluctuations, or
                losses arising from reliance on LoadIQ outputs.
              </p>
            </section>

            <section>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-sky-200">
                User acknowledgement
              </h3>
              <p className="mt-2">
                By accepting this disclaimer, you acknowledge that you have read
                and understood this version, that calculations are estimates
                only, that you remain solely responsible for your business and
                freight decisions, and that access to the calculator requires
                this acknowledgement.
              </p>
            </section>
          </div>
        </div>

        <footer className="border-t border-slate-700/70 bg-[#081322] px-5 py-4 sm:px-7">
          <label className="flex items-start gap-3 rounded-xl border border-slate-700/70 bg-slate-950/40 p-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(event) => setHasAcknowledged(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-sky-400/60 bg-slate-950 text-sky-400 accent-sky-400"
            />
            <span>
              I have scrolled through, read, understood, and agree to the
              LoadIQ disclaimer and limitation of liability.
            </span>
          </label>

          {!hasScrolled && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-red-200">
              Scroll to the end of the disclaimer to continue.
            </p>
          )}

          {errorMessage && (
            <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {errorMessage}
            </p>
          )}

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleDecline}
              disabled={isDeclining || isAccepting}
              className="rounded-xl border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-red-100 transition hover:border-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeclining ? "Leaving..." : "DECLINE"}
            </button>

            <button
              type="button"
              onClick={handleAccept}
              disabled={!canAccept || isDeclining}
              className="rounded-xl border border-sky-300/60 bg-sky-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_30px_rgba(56,189,248,0.25)] transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {isAccepting ? "Recording..." : "ACCEPT & CONTINUE"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
