import { OperatorBadge } from "@/types/operator-program";

const toneClasses = {
  sky: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  red: "border-red-400/30 bg-red-500/10 text-red-100",
  emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
};

export function OperatorBadges({ badges }: { badges: OperatorBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`rounded-full border px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em] ${toneClasses[badge.tone]}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
