"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { BookOpen, RadioTower, X } from "lucide-react";

import { AtlasCoreFreightPanel } from "@/components/ai/atlas-core-freight-panel";
import { AtlasEducationPanel } from "@/components/ai/atlas-education-panel";
import { AtlasLauncher } from "@/components/ai/atlas-launcher";
import {
  readAtlasEducationalEnabled,
  subscribeAtlasEducationalEnabled,
} from "@/lib/ai/atlas-educational-preferences";
import {
  getAtlasHelpEntry,
  type AtlasHelpEntry,
} from "@/lib/ai/atlas-help-registry";
import {
  ATLAS_CORE_EVENT,
  readAtlasOverlayVisibility,
  subscribeAtlasEducationalContextRequests,
  subscribeAtlasOverlayVisibility,
  writeAtlasOverlayVisibility,
} from "@/lib/ai/atlas-events";
import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";
import type { LoadIqAiLoadAnalysisInput } from "@/types/ai-load-analysis";

type OverlayMode = "education" | "core";

type AtlasCoreEventDetail = {
  payload?: LoadIqAiLoadAnalysisInput | null;
};

const ATLAS_EDUCATIONAL_LAYER = ATLAS_INTELLIGENCE_LAYERS.educational;
const ATLAS_FREIGHT_LAYER = ATLAS_INTELLIGENCE_LAYERS.freight;

export function AtlasOverlay({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const visible = useSyncExternalStore(
    subscribeAtlasOverlayVisibility,
    readAtlasOverlayVisibility,
    () => false
  );
  const educationalEnabled = useSyncExternalStore(
    subscribeAtlasEducationalEnabled,
    readAtlasEducationalEnabled,
    () => true
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [mode, setMode] = useState<OverlayMode>("education");
  const [helpEntry, setHelpEntry] = useState<AtlasHelpEntry | null>(null);
  const [corePayload, setCorePayload] =
    useState<LoadIqAiLoadAnalysisInput | null>(null);

  const pageSignal = useMemo(() => {
    if (!pathname || pathname === "/dashboard") return "Dashboard";
    if (pathname.includes("/history")) return "Load History";
    if (pathname.includes("/settings")) return "Settings";
    if (pathname.includes("/billing")) return "Billing";
    if (pathname.includes("/templates")) return "Templates";
    if (pathname.includes("/support")) return "Support";
    return "Authenticated App Surface";
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;

    return subscribeAtlasOverlayVisibility(() => {
      if (!readAtlasOverlayVisibility()) {
        setPanelOpen(false);
      }
    });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    return subscribeAtlasEducationalContextRequests(({ key }) => {
      const entry = getAtlasHelpEntry(key);

      if (!entry) return;

      setHelpEntry(entry);
      setMode("education");

      if (visible && educationalEnabled) {
        setPanelOpen(true);
      }
    });
  }, [educationalEnabled, enabled, visible]);

  useEffect(() => {
    if (!enabled) return;

    function onOpenCore(event: Event) {
      const customEvent = event as CustomEvent<AtlasCoreEventDetail>;
      setCorePayload(customEvent.detail?.payload ?? null);
      setMode("core");
      setPanelOpen(true);
    }

    window.addEventListener(ATLAS_CORE_EVENT, onOpenCore);

    return () => {
      window.removeEventListener(ATLAS_CORE_EVENT, onOpenCore);
    };
  }, [enabled]);

  if (!enabled) return null;

  function hideOverlay() {
    writeAtlasOverlayVisibility(false);
  }

  if (!visible) return null;
  if (!educationalEnabled && mode === "education") return null;

  return (
    <div data-atlas-root="true">
      {panelOpen && (
        <section className="fixed bottom-24 right-4 z-[69] max-h-[calc(100vh-8rem)] w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-sky-400/30 bg-[#06101F]/98 shadow-[0_24px_90px_rgba(0,0,0,0.62)] backdrop-blur-xl sm:right-6">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-[#050B14] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-sky-300/25 bg-sky-400/10">
                <Image
                  src={
                    mode === "core"
                      ? ATLAS_FREIGHT_LAYER.assets.emblem
                      : ATLAS_EDUCATIONAL_LAYER.assets.emblem
                  }
                  alt=""
                  fill
                  sizes="40px"
                  className="h-full w-full object-cover"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                  {mode === "core"
                    ? ATLAS_FREIGHT_LAYER.runtimeId
                    : ATLAS_EDUCATIONAL_LAYER.runtimeId}
                </p>
                <p className="text-sm font-black text-slate-100">
                  {mode === "core"
                    ? "Atlas Analysis Assistance"
                    : "Atlas Educational Support"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded-full border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:border-sky-400/50 hover:text-sky-200"
              aria-label="Minimize Atlas compatibility panel"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex gap-2 border-b border-slate-800 bg-[#050B14] px-4 py-3">
            <ModeButton
              active={mode === "education"}
              onClick={() => setMode("education")}
              icon={<BookOpen className="h-4 w-4" aria-hidden="true" />}
            >
              EDU
            </ModeButton>
            <ModeButton
              active={mode === "core"}
              onClick={() => setMode("core")}
              icon={<RadioTower className="h-4 w-4" aria-hidden="true" />}
            >
              Freight
            </ModeButton>
          </div>

          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-4">
            {mode === "core" ? (
              <AtlasCoreFreightPanel payload={corePayload} />
            ) : (
              <AtlasEducationPanel
                helpEntry={helpEntry}
                pageSignal={pageSignal}
              />
            )}
          </div>
        </section>
      )}

      {educationalEnabled && (
        <AtlasLauncher
          panelOpen={panelOpen}
          onOpen={() => {
            setMode(corePayload ? "core" : "education");
            setPanelOpen(true);
          }}
          onHide={hideOverlay}
        />
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-400/35 bg-sky-400/15 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-sky-100"
          : "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#06101F] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-200"
      }
    >
      {icon}
      {children}
    </button>
  );
}
