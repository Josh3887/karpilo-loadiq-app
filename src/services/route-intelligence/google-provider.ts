import {
  AddressValidationResponse,
  DeadheadRouteEstimate,
  GOOGLE_ROUTE_DISCLAIMER,
  LoadedRouteEstimate,
  RouteConfidence,
  RouteEstimate,
  RouteEstimateRequest,
  RouteEstimateResponse,
  RouteLegEstimate,
  RouteStopInput,
  VerifiedAddress,
} from "@/types/route-intelligence";

const GOOGLE_ADDRESS_VALIDATION_URL =
  "https://addressvalidation.googleapis.com/v1:validateAddress";
const GOOGLE_ROUTES_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";
const METERS_PER_MILE = 1609.344;

type GoogleAddressVerdict = {
  inputGranularity?: string;
  validationGranularity?: string;
  geocodeGranularity?: string;
  addressComplete?: boolean;
  hasUnconfirmedComponents?: boolean;
  hasInferredComponents?: boolean;
  hasReplacedComponents?: boolean;
  possibleNextAction?: string;
};

type GoogleAddressValidationPayload = {
  result?: {
    verdict?: GoogleAddressVerdict;
    address?: {
      formattedAddress?: string;
      missingComponentTypes?: string[];
      unconfirmedComponentTypes?: string[];
      unresolvedTokens?: string[];
    };
    geocode?: {
      location?: {
        latitude?: number;
        longitude?: number;
      };
    };
  };
  error?: {
    message?: string;
    status?: string;
  };
};

type GoogleRoutesPayload = {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    staticDuration?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

type GoogleAddress =
  NonNullable<GoogleAddressValidationPayload["result"]>["address"];

function getGoogleMapsApiKey() {
  return process.env.GOOGLE_MAPS_API_KEY;
}

function emptyVerifiedAddress(input: string, warning: string): VerifiedAddress {
  return {
    input,
    formattedAddress: input,
    lat: null,
    lng: null,
    confidence: "low",
    warnings: [warning],
  };
}

function formatGoogleError(
  fallback: string,
  payload: GoogleAddressValidationPayload | GoogleRoutesPayload | null
) {
  return payload?.error?.message ?? payload?.error?.status ?? fallback;
}

function hasCoordinates(address: VerifiedAddress) {
  return address.lat !== null && address.lng !== null;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getAddressConfidence(
  verdict: GoogleAddressVerdict | undefined,
  hasUsableCoordinates: boolean
): RouteConfidence {
  if (!hasUsableCoordinates) return "low";

  const validationGranularity = verdict?.validationGranularity ?? "";
  const geocodeGranularity = verdict?.geocodeGranularity ?? "";

  if (
    verdict?.addressComplete &&
    validationGranularity !== "OTHER" &&
    geocodeGranularity !== "OTHER"
  ) {
    return "high";
  }

  if (validationGranularity && validationGranularity !== "OTHER") {
    return "medium";
  }

  return "low";
}

function getRouteConfidence(
  origin: VerifiedAddress,
  destination: VerifiedAddress
): RouteConfidence {
  if (origin.confidence === "high" && destination.confidence === "high") {
    return "high";
  }

  if (origin.confidence !== "low" && destination.confidence !== "low") {
    return "medium";
  }

  return "low";
}

function getMultiPointRouteConfidence(addresses: VerifiedAddress[]) {
  if (addresses.length === 0) return "low";
  if (addresses.every((address) => address.confidence === "high")) {
    return "high";
  }
  if (addresses.every((address) => address.confidence !== "low")) {
    return "medium";
  }

  return "low";
}

function buildAddressWarnings(
  verdict: GoogleAddressVerdict | undefined,
  address: GoogleAddress | undefined,
  hasUsableCoordinates: boolean
) {
  const warnings: string[] = [];

  if (!verdict?.addressComplete) {
    warnings.push("Google did not mark the address as complete.");
  }

  if (address?.missingComponentTypes?.length) {
    warnings.push(
      `Missing components: ${address.missingComponentTypes.join(", ")}.`
    );
  }

  if (address?.unconfirmedComponentTypes?.length) {
    warnings.push(
      `Unconfirmed components: ${address.unconfirmedComponentTypes.join(", ")}.`
    );
  }

  if (address?.unresolvedTokens?.length) {
    warnings.push(
      `Unresolved address text: ${address.unresolvedTokens.join(", ")}.`
    );
  }

  if (verdict?.hasInferredComponents) {
    warnings.push("Google inferred one or more address components.");
  }

  if (verdict?.hasReplacedComponents) {
    warnings.push("Google replaced one or more address components.");
  }

  if (verdict?.possibleNextAction) {
    warnings.push(`Next action: ${verdict.possibleNextAction}.`);
  }

  if (!hasUsableCoordinates) {
    warnings.push("Google did not return usable coordinates for routing.");
  }

  return warnings;
}

function verdictLabel(verdict: GoogleAddressVerdict | undefined) {
  if (!verdict) return undefined;

  return [
    verdict.validationGranularity
      ? `validation=${verdict.validationGranularity}`
      : null,
    verdict.geocodeGranularity ? `geocode=${verdict.geocodeGranularity}` : null,
    verdict.addressComplete === true ? "complete" : "incomplete",
  ]
    .filter(Boolean)
    .join("; ");
}

async function readJson<T>(response: Response) {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function parseDurationMinutes(duration: string | undefined) {
  if (!duration) return null;

  const seconds = Number(duration.replace(/s$/, ""));

  if (!Number.isFinite(seconds)) return null;

  return Math.round(seconds / 60);
}

function roundMiles(meters: number) {
  return Number((meters / METERS_PER_MILE).toFixed(1));
}

function buildUnavailableEstimate(
  origin: VerifiedAddress,
  destination: VerifiedAddress,
  warnings: string[],
  overrides: Partial<RouteEstimate> = {}
): RouteEstimate {
  return {
    provider: "google_estimate",
    origin,
    destination,
    estimatedMiles: null,
    estimatedDurationMinutes: null,
    trafficAwareDurationMinutes: null,
    truckSpecific: false,
    confidence: getRouteConfidence(origin, destination),
    warnings,
    disclaimer: GOOGLE_ROUTE_DISCLAIMER,
    ...overrides,
  };
}

type LabeledAddress = {
  label: string;
  input: string;
  address: VerifiedAddress;
  validation: AddressValidationResponse;
};

type GoogleRouteLegResult = {
  leg: RouteLegEstimate;
  warnings: string[];
  status: "available" | "unavailable" | "invalid";
};

function normalizeRoutePlan(input: RouteEstimateRequest) {
  const pickupAddress = (input.pickupAddress ?? input.origin ?? "").trim();
  const deliveryAddress = (input.deliveryAddress ?? input.destination ?? "").trim();
  const deadheadOrigin = input.deadheadOrigin?.trim() ?? "";
  const stops = normalizeStops(input.stops);

  return {
    pickupAddress,
    deliveryAddress,
    deadheadOrigin,
    stops,
  };
}

function normalizeStops(stops: RouteStopInput[] | undefined) {
  return (stops ?? [])
    .map((stop, index) => ({
      ...stop,
      id: stop.id,
      label: stop.label?.trim() || `Stop ${index + 1}`,
      address: stop.address.trim(),
      sequence: Number.isFinite(Number(stop.sequence))
        ? Number(stop.sequence)
        : index + 1,
    }))
    .filter((stop) => stop.address.length >= 3)
    .sort((a, b) => a.sequence - b.sequence);
}

async function validateLabeledAddress(label: string, input: string) {
  const validation = await validateGoogleAddress(input);
  const address =
    validation.address ?? emptyVerifiedAddress(input, `${label} validation unavailable.`);

  return {
    label,
    input,
    validation,
    address,
  } satisfies LabeledAddress;
}

function prefixedWarnings(point: LabeledAddress) {
  return point.validation.warnings.map(
    (warning) => `${point.label}: ${warning}`
  );
}

async function estimateGoogleLeg(
  from: LabeledAddress,
  to: LabeledAddress
): Promise<GoogleRouteLegResult> {
  const leg: RouteLegEstimate = {
    fromLabel: from.label,
    toLabel: to.label,
    estimatedMiles: null,
    estimatedDurationMinutes: null,
  };
  const warnings: string[] = [];

  if (!hasCoordinates(from.address) || !hasCoordinates(to.address)) {
    warnings.push(
      `${from.label} to ${to.label}: route mileage requires validated coordinates.`
    );

    return {
      leg,
      warnings,
      status:
        from.validation.status === "unavailable" ||
        to.validation.status === "unavailable"
          ? "unavailable"
          : "invalid",
    };
  }

  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    warnings.push("GOOGLE_MAPS_API_KEY is not configured.");

    return {
      leg,
      warnings,
      status: "unavailable",
    };
  }

  const url = new URL(GOOGLE_ROUTES_URL);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "routes.distanceMeters,routes.duration,routes.staticDuration",
    },
    body: JSON.stringify({
      origin: {
        location: {
          latLng: {
            latitude: from.address.lat,
            longitude: from.address.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: to.address.lat,
            longitude: to.address.lng,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      units: "IMPERIAL",
    }),
  });

  const payload = await readJson<GoogleRoutesPayload>(response);

  if (!response.ok) {
    warnings.push(
      formatGoogleError(
        `Google Routes API returned HTTP ${response.status}. Check API enablement, quota, billing, and request validity.`,
        payload
      )
    );

    return {
      leg,
      warnings,
      status: "unavailable",
    };
  }

  const route = payload?.routes?.[0];

  if (!route || !isNumber(route.distanceMeters)) {
    warnings.push(
      `${from.label} to ${to.label}: Google Routes API did not return a usable route distance.`
    );

    return {
      leg,
      warnings,
      status: "unavailable",
    };
  }

  const trafficAwareDurationMinutes = parseDurationMinutes(route.duration);
  const estimatedDurationMinutes =
    trafficAwareDurationMinutes ?? parseDurationMinutes(route.staticDuration);

  return {
    leg: {
      ...leg,
      estimatedMiles: roundMiles(route.distanceMeters),
      estimatedDurationMinutes,
    },
    warnings,
    status: "available",
  };
}

function sumLegMiles(legs: RouteLegEstimate[]) {
  if (
    legs.length === 0 ||
    legs.some((leg) => leg.estimatedMiles === null)
  ) {
    return null;
  }

  return Number(
    legs
      .reduce((total, leg) => total + Number(leg.estimatedMiles ?? 0), 0)
      .toFixed(1)
  );
}

function sumLegDuration(legs: RouteLegEstimate[]) {
  if (
    legs.length === 0 ||
    legs.some((leg) => leg.estimatedDurationMinutes === null)
  ) {
    return null;
  }

  return legs.reduce(
    (total, leg) => total + Number(leg.estimatedDurationMinutes ?? 0),
    0
  );
}

function combineNullableMiles(
  loadedMiles: number | null,
  deadheadMiles: number | null,
  hasDeadhead: boolean
) {
  if (loadedMiles === null) return null;
  if (!hasDeadhead) return loadedMiles;
  if (deadheadMiles === null) return null;

  return Number((loadedMiles + deadheadMiles).toFixed(1));
}

function combineNullableMinutes(
  loadedMinutes: number | null,
  deadheadMinutes: number | null,
  hasDeadhead: boolean
) {
  if (loadedMinutes === null) return null;
  if (!hasDeadhead) return loadedMinutes;
  if (deadheadMinutes === null) return null;

  return loadedMinutes + deadheadMinutes;
}

export async function validateGoogleAddress(
  input: string
): Promise<AddressValidationResponse> {
  const addressInput = input.trim();

  if (addressInput.length < 3) {
    const address = emptyVerifiedAddress(
      addressInput,
      "Enter a pickup or delivery address before validation."
    );

    return {
      status: "invalid",
      provider: "google_estimate",
      address,
      message: "Address input is too short.",
      warnings: address.warnings,
    };
  }

  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    const address = emptyVerifiedAddress(
      addressInput,
      "GOOGLE_MAPS_API_KEY is not configured."
    );

    return {
      status: "unavailable",
      provider: "google_estimate",
      address,
      message: "Google Address Validation is not configured.",
      warnings: address.warnings,
    };
  }

  const url = new URL(GOOGLE_ADDRESS_VALIDATION_URL);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: {
        addressLines: [addressInput],
      },
    }),
  });

  const payload = await readJson<GoogleAddressValidationPayload>(response);

  if (!response.ok) {
    const message = formatGoogleError(
      `Google Address Validation returned HTTP ${response.status}.`,
      payload
    );
    const address = emptyVerifiedAddress(addressInput, message);

    return {
      status: "unavailable",
      provider: "google_estimate",
      address,
      message,
      warnings: address.warnings,
    };
  }

  const result = payload?.result;
  const latitude = result?.geocode?.location?.latitude;
  const longitude = result?.geocode?.location?.longitude;
  const hasUsableCoordinates = isNumber(latitude) && isNumber(longitude);
  const warnings = buildAddressWarnings(
    result?.verdict,
    result?.address,
    hasUsableCoordinates
  );
  const verifiedAddress: VerifiedAddress = {
    input: addressInput,
    formattedAddress: result?.address?.formattedAddress ?? addressInput,
    lat: hasUsableCoordinates ? latitude : null,
    lng: hasUsableCoordinates ? longitude : null,
    confidence: getAddressConfidence(
      result?.verdict,
      hasUsableCoordinates
    ),
    verdict: verdictLabel(result?.verdict),
    warnings,
  };

  return {
    status: hasUsableCoordinates ? "available" : "invalid",
    provider: "google_estimate",
    address: verifiedAddress,
    message: hasUsableCoordinates
      ? "Address validated by Google."
      : "Address validation did not return routeable coordinates.",
    warnings,
  };
}

export async function estimateGoogleRoute(
  originInput: string,
  destinationInput: string
): Promise<RouteEstimateResponse> {
  return estimateGoogleRoutePlan({
    pickupAddress: originInput,
    deliveryAddress: destinationInput,
  });
}

export async function estimateGoogleRoutePlan(
  input: RouteEstimateRequest
): Promise<RouteEstimateResponse> {
  const plan = normalizeRoutePlan(input);

  if (plan.pickupAddress.length < 3 || plan.deliveryAddress.length < 3) {
    const pickup = emptyVerifiedAddress(
      plan.pickupAddress,
      "Enter pickup address details before estimating mileage."
    );
    const delivery = emptyVerifiedAddress(
      plan.deliveryAddress,
      "Enter delivery address details before estimating mileage."
    );
    const warnings = [
      "Route estimate requires pickup and delivery address details.",
      GOOGLE_ROUTE_DISCLAIMER,
    ];

    return {
      status: "invalid",
      provider: "google_estimate",
      estimate: buildUnavailableEstimate(pickup, delivery, warnings),
      message: "Route estimate requires pickup and delivery addresses.",
      warnings,
    };
  }

  const validationRequests = [
    validateLabeledAddress("Pickup", plan.pickupAddress),
    validateLabeledAddress("Delivery", plan.deliveryAddress),
    ...plan.stops.map((stop) =>
      validateLabeledAddress(stop.label || "Stop", stop.address)
    ),
    ...(plan.deadheadOrigin
      ? [validateLabeledAddress("Deadhead origin", plan.deadheadOrigin)]
      : []),
  ];
  const validations = await Promise.all(validationRequests);
  const pickup = validations[0];
  const delivery = validations[1];
  const stopPoints = validations.slice(2, 2 + plan.stops.length);
  const deadheadOrigin = plan.deadheadOrigin
    ? validations[validations.length - 1]
    : null;
  const validationWarnings = validations.flatMap(prefixedWarnings);

  const loadedPoints = [pickup, ...stopPoints, delivery];
  const loadedLegResults = await Promise.all(
    loadedPoints.slice(0, -1).map((point, index) =>
      estimateGoogleLeg(point, loadedPoints[index + 1])
    )
  );
  const loadedLegs = loadedLegResults.map((result) => result.leg);
  const loadedLegWarnings = loadedLegResults.flatMap((result) => result.warnings);
  const estimatedLoadedMiles = sumLegMiles(loadedLegs);
  const estimatedLoadedDurationMinutes = sumLegDuration(loadedLegs);
  const deadheadLegResult = deadheadOrigin
    ? await estimateGoogleLeg(deadheadOrigin, pickup)
    : null;
  const deadheadWarnings = deadheadLegResult?.warnings ?? [];
  const estimatedDeadheadMiles =
    deadheadLegResult?.leg.estimatedMiles ?? null;
  const estimatedDeadheadDurationMinutes =
    deadheadLegResult?.leg.estimatedDurationMinutes ?? null;
  const hasDeadhead = Boolean(deadheadOrigin);
  const loadedWarnings = [
    ...validationWarnings.filter(
      (warning) => !warning.startsWith("Deadhead origin:")
    ),
    ...loadedLegWarnings,
  ];
  const deadheadEstimate: DeadheadRouteEstimate | undefined = deadheadOrigin
    ? {
        origin: deadheadOrigin.address,
        pickup: pickup.address,
        estimatedDeadheadMiles,
        estimatedDeadheadDurationMinutes,
        warnings: [
          ...prefixedWarnings(deadheadOrigin),
          ...prefixedWarnings(pickup),
          ...deadheadWarnings,
        ],
      }
    : undefined;
  const loadedEstimate: LoadedRouteEstimate = {
    pickup: pickup.address,
    stops: stopPoints.map((stop) => stop.address),
    delivery: delivery.address,
    estimatedLoadedMiles,
    estimatedLoadedDurationMinutes,
    legs: loadedLegs,
    warnings: loadedWarnings,
  };
  const totalEstimate = {
    estimatedMiles: combineNullableMiles(
      estimatedLoadedMiles,
      estimatedDeadheadMiles,
      hasDeadhead
    ),
    estimatedDurationMinutes: combineNullableMinutes(
      estimatedLoadedDurationMinutes,
      estimatedDeadheadDurationMinutes,
      hasDeadhead
    ),
  };
  const warnings = [
    ...validationWarnings,
    ...loadedLegWarnings,
    ...deadheadWarnings,
    "Google estimate uses standard driving routes and does not account for truck-specific restrictions.",
    "Stops are routed in the order entered.",
    GOOGLE_ROUTE_DISCLAIMER,
  ];
  const status =
    estimatedLoadedMiles !== null
      ? "available"
      : validations.some((validation) => validation.validation.status === "unavailable") ||
          loadedLegResults.some((result) => result.status === "unavailable")
        ? "unavailable"
        : "invalid";
  const estimate: RouteEstimate = {
    provider: "google_estimate",
    origin: pickup.address,
    destination: delivery.address,
    estimatedMiles: estimatedLoadedMiles,
    estimatedDurationMinutes: estimatedLoadedDurationMinutes,
    trafficAwareDurationMinutes: estimatedLoadedDurationMinutes,
    deadheadEstimate,
    loadedEstimate,
    totalEstimate,
    routeLegs: [
      ...(deadheadLegResult ? [deadheadLegResult.leg] : []),
      ...loadedLegs,
    ],
    truckSpecific: false,
    confidence: getMultiPointRouteConfidence(
      [pickup.address, delivery.address, ...stopPoints.map((stop) => stop.address)]
    ),
    warnings,
    disclaimer: GOOGLE_ROUTE_DISCLAIMER,
  };

  return {
    status,
    provider: "google_estimate",
    estimate,
    message:
      status === "available"
        ? "Google route estimate available."
        : "Route estimate unavailable.",
    warnings,
  };
}
