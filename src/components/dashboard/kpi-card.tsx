import type { PreviewExplanationKey } from "@/components/preview/preview-mode-provider";

type KpiCardProps = {
  label: string;
  value: string;
  tone?: "blue" | "red" | "green" | "silver";
  previewExplanation?: PreviewExplanationKey;
  atlasEduKey?: string;
};

const toneMap = {
  blue: "text-sky-400",
  red: "text-red-400",
  green: "text-emerald-400",
  silver: "text-slate-200",
};

export function KpiCard({
  label,
  value,
  tone = "silver",
  previewExplanation = "analyze-load",
  atlasEduKey,
}: KpiCardProps) {
  return (
    <div
      data-preview-explain={previewExplanation}
      data-atlas-edu={atlasEduKey ?? previewExplanation}
      className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
    >
      <div className="mb-2 text-xs uppercase tracking-[0.15em] text-slate-500">
        {label}
      </div>

      <div
        className={`text-2xl font-bold tracking-tight ${toneMap[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}
