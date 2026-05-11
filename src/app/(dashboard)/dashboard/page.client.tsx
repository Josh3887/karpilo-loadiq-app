"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { LoadInputForm } from "@/components/calculator/load-input-form";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DisclaimerModal } from "@/components/legal/disclaimer-modal";
import { ReviewPrompt } from "@/components/dashboard/review-prompt";
import { ResultsPanel } from "@/components/dashboard/results-panel";
import { DashboardCard } from "@/components/ui/dashboard-card";

import {
  ClientEntitlementState,
  getClientEntitlementState,
} from "@/domains/billing/client-entitlements";
import { recordUsageEvent } from "@/domains/billing/usage-service";
import { resolveEntitlements } from "@/domains/billing/entitlement-service";
import { useLoadCalculator } from "@/hooks/use-load-calculator";
import { getCalculatorDefaults } from "@/services/calculator-defaults";
import { acceptLoadIqDisclaimer } from "@/services/disclaimer-acceptance";
import { getLaneTemplateInput } from "@/services/lane-templates";
import { getSavedLoadInput } from "@/services/saved-load-input";
import { LoadInputFormValues } from "@/lib/load-schema";
import { createClient } from "@/lib/supabase-client";
import { LoadInput } from "@/types/load";

type DashboardClientPageProps = {
  editLoadId?: string;
  templateId?: string;
  requiresDisclaimer?: boolean;
};

export default function DashboardClientPage({
  editLoadId,
  templateId,
  requiresDisclaimer = false,
}: DashboardClientPageProps) {
  const router = useRouter();
  const {
    result,
    lastInput,
    calculate,
    setDefaults,
  } = useLoadCalculator();

  const [entitlementState, setEntitlementState] =
    useState<ClientEntitlementState | null>(null);
  const [gateMessage, setGateMessage] = useState("");
  const [initialInput, setInitialInput] =
    useState<LoadInputFormValues | null>(null);
  const [showDisclaimer, setShowDisclaimer] =
    useState(requiresDisclaimer);

  useEffect(() => {
    async function loadDefaults() {
      try {
        const defaults =
          await getCalculatorDefaults();

        setDefaults({
          overhead: defaults.dailyOverhead,
          operatingDaysPerWeek: defaults.operatingDaysPerWeek,
          operatingDaysPerMonth: defaults.operatingDaysPerMonth,
          incomeTargetDaily: defaults.incomeTargetDaily,
          incomeTargetWeekly: defaults.incomeTargetWeekly,
          minimumHourlyProfitability: defaults.minimumHourlyProfitability,
          targetTrueRpm: defaults.targetTrueRpm,
          defaultMpg: defaults.defaultMpg,
          defaultPayStructure: defaults.defaultPayStructure,
          maintenanceReserve: defaults.maintenanceReserve,
          tireReserve: defaults.tireReserve,
          trailerFee: defaults.trailerFee,
          insuranceAllocation: defaults.insuranceAllocation,
          variableCostPerMile: defaults.variableCostPerMile,
          fixedCostAllocation: defaults.fixedCostAllocation,
          dispatchPercent: defaults.dispatchPercent,
          factoringPercent: defaults.factoringPercent,
        });
      } catch (error) {
        console.error(error);
      }
    }

    loadDefaults();
  }, [setDefaults]);

  useEffect(() => {
    async function loadEntitlements() {
      try {
        setEntitlementState(await getClientEntitlementState());
      } catch (error) {
        console.error(error);
      }
    }

    loadEntitlements();
  }, []);

  useEffect(() => {
    if (!editLoadId) return;
    const savedLoadId = editLoadId;

    async function loadSavedInput() {
      try {
        const input = await getSavedLoadInput(savedLoadId);
        setInitialInput(input);
        setGateMessage("Loaded saved estimate. Adjust values and analyze again.");
      } catch (error) {
        setGateMessage(
          error instanceof Error
            ? error.message
            : "Unable to load saved estimate."
        );
      }
    }

    loadSavedInput();
  }, [editLoadId]);

  useEffect(() => {
    if (!templateId) return;
    const laneTemplateId = templateId;

    async function loadTemplateInput() {
      try {
        const input = await getLaneTemplateInput(laneTemplateId);
        setInitialInput(input);
        setGateMessage("Loaded lane template. Adjust values and analyze.");
      } catch (error) {
        setGateMessage(
          error instanceof Error
            ? error.message
            : "Unable to load lane template."
        );
      }
    }

    loadTemplateInput();
  }, [templateId]);

  function handleCalculate(input: LoadInput) {
    if (showDisclaimer) {
      setGateMessage("Accept the LoadIQ disclaimer before analyzing freight.");
      return;
    }

    if (entitlementState && !entitlementState.entitlements.canCalculate) {
      setGateMessage(
        "Free plan calculation limit reached. Upgrade to Pro for unlimited load analysis."
      );
      return;
    }

    setGateMessage("");
    calculate(input);

    void recordUsageEvent("calculation_created", {
      pickupZip: input.pickupZip,
      deliveryZip: input.deliveryZip,
      loadedMiles: input.loadedMiles,
      deadheadMiles: input.deadheadMiles,
    }).catch((error) => {
      console.error(error);
    });

    setEntitlementState((state) => {
      if (!state) return state;

      const usage = {
        ...state.usage,
        monthlyCalculations: state.usage.monthlyCalculations + 1,
      };

      return {
        usage,
        entitlements: resolveEntitlements(state.entitlements.tier, usage),
      };
    });
  }

  function handleLoadSaved() {
    setEntitlementState((state) => {
      if (!state) return state;

      const usage = {
        ...state.usage,
        savedLoads: state.usage.savedLoads + 1,
      };

      return {
        usage,
        entitlements: resolveEntitlements(state.entitlements.tier, usage),
      };
    });
  }

  async function handleDisclaimerAccept() {
    await acceptLoadIqDisclaimer();
    setShowDisclaimer(false);
    router.refresh();
  }

  async function handleDisclaimerDecline() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      {showDisclaimer && (
        <DisclaimerModal
          onAccept={handleDisclaimerAccept}
          onDecline={handleDisclaimerDecline}
        />
      )}

      <div
        className={
          showDisclaimer
            ? "mx-auto max-w-7xl pointer-events-none select-none blur-sm"
            : "mx-auto max-w-7xl"
        }
        aria-hidden={showDisclaimer}
      >
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              Karpilo LoadIQ
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-100 md:text-5xl">
              Freight Profitability Command Center
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Analyze load viability, deadhead exposure, fuel pressure,
              margin compression, and true RPM before accepting freight.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <DashboardNav />
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="lg:col-span-2">
            <ReviewPrompt
              calculationCount={entitlementState?.usage.monthlyCalculations ?? 0}
            />
          </div>

          <DashboardCard title="Load Input">
            {gateMessage && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {gateMessage}
              </div>
            )}

            {entitlementState && (
              <div className="mb-4 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs uppercase tracking-[0.16em] text-sky-200">
                <div>
                  {entitlementState.entitlements.tier} plan ·{" "}
                  {entitlementState.usage.monthlyCalculations} calculations this
                  month · {entitlementState.usage.savedLoads} saved loads
                </div>

                {entitlementState.entitlements.tier === "free" && (
                  <Link
                    href="/dashboard/billing"
                    className="mt-3 inline-flex text-sky-300 underline decoration-sky-400/40 underline-offset-4"
                  >
                    Upgrade for unlimited analysis
                  </Link>
                )}
              </div>
            )}

            <LoadInputForm
              onCalculate={handleCalculate}
              initialValues={initialInput}
            />
          </DashboardCard>

          <ResultsPanel
            result={result}
            input={lastInput}
            canSaveLoad={entitlementState?.entitlements.canSaveLoad ?? true}
            canCompareScenarios={
              entitlementState?.entitlements.canCompareScenarios ?? false
            }
            onLoadSaved={handleLoadSaved}
          />
        </section>
      </div>
    </main>
  );
}
