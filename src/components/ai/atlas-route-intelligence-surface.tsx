"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, GitBranch, Route } from "lucide-react";

import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";
import { formatNumber, formatPercent } from "@/utils/format";

type AtlasRouteIntelligenceSurfaceProps = {
  deadheadOrigin?: string | null;
  pickup?: string | null;
  delivery?: string | null;
  loadedMiles?: number | null;
  deadheadMiles?: number | null;
  totalMiles?: number | null;
  deadheadPercent?: number | null;
  routeStopCount?: number | null;
  stopOffCount?: number | null;
  dispatchDays?: number | null;
  deadheadDays?: number | null;
  pickupDate?: string | null;
  deliveryDate?: string | null;
  deadheadStartDate?: string | null;
  deadheadEndDate?: string | null;
  estimatedLoadWeightLbs?: number | null;
  routeModelVersion?: string | null;
  reserveMode?: string | null;
  targetRpmSnapshot?: string | null;
  compact?: boolean;
};

const ATLAS_ROUTE_LAYER = ATLAS_INTELLIGENCE_LAYERS.route;

export function AtlasRouteIntelligenceSurface({
  deadheadOrigin,
  pickup,
  delivery,
  loadedMiles,
  deadheadMiles,
  totalMiles,
  deadheadPercent,
  routeStopCount,
  stopOffCount,
  dispatchDays,
  deadheadDays,
  pickupDate,
  deliveryDate,
  deadheadStartDate,
  deadheadEndDate,
  estimatedLoadWeightLbs,
  routeModelVersion,
  reserveMode,
  targetRpmSnapshot,
  compact = false,
}: AtlasRouteIntelligenceSurfaceProps) {
  const routeSignal = getRouteSignal({
    deadheadPercent,
    stopOffCount,
    deadheadDays,
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-red-400/25 bg-[#120608] shadow-[0_0_34px_rgba(239,68,68,0.08)]">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/70 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 hidden h-full w-48 opacity-20 md:block"
        >
          <Image
            src={ATLAS_ROUTE_LAYER.assets.dashboardAlt}
            alt=""
            fill
            sizes="192px"
            className="object-cover"
          />
        </div>

        <div className="relative grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-red-300/25 bg-red-400/10 shadow-[0_0_28px_rgba(239,68,68,0.18)]">
              <Image
                src={ATLAS_ROUTE_LAYER.assets.emblem}
                alt=""
                fill
                sizes="56px"
                className="h-full w-full object-cover"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-200">
                {ATLAS_ROUTE_LAYER.runtimeId}
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-50">
                {ATLAS_ROUTE_LAYER.publicName}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Movement telemetry for repositioning distance, pickup-to-delivery
                flow, stop-off complexity, timing pressure, and corridor
                efficiency. Route values remain user-entered operational context.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 lg:max-w-72">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-red-200">
              Movement Signal
            </p>
            <p className="mt-2 text-sm font-black text-slate-100">
              {routeSignal.title}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {routeSignal.body}
            </p>
          </div>
        </div>

        <div className="relative border-t border-red-400/10 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <RouteTelemetryMetric
              label="Movement Flow"
              value={formatMovementFlow(pickup, delivery)}
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            />
            <RouteTelemetryMetric
              label="Deadhead Exposure"
              value={
                Number.isFinite(Number(deadheadPercent))
                  ? formatPercent(Number(deadheadPercent))
                  : "Not modeled"
              }
              detail={
                Number(deadheadMiles) > 0
                  ? `${formatNumber(Number(deadheadMiles))} unpaid mi`
                  : "No deadhead miles entered"
              }
            />
            <RouteTelemetryMetric
              label="Stop Complexity"
              value={`${Number(routeStopCount ?? 0)} total`}
              detail={`${Number(stopOffCount ?? 0)} stop-off`}
              icon={<GitBranch className="h-4 w-4" aria-hidden="true" />}
            />
          </div>

          {!compact && (
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <RouteContextRow
                label="Deadhead Origin"
                value={deadheadOrigin || "Not provided"}
              />
              <RouteContextRow
                label="Loaded / Total Miles"
                value={`${formatOptionalMiles(loadedMiles)} / ${formatOptionalMiles(totalMiles)}`}
              />
              <RouteContextRow
                label="Pickup Window"
                value={formatDateValue(pickupDate)}
              />
              <RouteContextRow
                label="Delivery Window"
                value={formatDateValue(deliveryDate)}
              />
              <RouteContextRow
                label="Deadhead Dates"
                value={formatDateRange(deadheadStartDate, deadheadEndDate)}
              />
              <RouteContextRow
                label="Timing Load"
                value={`${formatOptionalDays(dispatchDays)} dispatch · ${formatOptionalDays(deadheadDays)} deadhead`}
              />
              <RouteContextRow
                label="Estimated Weight"
                value={
                  Number(estimatedLoadWeightLbs) > 0
                    ? `${formatNumber(Number(estimatedLoadWeightLbs))} lbs est.`
                    : "Not provided"
                }
              />
              <RouteContextRow
                label="Route Model"
                value={routeModelVersion || "Manual route context"}
              />
              {reserveMode && (
                <RouteContextRow label="Reserve Mode" value={reserveMode} />
              )}
              {targetRpmSnapshot && (
                <RouteContextRow
                  label="Target RPM Snapshot"
                  value={targetRpmSnapshot}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function RouteTelemetryMetric({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-red-400/10 bg-[#18090B] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-red-200">
          {label}
        </p>
        {icon ?? <Route className="h-4 w-4 text-red-200" aria-hidden="true" />}
      </div>
      <p className="mt-2 text-sm font-black text-slate-100">{value}</p>
      {detail && <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>}
    </div>
  );
}

function RouteContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-red-400/10 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function getRouteSignal({
  deadheadPercent,
  stopOffCount,
  deadheadDays,
}: {
  deadheadPercent?: number | null;
  stopOffCount?: number | null;
  deadheadDays?: number | null;
}) {
  if (Number(deadheadPercent) >= 30) {
    return {
      title: "Elevated Repositioning Pressure",
      body:
        "Atlas Route Intelligence detected deadhead imbalance against loaded efficiency.",
    };
  }

  if (Number(stopOffCount) >= 2) {
    return {
      title: "Multi-Stop Complexity Pressure",
      body:
        "Route telemetry indicates added movement and timing coordination across stops.",
    };
  }

  if (Number(deadheadDays) > 0) {
    return {
      title: "Deadhead Time Attached",
      body:
        "Movement timing includes repositioning days before pickup. Watch daily net dilution.",
    };
  }

  return {
    title: "Route Structure Stable",
    body:
      "Movement telemetry is currently simple pickup-to-delivery context with limited route complexity.",
  };
}

function formatMovementFlow(pickup?: string | null, delivery?: string | null) {
  if (pickup && delivery) return `${pickup} -> ${delivery}`;
  return "Lane pending";
}

function formatOptionalMiles(value?: number | null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? `${formatNumber(numeric)} mi`
    : "not modeled";
}

function formatOptionalDays(value?: number | null) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? `${formatNumber(numeric)} days`
    : "0 days";
}

function formatDateValue(value: string | null | undefined) {
  if (!value) return "Not provided";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (!Number.isFinite(date.getTime())) return "Not provided";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined
) {
  if (!start && !end) return "Not provided";

  return `${formatDateValue(start)} -> ${formatDateValue(end)}`;
}
