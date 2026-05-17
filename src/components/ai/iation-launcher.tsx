"use client";

import Image from "next/image";
import { RadioTower, X } from "lucide-react";

import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";

type IationLauncherProps = {
  panelOpen: boolean;
  onOpen: () => void;
  onHide: () => void;
};

const ATLAS_EDUCATIONAL_LAYER = ATLAS_INTELLIGENCE_LAYERS.educational;

// TODO(Atlas migration): legacy launcher is opt-in compatibility while Atlas
// intelligence moves into embedded workflow surfaces.
export function IationLauncher({
  panelOpen,
  onOpen,
  onHide,
}: IationLauncherProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[70] flex max-w-[calc(100vw-2rem)] items-end gap-3 sm:bottom-6 sm:right-6">
      <button
        type="button"
        onClick={onHide}
        className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-[#050B14]/95 text-slate-400 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-red-400/40 hover:text-red-200 sm:inline-flex"
        aria-label="Hide Atlas compatibility overlay"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="iation-signal-shell group relative flex min-w-0 items-center gap-3 rounded-2xl border border-sky-400/35 bg-[#06101F]/95 px-4 py-3 text-left shadow-[0_18px_60px_rgba(8,47,73,0.42)] backdrop-blur-xl transition hover:border-sky-300/60 hover:bg-[#07182A]"
        aria-label="Open Atlas educational signal"
        aria-expanded={panelOpen}
      >
        <span className="iation-scan-ring absolute -inset-1 rounded-[1.15rem] border border-sky-300/20" />
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-sky-300/25 bg-sky-400/10">
          <Image
            src={ATLAS_EDUCATIONAL_LAYER.assets.emblem}
            alt=""
            fill
            sizes="48px"
            className="h-full w-full object-cover"
            aria-hidden="true"
          />
        </span>
        <span className="relative min-w-0">
          <span className="block text-sm font-black uppercase tracking-[0.16em] text-sky-100">
            Atlas EDU
          </span>
          <span className="mt-1 flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.16em] text-sky-300">
            <RadioTower className="h-3.5 w-3.5" aria-hidden="true" />
            Signal Active
          </span>
        </span>
      </button>
    </div>
  );
}
