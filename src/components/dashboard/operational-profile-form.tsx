"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

import {
  createPayTemplate,
  defaultOperationalProfile,
  deriveIncomeTargets,
  getOperationalProfile,
  OperationalProfile,
  PayTemplate,
  saveOperationalProfile,
} from "@/services/operational-profile";
import { ThemedSelect } from "@/components/ui/themed-select";
import { LearnMore } from "@/components/ui/learn-more";
import { EDUCATION_TOPICS } from "@/config/education";
import { PayStructure } from "@/types/load";
import { formatCurrency } from "@/utils/format";

const defaultPayForm = {
  name: "88% gross",
  type: "percentage" as PayStructure["type"],
  primaryPercent: 88,
  nestedPercent: 100,
  cpmRate: 0,
  flatAmount: 0,
  dailyRate: 0,
  isDefault: true,
};

export function OperationalProfileForm() {
  const [profile, setProfile] = useState<OperationalProfile>(
    defaultOperationalProfile
  );
  const [payTemplates, setPayTemplates] = useState<PayTemplate[]>([]);
  const [payForm, setPayForm] = useState(defaultPayForm);
  const [status, setStatus] = useState("");

  async function loadProfile() {
    try {
      const data = await getOperationalProfile();
      setProfile(data.profile);
      setPayTemplates(data.payTemplates);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to load operational profile."
      );
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSaveProfile() {
    try {
      setStatus("Saving profile...");
      await saveOperationalProfile(profile);
      setStatus("Operational profile saved.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save operational profile."
      );
    }
  }

  async function handleCreatePayTemplate() {
    try {
      setStatus("Saving pay template...");
      const structure: PayStructure = {
        type: payForm.type,
        label: payForm.name,
        percentageChain:
          payForm.type === "percentage"
            ? [payForm.nestedPercent, payForm.primaryPercent]
            : [100],
        cpmRate: payForm.cpmRate,
        flatAmount: payForm.flatAmount,
        dailyRate: payForm.dailyRate,
        includeFuelSurcharge: payForm.type === "percentage",
        includeAccessorials: payForm.type === "percentage",
      };

      await createPayTemplate(payForm.name, structure, payForm.isDefault);
      await loadProfile();
      setStatus("Pay template saved.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to save pay template."
      );
    }
  }

  const targets = deriveIncomeTargets(
    profile.incomeTargetAmount,
    profile.incomeTargetPeriod
  );

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <SectionTitle title="Driver Profile" />

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Profile Name"
            value={profile.profileName}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, profileName: value }))
            }
          />

          <InputField
            label="Company Name"
            value={profile.companyName}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, companyName: value }))
            }
          />

          <SelectField
            label="Operation Type"
            value={profile.operationType}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                operationType: value as OperationalProfile["operationType"],
              }))
            }
            options={[
              ["local", "Local"],
              ["regional", "Regional"],
              ["dedicated", "Dedicated"],
              ["otr", "OTR"],
            ]}
          />
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle title="Target Profitability" />
        <div className="grid gap-4 md:grid-cols-3">
          <LearnMore {...EDUCATION_TOPICS.trueRpm} />
          <LearnMore {...EDUCATION_TOPICS.breakEvenRpm} />
          <LearnMore {...EDUCATION_TOPICS.targetMargins} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Income Target"
            type="number"
            value={String(profile.incomeTargetAmount)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                incomeTargetAmount: Number(value),
              }))
            }
          />

          <SelectField
            label="Target Period"
            value={profile.incomeTargetPeriod}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                incomeTargetPeriod:
                  value as OperationalProfile["incomeTargetPeriod"],
              }))
            }
            options={[
              ["yearly", "Yearly"],
              ["monthly", "Monthly"],
              ["weekly", "Weekly"],
            ]}
          />

          <InputField
            label="Minimum True RPM"
            type="number"
            value={String(profile.minimumTrueRpm)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                minimumTrueRpm: Number(value),
              }))
            }
          />

          <InputField
            label="Minimum Hourly Profit"
            type="number"
            value={String(profile.minimumHourlyProfitability)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                minimumHourlyProfitability: Number(value),
              }))
            }
          />

          <InputField
            label="Operating Days / Week"
            type="number"
            value={String(profile.operatingDaysPerWeek)}
            onChange={(value) =>
              setProfile((prev) => {
                const operatingDaysPerWeek = Number(value);
                return {
                  ...prev,
                  operatingDaysPerWeek,
                  operatingDaysPerMonth: Number(
                    (operatingDaysPerWeek * 4.33).toFixed(2)
                  ),
                };
              })
            }
          />

          <InputField
            label="Operating Days / Month"
            type="number"
            value={String(profile.operatingDaysPerMonth)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                operatingDaysPerMonth: Number(value),
              }))
            }
          />

          <InputField
            label="Target Profit Margin %"
            type="number"
            value={String(profile.targetProfitMargin)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                targetProfitMargin: Number(value),
              }))
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Yearly" value={formatCurrency(targets.yearly)} />
          <SummaryCard label="Monthly" value={formatCurrency(targets.monthly)} />
          <SummaryCard label="Weekly" value={formatCurrency(targets.weekly)} />
          <SummaryCard label="Daily" value={formatCurrency(targets.daily)} />
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle title="Truck Profile" />

        <div className="grid gap-5 md:grid-cols-3">
          <InputField
            label="Make"
            value={profile.truckMake}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, truckMake: value }))
            }
          />
          <InputField
            label="Model"
            value={profile.truckModel}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, truckModel: value }))
            }
          />
          <InputField
            label="Year"
            type="number"
            value={String(profile.truckYear)}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, truckYear: Number(value) }))
            }
          />
          <InputField
            label="Engine"
            value={profile.truckEngine}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, truckEngine: value }))
            }
          />
          <InputField
            label="Odometer"
            type="number"
            value={String(profile.truckOdometer)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                truckOdometer: Number(value),
              }))
            }
          />
          <InputField
            label="Default MPG"
            type="number"
            value={String(profile.defaultMpg)}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, defaultMpg: Number(value) }))
            }
          />
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle title="Default Cost Assumptions" />

        <div className="grid gap-5 md:grid-cols-3">
          <InputField
            label="Maintenance Reserve"
            type="number"
            value={String(profile.defaultMaintenanceReserve)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultMaintenanceReserve: Number(value),
              }))
            }
          />
          <InputField
            label="Tire Reserve"
            type="number"
            value={String(profile.defaultTireReserve)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultTireReserve: Number(value),
              }))
            }
          />
          <InputField
            label="Variable CPM"
            type="number"
            value={String(profile.defaultVariableCostPerMile)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultVariableCostPerMile: Number(value),
              }))
            }
          />
          <InputField
            label="Trailer Fee"
            type="number"
            value={String(profile.defaultTrailerFee)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultTrailerFee: Number(value),
              }))
            }
          />
          <InputField
            label="Insurance Allocation"
            type="number"
            value={String(profile.defaultInsuranceAllocation)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultInsuranceAllocation: Number(value),
              }))
            }
          />
          <InputField
            label="Dispatch %"
            type="number"
            value={String(profile.defaultDispatchPercent)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultDispatchPercent: Number(value),
              }))
            }
          />
          <InputField
            label="Factoring %"
            type="number"
            value={String(profile.defaultFactoringPercent)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultFactoringPercent: Number(value),
              }))
            }
          />
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Save Profile
        </button>
      </section>

      <section className="space-y-5">
        <SectionTitle title="Pay Templates" />
        <LearnMore {...EDUCATION_TOPICS.payStructures} />

        <div className="grid gap-5 md:grid-cols-3">
          <InputField
            label="Template Name"
            value={payForm.name}
            onChange={(value) =>
              setPayForm((prev) => ({ ...prev, name: value }))
            }
          />
          <SelectField
            label="Pay Type"
            value={payForm.type}
            onChange={(value) =>
              setPayForm((prev) => ({
                ...prev,
                type: value as PayStructure["type"],
              }))
            }
            options={[
              ["percentage", "Percentage"],
              ["flat", "Flat Rate"],
              ["cpm", "CPM"],
            ]}
          />
          {payForm.type === "percentage" && (
            <>
              <InputField
                label="Primary %"
                type="number"
                value={String(payForm.primaryPercent)}
                onChange={(value) =>
                  setPayForm((prev) => ({
                    ...prev,
                    primaryPercent: Number(value),
                  }))
                }
              />
              <InputField
                label="Nested %"
                type="number"
                value={String(payForm.nestedPercent)}
                onChange={(value) =>
                  setPayForm((prev) => ({
                    ...prev,
                    nestedPercent: Number(value),
                  }))
                }
              />
            </>
          )}
          {payForm.type === "flat" && (
            <InputField
              label="Flat Amount"
              type="number"
              value={String(payForm.flatAmount)}
              onChange={(value) =>
                setPayForm((prev) => ({
                  ...prev,
                  flatAmount: Number(value),
                }))
              }
            />
          )}
          {payForm.type === "cpm" && (
            <InputField
              label="CPM"
              type="number"
              value={String(payForm.cpmRate)}
              onChange={(value) =>
                setPayForm((prev) => ({ ...prev, cpmRate: Number(value) }))
              }
            />
          )}
        </div>

        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-800 bg-[#060B14] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
          <input
            type="checkbox"
            checked={payForm.isDefault}
            onChange={(event) =>
              setPayForm((prev) => ({
                ...prev,
                isDefault: event.target.checked,
              }))
            }
            className="h-4 w-4 accent-sky-400"
          />
          Set As Default
        </label>

        <button
          type="button"
          onClick={handleCreatePayTemplate}
          className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Save Pay Template
        </button>

        <div className="space-y-3">
          {payTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
            >
              <div className="font-semibold text-slate-100">
                {template.name}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {template.structure.type}{" "}
                {template.is_default ? "• default" : ""}
              </div>
            </div>
          ))}
        </div>
      </section>

      {status && <p className="text-sm text-slate-400">{status}</p>}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-800 pb-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
      {title}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-slate-100">{value}</div>
    </div>
  );
}

function InputField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        type={type}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <ThemedSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options.map(([optionValue, optionLabel]) => ({
        value: optionValue,
        label: optionLabel,
      }))}
    />
  );
}
