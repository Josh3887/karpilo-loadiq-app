"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  duplicateSavedLoad,
  updateSavedLoadActuals,
  updateSavedLoadOutcome,
} from "@/services/saved-load-actions";
import { createLaneTemplateFromSavedLoad } from "@/services/lane-templates";
import {
  buildActualsForForm,
  createPostTripExpense,
  getExpenseCategoryLabel,
  getSubcategories,
  isGallonBasedExpense,
  normalizePostTripExpense,
  normalizeSavedLoadActuals,
  POST_TRIP_EXPENSE_GROUPS,
} from "@/services/post-trip-actuals";
import {
  PostTripActualExpense,
  PostTripExpenseCategory,
  SavedLoadActuals,
} from "@/types/saved-load";
import { ThemedSelect } from "@/components/ui/themed-select";
import { formatCurrency, formatRpm } from "@/utils/format";

const defaultActuals: SavedLoadActuals = {
  fuelCost: 0,
  actualFuelPrice: 0,
  tolls: 0,
  lumpers: 0,
  maintenance: 0,
  parking: 0,
  other: 0,
  notes: "",
};

type SavedLoadActionsProps = {
  loadId: string;
  initialActuals?: Partial<SavedLoadActuals> | null;
  grossRevenue: number;
  estimatedTripCost: number;
  totalTripMiles: number;
};

export function SavedLoadActions({
  loadId,
  initialActuals,
  grossRevenue,
  estimatedTripCost,
  totalTripMiles,
}: SavedLoadActionsProps) {
  const router = useRouter();
  const context = {
    grossRevenue,
    estimatedTripCost,
    totalTripMiles,
  };
  const [actuals, setActuals] = useState(() =>
    buildActualsForForm(initialActuals ?? defaultActuals, context)
  );
  const [outcome, setOutcome] = useState("unknown");
  const [status, setStatus] = useState("");
  const actualSummary = normalizeSavedLoadActuals(actuals, context);

  async function handleDuplicate() {
    try {
      setStatus("Duplicating load...");
      const duplicateId = await duplicateSavedLoad(loadId);
      router.push(`/dashboard/history/${duplicateId}`);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to duplicate load.");
    }
  }

  async function handleSaveActuals() {
    try {
      setStatus("Saving actuals...");
      await updateSavedLoadActuals(loadId, actualSummary);
      setStatus("Actuals saved.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save actuals.");
    }
  }

  function addExpense() {
    setActuals((prev) => ({
      ...prev,
      postTripActualExpenses: [
        ...(prev.postTripActualExpenses ?? []),
        createPostTripExpense(),
      ],
    }));
  }

  function updateExpense(
    expenseId: string,
    updates: Partial<PostTripActualExpense>
  ) {
    setActuals((prev) => ({
      ...prev,
      postTripActualExpenses: (prev.postTripActualExpenses ?? []).map(
        (expense) =>
          expense.id === expenseId
            ? normalizePostTripExpense({
                ...expense,
                ...updates,
              })
            : expense
      ),
    }));
  }

  function removeExpense(expenseId: string) {
    setActuals((prev) => ({
      ...prev,
      postTripActualExpenses: (prev.postTripActualExpenses ?? []).filter(
        (expense) => expense.id !== expenseId
      ),
    }));
  }

  async function handleCreateTemplate() {
    try {
      setStatus("Saving lane template...");
      await createLaneTemplateFromSavedLoad(loadId);
      setStatus("Lane template saved.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save lane template."
      );
    }
  }

  async function handleSaveOutcome() {
    const statusByOutcome: Record<string, string> = {
      ran: "accepted",
      did_not_run: "archived",
      lost: "archived",
      declined: "archived",
      unknown: "saved",
    };

    try {
      setStatus("Saving load outcome...");
      await updateSavedLoadOutcome(
        loadId,
        outcome,
        statusByOutcome[outcome] ?? "saved"
      );
      setStatus("Load outcome saved.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save outcome.");
    }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Post-Trip Actuals
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Capture actual trip expenses without overwriting the original
            estimate.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <SummaryTile
            label="Estimated Trip Cost"
            value={formatCurrency(estimatedTripCost)}
          />
          <SummaryTile
            label="Actual Expense Total"
            value={formatCurrency(actualSummary.actualExpenseTotal ?? 0)}
          />
          <SummaryTile
            label="Actual Net"
            value={formatCurrency(actualSummary.actualNetProfit ?? 0)}
          />
          <SummaryTile
            label="Actual / Mile"
            value={formatRpm(actualSummary.actualProfitPerMile ?? 0)}
          />
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm leading-6 text-slate-300">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Estimated vs actual expense delta</span>
            <span className="font-black text-slate-100">
              {formatCurrency(actualSummary.estimatedVsActualDelta ?? 0)}
            </span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {(actuals.postTripActualExpenses ?? []).length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm leading-6 text-slate-400">
              No post-trip expenses added yet. Add fuel, DEF, parking, repairs,
              receipts, or other trip costs to compare estimated profit against
              actual results.
            </p>
          ) : (
            actuals.postTripActualExpenses?.map((expense) => (
              <PostTripExpenseEditor
                key={expense.id}
                expense={expense}
                onChange={(updates) => updateExpense(expense.id, updates)}
                onRemove={() => removeExpense(expense.id)}
              />
            ))
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={addExpense}
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
          >
            + Add Trip Expense
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Notes
          </span>

          <textarea
            value={actuals.notes}
            onChange={(event) =>
              setActuals((prev) => ({ ...prev, notes: event.target.value }))
            }
            className="min-h-24 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
        </label>

        <div className="mt-4 space-y-2 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
          <p>
            Karpilo LoadIQ provides operational organization and tracking tools
            only and does not provide legal, accounting, or tax advice.
          </p>
          <p>
            Users are responsible for verifying deductibility, compliance
            requirements, and financial treatment with qualified professionals.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveActuals}
          className="mt-4 rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Save Actuals
        </button>

        <div className="mt-6 border-t border-slate-800 pt-5">
          <ThemedSelect
            label="What happened with this load?"
            value={outcome}
            onChange={setOutcome}
            options={[
              { label: "Ran this load", value: "ran" },
              { label: "Did not run this load", value: "did_not_run" },
              { label: "Lost load", value: "lost" },
              { label: "Declined load", value: "declined" },
              { label: "Unknown", value: "unknown" },
            ]}
          />
          <button
            type="button"
            onClick={handleSaveOutcome}
            className="mt-4 rounded-xl border border-slate-700 bg-[#060B14] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
          >
            Save Outcome
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
          Load Actions
        </h2>

        <button
          type="button"
          onClick={handleDuplicate}
          className="mt-4 w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Duplicate Load
        </button>

        <Link
          href={`/dashboard?edit=${loadId}`}
          className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-700 bg-[#060B14] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
        >
          Edit Estimate
        </Link>

        <button
          type="button"
          onClick={handleCreateTemplate}
          className="mt-3 w-full rounded-xl border border-slate-700 bg-[#060B14] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
        >
          Save Lane Template
        </button>

        <Link
          href="/dashboard/templates"
          className="mt-3 flex w-full items-center justify-center rounded-xl border border-slate-700 bg-[#060B14] px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-300 transition hover:border-sky-400 hover:text-sky-300"
        >
          Templates
        </Link>

        <Link
          href={`/dashboard/history/${loadId}/report`}
          className="mt-3 flex w-full items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Print Report
        </Link>

        {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}
      </div>
    </section>
  );
}

function PostTripExpenseEditor({
  expense,
  onChange,
  onRemove,
}: {
  expense: PostTripActualExpense;
  onChange: (updates: Partial<PostTripActualExpense>) => void;
  onRemove: () => void;
}) {
  const subcategories = getSubcategories(expense.expenseCategory);
  const gallonBased = isGallonBasedExpense(
    expense.expenseCategory,
    expense.expenseSubcategory
  );
  const calculatedTotal = Number(expense.calculatedTotal ?? 0);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#060B14] p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
            {getExpenseCategoryLabel(expense.expenseCategory)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {expense.expenseSubcategory || "Expense detail pending"}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-500/20"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ThemedSelect
          label="Category"
          value={expense.expenseCategory}
          onChange={(value) => {
            const category = value as PostTripExpenseCategory;
            const nextSubcategory = getSubcategories(category)[0] ?? "";
            onChange({
              expenseCategory: category,
              expenseSubcategory: nextSubcategory,
              unitType: isGallonBasedExpense(category, nextSubcategory)
                ? "gallon"
                : "flat",
            });
          }}
          options={POST_TRIP_EXPENSE_GROUPS.map((group) => ({
            value: group.category,
            label: group.label,
          }))}
        />

        <ThemedSelect
          label="Subcategory"
          value={expense.expenseSubcategory}
          onChange={(value) =>
            onChange({
              expenseSubcategory: value,
              unitType: isGallonBasedExpense(expense.expenseCategory, value)
                ? "gallon"
                : "flat",
            })
          }
          options={subcategories.map((subcategory) => ({
            value: subcategory,
            label: subcategory,
          }))}
        />

        {gallonBased ? (
          <>
            <ActualField
              label="Price Per Gallon"
              value={Number(expense.pricePerGallon ?? 0)}
              onChange={(value) => onChange({ pricePerGallon: value })}
            />
            <ActualField
              label="Quantity / Gallons"
              value={Number(expense.quantityGallons ?? 0)}
              onChange={(value) => onChange({ quantityGallons: value })}
            />
            <ReadOnlyActualField
              label="Calculated Total"
              value={formatCurrency(calculatedTotal)}
            />
          </>
        ) : (
          <ActualField
            label="Amount"
            value={Number(expense.amount ?? 0)}
            onChange={(value) => onChange({ amount: value })}
          />
        )}

        <TextField
          label="Date"
          type="date"
          value={expense.date ?? ""}
          onChange={(value) => onChange({ date: value })}
        />
        <TextField
          label="Vendor"
          value={expense.vendorName ?? ""}
          onChange={(value) => onChange({ vendorName: value })}
        />
        <TextField
          label="Location"
          value={expense.location ?? ""}
          onChange={(value) => onChange({ location: value })}
        />
      </div>

      <label className="mt-4 flex min-h-12 items-center gap-3 rounded-xl border border-slate-800 bg-[#0B1220] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
        <input
          type="checkbox"
          checked={expense.receiptAttached ?? false}
          onChange={(event) =>
            onChange({ receiptAttached: event.target.checked })
          }
          className="h-4 w-4 accent-sky-400"
        />
        Receipt attached placeholder
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Notes
        </span>
        <textarea
          value={expense.notes ?? ""}
          onChange={(event) => onChange({ notes: event.target.value })}
          className="min-h-20 w-full rounded-xl border border-slate-800 bg-[#0B1220] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
        />
      </label>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-slate-100">{value}</div>
    </div>
  );
}

type ActualFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function ActualField({ label, value, onChange }: ActualFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(Math.max(Number(event.target.value) || 0, 0))
        }
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}

function ReadOnlyActualField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <div className="flex h-12 items-center rounded-xl border border-slate-800 bg-[#0B1220] px-4 text-slate-100">
        {value}
      </div>
    </label>
  );
}

function TextField({
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
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}
