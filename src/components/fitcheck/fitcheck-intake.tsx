"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Save, ShieldCheck } from "lucide-react";

import {
  BIGGEST_PROBLEM_OPTIONS,
  BUSINESS_TYPE_OPTIONS,
  DECISION_FACTOR_OPTIONS,
  ENDORSEMENT_OPTIONS,
  EQUIPMENT_TYPE_OPTIONS,
  FITCHECK_NON_GUARANTEE_DISCLAIMER,
  PRIMARY_BUSINESS_PRIORITY_OPTIONS,
  TOOLTIP_DEFINITIONS,
  calculateFitCheck,
  defaultFitCheckInput,
  formatCurrency,
  formatPercent,
  recommendFitCheckTier,
  type FitCheckInput,
} from "@/lib/fitcheck";
import { COMBINATION_TYPE_OPTIONS } from "@/lib/equipment-profile";
import {
  applyProfileToFitCheckInput,
  buildLoadIqProfileFromInput,
  getLoadIqProfileSnapshot,
  saveLoadIqProfileSnapshot,
} from "@/services/fitcheck-profile";
import { cn } from "@/utils/cn";

const STORAGE_KEY = "loadiq-fitcheck-draft-v1";

const steps = [
  "Business Profile",
  "Revenue History",
  "Miles and Rates",
  "Business Overhead",
  "Operator Income Goal",
  "Load Sourcing",
  "Results",
] as const;

type SaveChoice = "pending" | "save" | "skip";

export function FitCheckIntake() {
  const [input, setInput] = useState<FitCheckInput>(defaultFitCheckInput);
  const [activeStep, setActiveStep] = useState(0);
  const [status, setStatus] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saveChoices, setSaveChoices] = useState<Record<number, SaveChoice>>({});
  const [saveReusableProfile, setSaveReusableProfile] = useState(true);
  const [saveSensitiveFinancials, setSaveSensitiveFinancials] = useState(false);

  const result = useMemo(() => calculateFitCheck(input), [input]);
  const recommendation = useMemo(
    () => recommendFitCheckTier(input, result),
    [input, result]
  );

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      try {
        const profile = await getLoadIqProfileSnapshot();
        const profileDefaults = applyProfileToFitCheckInput(
          defaultFitCheckInput,
          profile
        );
        const draft = window.localStorage.getItem(STORAGE_KEY);
        const nextInput = draft
          ? { ...profileDefaults, ...(JSON.parse(draft) as Partial<FitCheckInput>) }
          : profileDefaults;

        if (!ignore) {
          setInput(nextInput);
          setProfileLoaded(true);
        }
      } catch {
        const draft = window.localStorage.getItem(STORAGE_KEY);
        if (!ignore && draft) {
          setInput({
            ...defaultFitCheckInput,
            ...(JSON.parse(draft) as Partial<FitCheckInput>),
          });
        }
        if (!ignore) setProfileLoaded(true);
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (profileLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
    }
  }, [input, profileLoaded]);

  function update<K extends keyof FitCheckInput>(key: K, value: FitCheckInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function updateNumber<K extends keyof FitCheckInput>(key: K, value: string) {
    const numeric = value === "" ? 0 : Number(value);
    update(key, (Number.isFinite(numeric) ? numeric : 0) as FitCheckInput[K]);
  }

  function updateYearlyRevenue(index: number, value: string) {
    const numeric = value === "" ? 0 : Number(value);
    setInput((current) => {
      const yearlyGrossRevenue = [...current.yearlyGrossRevenue];
      yearlyGrossRevenue[index] = Number.isFinite(numeric) ? numeric : 0;
      return { ...current, yearlyGrossRevenue };
    });
  }

  function toggleArrayValue<K extends "endorsements" | "mainPainPoints">(
    key: K,
    value: string
  ) {
    setInput((current) => {
      const values = new Set(current[key]);
      if (value === "None") {
        return { ...current, [key]: values.has("None") ? [] : ["None"] };
      }
      values.delete("None");
      if (values.has(value)) {
        values.delete(value);
      } else {
        values.add(value);
      }
      return { ...current, [key]: Array.from(values) };
    });
  }

  async function handleSaveProfile() {
    setStatus("Saving selected FitCheck items to Settings...");
    try {
      const profile = saveReusableProfile ? buildLoadIqProfileFromInput(input) : {};
      const saveResult = await saveLoadIqProfileSnapshot(
        profile,
        input,
        result,
        recommendation.recommendedTierId,
        saveSensitiveFinancials
      );
      window.localStorage.removeItem(STORAGE_KEY);
      if (saveResult.warnings.length > 0) {
        setStatus(saveResult.warnings.join(" "));
      } else if (saveResult.settingsHydrationAttempted) {
        setStatus("FitCheck selections saved to the Settings operating profile.");
      } else {
        setStatus("FitCheck result snapshot preferences saved.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save FitCheck settings.");
    }
  }

  function clearDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    setInput(defaultFitCheckInput);
    setStatus("FitCheck draft cleared.");
  }

  const isResultsStep = activeStep === steps.length - 1;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-sky-400/20 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              FitCheck Intake
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-100">
              Operator income is a business obligation, not a guaranteed outcome.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Think of yourself as the operator your business has to pay. After
              the business covers fuel, insurance, equipment, maintenance,
              dispatch, factoring, tolls, software, and other overhead, what
              should the business pay you each month for your work?
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearDraft}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300"
            >
              Clear draft
            </button>
            <Link
              href="/dashboard/settings"
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-200"
            >
              Open Settings
            </Link>
          </div>
        </div>
      </section>

      <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {steps.map((step, index) => (
          <button
            key={step}
            type="button"
            onClick={() => setActiveStep(index)}
            className={cn(
              "rounded-xl border px-3 py-3 text-left text-xs font-black uppercase leading-5 tracking-[0.12em]",
              activeStep === index
                ? "border-sky-400/50 bg-sky-400/10 text-sky-200"
                : "border-slate-800 bg-[#0B1220] text-slate-400"
            )}
          >
            <span className="block text-slate-500">Step {index + 1}</span>
            {step}
          </button>
        ))}
      </nav>

      {!isResultsStep ? (
        <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
          {activeStep === 0 && (
            <Section title="Business Profile">
              <SelectField
                label="Business type"
                value={input.businessType}
                onChange={(value) => update("businessType", value)}
                options={BUSINESS_TYPE_OPTIONS.map((item) => [item.value, item.label] as [string, string])}
              />
              <NumberField
                label="Number of trucks"
                value={input.truckCount}
                min={0}
                onChange={(value) => updateNumber("truckCount", value)}
              />
              <NumberField
                label="Number of trailers"
                value={input.trailerCount}
                min={0}
                onChange={(value) => updateNumber("trailerCount", value)}
              />
              <SelectField
                label="Equipment type"
                value={input.equipmentType}
                onChange={(value) => update("equipmentType", value)}
                options={EQUIPMENT_TYPE_OPTIONS.map((item) => [item, item] as [string, string])}
              />
              <SelectField
                label="Combination type"
                value={input.combinationType}
                onChange={(value) => update("combinationType", value)}
                options={COMBINATION_TYPE_OPTIONS.map((item) => [item, item] as [string, string])}
              />
              <NumberField
                label="Trailer length"
                value={input.trailerLengthFeet}
                min={0}
                step="1"
                help="Feet. Used for fit checks and Atlas equipment context, not permit certification."
                onChange={(value) => updateNumber("trailerLengthFeet", value)}
              />
              <NumberField
                label="Trailer width"
                value={input.trailerWidthInches}
                min={0}
                step="1"
                help="Inches. Example: 102."
                onChange={(value) => updateNumber("trailerWidthInches", value)}
              />
              <NumberField
                label="Trailer height"
                value={input.trailerHeightInches}
                min={0}
                step="1"
                help="Inches. Used for load fit and route-clearance context only."
                onChange={(value) => updateNumber("trailerHeightInches", value)}
              />
              <NumberField
                label="Max payload"
                value={input.maxPayloadLbs}
                min={0}
                step="100"
                help="Pounds. User-entered operating assumption."
                onChange={(value) => updateNumber("maxPayloadLbs", value)}
              />
              <NumberField
                label="GVWR / max gross"
                value={input.grossVehicleWeightRatingLbs}
                min={0}
                step="100"
                help="Pounds. Use your real equipment rating where available."
                onChange={(value) =>
                  updateNumber("grossVehicleWeightRatingLbs", value)
                }
              />
              <NumberField
                label="Axle count"
                value={input.axleCount}
                min={0}
                step="1"
                onChange={(value) => updateNumber("axleCount", value)}
              />
              <BooleanField
                label="Hazmat capable"
                checked={input.hazmatCapable}
                onChange={(checked) => update("hazmatCapable", checked)}
              />
              <BooleanField
                label="Tanker capable"
                checked={input.tankerCapable}
                onChange={(checked) => update("tankerCapable", checked)}
              />
              <BooleanField
                label="Refrigerated capable"
                checked={input.refrigeratedCapable}
                onChange={(checked) => update("refrigeratedCapable", checked)}
              />
              <TextField
                label="Specialized capabilities"
                value={input.specializedCapabilities}
                placeholder="Ramps, tarps, chains, coil racks, oversize..."
                onChange={(value) => update("specializedCapabilities", value)}
              />
              <TextField
                label="Securement equipment"
                value={input.securementEquipment}
                placeholder="Straps, chains, edge protection, dunnage..."
                onChange={(value) => update("securementEquipment", value)}
              />
              <TextField
                label="Route restriction notes"
                value={input.routeRestrictionNotes}
                placeholder="Height concerns, hazmat restrictions, bridge limits..."
                onChange={(value) => update("routeRestrictionNotes", value)}
              />
              <TextField
                label="Authority age"
                value={input.authorityAge}
                placeholder="Example: 2 years, new authority, leased on"
                onChange={(value) => update("authorityAge", value)}
              />
              <TextField
                label="Main operating regions"
                value={input.operatingRegions}
                placeholder="Midwest, Southeast, Texas triangle..."
                onChange={(value) => update("operatingRegions", value)}
              />
              <TextField
                label="Preferred lanes"
                value={input.preferredLanes}
                placeholder="Lanes you prefer to run"
                onChange={(value) => update("preferredLanes", value)}
              />
              <TextField
                label="Lanes to avoid"
                value={input.avoidedLanes}
                placeholder="Markets, cities, or lanes you avoid"
                onChange={(value) => update("avoidedLanes", value)}
              />
              <CheckboxGroup
                label="Endorsements"
                values={ENDORSEMENT_OPTIONS}
                selected={input.endorsements}
                onToggle={(value) => toggleArrayValue("endorsements", value)}
              />
              <SelectField
                label="Home-time priority"
                value={input.homeTimePriority}
                onChange={(value) =>
                  update("homeTimePriority", value as FitCheckInput["homeTimePriority"])
                }
                options={["Low", "Medium", "High"].map((item) => [item, item] as [string, string])}
              />
              <NumberField
                label="Days willing to run per month"
                value={input.daysWillingToRun}
                min={0}
                onChange={(value) => updateNumber("daysWillingToRun", value)}
              />
            </Section>
          )}

          {activeStep === 1 && (
            <Section title="Revenue History">
              <NumberField
                label="Last 12 months gross revenue"
                value={input.last12MonthsGrossRevenue}
                help="Leave 0 if you do not know."
                onChange={(value) => updateNumber("last12MonthsGrossRevenue", value)}
              />
              <NumberField
                label="Average monthly gross revenue"
                value={input.averageMonthlyGrossRevenue}
                onChange={(value) => updateNumber("averageMonthlyGrossRevenue", value)}
              />
              {input.yearlyGrossRevenue.map((value, index) => (
                <NumberField
                  key={index}
                  label={`Optional yearly gross revenue - Year ${index + 1}`}
                  value={value}
                  help="Leave 0 if unknown."
                  onChange={(nextValue) => updateYearlyRevenue(index, nextValue)}
                />
              ))}
              <NumberField
                label="Best month gross"
                value={input.bestMonthGross}
                help="Leave 0 if unknown."
                onChange={(value) => updateNumber("bestMonthGross", value)}
              />
              <NumberField
                label="Worst month gross"
                value={input.worstMonthGross}
                help="Leave 0 if unknown."
                onChange={(value) => updateNumber("worstMonthGross", value)}
              />
            </Section>
          )}

          {activeStep === 2 && (
            <Section title="Miles and Rates">
              <NumberField
                label="Average monthly total miles"
                value={input.totalMiles}
                min={0}
                tooltip={TOOLTIP_DEFINITIONS.allMileRate}
                onChange={(value) => updateNumber("totalMiles", value)}
              />
              <NumberField
                label="Average monthly loaded miles"
                value={input.loadedMiles}
                min={0}
                tooltip={TOOLTIP_DEFINITIONS.loadedMileRate}
                onChange={(value) => updateNumber("loadedMiles", value)}
              />
              <NumberField
                label="Average monthly deadhead miles"
                value={input.deadheadMiles}
                min={0}
                tooltip={TOOLTIP_DEFINITIONS.deadhead}
                onChange={(value) => updateNumber("deadheadMiles", value)}
              />
              <NumberField
                label="Average rate per loaded mile"
                value={input.ratePerLoadedMile}
                step="0.01"
                onChange={(value) => updateNumber("ratePerLoadedMile", value)}
              />
              <ReadOnlyMetric label="Calculated all-mile rate" value={result.allMileRate ? `$${result.allMileRate.toFixed(2)}` : "Unknown"} />
              <NumberField
                label="Average length of haul"
                value={input.averageLengthOfHaul}
                min={0}
                onChange={(value) => updateNumber("averageLengthOfHaul", value)}
              />
              <NumberField
                label="Average loads per month"
                value={input.loadsPerMonth}
                min={0}
                onChange={(value) => updateNumber("loadsPerMonth", value)}
              />
            </Section>
          )}

          {activeStep === 3 && (
            <Section title="Business Overhead">
              <NumberField
                label="Fuel monthly cost"
                value={input.fuelMonthlyCost}
                tooltip={TOOLTIP_DEFINITIONS.businessOverhead}
                onChange={(value) => updateNumber("fuelMonthlyCost", value)}
              />
              <NumberField
                label="Fuel cost per mile"
                value={input.fuelCostPerMile}
                step="0.01"
                help="Used if monthly fuel cost is unknown."
                onChange={(value) => updateNumber("fuelCostPerMile", value)}
              />
              <NumberField label="Insurance monthly cost" value={input.insuranceMonthlyCost} onChange={(value) => updateNumber("insuranceMonthlyCost", value)} />
              <NumberField label="Truck payment" value={input.truckPayment} onChange={(value) => updateNumber("truckPayment", value)} />
              <NumberField label="Trailer payment/rental" value={input.trailerPayment} onChange={(value) => updateNumber("trailerPayment", value)} />
              <NumberField label="Maintenance reserve" value={input.maintenanceReserve} onChange={(value) => updateNumber("maintenanceReserve", value)} />
              <NumberField label="Factoring percentage" value={input.factoringPercent} min={0} max={100} step="0.01" onChange={(value) => updateNumber("factoringPercent", value)} />
              <NumberField label="Factoring monthly cost" value={input.factoringMonthlyCost} onChange={(value) => updateNumber("factoringMonthlyCost", value)} />
              <NumberField label="Dispatch fee percentage" value={input.dispatchFeePercent} min={0} max={100} step="0.01" onChange={(value) => updateNumber("dispatchFeePercent", value)} />
              <NumberField label="Dispatch monthly cost" value={input.dispatchMonthlyCost} onChange={(value) => updateNumber("dispatchMonthlyCost", value)} />
              <NumberField label="Tolls/permits" value={input.tollsPermits} onChange={(value) => updateNumber("tollsPermits", value)} />
              <NumberField label="ELD/software" value={input.eldSoftware} onChange={(value) => updateNumber("eldSoftware", value)} />
              <NumberField label="Payroll/driver pay if fleet" value={input.payrollDriverPay} onChange={(value) => updateNumber("payrollDriverPay", value)} />
              <NumberField label="Other fixed overhead" value={input.otherFixedOverhead} onChange={(value) => updateNumber("otherFixedOverhead", value)} />
              <NumberField
                label="Known total monthly business overhead"
                value={input.monthlyBusinessOverhead}
                help="Optional override. If set, this is used instead of summing the overhead fields."
                onChange={(value) => updateNumber("monthlyBusinessOverhead", value)}
              />
            </Section>
          )}

          {activeStep === 4 && (
            <Section title="Operator Income Goal">
              <NumberField
                label="Current monthly operator income"
                value={input.currentOperatorIncome}
                tooltip={TOOLTIP_DEFINITIONS.operatorIncome}
                onChange={(value) => updateNumber("currentOperatorIncome", value)}
              />
              <NumberField
                label="Minimum monthly operator income needed"
                value={input.minimumOperatorIncome}
                onChange={(value) => updateNumber("minimumOperatorIncome", value)}
              />
              <NumberField
                label="Target monthly operator income"
                value={input.targetOperatorIncome}
                onChange={(value) => updateNumber("targetOperatorIncome", value)}
              />
              <NumberField
                label="Ideal monthly operator income"
                value={input.idealOperatorIncome}
                onChange={(value) => updateNumber("idealOperatorIncome", value)}
              />
              <NumberField
                label="Desired monthly business cushion after paying operator"
                value={input.desiredBusinessCushion}
                tooltip={TOOLTIP_DEFINITIONS.businessCushion}
                onChange={(value) => updateNumber("desiredBusinessCushion", value)}
              />
              <SelectField
                label="Primary business priority"
                value={input.primaryBusinessPriority}
                onChange={(value) => update("primaryBusinessPriority", value)}
                options={PRIMARY_BUSINESS_PRIORITY_OPTIONS.map((item) => [item, item] as [string, string])}
              />
            </Section>
          )}

          {activeStep === 5 && (
            <Section title="Load Sourcing and Behavior">
              <TextField label="Current load sources" value={input.currentLoadSources} placeholder="Load boards, dispatcher, brokers, direct customers..." onChange={(value) => update("currentLoadSources", value)} />
              <TextField label="Load boards used" value={input.loadBoardsUsed} placeholder="DAT, Truckstop, 123Loadboard..." onChange={(value) => update("loadBoardsUsed", value)} />
              <SelectField label="Dispatcher used" value={input.usesDispatcher} onChange={(value) => update("usesDispatcher", value as FitCheckInput["usesDispatcher"])} options={[["unknown", "I do not know / not sure"], ["yes", "Yes"], ["no", "No"]]} />
              <SelectField label="Broker relationships" value={input.brokerRelationshipLevel} onChange={(value) => update("brokerRelationshipLevel", value as FitCheckInput["brokerRelationshipLevel"])} options={[["", "I do not know / not sure"], ["None", "None"], ["Some", "Some"], ["Strong", "Strong"]]} />
              <SelectField label="Direct customers" value={input.hasDirectCustomers} onChange={(value) => update("hasDirectCustomers", value as FitCheckInput["hasDirectCustomers"])} options={[["unknown", "I do not know / not sure"], ["yes", "Yes"], ["no", "No"]]} />
              <NumberField label="Time spent searching for loads per day" value={input.timeSearchingLoadsPerDay} min={0} step="0.25" onChange={(value) => updateNumber("timeSearchingLoadsPerDay", value)} />
              <TextField label="How often do you negotiate rates?" value={input.negotiationFrequency} placeholder="Never, sometimes, most loads..." onChange={(value) => update("negotiationFrequency", value)} />
              <SelectField label="Main decision factor when choosing loads" value={input.preferredDecisionFactor} onChange={(value) => update("preferredDecisionFactor", value)} options={[["", "I do not know / not sure"], ...DECISION_FACTOR_OPTIONS.map((item) => [item, item] as [string, string])]} />
              <SelectField label="Biggest current problem" value={input.biggestCurrentProblem} onChange={(value) => update("biggestCurrentProblem", value)} options={[["", "I do not know / not sure"], ...BIGGEST_PROBLEM_OPTIONS.map((item) => [item, item] as [string, string])]} />
              <CheckboxGroup label="Main pain points" values={BIGGEST_PROBLEM_OPTIONS} selected={input.mainPainPoints} onToggle={(value) => toggleArrayValue("mainPainPoints", value)} />
            </Section>
          )}

          <SavePrompt
            choice={saveChoices[activeStep] ?? "pending"}
            onChoice={(choice) =>
              setSaveChoices((current) => ({ ...current, [activeStep]: choice }))
            }
          />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveStep(Math.max(activeStep - 1, 0))}
              className="rounded-xl border border-slate-700 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-300"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(Math.min(activeStep + 1, steps.length - 1))}
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-200"
            >
              {activeStep === 5 ? "Calculate FitCheck" : "Next section"}
            </button>
          </div>
        </section>
      ) : (
        <FitCheckResults
          input={input}
          result={result}
          recommendation={recommendation}
          saveReusableProfile={saveReusableProfile}
          saveSensitiveFinancials={saveSensitiveFinancials}
          status={status}
          onSaveReusableProfile={setSaveReusableProfile}
          onSaveSensitiveFinancials={setSaveSensitiveFinancials}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xl font-black text-slate-100">{title}</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function FitCheckResults({
  input,
  result,
  recommendation,
  saveReusableProfile,
  saveSensitiveFinancials,
  status,
  onSaveReusableProfile,
  onSaveSensitiveFinancials,
  onSaveProfile,
}: {
  input: FitCheckInput;
  result: ReturnType<typeof calculateFitCheck>;
  recommendation: ReturnType<typeof recommendFitCheckTier>;
  saveReusableProfile: boolean;
  saveSensitiveFinancials: boolean;
  status: string;
  onSaveReusableProfile: (value: boolean) => void;
  onSaveSensitiveFinancials: (value: boolean) => void;
  onSaveProfile: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <ResultCard
          title="Current Business Baseline"
          rows={[
            ["Monthly gross", formatCurrency(result.monthlyGrossRevenue)],
            ["Monthly overhead", formatCurrency(result.monthlyOverhead)],
            ["Available before operator income", formatCurrency(result.availableBeforeOperator)],
            ["Current operator income", formatCurrency(input.currentOperatorIncome)],
            ["Estimated remaining business cushion", formatCurrency(result.remainingBusinessCushion)],
          ]}
        />
        <ResultCard
          title="Operator Income Target"
          rows={[
            ["Minimum operator income", formatCurrency(input.minimumOperatorIncome)],
            ["Target operator income", formatCurrency(input.targetOperatorIncome)],
            ["Ideal operator income", formatCurrency(input.idealOperatorIncome)],
            ["Desired business cushion", formatCurrency(input.desiredBusinessCushion)],
            ["Gap to target", formatCurrency(result.operatorIncomeGap)],
          ]}
        />
        <ResultCard
          title="Miles and Rates"
          rows={[
            ["Deadhead percent", formatPercent(result.deadheadPercent)],
            ["Loaded-mile rate", result.loadedMileRate ? `$${result.loadedMileRate.toFixed(2)}` : "Unknown"],
            ["All-mile rate", result.allMileRate ? `$${result.allMileRate.toFixed(2)}` : "Unknown"],
            ["Target remaining cushion", formatCurrency(result.targetRemainingCushion)],
            ["Business health gap", formatCurrency(result.businessHealthGap)],
          ]}
        />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
        <h3 className="text-2xl font-black text-slate-100">
          Operational Pressure Points
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {result.pressurePoints.map((point) => (
            <div
              key={point}
              className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100"
            >
              <AlertTriangle className="mb-2 h-4 w-4" aria-hidden="true" />
              {point}
            </div>
          ))}
          {result.pressurePoints.length === 0 && (
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 className="mb-2 h-4 w-4" aria-hidden="true" />
              No major pressure point was detected from the current intake data.
            </div>
          )}
        </div>
        {result.warnings.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            {result.warnings.map((warning) => (
              <div key={warning}>{warning}</div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-sky-400/20 bg-[#0B1220]/95 p-5">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
          Tier Recommendation
        </p>
        <h3 className="mt-2 text-3xl font-black text-slate-100">
          {recommendation.recommendedTierName} - {recommendation.decisionSupportDepth}
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          LoadIQ recommends the lowest tier that appears reasonably aligned with
          your current operation, target operator income, and identifiable
          improvement opportunities.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoPanel title="Why this tier was recommended" items={recommendation.whyRecommended} />
          <InfoPanel
            title="Why a lower tier may not be enough"
            items={[recommendation.whyLowerMayNotBeEnough]}
          />
          <InfoPanel
            title="Why a higher tier may not be necessary"
            items={[recommendation.whyHigherMayNotBeNecessary]}
          />
          <InfoPanel title="Break-even context" items={[recommendation.breakEvenContext]} />
        </div>
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          {recommendation.disclaimer}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
        <h3 className="text-2xl font-black text-slate-100">
          Review items to save to profile.
        </h3>
        <div className="mt-4 grid gap-3">
          <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={saveReusableProfile}
              onChange={(event) => onSaveReusableProfile(event.target.checked)}
              className="mt-1"
            />
            <span>
              Save reusable Business Profile, Operator Income Goals, Operating
              Assumptions, and Load Preferences to the Settings operating
              profile, including supported overhead and vehicle context.
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-100">
            <input
              type="checkbox"
              checked={saveSensitiveFinancials}
              onChange={(event) => onSaveSensitiveFinancials(event.target.checked)}
              className="mt-1"
            />
            <span>
              These financial details can improve future LoadIQ recommendations.
              Save them to your profile? Sensitive financial fields are
              unchecked by default.
            </span>
          </label>
        </div>
        <button
          type="button"
          onClick={onSaveProfile}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-emerald-100"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Save selected profile items
        </button>
        {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
      </section>

      <section className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm leading-6 text-red-100">
        <ShieldCheck className="mb-2 h-5 w-5" aria-hidden="true" />
        {FITCHECK_NON_GUARANTEE_DISCLAIMER}
      </section>
    </div>
  );
}

function ResultCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
      <h3 className="text-xl font-black text-slate-100">{title}</h3>
      <div className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-slate-800 pb-2 text-sm">
            <span className="text-slate-400">{label}</span>
            <strong className="text-right text-slate-100">{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <h4 className="text-sm font-black uppercase tracking-[0.16em] text-sky-300">
        {title}
      </h4>
      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  );
}

function SavePrompt({
  choice,
  onChoice,
}: {
  choice: SaveChoice;
  onChoice: (choice: SaveChoice) => void;
}) {
  return (
    <div className="mt-6 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
      <p className="text-sm font-black text-sky-100">
        Save these answers to Settings for future recommendations?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ["save", "Save"],
          ["skip", "Don't save"],
          ["pending", "Edit before saving"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChoice(value as SaveChoice)}
            className={cn(
              "rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.14em]",
              choice === value
                ? "border-sky-400/50 bg-sky-400/15 text-sky-100"
                : "border-slate-700 text-slate-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TooltipLabel({
  label,
  tooltip,
}: {
  label: string;
  tooltip?: string;
}) {
  return (
    <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
      {label}
      {tooltip && (
        <span title={tooltip} className="inline-flex text-sky-300">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </span>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = "0.01",
  help,
  tooltip,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
  help?: string;
  tooltip?: string;
}) {
  return (
    <label className="block">
      <TooltipLabel label={label} tooltip={tooltip} />
      <input
        type="number"
        value={value || ""}
        min={min}
        max={max}
        step={step}
        placeholder="I don't know"
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-slate-100 outline-none focus:border-sky-400/50"
      />
      {help && <p className="mt-2 text-xs leading-5 text-slate-500">{help}</p>}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <TooltipLabel label={label} />
      <input
        value={value}
        placeholder={placeholder ?? "I don't know"}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/50"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <TooltipLabel label={label} />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-slate-100 outline-none focus:border-sky-400/50"
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue} className="bg-[#060B14]">
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-sm font-semibold text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-sky-400"
      />
      {label}
    </label>
  );
}

function CheckboxGroup({
  label,
  values,
  selected,
  onToggle,
}: {
  label: string;
  values: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <TooltipLabel label={label} />
      <div className="grid gap-2 rounded-xl border border-slate-800 bg-[#060B14] p-3 sm:grid-cols-2">
        {values.map((value) => (
          <label key={value} className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            {value}
          </label>
        ))}
      </div>
    </div>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-100">{value}</p>
    </div>
  );
}
