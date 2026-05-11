"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import { useId, useMemo, useState } from "react";

import {
  ACTIVE_DATA_PROVIDERS,
  DATA_PROVIDER_DISCLOSURE,
  DATA_PROVIDERS,
  EIA_ATTRIBUTION_TEXT,
} from "@/config/data-providers";

type DataSourcesProps = {
  compact?: boolean;
  showPlanned?: boolean;
  className?: string;
};

export function DataSources({
  compact = false,
  showPlanned = false,
  className = "",
}: DataSourcesProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  const contentId = useId();
  const providers = useMemo(
    () => (showPlanned ? DATA_PROVIDERS : ACTIVE_DATA_PROVIDERS),
    [showPlanned],
  );

  return (
    <section
      className={[
        "rounded-2xl border border-slate-800 bg-[#08111F]/80 text-left shadow-[0_0_24px_rgba(56,189,248,0.06)]",
        compact ? "p-4" : "p-5 sm:p-6",
        className,
      ].join(" ")}
      aria-labelledby="data-sources-heading"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="data-sources-heading"
            className="text-xs font-black uppercase tracking-[0.22em] text-sky-300"
          >
            Data Sources
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-400 sm:text-sm">
            {EIA_ATTRIBUTION_TEXT}
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-[#0B1220] text-slate-300 transition hover:border-sky-400 hover:text-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="sr-only">
            {isOpen ? "Collapse data source details" : "Expand data source details"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {isOpen ? (
        <div id={contentId} className="mt-5 space-y-4">
          <p className="border-l-2 border-red-400/60 pl-3 text-xs leading-5 text-slate-500">
            {DATA_PROVIDER_DISCLOSURE}
          </p>

          <div className="grid gap-3">
            {providers.map((provider) => (
              <article
                key={provider.id}
                className="rounded-xl border border-slate-800 bg-[#060B14]/90 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-slate-100">
                        {provider.shortName}
                      </h3>
                      <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        {provider.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {provider.name}
                    </p>
                  </div>

                  {provider.href ? (
                    <a
                      href={provider.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 transition hover:text-sky-200"
                    >
                      Open Data
                      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {provider.description}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {provider.disclaimer}
                </p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
