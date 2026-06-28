"use client";

import Image from "next/image";

import {
  ATLAS_HELP_EDUCATIONAL_DISCLAIMER,
  ATLAS_HELP_PROPRIETARY_STATEMENT,
  type AtlasHelpEntry,
} from "@/lib/ai/atlas-help-registry";
import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";

type AtlasEducationPanelProps = {
  helpEntry: AtlasHelpEntry | null;
  pageSignal: string;
};

const defaultEntry: AtlasHelpEntry = {
  featureSignal: "Atlas Educational Support",
  whatThisDoes:
    "Provides embedded context for Karpilo LoadIQ tools, panels, forms, settings, and workflow actions.",
  whyItMatters:
    "The app contains operational systems that work best when the user understands what each control is for.",
  howToUseIt:
    "Use supported Atlas education buttons or Learn More controls to request a practical explanation, then continue the workflow normally.",
  operatorReminder:
    "Karpilo Atlas AI explains workflow meaning. It does not decide whether to accept, reject, dispatch, price, route, or legally classify freight.",
};

const ATLAS_EDUCATIONAL_LAYER = ATLAS_INTELLIGENCE_LAYERS.educational;

export function AtlasEducationPanel({
  helpEntry,
  pageSignal,
}: AtlasEducationPanelProps) {
  const entry = helpEntry ?? defaultEntry;

  return (
    <div className="grid gap-4">
      {!helpEntry && (
        <div className="overflow-hidden rounded-2xl border border-sky-400/20 bg-[#050B14]">
          <Image
            src={ATLAS_EDUCATIONAL_LAYER.assets.dashboard}
            alt="Atlas Educational Support"
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
        {ATLAS_HELP_EDUCATIONAL_DISCLAIMER}
      </div>

      <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-xs leading-6 text-red-100">
        {ATLAS_HELP_PROPRIETARY_STATEMENT}
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
