"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Calculator,
  CheckCircle2,
  Gauge,
  Info,
  LockKeyhole,
  Play,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Truck,
  WalletCards,
  XCircle,
} from "lucide-react";

import { BrandAppIcon } from "@/components/brand/BrandAppIcon";
import { BrandCard } from "@/components/brand/BrandCard";
import { DemoNarration } from "@/components/demo/DemoNarration";
import { DemoProgressRail } from "@/components/demo/DemoProgressRail";
import { DemoRecordingFrame } from "@/components/demo/DemoRecordingFrame";
import { DemoStepCard } from "@/components/demo/DemoStepCard";
import {
  demoChecklistItems,
  demoFixedCosts,
  demoLoadInput,
  demoLoadResult,
  demoProfile,
  demoVariableCosts,
  initialDemoSavedLoads,
} from "@/demo/loadiq-demo-data";
import { demoSteps } from "@/demo/loadiq-demo-script";
import {
  DemoOperatorType,
  DemoSavedLoad,
  DemoSavedLoadStatus,
  DemoStep,
  DemoStepKey,
} from "@/demo/loadiq-demo-types";
import { BRAND } from "@/config/brand";
import { cn } from "@/utils/cn";
import { formatCurrency, formatNumber, formatRpm } from "@/utils/format";

type DemoWalkthroughProps = {
  recording: boolean;
};

type DemoState = {
  safetyAccepted: boolean;
  loginStatus: "idle" | "loading" | "complete";
  operatorType: DemoOperatorType;
  savedLoads: DemoSavedLoad[];
  saveChoice: DemoSavedLoadStatus | "";
  ranLoadAnswer: "yes" | "no" | "planned" | "rejected" | "";
  postTripExtraCost: number;
};

const storageKey = "loadiq-demo-walkthrough-state";
const recordingStepDurationMs = 7600;
const demoEmail = "josh.karpilo@karpilotrucking.com";

const initialState: DemoState = {
  safetyAccepted: false,
  loginStatus: "idle",
  operatorType: "leased_owner_operator",
  savedLoads: initialDemoSavedLoads,
  saveChoice: "",
  ranLoadAnswer: "",
  postTripExtraCost: 0,
};

const recordingState: DemoState = {
  ...initialState,
  safetyAccepted: true,
  loginStatus: "complete",
  operatorType: "leased_owner_operator",
  saveChoice: "potential",
  ranLoadAnswer: "planned",
  postTripExtraCost: 155,
};

const majorStepIndexes = [0, 2, 5, 12, 14, 23, 28];

export function DemoWalkthrough({ recording }: DemoWalkthroughProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [recordingNow, setRecordingNow] = useState(() => Date.now());
  const [recordingStepStartedAt, setRecordingStepStartedAt] = useState(() =>
    Date.now()
  );
  const [state, setState] = useState<DemoState>(() => {
    if (recording || typeof window === "undefined") {
      return recording ? recordingState : initialState;
    }

    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return initialState;

      const parsed = JSON.parse(stored) as Partial<DemoState>;

      return {
        ...initialState,
        ...parsed,
        savedLoads: parsed.savedLoads ?? initialDemoSavedLoads,
      };
    } catch {
      return initialState;
    }
  });

  const activeStep = demoSteps[activeIndex];
  const completion = Math.round(((activeIndex + 1) / demoSteps.length) * 100);
  const recordingElapsed = recording
    ? recordingNow - recordingStepStartedAt
    : recordingStepDurationMs;
  const recordingProgress = Math.min(
    100,
    Math.max(0, (recordingElapsed / recordingStepDurationMs) * 100)
  );

  useEffect(() => {
    if (recording) return;
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [recording, state]);

  useEffect(() => {
    if (!recording) return;

    const timer = window.setInterval(() => {
      setRecordingNow(Date.now());
    }, 200);

    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (!recording) return;

    const timer = window.setInterval(() => {
      const now = Date.now();

      setRecordingNow(now);
      setRecordingStepStartedAt(now);
      setActiveIndex((index) => Math.min(index + 1, demoSteps.length - 1));
    }, recordingStepDurationMs);

    return () => window.clearInterval(timer);
  }, [recording]);

  const completedChecklist = useMemo(
    () =>
      demoChecklistItems.map((item, index) => ({
        item,
        complete:
          activeIndex >= [2, 5, 6, 8, 10, 19, 23][index] ||
          (index === 0 && state.safetyAccepted),
      })),
    [activeIndex, state.safetyAccepted]
  );

  function patchState(patch: Partial<DemoState>) {
    setState((current) => ({ ...current, ...patch }));
  }

  function next() {
    setActiveIndex((index) => Math.min(index + 1, demoSteps.length - 1));
  }

  function back() {
    setActiveIndex((index) => Math.max(index - 1, 0));
  }

  function restart() {
    setActiveIndex(0);
    setState(initialState);
    window.localStorage.removeItem(storageKey);
  }

  function simulateLogin() {
    patchState({ loginStatus: "loading" });
    window.setTimeout(() => patchState({ loginStatus: "complete" }), 650);
  }

  function saveDemoLoad(status: DemoSavedLoadStatus) {
    const load: DemoSavedLoad = {
      id: "saved-live-demo",
      name: "Indianapolis to Dallas",
      status,
      ranLoad: status === "completed",
      date: "Demo now",
      input: demoLoadInput,
      result: demoLoadResult,
      note: "Saved in local demo state only. No Supabase insert occurred.",
    };

    setState((current) => ({
      ...current,
      saveChoice: status,
      savedLoads: [
        load,
        ...current.savedLoads.filter((saved) => saved.id !== load.id),
      ],
    }));
  }

  function renderPhoneStep(key: DemoStepKey) {
    const truckLabel = `${demoProfile.truckYear} ${demoProfile.truckMake} ${demoProfile.truckModel}`;
    const repairActual = Math.min(
      155,
      Math.round((recordingElapsed / 6000) * 155)
    );

    switch (key) {
      case "intro":
        return (
          <PhoneStack>
            <PhoneHero
              title={BRAND.productName}
              body="A simulated app session for reviewing setup, load calculation, and saved load decisions."
            />
            <PhoneMetricList
              metrics={[
                ["Account", "Demo only"],
                ["Database", "No writes"],
                ["Billing", "Not called"],
                ["Mode", "iPhone recording"],
              ]}
            />
            <PhonePrimaryButton label="Start Demo Walkthrough" />
          </PhoneStack>
        );
      case "login":
        return (
          <PhoneStack>
            <TypingField
              label="Email"
              value={demoEmail}
              elapsedMs={recordingElapsed}
              startMs={700}
            />
            <TypingField
              label="Password"
              value="demo-password"
              elapsedMs={recordingElapsed}
              startMs={3600}
              type="password"
            />
            <PhonePrimaryButton
              label={
                recordingElapsed > 6300
                  ? "Demo Login Complete"
                  : recordingElapsed > 5000
                    ? "Checking Credentials"
                    : "Log In"
              }
            />
            {recordingElapsed > 7000 && (
              <SuccessText text="Login simulated. No Supabase Auth call was made." />
            )}
          </PhoneStack>
        );
      case "safety":
        return (
          <PhoneStack>
            <PhoneHero
              title="Driving Safety"
              body="Use LoadIQ only when parked or through lawful hands-free operation."
              tone="warning"
            />
            <PhoneCheckRow
              label="I acknowledge this demo safety expectation."
              complete={recordingElapsed > 2800}
            />
            <PhonePrimaryButton
              label={recordingElapsed > 3300 ? "Continue" : "Continue Disabled"}
              disabled={recordingElapsed <= 3300}
            />
          </PhoneStack>
        );
      case "founderWelcome":
        return (
          <PhoneStack>
            <PhoneHero
              title={`Welcome, ${demoProfile.operatorName}`}
              body="Build the profile, understand the numbers, then use the app as decision support before committing to freight."
            />
            <PhoneMetricList
              metrics={[
                ["Company", demoProfile.companyName],
                ["Truck", truckLabel],
                ["Equipment", demoProfile.equipmentType],
              ]}
            />
          </PhoneStack>
        );
      case "checklist":
        return (
          <PhoneStack>
            {completedChecklist.map(({ item, complete }) => (
              <PhoneCheckRow key={item} label={item} complete={complete} />
            ))}
          </PhoneStack>
        );
      case "operatorType":
        return (
          <PhoneStack>
            <PhoneChoice
              title="Leased Owner-Operator"
              body="Percentage settlement, carrier rules, adjusted gross."
              selected={recordingElapsed > 1800}
            />
            <PhoneChoice
              title="Independent Owner-Operator"
              body="Direct customer/broker exposure."
            />
            <PhoneChoice title="Small Fleet" body="Coming later." muted />
          </PhoneStack>
        );
      case "payStructure":
        return (
          <PhoneMetricList
            metrics={[
              ["Pay model", "75% of 98% gross"],
              ["Operator share", `${demoProfile.operatorPercent}%`],
              ["Carrier gross basis", `${demoProfile.carrierGrossPercent}%`],
              ["Factoring", `${demoProfile.factoringFeePercent}%`],
              ["Payable revenue", formatCurrency(demoLoadResult.payableRevenue)],
            ]}
          />
        );
      case "fuel":
        return (
          <PhoneMetricList
            metrics={[
              ["Average MPG", demoProfile.truckMpg],
              ["Diesel price", formatCurrency(demoProfile.averageFuelCost)],
              ["Fuel reserve", formatCurrency(demoProfile.fuelReserve)],
              ["Trip fuel", formatCurrency(demoLoadResult.fuelCost)],
            ]}
          />
        );
      case "fixedCosts":
        return (
          <PhoneMetricList
            metrics={[
              ["Truck payment", "$3,150 monthly"],
              ["Insurance", "$1,050 monthly"],
              ["Permits", "$2,400 annual"],
              ["ELD", "$45 monthly"],
              ["Daily overhead", formatCurrency(demoProfile.fixedOverheadDaily)],
            ]}
          />
        );
      case "variableCosts":
        return (
          <PhoneMetricList
            metrics={[
              ["Maintenance", "$0.12 / mile"],
              ["Tires", "$0.06 / mile"],
              ["Oil / PM", "$35 / load"],
              ["Factoring", "2.5%"],
              ["Misc", "$25 / load"],
            ]}
          />
        );
      case "targetIncome":
        return (
          <PhoneMetricList
            metrics={[
              ["Annual target", formatCurrency(demoProfile.targetAnnualIncome)],
              ["Working weeks", demoProfile.workingWeeks],
              ["Loads / week", demoProfile.loadsPerWeek],
              ["Weekly net", formatCurrency(demoProfile.targetAnnualIncome / demoProfile.workingWeeks)],
              ["Target true RPM", formatRpm(demoProfile.minimumTrueRpm)],
            ]}
          />
        );
      case "profileReview":
        return (
          <PhoneMetricList
            metrics={[
              ["Company", demoProfile.companyName],
              ["Truck", truckLabel],
              ["Equipment", demoProfile.equipmentType],
              ["Pay", "75% of 98% gross"],
              ["Target RPM", formatRpm(demoProfile.minimumTrueRpm)],
            ]}
          />
        );
      case "dashboard":
        return (
          <PhoneMetricList
            metrics={[
              ["Profile", "100% complete"],
              ["Target true RPM", formatRpm(demoProfile.minimumTrueRpm)],
              ["Weekly revenue", formatCurrency(7250)],
              ["Net profit", formatCurrency(2460)],
              ["Saved loads", state.savedLoads.length],
            ]}
          />
        );
      case "startLoad":
        return (
          <PhoneStack>
            <PhoneHero
              title="Calculate New Load"
              body="Start a guided load builder instead of forcing every field onto one screen."
            />
            <PhonePrimaryButton label="Calculate New Load" />
          </PhoneStack>
        );
      case "lane":
        return (
          <PhoneStack>
            <TypingField
              label="Pickup city/state"
              value="Indianapolis, IN"
              elapsedMs={recordingElapsed}
              startMs={500}
            />
            <TypingField
              label="Delivery city/state"
              value="Dallas, TX"
              elapsedMs={recordingElapsed}
              startMs={3000}
            />
            <RecordingSelectField
              label="Equipment"
              value={demoProfile.equipmentType}
              selected={recordingElapsed > 5400}
            />
            <RecordingSelectField
              label="Truck"
              value={truckLabel}
              selected={recordingElapsed > 6400}
            />
          </PhoneStack>
        );
      case "miles":
        return (
          <PhoneMetricList
            metrics={[
              ["Loaded miles", formatNumber(demoLoadInput.loadedMiles)],
              ["Deadhead", formatNumber(demoLoadInput.deadheadMiles)],
              ["Total miles", formatNumber(demoLoadResult.totalMiles)],
              ["Deadhead %", `${demoLoadResult.deadheadPercent}%`],
            ]}
          />
        );
      case "revenue":
        return (
          <PhoneMetricList
            metrics={[
              ["Linehaul", formatCurrency(demoLoadResult.linehaulRevenue)],
              ["Fuel surcharge", formatCurrency(demoLoadResult.fuelSurchargeRevenue)],
              ["Accessorials", formatCurrency(demoLoadResult.accessorialRevenue)],
              ["Gross revenue", formatCurrency(demoLoadResult.grossRevenue)],
            ]}
          />
        );
      case "tripCosts":
        return (
          <PhoneMetricList
            metrics={[
              ["Fuel cost", formatCurrency(demoLoadResult.fuelCost)],
              ["Tolls", formatCurrency(demoLoadInput.tolls)],
              ["Lumpers", formatCurrency(demoLoadInput.lumpers)],
              ["Parking", formatCurrency(25)],
            ]}
          />
        );
      case "time":
        return (
          <PhoneMetricList
            metrics={[
              ["Drive time", "16.8 hours"],
              ["Loading", "2.0 hours"],
              ["Waiting", "1.5 hours"],
              ["Total hours", "30.3 hours"],
              ["Profit / hour", formatCurrency(demoLoadResult.profitPerHour)],
            ]}
          />
        );
      case "calculationReview":
        return (
          <PhoneMetricList
            metrics={[
              ["Gross revenue", formatCurrency(demoLoadResult.grossRevenue)],
              ["Operator share", formatCurrency(demoLoadResult.payableRevenue)],
              ["Fuel cost", formatCurrency(demoLoadResult.fuelCost)],
              ["Overhead", formatCurrency(demoLoadResult.loadOverheadApplied)],
              ["Estimated net", formatCurrency(demoLoadResult.estimatedNet)],
              ["True RPM", formatRpm(demoLoadResult.trueRpm)],
            ]}
          />
        );
      case "recommendation":
        return (
          <PhoneStack>
            <PhoneHero
              title="Strong Load"
              body={`${formatRpm(demoLoadResult.trueRpm)} true RPM clears the ${formatRpm(demoProfile.minimumTrueRpm)} target after modeled costs.`}
              tone="success"
            />
            <PhoneCheckRow label="Meets target true RPM" complete />
            <PhoneCheckRow label="Deadhead controlled" complete />
            <PhoneCheckRow label="Fuel modeled before commitment" complete />
          </PhoneStack>
        );
      case "saveDecision":
        return (
          <PhoneStack>
            {[
              ["Save as potential load", recordingElapsed > 2600],
              ["Mark as accepted", false],
              ["Mark as rejected", false],
              ["Mark as completed later", false],
            ].map(([label, selected]) => (
              <PhoneChoice
                key={String(label)}
                title={String(label)}
                body="Stored in local demo state only."
                selected={Boolean(selected)}
              />
            ))}
          </PhoneStack>
        );
      case "ranLoad":
        return (
          <PhoneStack>
            <PhoneHero
              title="Did you run it?"
              body="Quoted, planned, rejected, and completed loads are treated differently."
            />
            <div className="grid grid-cols-2 gap-2">
              {(["yes", "no", "planned", "rejected"] as const).map((answer) => (
                <PhonePill
                  key={answer}
                  label={answer}
                  selected={answer === "planned" && recordingElapsed > 2500}
                />
              ))}
            </div>
          </PhoneStack>
        );
      case "savedLoads":
        return (
          <PhoneStack>
            {state.savedLoads.slice(0, 4).map((load) => (
              <PhoneChoice
                key={load.id}
                title={load.name}
                body={`${formatRpm(load.result.trueRpm)} true RPM - ${formatCurrency(load.result.estimatedNet)} net`}
                selected={load.status === "potential"}
              />
            ))}
          </PhoneStack>
        );
      case "compare":
        return (
          <PhoneMetricList
            metrics={[
              ["Load A true RPM", formatRpm(state.savedLoads[0].result.trueRpm)],
              ["Load A net", formatCurrency(state.savedLoads[0].result.estimatedNet)],
              ["Load B true RPM", formatRpm(state.savedLoads[1].result.trueRpm)],
              ["Load B net", formatCurrency(state.savedLoads[1].result.estimatedNet)],
            ]}
          />
        );
      case "postTrip":
        return (
          <PhoneStack>
            <PhoneMetricList
              metrics={[
                ["Extra fuel", formatCurrency(65)],
                ["Added lumper", formatCurrency(75)],
                ["Parking", formatCurrency(25)],
                ["Repair actual", formatCurrency(repairActual)],
                ["Final net", formatCurrency(demoLoadResult.estimatedNet - repairActual)],
              ]}
            />
            <input
              readOnly
              type="range"
              min="0"
              max="500"
              value={repairActual}
              className="w-full accent-sky-400"
            />
          </PhoneStack>
        );
      case "insights":
        return (
          <PhoneStack>
            {[
              "What is true RPM?",
              "Why deadhead matters",
              "Why gross revenue lies",
              "Why profit per hour matters",
            ].map((title) => (
              <PhoneChoice
                key={title}
                title={title}
                body="Tap to learn how this affects freight decisions."
              />
            ))}
          </PhoneStack>
        );
      case "settings":
        return (
          <PhoneMetricList
            metrics={[
              ["Company", demoProfile.companyName],
              ["Operator", demoProfile.operatorName],
              ["Truck", truckLabel],
              ["Equipment", demoProfile.equipmentType],
              ["Fuel", "6.7 MPG / $3.89"],
              ["Reset demo", "Available"],
            ]}
          />
        );
      case "final":
        return (
          <PhoneStack>
            <PhoneHero
              title="LoadIQ in Action"
              body="Understand freight before committing to it, protect margin, and make better decisions with real operating numbers."
              tone="success"
            />
            <PhonePrimaryButton label="Join Pilot" />
            <PhonePrimaryButton label="Create Account" secondary />
          </PhoneStack>
        );
      default:
        return null;
    }
  }

  if (recording) {
    return (
      <DemoRecordingFrame recording={recording}>
        <main className="h-full min-h-0 bg-[#060B14] p-4 text-slate-100">
          <div className="mx-auto grid h-full min-h-0 max-w-5xl items-center justify-center gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
            <IPhoneAppShell
              activeStep={activeStep}
              completion={completion}
              activeIndex={activeIndex}
              homeScreen={activeStep.key === "intro" && recordingElapsed < 3600}
              homeScreenTapped={recordingElapsed > 1700}
            >
              <RecordingActionBar
                label={getRecordingActionLabel(activeStep.key, recordingElapsed)}
                progress={recordingProgress}
              />
              {renderPhoneStep(activeStep.key)}
            </IPhoneAppShell>

            <RecordingDialoguePanel
              activeStep={activeStep}
              elapsedMs={recordingElapsed}
              progress={recordingProgress}
            />
          </div>
        </main>
      </DemoRecordingFrame>
    );
  }

  return (
    <DemoRecordingFrame recording={recording}>
      <main
        className={cn(
          "min-h-screen bg-[#060B14] px-4 py-5 text-slate-100 md:px-8",
          recording &&
            "flex h-full min-h-0 flex-col overflow-hidden p-3 md:p-4"
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-7xl",
            recording && "flex h-full min-h-0 w-full flex-col"
          )}
        >
        <header
          className={cn(
            "mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
            recording && "mb-3 shrink-0 flex-row items-start justify-between gap-3"
          )}
        >
          <div className="flex items-start gap-4">
            <BrandAppIcon size={recording ? 40 : 48} priority={recording} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-400">
                  {BRAND.productName}
                </p>
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-amber-100">
                  Demo Mode
                </span>
              </div>
              <h1
                className={cn(
                  "mt-2 text-3xl font-black tracking-tight md:text-5xl",
                  recording && "text-xl md:text-3xl"
                )}
              >
                Realistic App Walkthrough
              </h1>
              <p
                className={cn(
                  "mt-3 max-w-3xl text-sm leading-6 text-slate-400 md:text-base",
                  recording && "hidden lg:block lg:max-w-2xl lg:text-xs lg:leading-5"
                )}
              >
                A simulated owner-operator journey for training videos. It uses
                mock state, localStorage, and the pure calculator engine only.
              </p>
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-sm text-sky-100",
              recording && "shrink-0 p-3 text-xs"
            )}
          >
            <div className="font-black uppercase tracking-[0.18em]">
              {recording ? "Recording Mode" : "Manual Demo Mode"}
            </div>
            <div className="mt-2 text-sky-200/80">
              Step {activeIndex + 1} of {demoSteps.length} - {completion}%
            </div>
          </div>
        </header>

        <div
          className={cn(
            "grid gap-5 lg:grid-cols-[320px_1fr]",
            recording && "min-h-0 flex-1 overflow-hidden lg:block"
          )}
        >
          {!recording && (
            <DemoProgressRail
              steps={demoSteps}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              recording={recording}
            />
          )}

          <section
            className={cn(
              recording ? "flex h-full min-h-0 flex-col lg:col-span-2" : ""
            )}
          >
            <DemoNarration
              narration={activeStep.narration}
              recording={recording}
            />

            <DemoStepCard
              eyebrow={activeStep.eyebrow}
              title={activeStep.title}
              className={cn(
                recording
                  ? "min-h-0 flex-1 overflow-hidden p-4 md:p-5"
                  : "min-h-[560px]"
              )}
              bodyClassName={recording ? "min-h-0 overflow-hidden" : undefined}
              compact={recording}
            >
              {recording && (
                <RecordingActionBar
                  label={getRecordingActionLabel(
                    activeStep.key,
                    recordingElapsed
                  )}
                  progress={recordingProgress}
                />
              )}
              {renderStep(activeStep.key)}
            </DemoStepCard>

            {!recording && (
              <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {majorStepIndexes.map((index) => (
                    <button
                      key={demoSteps[index].key}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className="rounded-lg border border-slate-700 bg-[#08111F] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-300 hover:border-sky-400/40"
                    >
                      {demoSteps[index].section}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <NavButton onClick={back} disabled={activeIndex === 0}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </NavButton>
                  <NavButton onClick={restart}>
                    <RotateCcw className="h-4 w-4" />
                    Restart Demo
                  </NavButton>
                  <NavButton
                    onClick={next}
                    primary
                    disabled={activeIndex === demoSteps.length - 1}
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </NavButton>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
    </DemoRecordingFrame>
  );

  function renderStep(key: DemoStepKey) {
    switch (key) {
      case "intro":
        return (
          <TwoColumn
            side={<SafetyPanel />}
            main={
              <div className="space-y-3 md:space-y-5">
                <BrandCard
                  className="max-w-2xl"
                  priority
                  overlay={
                    <div className="flex h-full items-end bg-gradient-to-t from-[#060B14]/80 via-[#060B14]/10 to-transparent p-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-200">
                          {BRAND.shortName}
                        </p>
                        <p className="mt-2 text-2xl font-black text-white">
                          {BRAND.tagline}
                        </p>
                      </div>
                    </div>
                  }
                />
                <p className="text-lg font-semibold leading-8 text-slate-200">
                  Welcome to the {BRAND.productName} demo. This walkthrough shows how
                  an owner-operator can set up a profile, calculate loads, save
                  results, and understand true profitability before committing
                  to freight.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile icon={<LockKeyhole />} title="No real account" body="Login and account creation are visual simulations." />
                  <InfoTile icon={<WalletCards />} title="No payment" body="Stripe, Apple, Google, and billing routes are never called." />
                  <InfoTile icon={<ShieldCheck />} title="No database writes" body="Saved loads and acknowledgments stay in local demo state." />
                  <InfoTile icon={<Play />} title="Video friendly" body="Use ?recording=true for timed narration and automatic advance." />
                </div>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14]"
                >
                  Start Demo Walkthrough
                </button>
              </div>
            }
          />
        );
      case "login":
        return (
          <TwoColumn
            side={<Callout title="Demo credentials helper" body={`Use ${demoEmail} and any password. The submit handler is local only.`} icon={<LockKeyhole />} />}
            main={
              <div className="max-w-xl rounded-xl border border-slate-800 bg-[#060B14] p-3 md:p-5">
                {recording ? (
                  <>
                    <TypingField
                      label="Email"
                      value={demoEmail}
                      elapsedMs={recordingElapsed}
                      startMs={700}
                    />
                    <TypingField
                      label="Password"
                      value="demo-password"
                      elapsedMs={recordingElapsed}
                      startMs={3600}
                      type="password"
                    />
                  </>
                ) : (
                  <>
                    <Field label="Email" value={demoEmail} />
                    <Field label="Password" value="demo-password" type="password" />
                  </>
                )}
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                  <span className="text-sky-300">Create account</span>
                  <span>Forgot password?</span>
                </div>
                <button
                  type="button"
                  onClick={simulateLogin}
                  className="mt-5 w-full rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14]"
                >
                  {recording
                    ? recordingElapsed > 6300
                      ? "Demo Login Complete"
                      : recordingElapsed > 5000
                        ? "Checking demo credentials..."
                        : "Log In"
                    : state.loginStatus === "loading"
                      ? "Checking demo credentials..."
                      : "Log In"}
                </button>
                {(state.loginStatus === "complete" ||
                  (recording && recordingElapsed > 7000)) && (
                  <SuccessText text="Login simulated. No Supabase Auth call was made." />
                )}
              </div>
            }
          />
        );
      case "safety":
        return (
          <TwoColumn
            side={<SafetyPanel />}
            main={
              <div className="space-y-4">
                <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-red-50 md:p-5">
                  <h3 className="text-xl font-black">Driving safety disclaimer</h3>
                  <p className="mt-3 leading-7">
                    Do not interact with LoadIQ while driving unless safely
                    parked or using lawful hands-free methods. The app supports
                    better decisions; it does not replace safe operation.
                  </p>
                </div>
                <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#060B14] p-4">
                  <input
                    type="checkbox"
                    checked={
                      recording ? recordingElapsed > 2800 : state.safetyAccepted
                    }
                    onChange={(event) =>
                      patchState({ safetyAccepted: event.target.checked })
                    }
                    className="mt-1 h-4 w-4 accent-sky-400"
                  />
                  <span>I acknowledge this demo safety expectation.</span>
                </label>
                <button
                  type="button"
                  disabled={
                    recording ? recordingElapsed <= 3300 : !state.safetyAccepted
                  }
                  onClick={next}
                  className="rounded-xl bg-sky-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#060B14] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            }
          />
        );
      case "founderWelcome":
        return (
          <TwoColumn
            side={<Callout title="Joshua Karpilo" body="Founder/CEO welcome is modeled as a demo-only onboarding moment." icon={<BadgeCheck />} />}
            main={
              <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4 md:p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-300">
                  Founder welcome
                </p>
                <h3 className="mt-3 text-3xl font-black text-slate-100">
                  Welcome to LoadIQ, {demoProfile.operatorName}.
                </h3>
                <p className="mt-4 leading-8 text-slate-300">
                  I built Karpilo LoadIQ to help operators protect margin before
                  they commit to freight. The pilot expectation is simple:
                  build a realistic profile, test load decisions, and use the
                  numbers as decision support.
                </p>
              </div>
            }
          />
        );
      case "checklist":
        return (
          <div className="grid gap-3">
            {completedChecklist.map(({ item, complete }) => (
              <ChecklistRow key={item} label={item} complete={complete} />
            ))}
          </div>
        );
      case "operatorType":
        return (
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["leased_owner_operator", "Leased Owner-Operator", "Percentage settlement, carrier rules, adjusted gross."],
              ["independent_owner_operator", "Independent Owner-Operator", "Fuller gross-to-cost modeling and direct customer/broker exposure."],
              ["small_fleet", "Small Fleet", "Coming later: multi-truck dispatch and fleet-level comparison."],
            ].map(([value, title, body]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  value !== "small_fleet" &&
                  patchState({ operatorType: value as DemoOperatorType })
                }
                className={cn(
                  "rounded-xl border p-3 text-left md:p-5",
                  (recording
                    ? value === "leased_owner_operator" &&
                      recordingElapsed > 1800
                    : state.operatorType === value)
                    ? "border-sky-400/60 bg-sky-400/10 text-sky-50"
                    : "border-slate-800 bg-[#060B14] text-slate-300",
                  value === "small_fleet" && "opacity-60"
                )}
              >
                <Truck className="h-6 w-6 text-sky-300" />
                <h3 className="mt-4 text-lg font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
              </button>
            ))}
          </div>
        );
      case "payStructure":
        return (
          <MetricGrid
            metrics={[
              ["Gross linehaul", formatCurrency(demoLoadResult.linehaulRevenue)],
              ["Carrier gross basis", `${demoProfile.carrierGrossPercent}%`],
              ["Operator share", `${demoProfile.operatorPercent}%`],
              ["Retained before split", `${demoProfile.retainedBeforeSplitPercent}%`],
              ["Dispatch fee", `${demoProfile.dispatchFeePercent}%`],
              ["Factoring fee", `${demoProfile.factoringFeePercent}%`],
              ["Pay model", "75% of 98% gross"],
              ["Operator payable revenue", formatCurrency(demoLoadResult.payableRevenue)],
            ]}
          />
        );
      case "fuel":
        return (
          <TwoColumn
            side={<ValidationPanel items={["MPG is required", "Fuel price must be greater than zero", "Deadhead changes fuel burn"]} />}
            main={
              <MetricGrid
                metrics={[
                  ["Average MPG", demoProfile.truckMpg],
                  ["Diesel price", formatCurrency(demoProfile.averageFuelCost)],
                  ["Fuel surcharge handling", "Included in percentage pay"],
                  ["Fuel reserve", formatCurrency(demoProfile.fuelReserve)],
                  ["Empty miles note", "Deadhead is included in total fuel cost"],
                  ["Estimated trip fuel", formatCurrency(demoLoadResult.fuelCost)],
                ]}
              />
            }
          />
        );
      case "fixedCosts":
        return <CostTable rows={demoFixedCosts} />;
      case "variableCosts":
        return <CostTable rows={demoVariableCosts} />;
      case "targetIncome":
        return (
          <MetricGrid
            metrics={[
              ["Desired annual personal income", formatCurrency(demoProfile.targetAnnualIncome)],
              ["Estimated working weeks", demoProfile.workingWeeks],
              ["Average loads per week", demoProfile.loadsPerWeek],
              ["Required weekly net", formatCurrency(demoProfile.targetAnnualIncome / demoProfile.workingWeeks)],
              ["Minimum target true RPM", formatRpm(demoProfile.minimumTrueRpm)],
              ["Minimum hourly profit", formatCurrency(demoProfile.minimumHourlyProfitability)],
            ]}
          />
        );
      case "profileReview":
        return (
          <TwoColumn
            side={<Callout title="Review before calculating" body="The profile is the lens for every future load decision." icon={<Gauge />} />}
            main={
              <MetricGrid
                metrics={[
                  ["Operator type", "Leased owner-operator"],
                  ["Company", demoProfile.companyName],
                  [
                    "Truck",
                    `${demoProfile.truckYear} ${demoProfile.truckMake} ${demoProfile.truckModel}`,
                  ],
                  ["Equipment", demoProfile.equipmentType],
                  ["Pay structure", "75% of 98% gross"],
                  ["Fuel assumptions", `6.7 MPG at ${formatCurrency(3.89)}`],
                  ["Fixed costs", `${formatCurrency(demoProfile.fixedOverheadDaily)} / day`],
                  ["Variable costs", formatRpm(demoProfile.variableOverheadPerMile)],
                  ["Target income", formatCurrency(demoProfile.targetAnnualIncome)],
                  ["Target true RPM", formatRpm(demoProfile.minimumTrueRpm)],
                ]}
              />
            }
          />
        );
      case "dashboard":
        return (
          <MetricGrid
            metrics={[
              ["Profile completeness", "100%"],
              ["Target true RPM", formatRpm(demoProfile.minimumTrueRpm)],
              ["Weekly revenue mock summary", formatCurrency(7250)],
              ["Net profit mock summary", formatCurrency(2460)],
              ["Saved loads", state.savedLoads.length],
              ["Warnings", "1 lane needs review"],
              ["Quick action", "Calculate new load"],
              ["Quick action", "Review insights"],
            ]}
          />
        );
      case "startLoad":
        return (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#060B14] p-5 text-center md:min-h-[360px] md:p-8">
            <Calculator className="h-12 w-12 text-sky-300" />
            <h3 className="mt-5 text-2xl font-black md:text-3xl">Calculate New Load</h3>
            <p className="mt-3 max-w-xl leading-7 text-slate-400">
              The production dashboard places this action near profile status,
              saved load history, and profitability warnings.
            </p>
            <button
              type="button"
              onClick={next}
              className="mt-6 rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.2em] text-[#060B14]"
            >
              Calculate New Load
            </button>
          </div>
        );
      case "lane":
        return (
          recording ? (
            <div className="grid gap-3 md:grid-cols-2">
              <TypingField
                label="Pickup city/state"
                value="Indianapolis, IN"
                elapsedMs={recordingElapsed}
                startMs={500}
              />
              <TypingField
                label="Pickup ZIP"
                value={demoLoadInput.pickupZip}
                elapsedMs={recordingElapsed}
                startMs={1800}
              />
              <TypingField
                label="Delivery city/state"
                value="Dallas, TX"
                elapsedMs={recordingElapsed}
                startMs={3000}
              />
              <TypingField
                label="Delivery ZIP"
                value={demoLoadInput.deliveryZip}
                elapsedMs={recordingElapsed}
                startMs={4200}
              />
              <RecordingSelectField
                label="Equipment type"
                value={demoProfile.equipmentType}
                selected={recordingElapsed > 5400}
              />
              <RecordingSelectField
                label="Load type"
                value="One pickup / one delivery"
                selected={recordingElapsed > 6400}
              />
            </div>
          ) : (
            <MetricGrid
              metrics={[
                ["Pickup city/state", "Indianapolis, IN"],
                ["Pickup ZIP", demoLoadInput.pickupZip],
                ["Delivery city/state", "Dallas, TX"],
                ["Delivery ZIP", demoLoadInput.deliveryZip],
                ["Equipment type", demoProfile.equipmentType],
                [
                  "Truck",
                  `${demoProfile.truckYear} ${demoProfile.truckMake} ${demoProfile.truckModel}`,
                ],
                ["Load type", "One pickup / one delivery"],
                ["Appointment window", "Pickup 0800, deliver next day PM"],
              ]}
            />
          )
        );
      case "miles":
        return (
          <TwoColumn
            side={<ValidationPanel items={["Loaded miles required", "Deadhead warning above 15%", "Total miles drive fuel and time"]} />}
            main={
              <MetricGrid
                metrics={[
                  ["Loaded miles", formatNumber(demoLoadInput.loadedMiles)],
                  ["Deadhead to pickup", "52 mi"],
                  ["Deadhead after delivery", "30 mi"],
                  ["Total deadhead", formatNumber(demoLoadInput.deadheadMiles)],
                  ["Total miles", formatNumber(demoLoadResult.totalMiles)],
                  ["Deadhead percent", `${demoLoadResult.deadheadPercent}%`],
                ]}
              />
            }
          />
        );
      case "revenue":
        return (
          <MetricGrid
            metrics={[
              ["Linehaul", formatCurrency(demoLoadResult.linehaulRevenue)],
              ["Fuel surcharge", formatCurrency(demoLoadResult.fuelSurchargeRevenue)],
              ["Accessorials", formatCurrency(demoLoadResult.accessorialRevenue)],
              ["Detention", formatCurrency(120)],
              ["Layover", formatCurrency(0)],
              ["Stop pay", formatCurrency(75)],
              ["Other revenue", formatCurrency(0)],
              ["Gross revenue", formatCurrency(demoLoadResult.grossRevenue)],
            ]}
          />
        );
      case "tripCosts":
        return (
          <MetricGrid
            metrics={[
              ["Estimated fuel cost", formatCurrency(demoLoadResult.fuelCost)],
              ["Tolls", formatCurrency(demoLoadInput.tolls)],
              ["Lumpers", formatCurrency(demoLoadInput.lumpers)],
              ["Washout", formatCurrency(0)],
              ["Scale tickets", formatCurrency(18)],
              ["Parking", formatCurrency(25)],
              ["Permits", formatCurrency(0)],
              ["Post-trip placeholder", "Awaiting actuals"],
            ]}
          />
        );
      case "time":
        return (
          <MetricGrid
            metrics={[
              ["Drive time", "16.8 hours"],
              ["Loading time", "2.0 hours"],
              ["Unloading time", "2.5 hours"],
              ["Waiting time", "1.5 hours"],
              ["Reset / layover impact", "0.25 day"],
              ["Total estimated hours", "30.3 hours"],
              ["Profit per hour", formatCurrency(demoLoadResult.profitPerHour)],
            ]}
          />
        );
      case "calculationReview":
        return <ResultsGrid />;
      case "recommendation":
        return (
          <TwoColumn
            side={<ResultBadge />}
            main={
              <div className="grid gap-3">
                {[
                  `Meets target true RPM: ${formatRpm(demoLoadResult.trueRpm)} vs ${formatRpm(demoProfile.minimumTrueRpm)} target.`,
                  `Deadhead is controlled at ${demoLoadResult.deadheadPercent}%.`,
                  `Fuel is modeled at ${formatCurrency(demoLoadResult.fuelCost)} before the user commits.`,
                  `Estimated net is ${formatCurrency(demoLoadResult.estimatedNet)} after realistic costs.`,
                ].map((line) => (
                  <ChecklistRow key={line} label={line} complete />
                ))}
              </div>
            }
          />
        );
      case "saveDecision":
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["potential", "Save as potential load"],
              ["accepted", "Mark as accepted"],
              ["rejected", "Mark as rejected"],
              ["completed", "Mark as completed later"],
            ].map(([status, label]) => (
              <button
                key={status}
                type="button"
                onClick={() => saveDemoLoad(status as DemoSavedLoadStatus)}
                className={cn(
                  "rounded-xl border p-3 text-left md:p-5",
                  (recording
                    ? status === "potential" && recordingElapsed > 2600
                    : state.saveChoice === status)
                    ? "border-sky-400/60 bg-sky-400/10 text-sky-50"
                    : "border-slate-800 bg-[#060B14] text-slate-300"
                )}
              >
                <Save className="h-5 w-5 text-sky-300" />
                <h3 className="mt-3 font-black">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Local demo state only. No production write.
                </p>
              </button>
            ))}
          </div>
        );
      case "ranLoad":
        return (
          <div className="rounded-xl border border-slate-800 bg-[#060B14] p-3 md:p-5">
            <h3 className="text-2xl font-black">Did you actually run this load?</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {(["yes", "no", "planned", "rejected"] as const).map((answer) => (
                <button
                  key={answer}
                  type="button"
                  onClick={() => patchState({ ranLoadAnswer: answer })}
                  className={cn(
                    "rounded-xl border p-4 text-sm font-black uppercase tracking-[0.14em]",
                    (recording
                      ? answer === "planned" && recordingElapsed > 2500
                      : state.ranLoadAnswer === answer)
                      ? "border-sky-400/60 bg-sky-400/10 text-sky-100"
                      : "border-slate-800 text-slate-400"
                  )}
                >
                  {answer}
                </button>
              ))}
            </div>
          </div>
        );
      case "savedLoads":
        return <SavedLoadsList loads={state.savedLoads} />;
      case "compare":
        return (
          <div className="grid gap-4 xl:grid-cols-2">
            <ComparePanel load={state.savedLoads[0]} label="Load A" />
            <ComparePanel load={state.savedLoads[1]} label="Load B" />
          </div>
        );
      case "postTrip":
        return (
          <TwoColumn
            side={<Callout title="Completed load edit" body="Actuals correct the original estimate and improve future decisions." icon={<Settings />} />}
            main={
              <div className="space-y-4">
                <MetricGrid
                  metrics={[
                    ["Extra fuel", formatCurrency(65)],
                    ["Added lumper", formatCurrency(75)],
                    ["Added parking", formatCurrency(25)],
                    [
                      "Repair expense",
                      formatCurrency(
                        recording
                          ? Math.min(
                              155,
                              Math.round((recordingElapsed / 6000) * 155)
                            )
                          : state.postTripExtraCost
                      ),
                    ],
                    [
                      "Updated final result",
                      formatCurrency(
                        demoLoadResult.estimatedNet -
                          (recording
                            ? Math.min(
                                155,
                                Math.round((recordingElapsed / 6000) * 155)
                              )
                            : state.postTripExtraCost)
                      ),
                    ],
                  ]}
                />
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={
                    recording
                      ? Math.min(155, Math.round((recordingElapsed / 6000) * 155))
                      : state.postTripExtraCost
                  }
                  onChange={(event) =>
                    patchState({ postTripExtraCost: Number(event.target.value) })
                  }
                  className="w-full accent-sky-400"
                />
              </div>
            }
          />
        );
      case "insights":
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["What is true RPM?", "Revenue across all miles, not just loaded miles."],
              ["Why deadhead matters", "Unpaid miles still consume fuel, tires, maintenance, and time."],
              ["Why gross revenue lies", "Gross does not show settlement rules or trip costs."],
              ["Why profit per hour matters", "A profitable mile can still waste the clock."],
              ["Leased vs independent", "Different pay structures require different math."],
              ["How overhead changes decisions", "Fixed costs must be carried by the freight."],
            ].map(([title, body]) => (
              <Callout key={title} title={title} body={body} icon={<Info />} />
            ))}
          </div>
        );
      case "settings":
        return (
          <MetricGrid
            metrics={[
              ["Edit operator type", "Leased owner-operator"],
              ["Company", demoProfile.companyName],
              [
                "Truck",
                `${demoProfile.truckYear} ${demoProfile.truckMake} ${demoProfile.truckModel}`,
              ],
              ["Equipment", demoProfile.equipmentType],
              ["Edit pay structure", "75% of 98% gross"],
              ["Edit fuel assumptions", "6.7 MPG / $3.89"],
              ["Edit overhead", formatCurrency(demoProfile.fixedOverheadDaily)],
              ["Edit target income", formatCurrency(demoProfile.targetAnnualIncome)],
              ["Review acknowledgments", "Safety accepted in local demo state"],
              ["Reset demo", "Available"],
            ]}
          />
        );
      case "final":
        return (
          <TwoColumn
            side={<SafetyPanel />}
            main={
              <div className="space-y-4 md:space-y-5">
                <h3 className="text-3xl font-black md:text-4xl">
                  This is {BRAND.productName} in action.
                </h3>
                <p className="max-w-2xl leading-8 text-slate-300">
                  {BRAND.productName} is built to help operators understand freight
                  before they commit to it, protect their margin, and make
                  better decisions with real operating numbers.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {["Join pilot", "Join waitlist", "Create account", "Learn more"].map((cta) => (
                    <button
                      key={cta}
                      type="button"
                      className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-sky-200"
                    >
                      {cta}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        );
      default:
        return null;
    }
  }
}

function NavButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-xs font-black uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-40",
        primary
          ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
          : "border-slate-700 bg-[#08111F] text-slate-300"
      )}
    >
      {children}
    </button>
  );
}

function IPhoneAppShell({
  activeStep,
  activeIndex,
  completion,
  homeScreen,
  homeScreenTapped,
  children,
}: {
  activeStep: DemoStep;
  activeIndex: number;
  completion: number;
  homeScreen?: boolean;
  homeScreenTapped?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center">
      <div
        className="relative flex min-h-0 shrink-0 rounded-[2.55rem] border border-slate-700 bg-slate-950 p-3 shadow-[0_0_45px_rgba(56,189,248,0.18)]"
        style={{
          aspectRatio: "390 / 844",
          width:
            "min(330px, calc((100vh - 112px) * 390 / 844), calc(100vw - 48px))",
        }}
      >
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex h-[calc(100%-38px)] min-h-0 w-full flex-col overflow-hidden rounded-[1.9rem] border border-slate-800 bg-[#07101D]">
          {homeScreen ? (
            <IPhoneHomeScreen tapped={Boolean(homeScreenTapped)} />
          ) : (
            <>
          <div className="shrink-0 border-b border-slate-800 bg-[#050A12] px-4 pb-3 pt-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrandAppIcon size={34} priority />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
                    {BRAND.shortName}
                  </p>
                  <p className="text-sm font-black text-slate-100">
                    Mobile App Demo
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-amber-100">
                Demo
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              <span>
                Step {activeIndex + 1} / {demoSteps.length}
              </span>
              <span>{completion}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-sky-300 transition-[width] duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="mt-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {activeStep.eyebrow}
              </p>
              <h2 className="mt-1 text-base font-black leading-tight text-slate-100">
                {activeStep.title}
              </h2>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {children}
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IPhoneHomeScreen({ tapped }: { tapped: boolean }) {
  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.35),transparent_28%),linear-gradient(145deg,#07101D,#111827_48%,#020617)] px-4 pb-5 pt-11">
      <div className="flex items-center justify-between text-[11px] font-bold text-white/85">
        <span>9:41</span>
        <span>5G  100%</span>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-x-3 gap-y-5">
        <button
          type="button"
          className={cn(
            "flex flex-col items-center gap-2 transition duration-300",
            tapped && "scale-90 opacity-80"
          )}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white shadow-[0_12px_25px_rgba(0,0,0,0.35)]">
            <BrandAppIcon size={48} priority />
          </span>
          <span className="text-center text-[11px] font-bold leading-tight text-white drop-shadow">
            LoadIQ
          </span>
        </button>

        {["Maps", "Notes", "Calendar", "Files", "Camera", "Weather"].map(
          (label) => (
            <div key={label} className="flex flex-col items-center gap-2 opacity-45">
              <span className="h-14 w-14 rounded-[1.2rem] bg-white/20" />
              <span className="text-[11px] font-bold text-white/80">{label}</span>
            </div>
          )
        )}
      </div>

      <div className="mt-auto rounded-[1.6rem] bg-white/12 p-3 backdrop-blur">
        <div className="grid grid-cols-4 gap-3">
          {["Phone", "Safari", "Messages", "LoadIQ"].map((label) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "h-12 w-12 rounded-2xl bg-white/20",
                  label === "LoadIQ" && "flex items-center justify-center bg-white"
                )}
              >
                {label === "LoadIQ" && <BrandAppIcon size={38} priority />}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center text-xs font-black uppercase tracking-[0.18em] text-white/85">
        {tapped ? "Opening LoadIQ..." : "Tap LoadIQ"}
      </div>
    </div>
  );
}

function RecordingDialoguePanel({
  activeStep,
  elapsedMs,
  progress,
}: {
  activeStep: DemoStep;
  elapsedMs: number;
  progress: number;
}) {
  return (
    <aside className="flex h-full min-h-0 flex-col justify-center overflow-hidden">
      <div className="max-h-full overflow-hidden rounded-2xl border border-slate-800 bg-[#08111F] p-4 shadow-[0_0_35px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
              Recording Dialogue
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-slate-100">
              {activeStep.title}
            </h2>
          </div>
          <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-sky-200">
            iPhone simulation
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-slate-700 bg-[#050A12] p-3">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            On-screen action
          </div>
          <p className="mt-2 text-lg font-black text-sky-100">
            {getRecordingActionLabel(activeStep.key, elapsedMs)}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-sky-300 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-700 bg-[#050A12] p-3">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Narration
          </div>
          <p className="mt-2 text-base leading-7 text-slate-200">
            {activeStep.narration}
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <DialogueFact label="Demo company" value={demoProfile.companyName} />
          <DialogueFact label="Operator" value={demoProfile.operatorName} />
          <DialogueFact
            label="Truck"
            value={`${demoProfile.truckYear} ${demoProfile.truckMake} ${demoProfile.truckModel}`}
          />
          <DialogueFact label="Equipment" value={demoProfile.equipmentType} />
        </div>

        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs leading-5 text-emerald-50">
          This route is demo-only: local state, no real auth, no Supabase
          writes, no billing calls, and no production profile mutation.
        </div>
      </div>
    </aside>
  );
}

function DialogueFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-[#050A12] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-slate-100">{value}</div>
    </div>
  );
}

function PhoneStack({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}

function PhoneHero({
  title,
  body,
  tone = "default",
}: {
  title: string;
  body: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "success"
          ? "border-emerald-300/25 bg-emerald-400/10"
          : tone === "warning"
            ? "border-amber-300/25 bg-amber-300/10"
            : "border-slate-800 bg-[#050A12]"
      )}
    >
      <h3 className="text-xl font-black leading-tight text-slate-100">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function PhoneMetricList({
  metrics,
}: {
  metrics: Array<[string, string | number]>;
}) {
  return (
    <div className="grid gap-2">
      {metrics.map(([label, value], index) => (
        <div
          key={`${label}-${index}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#050A12] p-3"
        >
          <span className="min-w-0 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            {label}
          </span>
          <span className="max-w-[55%] text-right text-sm font-black text-slate-100">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PhoneCheckRow({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#050A12] p-3">
      {complete ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0 text-slate-600" />
      )}
      <span
        className={cn(
          "text-sm font-bold leading-5",
          complete ? "text-slate-100" : "text-slate-500"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function PhoneChoice({
  title,
  body,
  selected,
  muted,
}: {
  title: string;
  body: string;
  selected?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        selected
          ? "border-sky-400/60 bg-sky-400/10"
          : "border-slate-800 bg-[#050A12]",
        muted && "opacity-55"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-100">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">{body}</p>
        </div>
        {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-sky-300" />}
      </div>
    </div>
  );
}

function PhonePill({
  label,
  selected,
}: {
  label: string;
  selected?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3 text-center text-xs font-black uppercase tracking-[0.14em]",
        selected
          ? "border-sky-400/60 bg-sky-400/10 text-sky-100"
          : "border-slate-800 bg-[#050A12] text-slate-500"
      )}
    >
      {label}
    </div>
  );
}

function PhonePrimaryButton({
  label,
  disabled,
  secondary,
}: {
  label: string;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 text-center text-xs font-black uppercase tracking-[0.18em]",
        disabled
          ? "bg-slate-800 text-slate-500"
          : secondary
            ? "border border-sky-400/30 bg-sky-400/10 text-sky-200"
            : "bg-sky-400 text-[#050A12]"
      )}
    >
      {label}
    </div>
  );
}

function TwoColumn({
  main,
  side,
}: {
  main: React.ReactNode;
  side: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      {main}
      {side}
    </div>
  );
}

function Field({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string;
  type?: string;
}) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        readOnly
        type={type}
        value={value}
        className="mt-2 h-12 w-full rounded-xl border border-slate-800 bg-[#0B1220] px-4 text-slate-100 outline-none"
      />
    </label>
  );
}

function TypingField({
  label,
  value,
  elapsedMs,
  startMs,
  type = "text",
}: {
  label: string;
  value: string;
  elapsedMs: number;
  startMs: number;
  type?: string;
}) {
  const revealedValue = revealText(value, elapsedMs, startMs);
  const complete = revealedValue.length >= value.length;

  return (
    <label className="mt-4 block first:mt-0">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <div className="relative mt-2">
        <input
          readOnly
          type={type}
          value={revealedValue}
          className={cn(
            "h-12 w-full rounded-xl border bg-[#0B1220] px-4 pr-12 text-slate-100 outline-none transition-colors",
            complete ? "border-sky-400/40" : "border-slate-800"
          )}
        />
        {!complete && elapsedMs >= startMs && (
          <span className="absolute right-4 top-1/2 h-5 w-0.5 -translate-y-1/2 animate-pulse bg-sky-300" />
        )}
      </div>
    </label>
  );
}

function RecordingSelectField({
  label,
  value,
  selected,
}: {
  label: string;
  value: string;
  selected: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        selected
          ? "border-sky-400/60 bg-sky-400/10 text-sky-50"
          : "border-slate-800 bg-[#060B14] text-slate-400"
      )}
    >
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-lg font-black">
        <span>{selected ? value : "Selecting..."}</span>
        {selected && <CheckCircle2 className="h-5 w-5 text-sky-300" />}
      </div>
    </div>
  );
}

function RecordingActionBar({
  label,
  progress,
}: {
  label: string;
  progress: number;
}) {
  return (
    <div className="mb-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-sky-100">
          <span className="h-2 w-2 animate-pulse rounded-full bg-sky-300" />
          {label}
        </div>
        <span className="hidden text-[10px] font-bold text-slate-400 min-[380px]:block">
          Simulated operator input
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-sky-300 transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function revealText(
  value: string,
  elapsedMs: number,
  startMs: number,
  charsPerSecond = 18
) {
  const visibleChars = Math.max(
    0,
    Math.floor(((elapsedMs - startMs) / 1000) * charsPerSecond)
  );

  return value.slice(0, Math.min(value.length, visibleChars));
}

function getRecordingActionLabel(key: DemoStepKey, elapsedMs: number) {
  const sequences: Partial<Record<DemoStepKey, Array<[number, string]>>> = {
    intro: [
      [0, "Opening demo environment"],
      [2400, "Reviewing demo safeguards"],
      [5600, "Starting walkthrough"],
    ],
    login: [
      [0, "Typing demo email"],
      [3000, "Typing password"],
      [5200, "Submitting login"],
      [7000, "Entering demo account"],
    ],
    safety: [
      [0, "Reading safety gate"],
      [2300, "Checking acknowledgment"],
      [5200, "Continuing setup"],
    ],
    operatorType: [
      [0, "Comparing operator types"],
      [1800, "Selecting leased owner-operator"],
      [5200, "Saving operator type"],
    ],
    payStructure: [
      [0, "Entering gross settlement rules"],
      [2600, "Applying 75 percent split"],
      [5700, "Confirming adjusted gross"],
    ],
    fuel: [
      [0, "Typing MPG and diesel price"],
      [3000, "Checking fuel validation"],
      [6100, "Saving fuel assumptions"],
    ],
    fixedCosts: [
      [0, "Adding fixed overhead"],
      [3000, "Setting cost frequencies"],
      [6200, "Allocating daily burden"],
    ],
    variableCosts: [
      [0, "Adding per-mile reserves"],
      [3000, "Adding percentage deductions"],
      [6200, "Saving variable costs"],
    ],
    targetIncome: [
      [0, "Typing income target"],
      [3000, "Calculating weekly net"],
      [6200, "Setting target true RPM"],
    ],
    dashboard: [
      [0, "Reviewing dashboard cards"],
      [3000, "Checking warnings"],
      [6200, "Choosing new load"],
    ],
    lane: [
      [0, "Typing pickup details"],
      [2800, "Typing delivery details"],
      [5600, "Selecting equipment"],
    ],
    miles: [
      [0, "Entering loaded miles"],
      [2600, "Adding deadhead"],
      [5600, "Checking deadhead warning"],
    ],
    revenue: [
      [0, "Typing linehaul"],
      [2400, "Adding surcharge"],
      [5200, "Adding accessorials"],
    ],
    tripCosts: [
      [0, "Estimating fuel cost"],
      [2600, "Adding tolls and fees"],
      [5600, "Reviewing trip costs"],
    ],
    time: [
      [0, "Estimating drive time"],
      [2600, "Adding loading delay"],
      [5600, "Calculating profit per hour"],
    ],
    calculationReview: [
      [0, "Running profitability engine"],
      [3000, "Applying overhead"],
      [6200, "Comparing against target"],
    ],
    recommendation: [
      [0, "Reading recommendation"],
      [3000, "Checking target reasons"],
      [6200, "Preparing save decision"],
    ],
    saveDecision: [
      [0, "Choosing save status"],
      [2600, "Saving potential load"],
      [5600, "Confirming local demo state"],
    ],
    ranLoad: [
      [0, "Answering data quality prompt"],
      [2500, "Marking as planned"],
      [5600, "Protecting history quality"],
    ],
    savedLoads: [
      [0, "Opening saved loads"],
      [3000, "Scanning load cards"],
      [6200, "Selecting compare"],
    ],
    compare: [
      [0, "Comparing load A"],
      [3000, "Comparing load B"],
      [6200, "Finding profitable option"],
    ],
    postTrip: [
      [0, "Opening completed load"],
      [2600, "Adding actual repair cost"],
      [5600, "Updating final net"],
    ],
    settings: [
      [0, "Opening profile settings"],
      [3000, "Reviewing editable inputs"],
      [6200, "Keeping profile current"],
    ],
    final: [
      [0, "Reviewing final CTA"],
      [3000, "Showing next actions"],
      [6200, "Ending walkthrough"],
    ],
  };

  const fallback: Array<[number, string]> = [
    [0, "Reviewing screen"],
    [2800, "Confirming details"],
    [5800, "Continuing walkthrough"],
  ];

  const sequence = sequences[key] ?? fallback;
  return sequence.reduce(
    (current, [time, label]) => (elapsedMs >= time ? label : current),
    sequence[0][1]
  );
}

function InfoTile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-3 md:p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-400/25 bg-sky-400/10 text-sky-300">
        {icon}
      </div>
      <h3 className="mt-3 font-black text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}

function Callout({
  icon,
  title,
  body,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-3 md:p-5">
      <div className="flex items-center gap-3 text-sky-300">
        {icon ?? <Info className="h-5 w-5" />}
        <h3 className="text-lg font-black text-slate-100">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-400">{body}</p>
    </div>
  );
}

function SafetyPanel() {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-3 md:p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
        Demo isolation
      </p>
      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        {[
          "No real authentication",
          "No Supabase writes",
          "No Stripe checkout",
          "No email events",
          "No production user data",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidationPanel({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 md:p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">
        Validation
      </p>
      <div className="mt-4 grid gap-3 text-sm text-amber-50">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistRow({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#060B14] p-4">
      {complete ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
      ) : (
        <XCircle className="h-5 w-5 text-slate-600" />
      )}
      <span className={complete ? "text-slate-100" : "text-slate-500"}>
        {label}
      </span>
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: Array<[string, string | number]> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map(([label, value], index) => (
        <Metric key={`${label}-${index}`} label={label} value={value} />
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-3 md:p-4">
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-base font-black text-slate-100 md:text-lg">
        {value}
      </div>
    </div>
  );
}

function CostTable({ rows }: { rows: readonly (readonly [string, string, string])[] }) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-800 bg-[#060B14]">
      <div className="grid grid-cols-[1fr_120px_120px] border-b border-slate-800 bg-[#08111F] p-4 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        <span>Category</span>
        <span>Cost</span>
        <span>Frequency</span>
      </div>
      {rows.map(([category, cost, frequency]) => (
        <div
          key={category}
          className="grid grid-cols-[1fr_120px_120px] border-b border-slate-900 p-4 text-sm last:border-b-0"
        >
          <span className="font-bold text-slate-100">{category}</span>
          <span className="text-slate-300">{cost}</span>
          <span className="text-slate-400">{frequency}</span>
        </div>
      ))}
    </div>
  );
}

function ResultsGrid() {
  return (
    <MetricGrid
      metrics={[
        ["Gross revenue", formatCurrency(demoLoadResult.grossRevenue)],
        ["Adjusted revenue", formatCurrency(demoLoadResult.payableRevenue)],
        ["Operator share", formatCurrency(demoLoadResult.payableRevenue)],
        ["Fuel cost", formatCurrency(demoLoadResult.fuelCost)],
        ["Fixed overhead allocation", formatCurrency(demoLoadResult.loadOverheadApplied)],
        ["Variable costs", formatCurrency(demoLoadResult.costBreakdown.variableCosts)],
        ["Trip costs", formatCurrency(demoLoadResult.totalTripCost)],
        ["Estimated net profit", formatCurrency(demoLoadResult.estimatedNet)],
        ["RPM", formatRpm(demoLoadInput.ratePerMile)],
        ["True RPM", formatRpm(demoLoadResult.trueRpm)],
        ["Profit per mile", formatRpm(demoLoadResult.profitPerTotalMile)],
        ["Profit per hour", formatCurrency(demoLoadResult.profitPerHour)],
        ["Target comparison", `${formatRpm(demoLoadResult.trueRpm)} vs ${formatRpm(demoProfile.minimumTrueRpm)}`],
      ]}
    />
  );
}

function ResultBadge() {
  const strong = demoLoadResult.trueRpm >= demoProfile.minimumTrueRpm;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 md:p-5",
        strong
          ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-50"
          : "border-red-300/25 bg-red-400/10 text-red-50"
      )}
    >
      <BarChart3 className="h-8 w-8" />
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em]">
        Recommendation
      </p>
      <h3 className="mt-2 text-3xl font-black">
        {strong ? "Strong load" : "Renegotiate"}
      </h3>
      <p className="mt-3 text-sm leading-7 opacity-90">
        The load clears the modeled target after deadhead, fuel, overhead, and
        reserves. It still needs real-world judgment before commitment.
      </p>
    </div>
  );
}

function SavedLoadsList({ loads }: { loads: DemoSavedLoad[] }) {
  return (
    <div className="grid max-h-[460px] gap-3 overflow-auto pr-1">
      {loads.map((load) => (
        <div key={load.id} className="rounded-xl border border-slate-800 bg-[#060B14] p-3 md:p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-100">{load.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{load.note}</p>
            </div>
            <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-sky-200">
              {load.status} - {load.date}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            <Metric label="Revenue" value={formatCurrency(load.result.grossRevenue)} />
            <Metric label="True RPM" value={formatRpm(load.result.trueRpm)} />
            <Metric label="Net profit" value={formatCurrency(load.result.estimatedNet)} />
            <Metric label="Status" value={load.status} />
            <Metric label="Compare" value="Ready" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ComparePanel({
  load,
  label,
}: {
  load: DemoSavedLoad;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-3 md:p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
        {label}
      </p>
      <h3 className="mt-2 text-2xl font-black">{load.name}</h3>
      <MetricGrid
        metrics={[
          ["Total miles", formatNumber(load.result.totalMiles)],
          ["Deadhead", `${load.result.deadheadPercent}%`],
          ["Revenue", formatCurrency(load.result.grossRevenue)],
          ["Fuel cost", formatCurrency(load.result.fuelCost)],
          ["Net profit", formatCurrency(load.result.estimatedNet)],
          ["True RPM", formatRpm(load.result.trueRpm)],
          ["Profit / hour", formatCurrency(load.result.profitPerHour)],
        ]}
      />
    </div>
  );
}

function SuccessText({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
      {text}
    </p>
  );
}
