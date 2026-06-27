import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { validateAddress } from "@/services/route-intelligence/route-intelligence-service";

const validateAddressRequestSchema = z.object({
  address: z.string().trim().min(3),
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
        address: null,
        message: "Address validation requires a valid JSON request body.",
        warnings: ["Send an address as JSON."],
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const parsed = validateAddressRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "invalid",
        provider: "google_estimate",
        address: null,
        message: "Address validation requires an address.",
        warnings: ["Enter a pickup or delivery address before validation."],
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const response = await validateAddress(
    parsed.data.address,
    parsed.data.provider
  );

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
