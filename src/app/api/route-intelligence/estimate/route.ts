import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { estimateRoute } from "@/services/route-intelligence/route-intelligence-service";
import { RouteStopKind } from "@/types/route-intelligence";

const routeStopKindValues: [RouteStopKind, ...RouteStopKind[]] = [
  "pickup",
  "delivery",
  "intermediate_stop",
  "fuel",
  "def",
  "scale",
  "rest",
  "customer",
  "other",
];

const routeStopSchema = z.object({
  id: z.string().optional(),
  address: z.string().trim().min(3),
  label: z.string().trim().optional(),
  kind: z.enum(routeStopKindValues).default("intermediate_stop"),
  sequence: z.coerce.number().int().positive().optional(),
});

const estimateRouteRequestSchema = z.object({
  origin: z.string().trim().optional(),
  destination: z.string().trim().optional(),
  deadheadOrigin: z.string().trim().optional(),
  pickupAddress: z.string().trim().optional(),
  deliveryAddress: z.string().trim().optional(),
  stops: z.array(routeStopSchema).optional().default([]),
  provider: z.enum(["google_estimate", "trimble_truck"]).default("google_estimate"),
}).superRefine((value, context) => {
  const pickupAddress = value.pickupAddress ?? value.origin ?? "";
  const deliveryAddress = value.deliveryAddress ?? value.destination ?? "";

  if (pickupAddress.length < 3) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pickup address is required.",
      path: ["pickupAddress"],
    });
  }

  if (deliveryAddress.length < 3) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Delivery address is required.",
      path: ["deliveryAddress"],
    });
  }
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

  const response = await estimateRoute({
    deadheadOrigin: parsed.data.deadheadOrigin,
    pickupAddress: parsed.data.pickupAddress ?? parsed.data.origin,
    deliveryAddress: parsed.data.deliveryAddress ?? parsed.data.destination,
    stops: parsed.data.stops.map((stop, index) => ({
      ...stop,
      sequence: stop.sequence ?? index + 1,
    })),
    provider: parsed.data.provider,
  });

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
