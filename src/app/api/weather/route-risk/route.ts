import { NextRequest, NextResponse } from "next/server";

import { getRouteWeatherAnalysis } from "@/lib/weather";
import {
  routeRiskFromBody,
  routeRiskFromSearchParams,
  weatherApiError,
} from "@/lib/weather/weatherApi";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    await getRouteWeatherAnalysis(routeRiskFromSearchParams(request.nextUrl.searchParams)),
    {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      weatherApiError(
        "invalid_json",
        "Route weather risk requires a valid JSON request body."
      ),
      { status: 400 }
    );
  }

  const parsed = routeRiskFromBody(body);

  if (!parsed) {
    return NextResponse.json(
      weatherApiError(
        "invalid_route_weather_request",
        "Route weather risk requires a JSON object."
      ),
      { status: 400 }
    );
  }

  return NextResponse.json(await getRouteWeatherAnalysis(parsed), {
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}
