"use client";

import Image from "next/image";

import {
  IATION_EDUCATIONAL_DISCLAIMER,
  IATION_PROPRIETARY_STATEMENT,
  type IationHelpEntry,
} from "@/lib/ai/iation-help-registry";

type IationEducationPanelProps = {
  helpEntry: IationHelpEntry | null;
  pageSignal: string;
};

const defaultEntry: IationHelpEntry = {
  featureSignal: "iAtion Signal",
  whatThisDoes:
    "Provides educational guidance for navigating Karpilo LoadIQ tools, panels, forms, settings, and workflow actions.",
  whyItMatters:
    "The app contains operational systems that work best when the user understands what each control is for.",
  howToUseIt:
    "Tap supported controls or page areas to see a practical explanation, then continue the workflow normally.",
  operatorReminder:
    "iAtion explains how the app works. It does not decide whether to accept, reject, dispatch, price, or legally classify freight.",
};

export function IationEducationPanel({
  helpEntry,
  pageSignal,
}: IationEducationPanelProps) {
  const entry = helpEntry ?? defaultEntry;

  return (
    <div className="grid gap-4">
      {!helpEntry && (
        <div className="overflow-hidden rounded-2xl border border-sky-400/20 bg-[#050B14]">
          <Image
            src="/brand/iation-philosophy-hero.jpg"
            alt="iAtion educational guidance philosophy"
            width={640}
            height={360}
            className="h-36 w-full object-cover opacity-80"
          />
        </div>
      )}

      <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          Feature Signal
        </p>
        <h3 className="mt-2 text-xl font-black text-slate-50">
          {entry.featureSignal}
        </h3>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
          Page context: {pageSignal}
        </p>
      </div>

      <EducationBlock title="What This Does" body={entry.whatThisDoes} />
      <EducationBlock title="Why It Matters" body={entry.whyItMatters} />
      <EducationBlock title="How To Use It" body={entry.howToUseIt} />
      <EducationBlock title="Operator Reminder" body={entry.operatorReminder} />

      <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4 text-xs leading-6 text-slate-500">
        {IATION_EDUCATIONAL_DISCLAIMER}
      </div>

      <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-xs leading-6 text-red-100">
        {IATION_PROPRIETARY_STATEMENT}
      </div>
    </div>
  );
}

function EducationBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#050B14] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}
