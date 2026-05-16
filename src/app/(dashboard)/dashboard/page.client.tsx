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
import { formatPlanTierLabel } from "@/domains/billing/plan-limits";
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
        "An active Karpilo LoadIQ subscription is required before analyzing freight."
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
                  {formatPlanTierLabel(entitlementState.entitlements.tier)} ·{" "}
                  {entitlementState.usage.monthlyCalculations} calculations this
                  month · {entitlementState.usage.savedLoads} saved loads
                </div>

                {entitlementState.entitlements.tier === "no_access" && (
                  <Link
                    href="/dashboard/billing"
                    className="mt-3 inline-flex text-sky-300 underline decoration-sky-400/40 underline-offset-4"
                  >
                    Activate subscription access
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

          <div className="lg:col-span-2">
            <PlatinumReadinessCard
              tier={entitlementState?.entitlements.tier ?? "no_access"}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function PlatinumReadinessCard({ tier }: { tier: string }) {
  const hasPlatinum = tier === "platinum";

  return (
    <DashboardCard title="Platinum Intelligence Readiness">
      <div className="space-y-4 text-sm leading-6 text-slate-300">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#060B14] p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              IFTA Estimation Support
            </p>
            <p className="mt-2 text-slate-400">
              Platinum will use jurisdiction miles, fuel purchases, gallons,
              vehicle MPG, and load history to support planning estimates only.
            </p>
          </div>
          <span
            className={
              hasPlatinum
                ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-200"
                : "rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400"
            }
          >
            {hasPlatinum ? "Enabled" : "Platinum"}
          </span>
        </div>

        <p className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-xs leading-5 text-red-100">
          IFTA support is estimation and planning assistance only. It is not tax
          filing, legal certification, or a replacement for verified
          jurisdictional reporting.
        </p>
      </div>
    </DashboardCard>
  );
}
