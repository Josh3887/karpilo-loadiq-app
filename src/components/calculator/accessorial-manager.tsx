"use client";

import { useState } from "react";

import {
  AccessorialCategory,
  AccessorialDirection,
  AccessorialInputItem,
} from "@/types/accessorial";
import { ThemedSelect } from "@/components/ui/themed-select";
import { formatCurrency } from "@/utils/format";

const defaultItem = {
  category: "misc" as AccessorialCategory,
  direction: "expense" as AccessorialDirection,
  amount: 0,
  isReimbursed: false,
  notes: "",
};

type AccessorialManagerProps = {
  items: AccessorialInputItem[];
  onChange: (
    items: AccessorialInputItem[]
  ) => void;
};

export function AccessorialManager({
  items,
  onChange,
}: AccessorialManagerProps) {

  const [form, setForm] = useState(defaultItem);

  function addItem() {
    onChange([
      ...items,
      {
        id: crypto.randomUUID(),
        ...form,
      },
    ]);

    setForm(defaultItem);
  }

  function removeItem(id: string) {
    onChange(
      items.filter((item) => item.id !== id)
    );
  }

  const revenueTotal = items
    .filter((item) => item.direction === "revenue")
    .reduce((total, item) => total + Number(item.amount), 0);

  const expenseTotal = items
    .filter((item) => item.direction === "expense")
    .reduce((total, item) => total + Number(item.amount), 0);

  const reimbursedTotal = items
    .filter((item) => item.isReimbursed)
    .reduce((total, item) => total + Number(item.amount), 0);

  return (
    <section className="space-y-4">
      <div className="border-b border-slate-800 pb-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
        Accessorial Items
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Summary label="Revenue" value={formatCurrency(revenueTotal)} />
        <Summary label="Expense" value={formatCurrency(expenseTotal)} />
        <Summary label="Reimbursed" value={formatCurrency(reimbursedTotal)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label="Category"
          value={form.category}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              category: value as AccessorialCategory,
            }))
          }
          options={[
            ["toll", "Toll"],
            ["lumper", "Lumper"],
            ["scale", "CAT Scale"],
            ["gate_fee", "Gate Fee"],
            ["washout", "Washout"],
            ["parking", "Parking"],
            ["detention", "Detention"],
            ["layover", "Layover"],
            ["tonu", "TONU"],
            ["extra_stop", "Extra Stop"],
            ["permit", "Permit"],
            ["escort", "Escort"],
            ["misc", "Misc"],
          ]}
        />

        <Select
          label="Direction"
          value={form.direction}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              direction: value as AccessorialDirection,
            }))
          }
          options={[
            ["expense", "Expense"],
            ["revenue", "Revenue"],
          ]}
        />

        <Input
          label="Amount"
          type="number"
          value={String(form.amount)}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              amount: Number(value),
            }))
          }
        />

        <Select
          label="Reimbursed"
          value={String(form.isReimbursed)}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              isReimbursed: value === "true",
            }))
          }
          options={[
            ["false", "No"],
            ["true", "Yes"],
          ]}
        />

        <Input
          label="Notes"
          value={form.notes}
          onChange={(value) =>
            setForm((prev) => ({
              ...prev,
              notes: value,
            }))
          }
        />
      </div>

      <button
        type="button"
        onClick={addItem}
        className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
      >
        Add Accessorial
      </button>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#060B14] p-4"
          >
            <div>
              <div className="font-semibold text-slate-100">
                {item.category} • {item.direction}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                {formatCurrency(Number(item.amount))}
                {item.isReimbursed ? " • reimbursed" : ""}
                {item.notes ? ` • ${item.notes}` : ""}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300 hover:bg-red-500/20"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-slate-100">{value}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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

function Select({
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
