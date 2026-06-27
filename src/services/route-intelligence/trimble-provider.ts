import {
  FutureTrimbleRouteInputs,
  RouteEstimate,
  RouteEstimateResponse,
  TRIMBLE_ROUTE_PLACEHOLDER,
  VerifiedAddress,
} from "@/types/route-intelligence";

export const futureTrimbleRouteInputs: Array<keyof FutureTrimbleRouteInputs> = [
  "tractorTrailerProfile",
  "vehicleHeightInches",
  "vehicleWidthInches",
  "vehicleLengthFeet",
  "grossWeightPounds",
  "axleCount",
  "hazmatLoad",
  "loadFlags",
  "preferredRoutingProfile",
  "tollPreference",
];

function placeholderAddress(input: string): VerifiedAddress {
  return {
    input,
    formattedAddress: input,
    lat: null,
    lng: null,
    confidence: "low",
    warnings: ["Trimble address validation is not configured."],
  };
}

export function getUnavailableTrimbleRouteEstimate(
  originInput: string,
  destinationInput: string
): RouteEstimateResponse {
  const origin = placeholderAddress(originInput);
  const destination = placeholderAddress(destinationInput);
  const warnings = [
    "Trimble truck-specific routing is scaffolded only and is not configured.",
    "Future Trimble routing will require tractor/trailer profile, vehicle dimensions, gross weight, axle count, HAZMAT/load flags, routing profile, and toll preference.",
  ];
  const estimate: RouteEstimate = {
    provider: "trimble_truck",
    origin,
    destination,
    estimatedMiles: null,
    estimatedDurationMinutes: null,
    trafficAwareDurationMinutes: null,
    truckSpecific: true,
    confidence: "low",
    warnings,
    disclaimer: TRIMBLE_ROUTE_PLACEHOLDER,
  };

  return {
    status: "unavailable",
    provider: "trimble_truck",
    estimate,
    message: TRIMBLE_ROUTE_PLACEHOLDER,
    warnings,
  };
}
