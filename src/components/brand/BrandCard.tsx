"use client";

import Image from "next/image";
import { ReactNode, useState } from "react";

import { BRAND } from "@/config/brand";
import { cn } from "@/utils/cn";

type BrandCardProps = {
  className?: string;
  imageClassName?: string;
  alt?: string;
  priority?: boolean;
  overlay?: ReactNode;
  fallbackLabel?: string;
};

export function BrandCard({
  className,
  imageClassName,
  alt = BRAND.alt.cardImage,
  priority = false,
  overlay,
  fallbackLabel = BRAND.productName,
}: BrandCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-800 bg-[#08111F]",
        className
      )}
    >
      {!imageFailed ? (
        <Image
          src={BRAND.assets.cardImage}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 420px, 100vw"
          className={cn("object-cover", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[#060B14] p-6 text-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-sky-300">
              {BRAND.shortName}
            </p>
            <p className="mt-3 text-2xl font-black text-slate-100">
              {fallbackLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Brand visual unavailable
            </p>
          </div>
        </div>
      )}

      {overlay && <div className="absolute inset-0">{overlay}</div>}
    </div>
  );
}
