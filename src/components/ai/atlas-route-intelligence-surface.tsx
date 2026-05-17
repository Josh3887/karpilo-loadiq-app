"use client";

import { ArrowRight, GitBranch } from "lucide-react";

import {
  AtlasInfoBlock,
  AtlasMetricTile,
  AtlasRuntimeFrame,
} from "@/components/ai/atlas-runtime-frame";
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
    loadedMiles,
    deadheadMiles,
    dispatchDays,
  });

  return (
    <AtlasRuntimeFrame
      layer={ATLAS_ROUTE_LAYER}
      compact={compact}
      description="Educational context for repositioning distance, pickup-to-delivery flow, stop-off complexity, timing pressure, and route assumptions. Route values remain user-entered context."
      signal={
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="grid gap-3 md:grid-cols-3">
            <AtlasMetricTile
              label="Movement Flow"
              value={formatMovementFlow(pickup, delivery)}
              layer={ATLAS_ROUTE_LAYER}
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            />
            <AtlasMetricTile
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
              layer={ATLAS_ROUTE_LAYER}
            />
            <AtlasMetricTile
              label="Stop Complexity"
              value={`${Number(routeStopCount ?? 0)} total`}
              detail={`${Number(stopOffCount ?? 0)} stop-off`}
              layer={ATLAS_ROUTE_LAYER}
              icon={<GitBranch className="h-4 w-4" aria-hidden="true" />}
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
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
      }
    >
      {!compact && (
        <div className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-3">
            <AtlasInfoBlock
              title="Movement Signal Summary"
              body={routeSignal.movementSummary}
              layer={ATLAS_ROUTE_LAYER}
            />
            <AtlasInfoBlock
              title="Corridor Pressure"
              body={routeSignal.corridorPressure}
              layer={ATLAS_ROUTE_LAYER}
            />
            <AtlasInfoBlock
              title="Timing Interpretation"
              body={routeSignal.timingInterpretation}
              layer={ATLAS_ROUTE_LAYER}
            />
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-2">
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
        </div>
      )}
    </AtlasRuntimeFrame>
  );
}

function RouteContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-white/10 pb-2 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <span className="text-slate-400">{label}</span>
      <span className="break-words font-semibold text-slate-200 sm:text-right">
        {value}
      </span>
    </div>
  );
}

function getRouteSignal({
  deadheadPercent,
  stopOffCount,
  deadheadDays,
  loadedMiles,
  deadheadMiles,
  dispatchDays,
}: {
  deadheadPercent?: number | null;
  stopOffCount?: number | null;
  deadheadDays?: number | null;
  loadedMiles?: number | null;
  deadheadMiles?: number | null;
  dispatchDays?: number | null;
}) {
  const loaded = Number(loadedMiles);
  const deadhead = Number(deadheadMiles);
  const dispatch = Number(dispatchDays);
  const deadheadTiming = Number(deadheadDays);
  const safeDeadhead = Number.isFinite(deadhead) ? Math.max(deadhead, 0) : 0;
  const movementSummary =
    Number.isFinite(loaded) && loaded > 0
      ? `Loaded movement is modeled at ${formatNumber(loaded)} miles with ${formatNumber(safeDeadhead)} deadhead miles attached.`
      : "Loaded movement is not fully modeled yet.";
  const corridorPressure =
    Number(deadheadPercent) >= 30
      ? "Corridor efficiency is reduced by elevated repositioning distance before paid freight begins."
      : Number(stopOffCount) >= 2
        ? "Corridor pressure is shaped by multiple stop events and coordination points."
        : "Corridor pressure is currently controlled by a simple pickup-to-delivery structure.";
  const timingInterpretation =
    Number(dispatch) + Number(deadheadTiming) > 0
      ? `Timing context includes ${formatOptionalDays(dispatch)} dispatch and ${formatOptionalDays(deadheadTiming)} deadhead.`
      : "Timing context is not fully modeled yet.";

  if (Number(deadheadPercent) >= 30) {
    return {
      title: "Elevated Repositioning Pressure",
      body:
        "Atlas Operational Context detected deadhead imbalance against loaded efficiency.",
      movementSummary,
      corridorPressure,
      timingInterpretation,
    };
  }

  if (Number(stopOffCount) >= 2) {
    return {
      title: "Multi-Stop Complexity Pressure",
      body:
        "Route telemetry indicates added movement and timing coordination across stops.",
      movementSummary,
      corridorPressure,
      timingInterpretation,
    };
  }

  if (Number(deadheadDays) > 0) {
    return {
      title: "Deadhead Time Attached",
      body:
        "Movement timing includes repositioning days before pickup. Watch daily net dilution.",
      movementSummary,
      corridorPressure,
      timingInterpretation,
    };
  }

  return {
    title: "Route Structure Stable",
    body:
      "Movement telemetry is currently simple pickup-to-delivery context with limited route complexity.",
    movementSummary,
    corridorPressure,
    timingInterpretation,
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
