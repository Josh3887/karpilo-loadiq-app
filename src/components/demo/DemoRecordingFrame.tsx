import { ReactNode } from "react";

import { cn } from "@/utils/cn";

type DemoRecordingFrameProps = {
  recording: boolean;
  children: ReactNode;
};

export function DemoRecordingFrame({
  recording,
  children,
}: DemoRecordingFrameProps) {
  if (!recording) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#060B14] p-4 text-slate-100">
      <div
        className={cn(
          "mx-auto flex h-full w-full items-center justify-center",
          "max-md:items-start"
        )}
      >
        <div
          className={cn(
            "relative h-full w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-[#060B14] shadow-[0_0_40px_rgba(56,189,248,0.12)]"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
