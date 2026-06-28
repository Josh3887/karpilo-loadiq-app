"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";

import {
  readAtlasEducationalEnabled,
  subscribeAtlasEducationalEnabled,
  writeAtlasEducationalEnabled,
} from "@/lib/ai/atlas-educational-preferences";
import {
  readAtlasOverlayVisibility,
  subscribeAtlasOverlayVisibility,
  writeAtlasOverlayVisibility,
} from "@/lib/ai/atlas-events";
import { AtlasRuntimeFrame } from "@/components/ai/atlas-runtime-frame";
import {
  ATLAS_INTELLIGENCE_LAYERS,
  ATLAS_LAYER_ORDER,
  ATLAS_CORE_CONTROLLED_ORCHESTRATION_NOTE,
  ATLAS_PROCESSING_DISCLOSURE,
  ATLAS_PROPRIETARY_STATEMENT,
  type AtlasLayerKey,
} from "@/lib/atlas/atlas-registry";
import {
  ATLAS_CONTROLLED_ACTIVATION_POLICY,
  ATLAS_CORE_SECONDARY_ROLES,
  ATLAS_EQUIPMENT_INTELLIGENCE_PACKS,
  ATLAS_SYSTEM_MISSION,
  ATLAS_TIER_INTELLIGENCE_POLICY,
} from "@/lib/atlas/atlas-intelligence-system";

export function AtlasIntelligenceSettingsCard({
  enabled,
}: {
  enabled: boolean;
}) {
  const coreLayer = ATLAS_INTELLIGENCE_LAYERS.core;
  const educationalEnabled = useSyncExternalStore(
    subscribeAtlasEducationalEnabled,
    readAtlasEducationalEnabled,
    () => true
  );
  const showCompatibilityOverlay = useSyncExternalStore(
    subscribeAtlasOverlayVisibility,
    readAtlasOverlayVisibility,
    () => false
  );

  function updateVisibility(nextValue: boolean) {
    writeAtlasOverlayVisibility(nextValue);
  }

  return (
    <AtlasRuntimeFrame
      layer={coreLayer}
      description="Karpilo Atlas AI provides educational, informational, and analytical support inside the Karpilo LoadIQ calculator environment."
      action={
        <div className="grid min-w-0 gap-3 sm:min-w-80">
          <ToggleRow
            label="Atlas Educational Support"
            description="Enable contextual educational guidance while navigating inputs, buttons, dialogs, result tiles, and LearnMore elements."
            checked={enabled && educationalEnabled}
            disabled={!enabled}
            onChange={writeAtlasEducationalEnabled}
            accent="sky"
          />
          <ToggleRow
            label="Karpilo Atlas on-demand panel"
            description="Optional on-demand panel for controlled Atlas Education and Freight context."
            checked={enabled && showCompatibilityOverlay}
            disabled={!enabled}
            onChange={updateVisibility}
            accent="purple"
          />
        </div>
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
            Embedded Support
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {ATLAS_PROCESSING_DISCLOSURE}
          </p>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            {ATLAS_PROPRIETARY_STATEMENT}
          </p>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            {ATLAS_CORE_CONTROLLED_ORCHESTRATION_NOTE}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Core Mission
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {ATLAS_SYSTEM_MISSION}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Controlled Activation
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {ATLAS_CONTROLLED_ACTIVATION_POLICY.summary}
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {ATLAS_CONTROLLED_ACTIVATION_POLICY.allowedTriggers.map(
              (trigger) => (
                <div
                  key={trigger.key}
                  className="rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-200">
                    {trigger.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {trigger.description}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Core Secondary Roles
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {Object.entries(ATLAS_CORE_SECONDARY_ROLES).map(([key, role]) => (
              <div
                key={key}
                className="rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-purple-200">
                  {role.label}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {role.purpose}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {role.boundary}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Equipment Intelligence Packs
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.values(ATLAS_EQUIPMENT_INTELLIGENCE_PACKS).map((pack) => (
              <span
                key={pack.label}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300"
              >
                {pack.label}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Tier Guardrails
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ATLAS_TIER_INTELLIGENCE_POLICY.map((policy) => (
              <div
                key={policy.tier}
                className="rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <p className="text-xs font-black uppercase tracking-[0.14em] text-lime-200">
                  {policy.tier}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {policy.education}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {policy.freight}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {policy.route}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {policy.addOnCredits}
                </p>
              </div>
            ))}
          </div>
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

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
  accent,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  accent: "purple" | "sky";
}) {
  return (
    <label className="flex min-w-0 cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <span>
        <span className="block text-sm font-black text-slate-100">
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className={
          accent === "sky"
            ? "h-5 w-5 shrink-0 accent-sky-400"
            : "h-5 w-5 shrink-0 accent-purple-400"
        }
      />
    </label>
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
