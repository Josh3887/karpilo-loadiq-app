import { ReactNode } from "react";

import type { PreviewExplanationKey } from "@/components/preview/preview-mode-provider";
import { cn } from "@/utils/cn";

type DashboardCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  previewExplanation?: PreviewExplanationKey;
};

export function DashboardCard({
  title,
  children,
  className,
  previewExplanation,
}: DashboardCardProps) {
  return (
    <div
      data-preview-explain={previewExplanation}
      className={cn(
        "rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_25px_rgba(56,189,248,0.08)] backdrop-blur-sm",
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            {title}
          </h3>
        </div>
      )}

      {children}
    </div>
  );
}
