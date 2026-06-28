"use client";

import { AtlasFreightIntelligenceSurface } from "@/components/ai/atlas-freight-intelligence-surface";
import type { LoadIqAiLoadAnalysisInput } from "@/types/ai-load-analysis";

type AtlasCoreFreightPanelProps = {
  payload: LoadIqAiLoadAnalysisInput | null;
};

export function AtlasCoreFreightPanel({
  payload,
}: AtlasCoreFreightPanelProps) {
  return (
    <AtlasFreightIntelligenceSurface payload={payload} variant="overlay" />
  );
}
