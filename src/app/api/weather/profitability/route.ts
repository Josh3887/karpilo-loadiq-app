import { NextResponse } from "next/server";

import { getServerEntitlements } from "@/domains/billing/server-entitlements";
import { createClient } from "@/lib/supabase-server";
import { calculateWeatherProfitability } from "@/services/weather";
import type { WeatherUnits } from "@/types/weather";
import type {
  WeatherProfitabilityInput,
  WeatherProfitabilityLoadValues,
  WeatherProfitabilityPointInput,
} from "@/types/weather-profitability";

export const dynamic = "force-dynamic";

const LOCKED_WEATHER_MESSAGE =
  "Weather Profitability Risk is available on Platinum and Pro.";

type WeatherProfitabilityRequest = {
  points?: unknown;
  loadValues?: unknown;
  units?: unknown;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return lockedResponse(401);
  }

  const entitlements = await getServerEntitlements(user.id, user.email);

  if (!entitlements.canUseWeatherProfitabilityRisk) {
    return lockedResponse(403);
  }

  const body = await parseRequest(request);
  const points = normalizePoints(body.points);
  const weatherInput: WeatherProfitabilityInput = {
    points,
    loadValues: normalizeLoadValues(body.loadValues),
    units: normalizeUnits(body.units),
  };
  const result = await calculateWeatherProfitability(weatherInput);
  const providerWasRequested = points.length > 0;

  return NextResponse.json(
    {
      ok: result.status === "available",
      provider: "openweather_free",
      providerStatus: providerWasRequested ? result.status : "not_requested",
      providerFreshness:
        result.status === "available"
          ? "fresh"
          : providerWasRequested
            ? "not_requested_or_unavailable"
            : "not_requested",
      cacheStatus: "not_implemented",
      result,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

function lockedResponse(status: 401 | 403) {
  return NextResponse.json(
    {
      ok: false,
      provider: "openweather_free",
      providerStatus: "locked",
      providerFreshness: "not_requested",
      cacheStatus: "not_implemented",
      message: LOCKED_WEATHER_MESSAGE,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

async function parseRequest(request: Request): Promise<WeatherProfitabilityRequest> {
  try {
    return (await request.json()) as WeatherProfitabilityRequest;
  } catch {
    return {};
  }
}

function normalizePoints(value: unknown): WeatherProfitabilityPointInput[] {
  if (!Array.isArray(value)) return [];

  const points: WeatherProfitabilityPointInput[] = [];

  value.forEach((point, index) => {
    if (!isRecord(point)) return;

    const role = normalizeRole(point.role);
    const latitude = numberValue(point.latitude);
    const longitude = numberValue(point.longitude);

    if (!role || latitude === null || longitude === null) return;

    points.push({
      role,
      latitude,
      longitude,
      label: stringValue(point.label) ?? undefined,
      scheduledAt: stringValue(point.scheduledAt) ?? undefined,
      sequence: numberValue(point.sequence) ?? index + 1,
    });
  });

  return points;
}

function normalizeLoadValues(
  value: unknown
): WeatherProfitabilityLoadValues | undefined {
  if (!isRecord(value)) return undefined;

  return {
    totalMiles: numberValue(value.totalMiles) ?? undefined,
    loadedMiles: numberValue(value.loadedMiles) ?? undefined,
    deadheadMiles: numberValue(value.deadheadMiles) ?? undefined,
    fuelPrice: numberValue(value.fuelPrice) ?? undefined,
    mpg: numberValue(value.mpg) ?? undefined,
    loadGross: numberValue(value.loadGross) ?? undefined,
    targetRpm: numberValue(value.targetRpm) ?? undefined,
    baseProfit: numberValue(value.baseProfit) ?? undefined,
    baseMarginPercent: numberValue(value.baseMarginPercent) ?? undefined,
    breakEvenRpm: numberValue(value.breakEvenRpm) ?? undefined,
    baseMinimumAllInRate:
      numberValue(value.baseMinimumAllInRate) ?? undefined,
  };
}

function normalizeRole(
  value: unknown
): WeatherProfitabilityPointInput["role"] | null {
  if (
    value === "deadhead_origin" ||
    value === "pickup" ||
    value === "stop" ||
    value === "delivery"
  ) {
    return value;
  }

  return null;
}

function normalizeUnits(value: unknown): WeatherUnits | undefined {
  if (value === "imperial" || value === "metric" || value === "standard") {
    return value;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
