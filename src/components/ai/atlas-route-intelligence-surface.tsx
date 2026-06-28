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
  equipmentType?: string | null;
  equipmentPackLabel?: string | null;
  combinationType?: string | null;
  equipmentDimensions?: string | null;
  maxPayloadLbs?: number | null;
  grossVehicleWeightRatingLbs?: number | null;
  axleCount?: number | null;
  hazmatCapable?: boolean | null;
  tankerCapable?: boolean | null;
  refrigeratedCapable?: boolean | null;
  routeRestrictionNotes?: string | null;
  routeModelVersion?: string | null;
  reserveMode?: string | null;
  targetRpmSnapshot?: string | null;
  canUseTruckSpecificRouting?: boolean;
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
  equipmentType,
  equipmentPackLabel,
  combinationType,
  equipmentDimensions,
  maxPayloadLbs,
  grossVehicleWeightRatingLbs,
  axleCount,
  hazmatCapable,
  tankerCapable,
  refrigeratedCapable,
  routeRestrictionNotes,
  routeModelVersion,
  reserveMode,
  targetRpmSnapshot,
  canUseTruckSpecificRouting = false,
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
  const truckRoutingEligible = canUseTruckSpecificRouting;

  return (
    <AtlasRuntimeFrame
      layer={ATLAS_ROUTE_LAYER}
      compact={compact}
      description="Educational context for repositioning distance, pickup-to-delivery flow, stop-off complexity, timing pressure, equipment assumptions, and route assumptions. Route and vehicle values remain user-entered context; truck-specific provider routing is Platinum/Pro only."
      signal={
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <AtlasMetricTile
              label="Equipment Context"
              value={equipmentPackLabel || equipmentType || "Not set"}
              detail={combinationType || "Combination not set"}
              layer={ATLAS_ROUTE_LAYER}
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
            <p className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.14em] text-slate-300">
              {truckRoutingEligible
                ? "Platinum/Pro truck routing eligible"
                : "Manual context only"}
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

          <AtlasInfoBlock
            title="Truck-Specific Routing Boundary"
            body={
              truckRoutingEligible
                ? "This tier is eligible for future truck-specific provider routing estimates when Google Maps, AWS Geo, and vehicle-parameter routing are wired. Equipment values remain planning assumptions only and do not certify route legality, clearances, bridge limits, permits, hazmat routing, or securement."
                : "This view shows manual route context only. Truck-specific provider routing, vehicle-constraint routing, and enriched route intelligence are reserved for Platinum/Pro. Equipment values do not certify fit, route legality, permits, hazmat routing, or securement."
            }
            layer={ATLAS_ROUTE_LAYER}
          />

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
              label="Equipment"
              value={equipmentPackLabel || equipmentType || "Not provided"}
            />
            <RouteContextRow
              label="Combination"
              value={combinationType || "Not provided"}
            />
            <RouteContextRow
              label="Equipment Dimensions"
              value={equipmentDimensions || "Not provided"}
            />
            <RouteContextRow
              label="Payload / GVWR"
              value={formatWeightPair(maxPayloadLbs, grossVehicleWeightRatingLbs)}
            />
            <RouteContextRow
              label="Axles / Capability"
              value={formatCapabilitySummary({
                axleCount,
                hazmatCapable,
                tankerCapable,
                refrigeratedCapable,
              })}
            />
            <RouteContextRow
              label="Route Restriction Notes"
              value={routeRestrictionNotes || "Not provided"}
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

function formatWeightPair(
  maxPayloadLbs?: number | null,
  grossVehicleWeightRatingLbs?: number | null
) {
  const payload = Number(maxPayloadLbs);
  const gross = Number(grossVehicleWeightRatingLbs);
  const payloadLabel =
    Number.isFinite(payload) && payload > 0
      ? `${formatNumber(payload)} lbs payload`
      : "payload not set";
  const grossLabel =
    Number.isFinite(gross) && gross > 0
      ? `${formatNumber(gross)} lbs gross`
      : "gross not set";

  return `${payloadLabel} / ${grossLabel}`;
}

function formatCapabilitySummary({
  axleCount,
  hazmatCapable,
  tankerCapable,
  refrigeratedCapable,
}: {
  axleCount?: number | null;
  hazmatCapable?: boolean | null;
  tankerCapable?: boolean | null;
  refrigeratedCapable?: boolean | null;
}) {
  const flags = [
    hazmatCapable ? "hazmat capable" : "",
    tankerCapable ? "tanker capable" : "",
    refrigeratedCapable ? "reefer capable" : "",
  ].filter(Boolean);
  const axleLabel =
    Number(axleCount) > 0 ? `${Number(axleCount)} axles` : "axles not set";

  return [axleLabel, ...flags].join(" / ");
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
