import type { RouteEstimate, RouteEstimateRequest } from "@/types/route-intelligence";

type AddressFields = {
  pickupAddress?: unknown; pickupCity?: unknown; pickupState?: unknown; pickupZip?: unknown;
  deliveryAddress?: unknown; deliveryCity?: unknown; deliveryState?: unknown; deliveryZip?: unknown;
  deadheadStartAddress?: unknown; deadheadStartCity?: unknown; deadheadStartState?: unknown; deadheadStartZip?: unknown;
  routeStops?: Array<{ id?: string; address?: string; city?: string; state?: string; zip?: string; stopType?: unknown }>;
};
const join = (parts: unknown[]) => parts.filter((p): p is string => typeof p === "string")
  .map((p) => p.trim()).filter(Boolean).join(", ");
const canonical = (value?: string) => (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function buildAddressRouteRequest(values: AddressFields): RouteEstimateRequest {
  return {
    pickupAddress: join([values.pickupAddress, values.pickupCity, values.pickupState, values.pickupZip]),
    deliveryAddress: join([values.deliveryAddress, values.deliveryCity, values.deliveryState, values.deliveryZip]),
    deadheadOrigin: join([values.deadheadStartAddress, values.deadheadStartCity, values.deadheadStartState, values.deadheadStartZip]) || undefined,
    stops: (values.routeStops ?? []).map((stop, index) => ({
      id: stop.id, address: join([stop.address, stop.city, stop.state, stop.zip]),
      kind: stop.stopType === "delivery" ? "delivery" : "pickup", sequence: index + 1,
    })),
    provider: "google_estimate",
  };
}

export function routeRequestKey(request: RouteEstimateRequest) {
  return JSON.stringify([
    canonical(request.pickupAddress ?? request.origin),
    canonical(request.deliveryAddress ?? request.destination),
    canonical(request.deadheadOrigin),
    (request.stops ?? []).map((stop) => [canonical(stop.address), stop.kind, stop.sequence]),
  ]);
}

export function estimateMatchesRequest(estimate: RouteEstimate | null, request: RouteEstimateRequest) {
  if (!estimate) return false;
  if (estimate.requestKey) return estimate.requestKey === routeRequestKey(request);
  // Older saved snapshots have no requestKey. Check their recorded input addresses.
  return canonical(estimate.origin?.input) === canonical(request.pickupAddress) &&
    canonical(estimate.destination?.input) === canonical(request.deliveryAddress) &&
    canonical(estimate.deadheadEstimate?.origin?.input) === canonical(request.deadheadOrigin) &&
    JSON.stringify((estimate.loadedEstimate?.stops ?? []).map((stop) => canonical(stop.input))) ===
      JSON.stringify((request.stops ?? []).map((stop) => canonical(stop.address)));
}
