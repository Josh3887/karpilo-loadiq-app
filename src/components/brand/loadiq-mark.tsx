import { BRAND } from "@/config/brand";

export function LoadIqMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div
      aria-label={BRAND.alt.logo}
      className={`${sizeClass} relative grid shrink-0 place-items-center rounded-2xl border border-sky-400/30 bg-[#08111F] shadow-[0_0_28px_rgba(56,189,248,0.22)]`}
    >
      <div className="absolute inset-1 rounded-xl border border-red-400/15" />
      <div className="text-sm font-black tracking-tight text-sky-200">
        {BRAND.shortName.charAt(0)}
      </div>
      <div className="absolute bottom-2 h-0.5 w-5 rounded-full bg-red-400/70" />
    </div>
  );
}
