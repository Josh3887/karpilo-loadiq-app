import { NextRequest, NextResponse } from "next/server";

import { getWeatherCurrent } from "@/lib/weather";
import {
  parseCoordinates,
  parseCurrentProvider,
  weatherApiError,
} from "@/lib/weather/weatherApi";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coordinates = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lon")
  );
  const provider = parseCurrentProvider(searchParams.get("provider"));

  if (!coordinates.ok) {
    return NextResponse.json(
      weatherApiError("invalid_coordinates", coordinates.message),
      { status: 400 }
    );
  }

  if (!provider) {
    return NextResponse.json(
      weatherApiError(
        "invalid_provider",
        "Provider must be google, openweather, or auto."
      ),
      { status: 400 }
    );
  }

  return NextResponse.json(
    await getWeatherCurrent(coordinates.latitude, coordinates.longitude, provider),
    {
      headers: {
        "Cache-Control": "private, max-age=600",
      },
    }
  );
}
