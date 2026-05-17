"use client";

import Image from "next/image";
import { Layers } from "lucide-react";

import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";

type AtlasEducationalSignalProps = {
  title: string;
  signal: string;
  consequence: string;
  operatorReminder?: string;
};

const ATLAS_EDUCATIONAL_LAYER = ATLAS_INTELLIGENCE_LAYERS.educational;

export function AtlasEducationalSignal({
  title,
  signal,
  consequence,
  operatorReminder,
}: AtlasEducationalSignalProps) {
  return (
    <aside className="overflow-hidden rounded-2xl border border-sky-400/25 bg-[#06101F] shadow-[0_0_28px_rgba(56,189,248,0.08)]">
      <div className="relative p-4">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent"
        />
        <div className="flex items-start gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-sky-300/25 bg-sky-400/10 shadow-[0_0_22px_rgba(56,189,248,0.14)]">
            <Image
              src={ATLAS_EDUCATIONAL_LAYER.assets.emblem}
              alt=""
              fill
              sizes="48px"
              className="h-full w-full object-cover"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-sky-300">
                {ATLAS_EDUCATIONAL_LAYER.runtimeId}
              </p>
              <Layers className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
            </div>
            <h3 className="mt-1 text-sm font-black text-slate-50">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-300">{signal}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {consequence}
            </p>
            {operatorReminder && (
              <p className="mt-3 rounded-xl border border-sky-400/10 bg-sky-400/5 p-3 text-xs leading-5 text-sky-100">
                {operatorReminder}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
