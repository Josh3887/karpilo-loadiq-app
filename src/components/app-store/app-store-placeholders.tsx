import { BrandAppIcon } from "@/components/brand/BrandAppIcon";
import { BRAND } from "@/config/brand";

export function AppStorePlaceholders() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 shadow-[0_0_24px_rgba(56,189,248,0.06)]">
      <div className="flex items-start gap-4">
        <BrandAppIcon size={48} />
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-sky-300">
            Account access
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-100">
            Mobile app availability coming soon
          </h2>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        {BRAND.productName} is available through account access today. Native
        mobile distribution is being prepared and will use the same shared app
        icon when store listings are ready.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <StorePill label="Pilot access" />
        <StorePill label="Launch access" />
      </div>
    </section>
  );
}

function StorePill({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-sky-400/20 bg-[#060B14] px-4 py-3 text-sm font-bold text-sky-100">
      {label} - Coming Soon
    </div>
  );
}
