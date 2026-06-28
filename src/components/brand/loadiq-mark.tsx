import Image from "next/image";

import { BRAND } from "@/config/brand";

export function LoadIqMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass =
    size === "lg" ? "h-16 w-16" : size === "sm" ? "h-10 w-10" : "h-12 w-12";

  return (
    <div
      aria-label={BRAND.alt.logo}
      className={`${sizeClass} relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-sky-400/30 bg-[#08111F] shadow-[0_0_28px_rgba(56,189,248,0.22)]`}
    >
      <Image
        src={BRAND.assets.appIcon}
        alt={BRAND.alt.appIcon}
        fill
        sizes={size === "lg" ? "64px" : size === "sm" ? "40px" : "48px"}
        className="object-cover"
        priority={size === "lg"}
      />
    </div>
  );
}
