"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import {
  readIationVisibility,
  subscribeIationVisibility,
  writeIationVisibility,
} from "@/lib/ai/iation-events";
import { AtlasRuntimeFrame } from "@/components/ai/atlas-runtime-frame";
import {
  ATLAS_INTELLIGENCE_LAYERS,
  ATLAS_LAYER_ORDER,
  ATLAS_PROCESSING_DISCLOSURE,
  ATLAS_PROPRIETARY_STATEMENT,
  type AtlasLayerKey,
} from "@/lib/atlas/atlas-registry";

export function AtlasIntelligenceSettingsCard({
  enabled,
}: {
  enabled: boolean;
}) {
  const coreLayer = ATLAS_INTELLIGENCE_LAYERS.core;
  const showCompatibilityOverlay = useSyncExternalStore(
    subscribeIationVisibility,
    readIationVisibility,
    () => false
  );

  function updateVisibility(nextValue: boolean) {
    writeIationVisibility(nextValue);
  }

  return (
    <AtlasRuntimeFrame
      layer={coreLayer}
      description="Atlas Core coordinates embedded freight, route, and educational intelligence as one operational runtime inside Karpilo LoadIQ."
      action={
        <label className="flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4 sm:min-w-64">
          <span>
            <span className="block text-sm font-black text-slate-100">
              Compatibility overlay
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Optional legacy overlay while embedded Atlas surfaces continue
              rolling out.
            </span>
          </span>
          <input
            type="checkbox"
            checked={enabled && showCompatibilityOverlay}
            disabled={!enabled}
            onChange={(event) => updateVisibility(event.target.checked)}
            className="h-5 w-5 shrink-0 accent-purple-400"
          />
        </label>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {ATLAS_LAYER_ORDER.map((layerKey) => (
          <AtlasLayerDisclosure key={layerKey} layerKey={layerKey} />
        ))}
      </div>

      <div className="mt-4 grid gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Embedded Runtime
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {ATLAS_PROCESSING_DISCLOSURE}
          </p>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            {ATLAS_PROPRIETARY_STATEMENT}
          </p>
        </div>
      </div>

      {!enabled && (
        <p className="mt-4 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm leading-6 text-slate-400">
          Atlas processing is disabled in this environment.
        </p>
      )}
    </AtlasRuntimeFrame>
  );
}

function AtlasLayerDisclosure({ layerKey }: { layerKey: AtlasLayerKey }) {
  const layer = ATLAS_INTELLIGENCE_LAYERS[layerKey];
  const theme = getLayerTheme(layerKey);

  return (
    <div className={`rounded-xl border p-4 ${theme.shell}`}>
      <div className="flex items-start gap-3">
        <Image
          src={layer.assets.emblem}
          alt=""
          width={48}
          height={48}
          className={`h-12 w-12 rounded-xl border object-cover ${theme.image}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p
            className={`text-xs font-black uppercase tracking-[0.18em] ${theme.kicker}`}
          >
            {layer.runtimeId}
          </p>
          <h3 className="mt-1 text-sm font-black text-slate-100">
            {layer.publicName}
          </h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {layer.shortOperationalDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

function getLayerTheme(layerKey: AtlasLayerKey) {
  switch (layerKey) {
    case "core":
      return {
        shell: "border-purple-400/20 bg-purple-500/10",
        image: "border-purple-300/25",
        kicker: "text-purple-200",
      };
    case "freight":
      return {
        shell: "border-lime-400/20 bg-lime-500/10",
        image: "border-lime-300/25",
        kicker: "text-lime-200",
      };
    case "route":
      return {
        shell: "border-red-400/20 bg-red-500/10",
        image: "border-red-300/25",
        kicker: "text-red-200",
      };
    case "educational":
      return {
        shell: "border-sky-400/20 bg-sky-500/10",
        image: "border-sky-300/25",
        kicker: "text-sky-200",
      };
  }
}
