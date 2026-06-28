import { NextRequest, NextResponse } from "next/server";

import { getNwsPoint } from "@/lib/weather/providers/nws";
import { parseCoordinates, weatherApiError } from "@/lib/weather/weatherApi";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const coordinates = parseCoordinates(
    searchParams.get("lat"),
    searchParams.get("lon")
  );

  if (!coordinates.ok) {
    return NextResponse.json(
      weatherApiError("invalid_coordinates", coordinates.message, "nws"),
      { status: 400 }
    );
  }

  const result = await getNwsPoint(coordinates.latitude, coordinates.longitude);

  return NextResponse.json(
    result.ok
      ? {
          ok: true,
          source: "Karpilo Weather Intelligence",
          provider: "nws",
          data: result.data,
        }
      : {
          ok: false,
          source: "Karpilo Weather Intelligence",
          provider: "nws",
          error: result.error,
        },
    {
      headers: {
        "Cache-Control": "private, max-age=86400",
      },
    }
  );
}
