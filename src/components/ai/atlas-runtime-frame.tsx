"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import type { AtlasIntelligenceLayer } from "@/lib/atlas/atlas-registry";

type AtlasRuntimeFrameProps = {
  layer: AtlasIntelligenceLayer;
  description: string;
  children: ReactNode;
  action?: ReactNode;
  signal?: ReactNode;
  compact?: boolean;
  className?: string;
};

type AtlasMetricTileProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  layer: AtlasIntelligenceLayer;
};

type AtlasInfoBlockProps = {
  title: string;
  body: string;
  layer: AtlasIntelligenceLayer;
};

export function AtlasRuntimeFrame({
  layer,
  description,
  children,
  action,
  signal,
  compact = false,
  className = "",
}: AtlasRuntimeFrameProps) {
  return (
    <section
      className={[
        "atlas-runtime-surface overflow-hidden rounded-2xl border bg-[#050B14] text-slate-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={getAtlasRuntimeStyle(layer)}
    >
      <div className="relative z-10">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--atlas-accent)] to-transparent opacity-70"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-44 opacity-[0.14] md:block"
        >
          <Image
            src={layer.assets.dashboardAlt}
            alt=""
            fill
            sizes="176px"
            className="object-cover"
          />
        </div>

        <div
          className={[
            "relative grid gap-4",
            compact
              ? "p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
              : "p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div
              className={[
                "atlas-runtime-node relative shrink-0 overflow-hidden rounded-2xl border bg-white/5",
                compact ? "h-11 w-11" : "h-12 w-12 sm:h-14 sm:w-14",
              ].join(" ")}
            >
              <Image
                src={layer.assets.emblem}
                alt=""
                fill
                sizes={compact ? "44px" : "56px"}
                className="h-full w-full object-cover"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--atlas-accent)] sm:text-xs">
                {layer.runtimeId}
              </p>
              <h3
                className={[
                  "mt-1 font-black text-slate-50",
                  compact ? "text-sm" : "text-lg sm:text-xl",
                ].join(" ")}
              >
                {layer.publicName}
              </h3>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400 sm:text-sm sm:leading-6">
                {description}
              </p>
            </div>
          </div>

          {action && <div className="relative min-w-0">{action}</div>}
        </div>

        {signal && (
          <div className="relative border-t border-white/10 p-4 sm:p-5">
            {signal}
          </div>
        )}

        <div className="relative border-t border-white/10 p-4 sm:p-5">
          {children}
        </div>
      </div>
    </section>
  );
}

export function AtlasMetricTile({
  label,
  value,
  detail,
  icon,
  layer,
}: AtlasMetricTileProps) {
  return (
    <div
      className="min-w-0 rounded-xl border bg-black/20 p-4"
      style={{
        borderColor: `${layer.colorIdentity.primary}22`,
        backgroundColor: "rgba(255,255,255,0.025)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--atlas-accent)]">
          {label}
        </p>
        {icon && <span className="text-[var(--atlas-accent)]">{icon}</span>}
      </div>
      <p className="mt-2 break-words text-sm font-black text-slate-100">
        {value}
      </p>
      {detail && (
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      )}
    </div>
  );
}

export function AtlasInfoBlock({ title, body, layer }: AtlasInfoBlockProps) {
  return (
    <div
      className="rounded-xl border bg-black/20 p-4"
      style={{ borderColor: `${layer.colorIdentity.primary}26` }}
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--atlas-accent)]">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
    </div>
  );
}

function getAtlasRuntimeStyle(layer: AtlasIntelligenceLayer): CSSProperties {
  return {
    "--atlas-accent": layer.colorIdentity.accent,
    "--atlas-primary": layer.colorIdentity.primary,
    borderColor: `${layer.colorIdentity.primary}42`,
    boxShadow: `0 0 34px ${layer.colorIdentity.glow}`,
  } as CSSProperties;
}
