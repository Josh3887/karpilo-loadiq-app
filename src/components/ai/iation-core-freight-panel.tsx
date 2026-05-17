"use client";

import { AtlasFreightIntelligenceSurface } from "@/components/ai/atlas-freight-intelligence-surface";
import type { LoadIqAiLoadAnalysisInput } from "@/types/ai-load-analysis";

type IationCoreFreightPanelProps = {
  payload: LoadIqAiLoadAnalysisInput | null;
};

// TODO(Atlas migration): this legacy export keeps the compatibility overlay
// working while primary freight intelligence moves into embedded Atlas surfaces.
export function IationCoreFreightPanel({
  payload,
}: IationCoreFreightPanelProps) {
  return (
    <AtlasFreightIntelligenceSurface payload={payload} variant="overlay" />
  );
}
