"use client";

import { AtlasIntelligenceSettingsCard } from "@/components/ai/atlas-intelligence-settings-card";

// TODO(Atlas migration): legacy export retained so any older settings imports
// keep working while Atlas Intelligence Systems becomes the primary UI.
export function IationSettingsCard({ enabled }: { enabled: boolean }) {
  return <AtlasIntelligenceSettingsCard enabled={enabled} />;
}
