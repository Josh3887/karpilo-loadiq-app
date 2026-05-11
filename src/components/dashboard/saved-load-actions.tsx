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
import { SavedLoadActuals } from "@/types/saved-load";
import { ThemedSelect } from "@/components/ui/themed-select";

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
};

export function SavedLoadActions({ loadId }: SavedLoadActionsProps) {
  const router = useRouter();
  const [actuals, setActuals] = useState(defaultActuals);
  const [outcome, setOutcome] = useState("unknown");
  const [status, setStatus] = useState("");

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
      await updateSavedLoadActuals(loadId, actuals);
      setStatus("Actuals saved.");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save actuals.");
    }
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
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ActualField
            label="Actual Fuel $/Gal"
            value={actuals.actualFuelPrice}
            onChange={(value) =>
              setActuals((prev) => ({ ...prev, actualFuelPrice: value }))
            }
          />

          <ActualField
            label="Fuel Total"
            value={actuals.fuelCost}
            onChange={(value) =>
              setActuals((prev) => ({ ...prev, fuelCost: value }))
            }
          />

          <ActualField
            label="Tolls"
            value={actuals.tolls}
            onChange={(value) =>
              setActuals((prev) => ({ ...prev, tolls: value }))
            }
          />

          <ActualField
            label="Lumpers"
            value={actuals.lumpers}
            onChange={(value) =>
              setActuals((prev) => ({ ...prev, lumpers: value }))
            }
          />

          <ActualField
            label="Maintenance"
            value={actuals.maintenance}
            onChange={(value) =>
              setActuals((prev) => ({ ...prev, maintenance: value }))
            }
          />

          <ActualField
            label="Parking"
            value={actuals.parking}
            onChange={(value) =>
              setActuals((prev) => ({ ...prev, parking: value }))
            }
          />

          <ActualField
            label="Other"
            value={actuals.other}
            onChange={(value) =>
              setActuals((prev) => ({ ...prev, other: value }))
            }
          />
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
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}
