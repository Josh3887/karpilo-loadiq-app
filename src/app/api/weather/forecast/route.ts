import { NextRequest, NextResponse } from "next/server";

import { getWeatherForecast } from "@/lib/weather";
import {
  parseCoordinates,
  parseDays,
  parseForecastProvider,
  parseForecastType,
  parseHours,
  weatherApiError,
} from "@/lib/weather/weatherApi";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coordinates = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lon")
  );
  const provider = parseForecastProvider(searchParams.get("provider"));
  const type = parseForecastType(searchParams.get("type"));

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
        "Provider must be google, openweather, nws, or auto."
      ),
      { status: 400 }
    );
  }

  if (!type) {
    return NextResponse.json(
      weatherApiError("invalid_forecast_type", "Forecast type must be hourly or daily."),
      { status: 400 }
    );
  }

  return NextResponse.json(
    await getWeatherForecast(coordinates.latitude, coordinates.longitude, {
      provider,
      type,
      hours: parseHours(searchParams.get("hours")),
      days: parseDays(searchParams.get("days")),
    }),
    {
      headers: {
        "Cache-Control": "private, max-age=900",
      },
    }
  );
}
