import { NextRequest, NextResponse } from "next/server";

import { getWeatherRisk } from "@/lib/weather";
import {
  loadWindowFromSearchParams,
  parseArea,
  parseCoordinates,
  parseProvider,
  weatherApiError,
} from "@/lib/weather/weatherApi";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coordinates = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lon")
  );
  const provider = parseProvider(searchParams.get("provider"));

  if (!coordinates.ok) {
    return NextResponse.json(
      weatherApiError("invalid_coordinates", coordinates.message),
      { status: 400 }
    );
  }

  if (!provider) {
    return NextResponse.json(
      weatherApiError("invalid_provider", "Provider must be google, openweather, nws, or auto."),
      { status: 400 }
    );
  }

  return NextResponse.json(
    await getWeatherRisk({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      area: parseArea(searchParams.get("area")),
      provider,
      ...loadWindowFromSearchParams(searchParams),
    }),
    {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    }
  );
}
