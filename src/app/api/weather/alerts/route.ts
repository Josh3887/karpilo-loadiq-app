import { NextRequest, NextResponse } from "next/server";

import { getWeatherAlerts } from "@/lib/weather";
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
  const rawLat = searchParams.get("lat");
  const rawLon = searchParams.get("lon");
  const provider = parseProvider(searchParams.get("provider"));
  const area = parseArea(searchParams.get("area"));
  const hasCoordinateParams = rawLat !== null || rawLon !== null;
  const coordinates = hasCoordinateParams
    ? parseCoordinates(rawLat, rawLon)
    : null;

  if (!provider) {
    return NextResponse.json(
      weatherApiError("invalid_provider", "Provider must be google, openweather, nws, or auto."),
      { status: 400 }
    );
  }

  if (hasCoordinateParams && coordinates && !coordinates.ok) {
    return NextResponse.json(
      weatherApiError("invalid_coordinates", coordinates.message, provider),
      { status: 400 }
    );
  }

  if (!area && !coordinates?.ok) {
    return NextResponse.json(
      weatherApiError(
        "alert_location_required",
        "Weather alerts require either lat/lon or a 2-letter area code.",
        provider
      ),
      { status: 400 }
    );
  }

  return NextResponse.json(
    await getWeatherAlerts({
      latitude: coordinates?.ok ? coordinates.latitude : null,
      longitude: coordinates?.ok ? coordinates.longitude : null,
      area,
      provider,
      loadWindow: loadWindowFromSearchParams(searchParams),
    }),
    {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    }
  );
}
