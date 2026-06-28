"use client";

import { useEffect, useMemo, useState } from "react";

import type { LoadInput, LoadResult } from "@/types/load";
import {
  WEATHER_RISK_DISCLAIMER,
  type WeatherProfitabilityInput,
  type WeatherProfitabilityPointInput,
  type WeatherProfitabilityResult,
} from "@/types/weather-profitability";
import { formatCurrency, formatRpm } from "@/utils/format";

const LOCKED_WEATHER_MESSAGE =
  "Weather Profitability Risk is available on Platinum and Pro.";

type WeatherProfitabilityRiskPanelProps = {
  input: LoadInput;
  result: LoadResult;
  entitlementTier?: string | null;
  canUseWeatherProfitabilityRisk: boolean;
  canSaveWeatherProfitabilitySnapshot: boolean;
  onSnapshotChange?: (snapshot: WeatherProfitabilityResult | null) => void;
};

type WeatherProfitabilityApiResponse = {
  ok: boolean;
  provider: string;
  providerStatus:
    | "available"
    | "unavailable"
    | "locked"
    | "not_requested"
    | string;
  providerFreshness: "fresh" | "not_requested" | string;
  cacheStatus: "not_implemented" | string;
  message?: string;
  result?: WeatherProfitabilityResult;
};

type PanelState =
  | {
      status: "idle" | "loading";
      response: null;
      error: null;
    }
  | {
      status: "ready";
      response: WeatherProfitabilityApiResponse;
      error: null;
    }
  | {
      status: "error";
      response: null;
      error: string;
    };

export function WeatherProfitabilityRiskPanel({
  input,
  result,
  entitlementTier,
  canUseWeatherProfitabilityRisk,
  canSaveWeatherProfitabilitySnapshot,
  onSnapshotChange,
}: WeatherProfitabilityRiskPanelProps) {
  const [panelState, setPanelState] = useState<PanelState>({
    status: "idle",
    response: null,
    error: null,
  });
  const requestPayload = useMemo(
    () => buildWeatherProfitabilityRequest(input, result),
    [input, result]
  );
  const requestKey = useMemo(
    () => JSON.stringify(requestPayload),
    [requestPayload]
  );

  useEffect(() => {
    if (!canUseWeatherProfitabilityRisk) {
      onSnapshotChange?.(null);
      return;
    }

    const controller = new AbortController();

    async function loadWeatherRisk() {
      try {
        setPanelState({ status: "loading", response: null, error: null });

        const response = await fetch("/api/weather/profitability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: requestKey,
          cache: "no-store",
          signal: controller.signal,
        });
        const payload =
          (await response.json()) as WeatherProfitabilityApiResponse;

        setPanelState({
          status: "ready",
          response: payload,
          error: null,
        });
        onSnapshotChange?.(
          canSaveWeatherProfitabilitySnapshot ? payload.result ?? null : null
        );
      } catch (error) {
        if (controller.signal.aborted) return;

        setPanelState({
          status: "error",
          response: null,
          error:
            error instanceof Error
              ? error.message
              : "Weather profitability request failed.",
        });
        onSnapshotChange?.(null);
      }
    }

    void loadWeatherRisk();

    return () => controller.abort();
  }, [
    canSaveWeatherProfitabilitySnapshot,
    canUseWeatherProfitabilityRisk,
    onSnapshotChange,
    requestKey,
  ]);

  if (!canUseWeatherProfitabilityRisk) {
    return (
      <section className="rounded-xl border border-slate-800 bg-[#060B14] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              {entitlementTier === "gold" ? "Upgrade Teaser" : "Locked"}
            </p>
            <h3 className="mt-2 text-xl font-black text-slate-100">
              Weather Profitability Risk
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {LOCKED_WEATHER_MESSAGE}
            </p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            Platinum / Pro
          </span>
        </div>
      </section>
    );
  }

  const response = panelState.response;
  const weatherResult = response?.result;
  const topFactors =
    weatherResult?.status === "available"
      ? weatherResult.pointAssessments
          .flatMap((point) =>
            point.factors.map((factor) => ({
              ...factor,
              pointLabel: point.label,
            }))
          )
          .sort((a, b) => b.scoreImpact - a.scoreImpact)
          .slice(0, 5)
      : [];

  return (
    <section className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
            Platinum / Pro Intelligence
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-100">
            Weather Profitability Risk
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Deterministic weather-cost pressure using provider weather,
            mileage, fuel, MPG, gross, target RPM, and margin values.
          </p>
        </div>
        <span className="rounded-full border border-sky-300/30 bg-[#060B14] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-sky-100">
          {formatProviderStatus(response?.providerStatus, panelState.status)}
        </span>
      </div>

      {panelState.status === "loading" && (
        <p className="mt-4 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm text-slate-400">
          Checking weather profitability risk...
        </p>
      )}

      {panelState.status === "error" && (
        <p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
          {panelState.error}
        </p>
      )}

      {weatherResult?.status === "available" && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <WeatherMetric
              label="Risk Score"
              value={`${weatherResult.weatherRiskScore}/100`}
            />
            <WeatherMetric
              label="Risk Level"
              value={formatRiskLevel(weatherResult.riskLevel)}
            />
            <WeatherMetric
              label="Delay"
              value={`${weatherResult.estimatedDelayMinutes} min`}
            />
            <WeatherMetric
              label="Fuel Penalty"
              value={formatCurrency(weatherResult.estimatedFuelPenaltyDollars)}
            />
            <WeatherMetric
              label="RPM Premium"
              value={formatRpm(weatherResult.recommendedRpmPremium)}
            />
            <WeatherMetric
              label="Adjusted Min Rate"
              value={formatRpm(weatherResult.adjustedMinimumAllInRate)}
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Major Weather Restraints
            </p>
            {topFactors.length > 0 ? (
              <div className="mt-3 space-y-2">
                {topFactors.map((factor) => (
                  <div
                    key={`${factor.pointLabel}-${factor.code}-${factor.detail}`}
                    className="flex justify-between gap-4 border-b border-slate-800 pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <span className="text-slate-300">
                      {factor.pointLabel}: {factor.label}
                    </span>
                    <span className="text-right text-slate-500">
                      {factor.detail}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No major weather restraints were detected in the provider data.
              </p>
            )}
          </div>

          <ProviderStatusRows response={response} />

          <p className="text-sm leading-6 text-slate-300">
            {weatherResult.plainEnglishExplanation}
          </p>
        </div>
      )}

      {weatherResult?.status === "unavailable" && (
        <div className="mt-5 space-y-4">
          <ProviderStatusRows response={response} />
          <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            {requestPayload.points.length === 0
              ? "Weather coordinates are not available in the current load input, so OpenWeather was not called. Add a provider-backed coordinate source before live weather scoring can run."
              : weatherResult.plainEnglishExplanation}
          </p>
        </div>
      )}

      <p className="mt-5 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">
        {WEATHER_RISK_DISCLAIMER}
      </p>
    </section>
  );
}

function buildWeatherProfitabilityRequest(
  input: LoadInput,
  result: LoadResult
): WeatherProfitabilityInput {
  return {
    units: "imperial",
    points: buildWeatherPoints(input),
    loadValues: {
      totalMiles: result.totalMiles,
      loadedMiles: input.loadedMiles,
      deadheadMiles: input.deadheadMiles,
      fuelPrice: input.fuelPrice,
      mpg: input.mpg,
      loadGross: result.grossRevenue,
      targetRpm: result.targetRpm,
      baseProfit: result.estimatedNet,
      baseMarginPercent: result.profitMarginPercent,
      breakEvenRpm: result.breakEvenRpm,
      baseMinimumAllInRate: Math.max(result.breakEvenRpm, result.targetRpm),
    },
  };
}

function buildWeatherPoints(input: LoadInput): WeatherProfitabilityPointInput[] {
  const source = input as unknown as Record<string, unknown>;
  const points: WeatherProfitabilityPointInput[] = [];
  const deadhead = coordinateFromRecord(source, [
    ["deadheadStartLatitude", "deadheadStartLongitude"],
    ["deadheadOriginLatitude", "deadheadOriginLongitude"],
    ["deadheadStartLat", "deadheadStartLng"],
  ]);
  const pickup = coordinateFromRecord(source, [
    ["pickupLatitude", "pickupLongitude"],
    ["pickupLat", "pickupLng"],
  ]);
  const delivery = coordinateFromRecord(source, [
    ["deliveryLatitude", "deliveryLongitude"],
    ["deliveryLat", "deliveryLng"],
  ]);

  if (deadhead) {
    points.push({
      role: "deadhead_origin",
      latitude: deadhead.latitude,
      longitude: deadhead.longitude,
      label: "Deadhead origin",
      scheduledAt: input.deadheadStartDate || input.deadheadEndDate || undefined,
    });
  }

  if (pickup) {
    points.push({
      role: "pickup",
      latitude: pickup.latitude,
      longitude: pickup.longitude,
      label: "Pickup",
      scheduledAt: input.pickupDate || undefined,
    });
  }

  input.routeStops.forEach((stop, index) => {
    const coordinates = coordinateFromRecord(
      stop as unknown as Record<string, unknown>,
      [
        ["latitude", "longitude"],
        ["lat", "lng"],
      ]
    );

    if (!coordinates) return;

    points.push({
      role: "stop",
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      label: `Stop ${index + 1}`,
      sequence: index + 1,
    });
  });

  if (delivery) {
    points.push({
      role: "delivery",
      latitude: delivery.latitude,
      longitude: delivery.longitude,
      label: "Delivery",
      scheduledAt: input.deliveryDate || undefined,
    });
  }

  return points;
}

function coordinateFromRecord(
  source: Record<string, unknown>,
  candidates: Array<[string, string]>
) {
  for (const [latitudeKey, longitudeKey] of candidates) {
    const latitude = numberValue(source[latitudeKey]);
    const longitude = numberValue(source[longitudeKey]);

    if (
      latitude !== null &&
      longitude !== null &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return {
        latitude,
        longitude,
      };
    }
  }

  return null;
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function WeatherMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-slate-100">{value}</p>
    </div>
  );
}

function ProviderStatusRows({
  response,
}: {
  response: WeatherProfitabilityApiResponse | null;
}) {
  return (
    <div className="grid gap-3 text-sm md:grid-cols-2">
      <StatusRow
        label="Provider Status"
        value={formatProviderStatus(response?.providerStatus, "ready")}
      />
      <StatusRow
        label="Cached / Fresh"
        value={formatCacheStatus(response?.providerFreshness, response?.cacheStatus)}
      />
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl border border-slate-800 bg-[#060B14] p-3">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function formatProviderStatus(
  status: WeatherProfitabilityApiResponse["providerStatus"] | undefined,
  panelStatus: PanelState["status"]
) {
  if (panelStatus === "loading") return "Checking";
  if (status === "available") return "Available";
  if (status === "locked") return "Locked";
  if (status === "not_requested") return "Not requested";
  if (status === "unavailable") return "Unavailable";
  return "Not checked";
}

function formatCacheStatus(freshness?: string, cacheStatus?: string) {
  if (freshness === "fresh") return "Fresh provider lookup";
  if (freshness === "not_requested") return "Not requested";
  if (cacheStatus === "not_implemented") return "No cache";
  return "Unavailable";
}

function formatRiskLevel(level: string) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}
