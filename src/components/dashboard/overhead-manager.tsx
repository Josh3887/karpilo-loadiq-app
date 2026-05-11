"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

import {
  calculateCpmExposure,
  calculatePercentDeductions,
  calculateWeeklyOverhead,
  createOverheadItem,
  deleteOverheadItem,
  getOverheadItems,
  OverheadAmountType,
  OverheadFrequency,
  OverheadItem,
  OverheadResponsibility,
} from "@/services/overhead-items";
import { ThemedSelect } from "@/components/ui/themed-select";
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

export function OverheadManager() {
  const [items, setItems] = useState<OverheadItem[]>([]);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(defaultForm);

  async function loadItems() {
    try {
      const data = await getOverheadItems();
      setItems(data);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to load overhead items.");
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleCreateItem() {
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
    try {
      await deleteOverheadItem(id);
      await loadItems();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete overhead item.");
    }
  }

  const weeklyOverhead = calculateWeeklyOverhead(items);
  const cpmExposure = calculateCpmExposure(items);
  const percentDeductions = calculatePercentDeductions(items);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Weekly Operational Burn" value={formatCurrency(weeklyOverhead)} />
        <SummaryCard label="CPM Exposure" value={`${formatCurrency(cpmExposure)}/mi`} />
        <SummaryCard label="Percent Deductions" value={`${percentDeductions.toFixed(2)}%`} />
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
            </div>

            <button
              type="button"
              onClick={() => handleDeleteItem(item.id)}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300 hover:bg-red-500/20"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5">
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
      onChange={onChange}
      options={options}
    />
  );
}
