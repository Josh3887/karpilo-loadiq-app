import { Lock } from "lucide-react";

export function LockedFeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-[#0B1220] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-100">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <Lock className="h-5 w-5 shrink-0 text-sky-300" />
      </div>
      <p className="mt-4 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-red-100">
        Coming soon / locked
      </p>
    </article>
  );
}
