"use client";

import { useState } from "react";

import { ThemedSelect } from "@/components/ui/themed-select";
import { createEntityNote, EntityNotePayload } from "@/services/entity-notes";

type EntityNoteFormProps = {
  savedLoadId: string;
};

export function EntityNoteForm({ savedLoadId }: EntityNoteFormProps) {
  const [note, setNote] = useState<EntityNotePayload>({
    savedLoadId,
    entityType: "facility",
    companyName: "",
    address: "",
    rating: 3,
    notes: "",
  });
  const [status, setStatus] = useState("");

  async function saveNote() {
    try {
      setStatus("Saving private facility note...");
      await createEntityNote(note);
      setNote({
        savedLoadId,
        entityType: "facility",
        companyName: "",
        address: "",
        rating: 3,
        notes: "",
      });
      setStatus("Private note saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save note.");
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.06)]">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
        Private Facility Notes
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Track wait time patterns, parking, staff behavior, lumper issues, and
        safety notes for your own future decisions.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ThemedSelect
          label="Entity Type"
          value={note.entityType}
          onChange={(value) =>
            setNote((prev) => ({
              ...prev,
              entityType: value as EntityNotePayload["entityType"],
            }))
          }
          options={[
            { label: "Shipper", value: "shipper" },
            { label: "Consignee", value: "consignee" },
            { label: "Facility", value: "facility" },
          ]}
        />
        <Field
          label="Private Rating 1-5"
          type="number"
          value={String(note.rating)}
          onChange={(value) =>
            setNote((prev) => ({ ...prev, rating: Number(value) }))
          }
        />
        <Field
          label="Company Name"
          value={note.companyName}
          onChange={(value) =>
            setNote((prev) => ({ ...prev, companyName: value }))
          }
        />
        <Field
          label="Address"
          value={note.address}
          onChange={(value) => setNote((prev) => ({ ...prev, address: value }))}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Operational Comments
        </span>
        <textarea
          value={note.notes}
          onChange={(event) =>
            setNote((prev) => ({ ...prev, notes: event.target.value }))
          }
          className="min-h-24 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
        />
      </label>

      <button
        type="button"
        onClick={saveNote}
        disabled={!note.companyName || !note.notes}
        className="mt-4 rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save Private Note
      </button>

      {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}
    </section>
  );
}

function Field({
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
        min={type === "number" ? 1 : undefined}
        max={type === "number" ? 5 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}
