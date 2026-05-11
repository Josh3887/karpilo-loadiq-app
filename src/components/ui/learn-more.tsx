"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";

type LearnMoreProps = {
  title: string;
  summary: string;
  detail: string;
};

export function LearnMore({ title, summary, detail }: LearnMoreProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 text-left"
      >
        <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
        <span>
          <span className="block text-sm font-bold text-sky-100">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-400">
            {summary}
          </span>
        </span>
      </button>

      {open && (
        <p className="mt-3 border-t border-sky-400/10 pt-3 text-xs leading-5 text-slate-300">
          {detail}
        </p>
      )}
    </div>
  );
}
