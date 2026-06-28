import { ReactNode } from "react";

import { cn } from "@/utils/cn";

type DemoStepCardProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
};

export function DemoStepCard({
  eyebrow,
  title,
  children,
  className,
  bodyClassName,
  compact = false,
}: DemoStepCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_30px_rgba(56,189,248,0.08)]",
        className
      )}
    >
      <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-300">
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-2 font-black tracking-tight text-slate-100",
          compact ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
        )}
      >
        {title}
      </h2>
      <div className={cn(compact ? "mt-3" : "mt-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
