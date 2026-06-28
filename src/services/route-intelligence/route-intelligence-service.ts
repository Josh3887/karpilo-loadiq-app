import {
  estimateGoogleRoute,
  estimateGoogleRoutePlan,
  validateGoogleAddress,
} from "./google-provider";
import { getUnavailableTrimbleRouteEstimate } from "./trimble-provider";
import {
  AddressValidationResponse,
  RouteEstimateRequest,
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
  input: string | RouteEstimateRequest,
  destination?: string,
  provider: RouteProvider = "google_estimate"
): Promise<RouteEstimateResponse> {
  const request =
    typeof input === "string"
      ? {
          pickupAddress: input,
          deliveryAddress: destination ?? "",
          provider,
        }
      : {
          ...input,
          provider: input.provider ?? provider,
        };
  const selectedProvider = request.provider ?? provider;

  if (selectedProvider === "trimble_truck") {
    return getUnavailableTrimbleRouteEstimate(request);
  }

  if (typeof input === "string") {
    return estimateGoogleRoute(input, destination ?? "");
  }

  return estimateGoogleRoutePlan(request);
}
