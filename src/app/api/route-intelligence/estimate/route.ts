import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { estimateRoute } from "@/services/route-intelligence/route-intelligence-service";

const estimateRouteRequestSchema = z.object({
  origin: z.string().trim().min(3),
  destination: z.string().trim().min(3),
  provider: z.enum(["google_estimate", "trimble_truck"]).default("google_estimate"),
});

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        status: "invalid",
        provider: "google_estimate",
        estimate: null,
        message: "Route estimate requires a valid JSON request body.",
        warnings: ["Send pickup and delivery addresses as JSON."],
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const parsed = estimateRouteRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "invalid",
        provider: "google_estimate",
        estimate: null,
        message: "Route estimate requires pickup and delivery addresses.",
        warnings: [
          "Enter pickup and delivery address details before estimating mileage.",
        ],
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const response = await estimateRoute(
    parsed.data.origin,
    parsed.data.destination,
    parsed.data.provider
  );

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
