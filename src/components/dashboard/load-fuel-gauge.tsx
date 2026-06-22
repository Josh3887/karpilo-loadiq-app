"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Fuel, MapPin, X } from "lucide-react";

import {
  calculateFuelGauge,
  getLoadRunStatusLabel,
  isFuelGaugeEntitledTier,
  type FuelGaugeBand,
} from "@/lib/fuel-gauge";
import type { LoadInput, LoadResult } from "@/types/load";
import { formatCurrency, formatFuelPrice, formatNumber } from "@/utils/format";
import { cn } from "@/utils/cn";

type LoadFuelGaugeProps = {
  input: LoadInput;
  result: LoadResult;
  entitlementTier?: string | null;
};

type LocationState =
  | { status: "idle"; message: string }
  | { status: "pending"; message: string }
  | { status: "ready"; message: string }
  | { status: "blocked"; message: string };

export function LoadFuelGauge({
  input,
  result,
  entitlementTier,
}: LoadFuelGaugeProps) {
  const [manualAlertOpen, setManualAlertOpen] = useState(false);
  const [dismissedAlertKey, setDismissedAlertKey] = useState("");
  const [locationState, setLocationState] = useState<LocationState>({
    status: "idle",
    message: "Location not attached to this load session.",
  });

  const entitled = isFuelGaugeEntitledTier(entitlementTier);
  const gauge = useMemo(
    () =>
      calculateFuelGauge({
        loadRunStatus: input.loadRunStatus,
        totalMiles: result.totalMiles,
        mpg: input.mpg,
        fuelPrice: input.fuelPrice,
        fuelTankCount: input.fuelTankCount,
        fuelTankCapacityGallons: input.fuelTankCapacityGallons,
        startingFuelPercent: input.startingFuelPercent,
      }),
    [
      input.fuelPrice,
      input.fuelTankCapacityGallons,
      input.fuelTankCount,
      input.loadRunStatus,
      input.mpg,
      input.startingFuelPercent,
      result.totalMiles,
    ]
  );

  const nextAlertKey = `${input.loadRunStatus}:${gauge.band}:${result.totalMiles}:${input.startingFuelPercent}`;
  const alertOpen =
    manualAlertOpen ||
    (entitled &&
      gauge.shouldAlert &&
      gauge.band !== "inactive" &&
      dismissedAlertKey !== nextAlertKey);

  if (!entitled) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              <Fuel className="h-4 w-4" />
              Platinum / Pro Fuel Gauge
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Active-load fuel range alerts are reserved for Platinum and Pro.
              Current tiers can still use fuel price, MPG, and fuel cost inside
              the standard load calculation.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Bonus feature
          </span>
        </div>
      </div>
    );
  }

  if (gauge.band === "inactive") {
    return null;
  }

  return (
    <div className={cn("rounded-xl border p-5", gaugeShellClass(gauge.band))}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
            <Fuel className="h-4 w-4" />
            Load Fuel Gauge
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", badgeClass(gauge.band))}>
              {gauge.label}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {gauge.message}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Status: {getLoadRunStatusLabel(input.loadRunStatus)}. Fuel gauge
            uses the load miles, profile MPG, tank setup, starting fuel, and
            {input.fuelPrice > 0
              ? ` ${formatFuelPrice(input.fuelPrice)} fuel price.`
              : " entered fuel price."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setManualAlertOpen(true)}
          className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-200 transition hover:bg-sky-400/20"
        >
          Gauge Alert
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(17rem,24rem)_1fr] lg:items-center">
        <FuelGaugeDial gauge={gauge} locationStatus={locationState.status} />

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                Gauge Reading
              </p>
              <p className="mt-2 text-xl font-black text-slate-100">
                {gauge.label}
              </p>
            </div>
            <span
              className={cn(
                "h-3 w-3 rounded-full shadow-[0_0_18px_currentColor]",
                indicatorDotClass(gauge.band)
              )}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {gauge.message}
          </p>
          <div className="mt-4 grid gap-2 text-xs leading-5 text-slate-500 sm:grid-cols-2">
            <span>Load status: {getLoadRunStatusLabel(input.loadRunStatus)}</span>
            <span>Preset: {formatNumber(input.startingFuelPercent)}% tank</span>
            <span>MPG: {formatNumber(input.mpg)}</span>
            <span>
              Fuel price:{" "}
              {input.fuelPrice > 0
                ? formatFuelPrice(input.fuelPrice)
                : "not set"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <GaugeMetric
          label="Fuel On Board"
          value={`${formatNumber(gauge.startingFuelGallons)} gal`}
          detail={`${formatNumber(gauge.totalFuelCapacityGallons)} gal capacity`}
        />
        <GaugeMetric
          label="Trip Burn"
          value={`${formatNumber(gauge.estimatedTripGallons)} gal`}
          detail={formatCurrency(gauge.estimatedTripFuelCost)}
        />
        <GaugeMetric
          label="Starting Range"
          value={`${formatNumber(gauge.startingRangeMiles)} mi`}
          detail={`${formatNumber(input.mpg)} MPG`}
        />
        <GaugeMetric
          label="Post-Load Buffer"
          value={`${formatNumber(gauge.remainingRangeMiles)} mi`}
          detail={`${formatNumber(gauge.reserveRangeMiles)} mi reserve`}
        />
      </div>

      <div className="mt-5 rounded-xl border border-slate-800 bg-[#060B14] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-300">
              <MapPin className="h-4 w-4 text-sky-300" />
              Location Signal
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {locationState.message}
            </p>
          </div>
          <button
            type="button"
            onClick={attachLocation}
            disabled={locationState.status === "pending"}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-200 transition hover:border-sky-400/40 disabled:text-slate-500"
          >
            Attach Location
          </button>
        </div>
      </div>

      {alertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-sky-400/30 bg-[#07111f] p-5 shadow-[0_0_60px_rgba(14,165,233,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                  <AlertTriangle className="h-4 w-4" />
                  Fuel Gauge Alert
                </div>
                <h3 className="mt-2 text-2xl font-black text-slate-50">
                  {gauge.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManualAlertOpen(false);
                  setDismissedAlertKey(nextAlertKey);
                }}
                aria-label="Close fuel gauge alert"
                className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-300 transition hover:border-sky-400/40 hover:text-sky-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              {gauge.message}
            </p>

            <div className="mt-5">
              <FuelGaugeDial
                gauge={gauge}
                locationStatus={locationState.status}
                compact
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <GaugeMetric
                label="Remaining Buffer"
                value={`${formatNumber(gauge.remainingRangeMiles)} mi`}
                detail="After planned load miles"
              />
              <GaugeMetric
                label="Reserve Range"
                value={`${formatNumber(gauge.reserveRangeMiles)} mi`}
                detail="Minimum planning buffer"
              />
            </div>

            <p className="mt-5 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-6 text-slate-500">
              This is an operational planning alert, not a dispatch command,
              route guarantee, fuel-price guarantee, or compliance instruction.
              Verify route conditions, safe stopping options, payment terms,
              fuel card pricing, and actual tank readings before purchase
              decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  function attachLocation() {
    if (!("geolocation" in navigator)) {
      setLocationState({
        status: "blocked",
        message: "Browser geolocation is unavailable on this device.",
      });
      return;
    }

    setLocationState({
      status: "pending",
      message: "Requesting location for this active load session...",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          status: "ready",
          message: `Location attached at ${position.coords.latitude.toFixed(
            4
          )}, ${position.coords.longitude.toFixed(
            4
          )}. Route-mile math remains based on the load calculation until Google Maps/AWS Geo routing is wired.`,
        });
      },
      () => {
        setLocationState({
          status: "blocked",
          message:
            "Location permission was blocked or unavailable. Fuel gauge remains tied to the load's entered route miles.",
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }
}

function GaugeMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-slate-100">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function FuelGaugeDial({
  gauge,
  locationStatus,
  compact = false,
}: {
  gauge: ReturnType<typeof calculateFuelGauge>;
  locationStatus: LocationState["status"];
  compact?: boolean;
}) {
  const dialPercent = getDialPercent(gauge);
  const needleAngle = 180 + dialPercent * 1.8;
  const needleEnd = polarPoint(140, 138, compact ? 72 : 84, needleAngle);
  const live = locationStatus === "ready" || locationStatus === "pending";
  const ticks = [180, 210, 240, 270, 300, 330, 360];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_72%,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-4 shadow-inner",
        compact ? "mx-auto max-w-sm" : "min-h-64"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-6 rounded-full blur-2xl",
          dialGlowClass(gauge.band),
          live ? "animate-pulse opacity-70" : "opacity-40"
        )}
      />

      <svg
        viewBox="0 0 280 185"
        role="img"
        aria-label={`Fuel gauge reads ${gauge.label}`}
        className="relative z-10 h-full min-h-48 w-full"
      >
        <path
          d={describeArc(140, 138, 104, 180, 360)}
          className="stroke-slate-900"
          strokeWidth="24"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={describeArc(140, 138, 104, 180, 232)}
          className="stroke-red-500"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={describeArc(140, 138, 104, 236, 292)}
          className="stroke-amber-300"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={describeArc(140, 138, 104, 296, 360)}
          className="stroke-emerald-400"
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
        />

        {ticks.map((angle) => {
          const outer = polarPoint(140, 138, 91, angle);
          const inner = polarPoint(140, 138, angle % 90 === 0 ? 72 : 78, angle);

          return (
            <line
              key={angle}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              className="stroke-slate-200/80"
              strokeWidth={angle % 90 === 0 ? 3 : 2}
              strokeLinecap="round"
            />
          );
        })}

        <line
          x1="140"
          y1="138"
          x2={needleEnd.x}
          y2={needleEnd.y}
          className={cn(
            "origin-center transition-all duration-700",
            needleClass(gauge.band)
          )}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="140" cy="138" r="17" className="fill-slate-950" />
        <circle
          cx="140"
          cy="138"
          r="10"
          className={cn("fill-current", indicatorDotClass(gauge.band))}
        />

        <text
          x="37"
          y="153"
          className="fill-slate-500 text-[16px] font-black"
        >
          E
        </text>
        <text
          x="232"
          y="153"
          className="fill-slate-500 text-[16px] font-black"
        >
          F
        </text>
        <text
          x="140"
          y="38"
          textAnchor="middle"
          className="fill-slate-300 text-[10px] font-black uppercase tracking-[0.16em]"
        >
          Active Load Fuel
        </text>
      </svg>

      <div className="relative z-10 -mt-3 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        <span>Reserve</span>
        <span
          className={cn(
            "rounded-full border px-2 py-1",
            live
              ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
              : "border-slate-800 bg-slate-950 text-slate-500"
          )}
        >
          {live ? "Live signal" : "Preset signal"}
        </span>
        <span>Good</span>
      </div>
    </div>
  );
}

function gaugeShellClass(band: FuelGaugeBand) {
  if (band === "green") return "border-emerald-400/25 bg-emerald-400/5";
  if (band === "yellow") return "border-amber-300/25 bg-amber-300/5";
  if (band === "red" || band === "unavailable") {
    return "border-red-400/25 bg-red-500/5";
  }
  return "border-slate-800 bg-[#060B14]";
}

function badgeClass(band: FuelGaugeBand) {
  if (band === "green") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (band === "yellow") return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  if (band === "red" || band === "unavailable") {
    return "border-red-400/30 bg-red-500/10 text-red-200";
  }
  return "border-slate-700 bg-slate-900 text-slate-300";
}

function getDialPercent(gauge: ReturnType<typeof calculateFuelGauge>) {
  if (gauge.band === "unavailable") return 0;
  if (gauge.band === "red") {
    return clamp((gauge.routeCoveragePercent / 105) * 32, 0, 32);
  }
  if (gauge.band === "yellow") {
    return clamp(34 + ((gauge.routeCoveragePercent - 105) / 25) * 28, 34, 62);
  }

  return clamp(68 + ((gauge.routeCoveragePercent - 130) / 70) * 32, 68, 100);
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarPoint(cx, cy, radius, startAngle);
  const end = polarPoint(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x,
    end.y,
  ].join(" ");
}

function indicatorDotClass(band: FuelGaugeBand) {
  if (band === "green") return "bg-emerald-300 text-emerald-300";
  if (band === "yellow") return "bg-amber-300 text-amber-300";
  if (band === "red" || band === "unavailable") {
    return "bg-red-400 text-red-400";
  }
  return "bg-slate-500 text-slate-500";
}

function dialGlowClass(band: FuelGaugeBand) {
  if (band === "green") return "bg-emerald-400/25";
  if (band === "yellow") return "bg-amber-300/25";
  if (band === "red" || band === "unavailable") return "bg-red-500/25";
  return "bg-slate-500/20";
}

function needleClass(band: FuelGaugeBand) {
  if (band === "green") return "stroke-emerald-100 drop-shadow-[0_0_10px_rgba(110,231,183,0.7)]";
  if (band === "yellow") return "stroke-amber-100 drop-shadow-[0_0_10px_rgba(252,211,77,0.7)]";
  if (band === "red" || band === "unavailable") {
    return "stroke-red-100 drop-shadow-[0_0_10px_rgba(248,113,113,0.7)]";
  }
  return "stroke-slate-200";
}
