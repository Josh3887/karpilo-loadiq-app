"use client";

import { Layers } from "lucide-react";

import { AtlasRuntimeFrame } from "@/components/ai/atlas-runtime-frame";
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
    <AtlasRuntimeFrame
      layer={ATLAS_EDUCATIONAL_LAYER}
      compact
      description={signal}
      action={<Layers className="hidden h-5 w-5 text-[var(--atlas-accent)] sm:block" aria-hidden="true" />}
    >
      <div className="grid gap-3">
        <h3 className="text-sm font-black text-slate-50">{title}</h3>
        <p className="text-xs leading-5 text-slate-400">{consequence}</p>
        {operatorReminder && (
          <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
            {operatorReminder}
          </p>
        )}
      </div>
    </AtlasRuntimeFrame>
  );
}
