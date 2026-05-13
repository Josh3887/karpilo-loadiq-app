"use client";

import Image from "next/image";
import { useState } from "react";

import { BRAND } from "@/config/brand";
import { cn } from "@/utils/cn";

type BrandAppIconProps = {
  className?: string;
  size?: number;
  priority?: boolean;
};

export function BrandAppIcon({
  className,
  size = 56,
  priority = false,
}: BrandAppIconProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-sky-400/30 bg-[#08111F] shadow-[0_0_28px_rgba(56,189,248,0.22)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={BRAND.alt.appIcon}
    >
      {!imageFailed ? (
        <Image
          src={BRAND.assets.appIcon}
          alt={BRAND.alt.appIcon}
          fill
          priority={priority}
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <div className="absolute inset-1 rounded-xl border border-red-400/15" />
          <div className="text-sm font-black tracking-tight text-sky-200">
            {BRAND.shortName.charAt(0)}
          </div>
          <div className="absolute bottom-2 h-0.5 w-5 rounded-full bg-red-400/70" />
        </>
      )}
    </div>
  );
}
