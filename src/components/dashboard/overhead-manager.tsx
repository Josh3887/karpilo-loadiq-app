"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { type ReactNode, useCallback, useEffect, useState } from "react";

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

const EXPENSE_GROUPS = [
  {
    key: "fixed",
    title: "Fixed Expenses",
    description:
      "Recurring business overhead such as base operating cost, parking, office, or other monthly obligations.",
  },
  {
    key: "equipment",
    title: "Truck, Trailer, APU, Reefer",
    description:
      "Equipment payments, rentals, APU/reefer context, or other tractor/trailer operating assumptions.",
  },
  {
    key: "variable",
    title: "Variable Costs And Reserves",
    description:
      "CPM, percent, maintenance, tire, fuel, toll, repair, and trip-sensitive cost pressure.",
  },
  {
    key: "admin",
    title: "Insurance, Compliance, Admin",
    description:
      "Insurance, permits, ELD, software, subscriptions, dispatch, factoring, accounting, and admin services.",
  },
] as const;

type ExpenseGroupKey = (typeof EXPENSE_GROUPS)[number]["key"];

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
  const groupedItems = groupOverheadItems(items);

  return (
    <div className="space-y-8">
      <MobileSection
        title="Operating Cost Snapshot"
        description="Review how Expense Intelligence converts saved overhead into calculator-ready fixed, CPM, and percent assumptions."
        defaultOpen
      >
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Weekly Operational Burn"
            value={formatCurrency(weeklyOverhead)}
          />
          <SummaryCard
            label="CPM Exposure"
            value={`${formatCurrency(cpmExposure)}/mi`}
          />
          <SummaryCard
            label="Percent Deductions"
            value={`${percentDeductions.toFixed(2)}%`}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#060B14] p-5">
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
            In the calculator, fixed overhead is applied as daily fixed overhead
            × dispatch days. A three-day load carries three days of overhead,
            not the entire monthly burden.
          </p>
        </div>
      </MobileSection>

      <LearnMore {...EDUCATION_TOPICS.overhead} />

      <MobileSection
        title="Expense Group Guide"
        description="Use these groups to keep fixed, variable, equipment, compliance, insurance, fuel, maintenance, toll, and miscellaneous costs understandable."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {EXPENSE_GROUPS.map((group) => (
            <div
              key={group.key}
              className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-5 text-slate-400"
            >
              <span className="font-bold uppercase tracking-[0.16em] text-sky-300">
                {group.title}
              </span>
              <span className="mt-2 block">{group.description}</span>
            </div>
          ))}
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
      </MobileSection>

      <MobileSection
        title="Add Expense Assumption"
        description="Add one operating-cost item at a time. The saved fields and calculation semantics are unchanged."
        defaultOpen
      >
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Label"
            value={form.label}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, label: value }))
            }
          />

          <InputField
            label="Amount"
            type="number"
            value={String(form.amount)}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, amount: Number(value) }))
            }
          />

          <SelectField
            label="Amount Type"
            value={form.amount_type}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                amount_type: value as OverheadAmountType,
                frequency:
                  value === "cpm"
                    ? "by_mile"
                    : value === "percent"
                      ? "none"
                      : "monthly",
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
            onChange={(value) =>
              setForm((prev) => ({ ...prev, category: value }))
            }
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
          className="mt-5 w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 sm:w-auto"
        >
          Add Overhead Item
        </button>
      </MobileSection>

      {status && <div className="text-sm text-slate-400">{status}</div>}

      <MobileSection
        title="Saved Expense Items"
        description="Saved items are grouped for review only. Deleting or editing behavior is unchanged."
        defaultOpen
      >
        <div className="space-y-4">
          {EXPENSE_GROUPS.map((group) => (
            <ExpenseItemGroup
              key={group.key}
              title={group.title}
              description={group.description}
              items={groupedItems[group.key]}
              operatingDaysPerWeek={operatingDaysPerWeek}
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      </MobileSection>
    </div>
  );
}

function groupOverheadItems(items: OverheadItem[]) {
  return items.reduce<Record<ExpenseGroupKey, OverheadItem[]>>(
    (groups, item) => {
      groups[classifyOverheadItem(item)].push(item);
      return groups;
    },
    {
      fixed: [],
      equipment: [],
      variable: [],
      admin: [],
    }
  );
}

function classifyOverheadItem(item: OverheadItem): ExpenseGroupKey {
  const text = `${item.label} ${item.category}`.toLowerCase();

  if (/(truck|tractor|trailer|apu|reefer|rental)/.test(text)) {
    return "equipment";
  }

  if (
    item.amount_type !== "flat" ||
    item.category === "reserve" ||
    item.category === "trip_specific" ||
    /(fuel|maintenance|tire|toll|repair|variable|cpm|mile)/.test(text)
  ) {
    return "variable";
  }

  if (
    item.category === "compliance" ||
    item.category === "services" ||
    item.category === "software_subscription" ||
    /(insurance|permit|eld|software|subscription|dispatch|factoring|account|admin)/.test(
      text
    )
  ) {
    return "admin";
  }

  return "fixed";
}

function MobileSection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group rounded-2xl border border-slate-800 bg-[#0B1220]/70 p-4 open:space-y-5"
    >
      <summary className="cursor-pointer list-none rounded-xl border border-slate-800 bg-[#060B14] p-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="break-words text-sm font-black uppercase tracking-[0.18em] text-sky-300">
              {title}
            </div>
            <p className="mt-2 break-words text-xs leading-5 text-slate-400">
              {description}
            </p>
          </div>
          <span className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-slate-500 group-open:hidden">
            Open
          </span>
          <span className="hidden shrink-0 text-xs font-black uppercase tracking-[0.16em] text-slate-500 group-open:inline">
            Close
          </span>
        </div>
      </summary>
      <div className="space-y-5 pt-5">{children}</div>
    </details>
  );
}

function ExpenseItemGroup({
  title,
  description,
  items,
  operatingDaysPerWeek,
  onDelete,
}: {
  title: string;
  description: string;
  items: OverheadItem[];
  operatingDaysPerWeek: number;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#060B14] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-sky-300">
            {title}
          </h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
        <span className="rounded-full border border-slate-800 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 && (
          <p className="rounded-xl border border-slate-800 bg-[#0B1220] p-4 text-sm text-slate-500">
            No saved item in this group.
          </p>
        )}
        {items.map((item) => (
          <OverheadItemCard
            key={item.id}
            item={item}
            operatingDaysPerWeek={operatingDaysPerWeek}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

function OverheadItemCard({
  item,
  operatingDaysPerWeek,
  onDelete,
}: {
  item: OverheadItem;
  operatingDaysPerWeek: number;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-800 bg-[#0B1220] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="break-words font-semibold text-slate-100">
          {item.label}
        </div>
        <div className="mt-1 break-words text-sm text-slate-400">
          {formatCurrency(Number(item.amount))} • {item.amount_type} •{" "}
          {item.frequency} • {item.responsibility}
        </div>
        {item.amount_type === "flat" && item.responsibility === "driver" && (
          <div className="mt-1 break-words text-xs text-slate-500">
            Monthly equivalent:{" "}
            {formatCurrency(
              calculateOverheadBreakdown([item], operatingDaysPerWeek).monthly
            )}{" "}
            • Daily equivalent:{" "}
            {formatCurrency(
              calculateOverheadBreakdown([item], operatingDaysPerWeek).daily
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(item.id)}
        disabled={item.system_generated}
        className="w-full shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {item.system_generated ? "System" : "Delete"}
      </button>
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
