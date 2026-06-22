"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { Layers, X } from "lucide-react";

import {
  readAtlasEducationalEnabled,
  subscribeAtlasEducationalEnabled,
} from "@/lib/ai/atlas-educational-preferences";
import {
  getAtlasEducationalHelpEntry,
  type AtlasEducationalHelpEntry,
} from "@/lib/ai/atlas-help-registry";
import { subscribeAtlasEducationalContextRequests } from "@/lib/ai/atlas-events";
import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";

type ActiveContext = {
  key: string;
  entry: AtlasEducationalHelpEntry;
};

const ATLAS_EDUCATIONAL_LAYER = ATLAS_INTELLIGENCE_LAYERS.educational;

export function AtlasEducationalContextRail({
  enabled,
}: {
  enabled: boolean;
}) {
  const educationalEnabled = useSyncExternalStore(
    subscribeAtlasEducationalEnabled,
    readAtlasEducationalEnabled,
    () => true
  );
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(
    null
  );
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const visibleContext = useMemo(() => {
    if (!enabled || !educationalEnabled || !activeContext) return null;
    if (dismissedKey === activeContext.key) return null;
    return activeContext;
  }, [activeContext, dismissedKey, educationalEnabled, enabled]);

  useEffect(() => {
    if (!enabled || !educationalEnabled) {
      return;
    }

    return subscribeAtlasEducationalContextRequests(({ key }) => {
      const entry = getAtlasEducationalHelpEntry(key);

      if (!entry) return;

      setDismissedKey(null);
      setActiveContext({ key, entry });
    });
  }, [educationalEnabled, enabled]);

  useEffect(() => {
    if (!visibleContext) return;

    const visibleContextKey = visibleContext.key;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDismissedKey(visibleContextKey);
      }
    }

    document.addEventListener("keydown", closeOnEscape, true);

    return () => {
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [visibleContext]);

  if (!visibleContext) return null;

  return (
    <aside
      data-atlas-educational-root="true"
      aria-live="polite"
      className="fixed bottom-24 left-4 z-[58] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-sky-400/25 bg-[#06101F]/96 shadow-[0_22px_70px_rgba(8,47,73,0.38)] backdrop-blur-xl md:left-auto md:right-6"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 bg-[#050B14] p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-sky-300/25 bg-sky-400/10">
            <Image
              src={ATLAS_EDUCATIONAL_LAYER.assets.emblem}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-sky-300">
              {ATLAS_EDUCATIONAL_LAYER.runtimeId}
            </p>
            <h2 className="mt-1 text-sm font-black text-slate-50">
              {visibleContext.entry.featureSignal}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissedKey(visibleContext.key)}
          className="rounded-full border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:border-sky-400/50 hover:text-sky-200"
          aria-label="Dismiss Atlas Educational Support context"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-3 p-4">
        <ContextBlock
          title="Why It Matters"
          body={visibleContext.entry.whyItMatters}
        />
        <ContextBlock title="How To Use It" body={visibleContext.entry.howToUseIt} />
        <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
          <Layers className="mr-2 inline h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
          {visibleContext.entry.operatorReminder}
        </p>
      </div>
    </aside>
  );
}

function ContextBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-sky-300">
        {title}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{body}</p>
    </div>
  );
}
