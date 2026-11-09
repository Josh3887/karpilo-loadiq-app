"use client";

import { useEffect, useId, useState } from "react";

import type { Facility } from "@/services/facilities/directory";

type Props = {
  label: string;
  onSelect: (facility: Facility) => void;
};

export function FacilitySearch({ label, onSelect }: Props) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const search = query.trim();
    if (search.length < 3) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/facilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: search }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Facility search unavailable");

        const { facilities, warnings = [] }: { facilities: Facility[]; warnings?: string[] } = await response.json();
        if (controller.signal.aborted) return;

        setFacilities(facilities);
        setStatus([...warnings, ...(facilities.length ? [] : ["No matches. Enter the address below; saving the load makes it reusable."])].join(" "));
      } catch {
        if (!controller.signal.aborted) {
          setStatus("Facility search is unavailable. Enter the address below.");
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <input
        id={id}
        type="search"
        maxLength={100}
        value={query}
        placeholder="Facility name, city, or ZIP"
        autoComplete="off"
        className="w-full rounded-md border border-slate-500 bg-transparent px-3 py-2 text-base"
        onChange={(event) => {
          const next = event.target.value;
          setFacilities([]);
          setStatus(next.trim().length >= 3 ? "Searching facilities…" : "");
          setQuery(next);
        }}
      />
      {facilities.length > 0 && (
        <ul className="space-y-1" aria-label={`${label} results`}>
          {facilities.map((facility) => (
            <li key={facility.id}>
              <button
                type="button"
                className="w-full rounded-md border border-slate-500 px-3 py-2 text-left text-sm"
                onClick={() => {
                  onSelect(facility);
                  setFacilities([]);
                  setQuery("");
                  setStatus(`${facility.name} address filled in.`);
                }}
              >
                <span className="block font-medium">{facility.name}</span>
                {facility.address}, {facility.city}, {facility.state} {facility.zip}
                <span className="block text-xs text-slate-400">{facility.source === "driver_saved" ? "Your saved addresses" : "Facility directory"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-slate-400">Searches your latest 500 saved loads and the configured directory.</p>
      {facilities.some((facility) => facility.source === "openstreetmap") && (
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="text-xs underline">© OpenStreetMap contributors</a>
      )}
      <p role="status" className="text-sm">{status}</p>
    </div>
  );
}
