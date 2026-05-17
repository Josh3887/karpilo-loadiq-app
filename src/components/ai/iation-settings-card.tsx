"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import {
  readIationVisibility,
  subscribeIationVisibility,
  writeIationVisibility,
} from "@/lib/ai/iation-events";
import { IATION_PROPRIETARY_STATEMENT } from "@/lib/ai/iation-help-registry";
import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";

const ATLAS_EDUCATIONAL_LAYER = ATLAS_INTELLIGENCE_LAYERS.educational;
const ATLAS_FREIGHT_LAYER = ATLAS_INTELLIGENCE_LAYERS.freight;

// TODO(Atlas migration): keep this compatibility settings control until the
// old iAtion overlay is replaced by embedded Atlas Intelligence surfaces.
export function IationSettingsCard({ enabled }: { enabled: boolean }) {
  const showIation = useSyncExternalStore(
    subscribeIationVisibility,
    readIationVisibility,
    () => true
  );

  function updateVisibility(nextValue: boolean) {
    writeIationVisibility(nextValue);
  }

  return (
    <div className="rounded-2xl border border-sky-400/20 bg-[#060B14] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-4">
            <div className="flex items-center gap-3">
              <Image
                src={ATLAS_EDUCATIONAL_LAYER.assets.emblem}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl border border-sky-300/25 object-cover"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                  {ATLAS_EDUCATIONAL_LAYER.runtimeId}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {ATLAS_EDUCATIONAL_LAYER.publicName} for app navigation,
                  tools, features, and workflows.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4">
            <div className="flex items-center gap-3">
              <Image
                src={ATLAS_FREIGHT_LAYER.assets.emblem}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl border border-red-300/25 object-cover"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">
                  {ATLAS_FREIGHT_LAYER.runtimeId}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  Atlas freight intelligence for calculated load data, margin
                  pressure, broker traffic, road signals, and operational
                  significance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <label className="flex min-w-52 cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#050B14] p-4">
          <span>
            <span className="block text-sm font-black text-slate-100">
              Show intelligence overlay
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Display compatibility educational guidance and Atlas freight
              intelligence overlays inside Karpilo LoadIQ.
            </span>
          </span>
          <input
            type="checkbox"
            checked={enabled && showIation}
            disabled={!enabled}
            onChange={(event) => updateVisibility(event.target.checked)}
            className="h-5 w-5 accent-sky-400"
          />
        </label>
      </div>

      {!enabled && (
        <p className="mt-4 rounded-xl border border-slate-800 bg-[#050B14] p-4 text-sm leading-6 text-slate-400">
          Atlas intelligence overlays are currently disabled in this environment.
        </p>
      )}

      <p className="mt-4 text-xs leading-6 text-slate-500">
        {IATION_PROPRIETARY_STATEMENT}
      </p>
    </div>
  );
}
