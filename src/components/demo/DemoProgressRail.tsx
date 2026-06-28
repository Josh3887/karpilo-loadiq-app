"use client";

import { DemoStep } from "@/demo/loadiq-demo-types";
import { cn } from "@/utils/cn";

export function DemoProgressRail({
  steps,
  activeIndex,
  onSelect,
  recording,
}: {
  steps: DemoStep[];
  activeIndex: number;
  onSelect: (index: number) => void;
  recording: boolean;
}) {
  const activeSection = steps[activeIndex]?.section;
  const sections = Array.from(new Set(steps.map((step) => step.section)));

  return (
    <aside className="rounded-2xl border border-slate-800 bg-[#08111F]/95 p-4">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-300">
        Walkthrough
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {sections.map((section) => {
          const sectionIndex = steps.findIndex((step) => step.section === section);

          return (
            <button
              key={section}
              type="button"
              disabled={recording}
              onClick={() => onSelect(sectionIndex)}
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-black uppercase tracking-[0.12em]",
                activeSection === section
                  ? "border-sky-400/50 bg-sky-400/10 text-sky-100"
                  : "border-slate-800 bg-[#060B14] text-slate-500 hover:border-sky-400/30"
              )}
            >
              {section}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid max-h-[calc(100vh-260px)] gap-2 overflow-auto pr-1">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;

          return (
            <button
              key={step.key}
              type="button"
              disabled={recording}
              onClick={() => onSelect(index)}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition",
                isActive
                  ? "border-sky-400/50 bg-sky-400/10 text-sky-100"
                  : isComplete
                    ? "border-emerald-400/20 bg-emerald-500/5 text-emerald-100"
                    : "border-slate-800 bg-[#060B14] text-slate-400 hover:border-sky-400/30"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black",
                  isActive
                    ? "border-sky-300 text-sky-200"
                    : isComplete
                      ? "border-emerald-300 text-emerald-200"
                      : "border-slate-700 text-slate-500"
                )}
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-[0.14em]">
                  {step.eyebrow}
                </span>
                <span className="mt-1 block truncate text-sm font-bold">
                  {step.title}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
