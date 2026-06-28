import { Captions, Video } from "lucide-react";

import { cn } from "@/utils/cn";

export function DemoNarration({
  narration,
  recording,
}: {
  narration: string;
  recording: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-4 rounded-xl border border-sky-400/25 bg-sky-400/10 p-4 text-sky-50",
        recording && "mb-3 shrink-0 p-3"
      )}
    >
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-sky-200">
        {recording ? (
          <Video className="h-4 w-4" />
        ) : (
          <Captions className="h-4 w-4" />
        )}
        {recording ? "Recording narration" : "Instructional narration"}
      </div>
      <p
        className={cn(
          "mt-3 text-base font-semibold leading-7 md:text-lg",
          recording && "mt-2 line-clamp-2 text-sm leading-5 md:text-base md:leading-6"
        )}
      >
        {narration}
      </p>
    </div>
  );
}
