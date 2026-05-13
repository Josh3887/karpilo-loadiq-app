import { SystemHealthNotice } from "@/services/system-health";
import { cn } from "@/utils/cn";

const statusStyles: Record<SystemHealthNotice["status"], string> = {
  info: "border-sky-400/25 bg-sky-400/10 text-sky-100",
  degraded: "border-yellow-300/25 bg-yellow-500/10 text-yellow-100",
  maintenance: "border-slate-500/30 bg-slate-500/10 text-slate-100",
  warning: "border-red-300/25 bg-red-500/10 text-red-100",
  critical: "border-red-400/40 bg-red-600/15 text-red-50",
};

export function SystemHealthBanner({
  notices,
}: {
  notices: SystemHealthNotice[];
}) {
  if (notices.length === 0) return null;

  return (
    <div className="mb-6 grid gap-3">
      {notices.map((notice) => (
        <section
          key={notice.id}
          className={cn("rounded-2xl border p-4", statusStyles[notice.status])}
        >
          <p className="text-xs font-black uppercase tracking-[0.22em] opacity-80">
            {notice.status}
          </p>
          <h2 className="mt-2 text-lg font-black">{notice.title}</h2>
          <p className="mt-2 text-sm leading-6 opacity-90">
            {notice.public_message}
          </p>
        </section>
      ))}
    </div>
  );
}
