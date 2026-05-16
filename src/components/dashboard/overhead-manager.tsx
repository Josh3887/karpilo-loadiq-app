"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";

import {
  calculateCpmExposure,
  calculateOverheadBreakdown,
  calculatePercentDeductions,
  calculateWeeklyOverhead,
  createOverheadItem,
  deleteOverheadItem,
  getOverheadItemsWithSubscriptionExpense,
  OverheadAmountType,
  OverheadFrequency,
  OverheadItem,
  OverheadResponsibility,
} from "@/services/overhead-items";
import { getOperationalProfile } from "@/services/operational-profile";
import { ThemedSelect } from "@/components/ui/themed-select";
import { LearnMore } from "@/components/ui/learn-more";
import { usePreviewMode } from "@/components/preview/preview-mode-provider";
import { EDUCATION_TOPICS, OVERHEAD_CATEGORY_HELP } from "@/config/education";
import { GOLD_ACCESS } from "@/config/pricing";
import { formatCurrency } from "@/utils/format";

const defaultForm = {
  label: "",
  category: "fixed_operations",
  amount: 0,
  amount_type: "flat" as OverheadAmountType,
  frequency: "monthly" as OverheadFrequency,
  responsibility: "driver" as OverheadResponsibility,
  is_active: true,
};

const previewItems: OverheadItem[] = [
  {
    id: "preview-loadiq-subscription",
    user_id: "preview",
    label: "Karpilo LoadIQ subscription",
    category: "software_subscription",
    amount: GOLD_ACCESS.monthlyPrice,
    amount_type: "flat",
    frequency: "monthly",
    responsibility: "driver",
    is_active: true,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    system_generated: true,
  },
  {
    id: "preview-insurance",
    user_id: "preview",
    label: "Insurance allocation",
    category: "fixed_operations",
    amount: 1200,
    amount_type: "flat",
    frequency: "monthly",
    responsibility: "driver",
    is_active: true,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  },
];

export function OverheadManager() {
  const preview = usePreviewMode();
  const [items, setItems] = useState<OverheadItem[]>([]);
  const [operatingDaysPerWeek, setOperatingDaysPerWeek] = useState(5.5);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(defaultForm);

  const loadItems = useCallback(async () => {
    if (preview.enabled) {
      setItems(previewItems);
      setOperatingDaysPerWeek(5.5);
      return;
    }

    try {
      const data = await getOverheadItemsWithSubscriptionExpense();
      setItems(data);
      const profile = await getOperationalProfile().catch(() => null);
      setOperatingDaysPerWeek(profile?.profile.operatingDaysPerWeek ?? 5.5);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load overhead items.");
    }
  }, [preview.enabled]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleCreateItem() {
    if (preview.enabled) {
      preview.explain("overhead-item");
      return;
    }

    try {
      setStatus("Saving overhead item...");
      await createOverheadItem(form);
      setForm(defaultForm);
      await loadItems();
      setStatus("Overhead item saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save overhead item.");
    }
  }

  async function handleDeleteItem(id: string) {
    if (preview.enabled) {
      preview.explain("overhead-delete");
      return;
    }

    try {
      await deleteOverheadItem(id);
      await loadItems();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete overhead item.");
    }
  }

  const weeklyOverhead = calculateWeeklyOverhead(items);
  const overheadBreakdown = calculateOverheadBreakdown(
    items,
    operatingDaysPerWeek
  );
  const cpmExposure = calculateCpmExposure(items);
  const percentDeductions = calculatePercentDeductions(items);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Weekly Operational Burn" value={formatCurrency(weeklyOverhead)} />
        <SummaryCard label="CPM Exposure" value={`${formatCurrency(cpmExposure)}/mi`} />
        <SummaryCard label="Percent Deductions" value={`${percentDeductions.toFixed(2)}%`} />
      </div>

      <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#060B14] p-5">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
            Overhead Breakdown
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Daily overhead is used to calculate how much fixed business cost
            should be assigned to each load based on how many days that load
            occupies your truck. Active Karpilo LoadIQ subscription pricing is
            included as a system operating expense for accuracy.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            label="Annual Fixed"
            value={formatCurrency(overheadBreakdown.annual)}
          />
          <SummaryCard
            label="Monthly Fixed"
            value={formatCurrency(overheadBreakdown.monthly)}
          />
          <SummaryCard
            label="Weekly Fixed"
            value={formatCurrency(overheadBreakdown.weekly)}
          />
          <SummaryCard
            label="Daily Fixed"
            value={formatCurrency(overheadBreakdown.daily)}
          />
        </div>

        <div className="grid gap-3 text-xs leading-5 text-slate-400 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4">
            Operating days per week:{" "}
            <span className="font-black text-slate-100">
              {overheadBreakdown.operatingDaysPerWeek}
            </span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4">
            Operating days per month:{" "}
            <span className="font-black text-slate-100">
              {overheadBreakdown.operatingDaysPerMonth}
            </span>
          </div>
        </div>

        <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
          In the calculator, fixed overhead is applied as daily fixed overhead ×
          dispatch days. A three-day load carries three days of overhead, not
          the entire monthly burden.
        </p>
      </section>

      <LearnMore {...EDUCATION_TOPICS.overhead} />

      <div className="grid gap-3 md:grid-cols-2">
        {Object.entries(OVERHEAD_CATEGORY_HELP).map(([key, value]) => (
          <div
            key={key}
            className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-5 text-slate-400"
          >
            <span className="font-bold uppercase tracking-[0.16em] text-sky-300">
              {key.replace(/([A-Z])/g, " $1")}
            </span>
            <span className="mt-2 block">{value}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <InputField
          label="Label"
          value={form.label}
          onChange={(value) => setForm((prev) => ({ ...prev, label: value }))}
        />

        <InputField
          label="Amount"
          type="number"
          value={String(form.amount)}
          onChange={(value) => setForm((prev) => ({ ...prev, amount: Number(value) }))}
        />

        <SelectField
          label="Amount Type"
          value={form.amount_type}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              amount_type: value as OverheadAmountType,
              frequency: value === "cpm" ? "by_mile" : value === "percent" ? "none" : "monthly",
            }))
          }
          options={[
            { label: "Flat", value: "flat" },
            { label: "CPM", value: "cpm" },
            { label: "Percent", value: "percent" },
          ]}
        />

        <SelectField
          label="Frequency"
          value={form.frequency}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              frequency: value as OverheadFrequency,
            }))
          }
          options={[
            { label: "By Mile", value: "by_mile" },
            { label: "By Day", value: "by_day" },
            { label: "Weekly", value: "weekly" },
            { label: "Monthly", value: "monthly" },
            { label: "Quarterly", value: "quarterly" },
            { label: "Annual", value: "annual" },
            { label: "Per Trip", value: "per_trip" },
            { label: "None", value: "none" },
          ]}
        />

        <SelectField
          label="Category"
          value={form.category}
          onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
          options={[
            { label: "Fixed Operations", value: "fixed_operations" },
            { label: "Compliance", value: "compliance" },
            { label: "Services", value: "services" },
            { label: "Reserve", value: "reserve" },
            { label: "Trip Specific", value: "trip_specific" },
          ]}
        />

        <SelectField
          label="Responsibility"
          value={form.responsibility}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              responsibility: value as OverheadResponsibility,
            }))
          }
          options={[
            { label: "Driver", value: "driver" },
            { label: "Carrier", value: "carrier" },
            { label: "Split", value: "split" },
            { label: "Reimbursed", value: "reimbursed" },
          ]}
        />
      </div>

      <button
        type="button"
        onClick={handleCreateItem}
        className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
      >
        Add Overhead Item
      </button>

      {status && <div className="text-sm text-slate-400">{status}</div>}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#060B14] p-4"
          >
            <div>
              <div className="font-semibold text-slate-100">{item.label}</div>
              <div className="mt-1 text-sm text-slate-400">
            {formatCurrency(Number(item.amount))} • {item.amount_type} • {item.frequency} • {item.responsibility}
              </div>
              {item.amount_type === "flat" && item.responsibility === "driver" && (
                <div className="mt-1 text-xs text-slate-500">
                  Monthly equivalent:{" "}
                  {formatCurrency(
                    calculateOverheadBreakdown([item], operatingDaysPerWeek)
                      .monthly
                  )}{" "}
                  • Daily equivalent:{" "}
                  {formatCurrency(
                    calculateOverheadBreakdown([item], operatingDaysPerWeek)
                      .daily
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleDeleteItem(item.id)}
              disabled={item.system_generated}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300 hover:bg-red-500/20"
            >
              {item.system_generated ? "System" : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      data-preview-explain="overhead-item"
      className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5"
    >
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">{label}</div>
      <div className="mt-3 text-3xl font-black text-slate-100">{value}</div>
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
        data-preview-explain="overhead-item"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none focus:border-sky-400"
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
  options: { label: string; value: string }[];
}) {
  return (
    <ThemedSelect
      label={label}
      value={value}
      previewExplanation="overhead-item"
      onChange={onChange}
      options={options}
    />
  );
}
