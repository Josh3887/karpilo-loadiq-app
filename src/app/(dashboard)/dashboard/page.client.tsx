"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { LoadIqMark } from "@/components/brand/loadiq-mark";
import { LoadInputForm } from "@/components/calculator/load-input-form";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { FounderWelcomeModal } from "@/components/dashboard/founder-welcome-modal";
import { OperatorBadges } from "@/components/dashboard/operator-badges";
import { PilotStatusCard } from "@/components/dashboard/pilot-status-card";
import { ReviewPrompt } from "@/components/dashboard/review-prompt";
import { ResultsPanel } from "@/components/dashboard/results-panel";
import { DashboardCard } from "@/components/ui/dashboard-card";

import { BRAND } from "@/config/brand";
import {
  ClientEntitlementState,
  getClientEntitlementState,
} from "@/domains/billing/client-entitlements";
import { recordUsageEvent } from "@/domains/billing/usage-service";
import { resolveEntitlements } from "@/domains/billing/entitlement-service";
import { useLoadCalculator } from "@/hooks/use-load-calculator";
import { getCalculatorDefaults } from "@/services/calculator-defaults";
import { getLaneTemplateInput } from "@/services/lane-templates";
import { getSavedLoadInput } from "@/services/saved-load-input";
import { LoadInputFormValues } from "@/lib/load-schema";
import { LoadInput } from "@/types/load";
import { OperatorProgramStatus } from "@/types/operator-program";
import { LaunchPhaseSnapshot } from "@/config/launch-phases";

type DashboardClientPageProps = {
  editLoadId?: string;
  templateId?: string;
  operatorStatus: OperatorProgramStatus;
  launchSnapshot: LaunchPhaseSnapshot;
  pilotSlotsRemaining: number;
  launchSlotsRemaining: number;
  claimedOperatorCount: number;
};

export default function DashboardClientPage({
  editLoadId,
  templateId,
  operatorStatus,
  launchSnapshot,
  pilotSlotsRemaining,
  launchSlotsRemaining,
  claimedOperatorCount,
}: DashboardClientPageProps) {
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
    if (entitlementState && !entitlementState.entitlements.canCalculate) {
      setGateMessage(
        "A paid LoadIQ subscription is required before analyzing freight."
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
      const entitlements = resolveEntitlements(state.entitlements.tier, usage);

      return {
        usage,
        entitlements,
        paymentAccess: {
          ...state.paymentAccess,
          entitlements,
        },
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
      const entitlements = resolveEntitlements(state.entitlements.tier, usage);

      return {
        usage,
        entitlements,
        paymentAccess: {
          ...state.paymentAccess,
          entitlements,
        },
      };
    });
  }

  return (
    <main className="min-h-screen bg-[#060B14] px-4 py-6 text-slate-100 md:px-8">
      {operatorStatus.shouldShowFounderWelcome && (
        <FounderWelcomeModal status={operatorStatus} />
      )}

      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <LoadIqMark />
            <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sky-400">
              {BRAND.productName}
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-100 md:text-5xl">
              Freight Profitability Command Center
            </h1>
            <OperatorBadges badges={operatorStatus.badges} />

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
              Analyze load viability, deadhead exposure, fuel pressure,
              margin compression, and true RPM before accepting freight.
            </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <DashboardNav />
            <LogoutButton />
          </div>
        </header>

        <PilotStatusCard
          status={operatorStatus}
          initialSnapshot={launchSnapshot}
          pilotSlotsRemaining={pilotSlotsRemaining}
          launchSlotsRemaining={launchSlotsRemaining}
          claimedOperatorCount={claimedOperatorCount}
        />

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
            canSaveLoad={entitlementState?.entitlements.canSaveLoad ?? false}
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
