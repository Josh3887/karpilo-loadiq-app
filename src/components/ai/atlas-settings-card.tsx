"use client";

import { AtlasIntelligenceSettingsCard } from "@/components/ai/atlas-intelligence-settings-card";

export function AtlasSettingsCard({ enabled }: { enabled: boolean }) {
  return <AtlasIntelligenceSettingsCard enabled={enabled} />;
}
