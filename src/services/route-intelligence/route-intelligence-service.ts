import { estimateGoogleRoute, validateGoogleAddress } from "./google-provider";
import { getUnavailableTrimbleRouteEstimate } from "./trimble-provider";
import {
  AddressValidationResponse,
  RouteEstimateResponse,
  RouteProvider,
} from "@/types/route-intelligence";

export async function validateAddress(
  address: string,
  provider: RouteProvider = "google_estimate"
): Promise<AddressValidationResponse> {
  if (provider === "trimble_truck") {
    return {
      status: "unavailable",
      provider,
      address: null,
      message:
        "Trimble address validation is scaffolded only and is not configured.",
      warnings: [
        "Trimble truck-specific routing is planned after launch and is not wired in V1.",
      ],
    };
  }

  return validateGoogleAddress(address);
}

export async function estimateRoute(
  origin: string,
  destination: string,
  provider: RouteProvider = "google_estimate"
): Promise<RouteEstimateResponse> {
  if (provider === "trimble_truck") {
    return getUnavailableTrimbleRouteEstimate(origin, destination);
  }

  return estimateGoogleRoute(origin, destination);
}
