import {
  AddressValidationResponse,
  GOOGLE_ROUTE_DISCLAIMER,
  RouteConfidence,
  RouteEstimate,
  RouteEstimateResponse,
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
  warnings: string[]
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
  };
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
  const [originValidation, destinationValidation] = await Promise.all([
    validateGoogleAddress(originInput),
    validateGoogleAddress(destinationInput),
  ]);

  const origin =
    originValidation.address ??
    emptyVerifiedAddress(originInput, "Origin validation unavailable.");
  const destination =
    destinationValidation.address ??
    emptyVerifiedAddress(destinationInput, "Destination validation unavailable.");
  const validationWarnings = [
    ...originValidation.warnings.map((warning) => `Pickup: ${warning}`),
    ...destinationValidation.warnings.map((warning) => `Delivery: ${warning}`),
  ];

  if (!hasCoordinates(origin) || !hasCoordinates(destination)) {
    const warnings = [
      ...validationWarnings,
      "Route mileage requires validated pickup and delivery coordinates.",
      GOOGLE_ROUTE_DISCLAIMER,
    ];

    return {
      status:
        originValidation.status === "unavailable" ||
        destinationValidation.status === "unavailable"
          ? "unavailable"
          : "invalid",
      provider: "google_estimate",
      estimate: buildUnavailableEstimate(origin, destination, warnings),
      message: "Route estimate unavailable.",
      warnings,
    };
  }

  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    const warnings = [
      ...validationWarnings,
      "GOOGLE_MAPS_API_KEY is not configured.",
    ];

    return {
      status: "unavailable",
      provider: "google_estimate",
      estimate: buildUnavailableEstimate(origin, destination, warnings),
      message: "Google Routes API is not configured.",
      warnings,
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
            latitude: origin.lat,
            longitude: origin.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng,
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
    const message = formatGoogleError(
      `Google Routes API returned HTTP ${response.status}. Check API enablement, quota, billing, and request validity.`,
      payload
    );
    const warnings = [...validationWarnings, message, GOOGLE_ROUTE_DISCLAIMER];

    return {
      status: "unavailable",
      provider: "google_estimate",
      estimate: buildUnavailableEstimate(origin, destination, warnings),
      message,
      warnings,
    };
  }

  const route = payload?.routes?.[0];

  if (!route || !isNumber(route.distanceMeters)) {
    const warnings = [
      ...validationWarnings,
      "Google Routes API did not return a usable route distance.",
      GOOGLE_ROUTE_DISCLAIMER,
    ];

    return {
      status: "unavailable",
      provider: "google_estimate",
      estimate: buildUnavailableEstimate(origin, destination, warnings),
      message: "Google route estimate did not include distance.",
      warnings,
    };
  }

  const trafficAwareDurationMinutes = parseDurationMinutes(route.duration);
  const estimatedDurationMinutes =
    trafficAwareDurationMinutes ?? parseDurationMinutes(route.staticDuration);
  const warnings = [
    ...validationWarnings,
    "Google estimate uses standard driving routes and does not account for truck-specific restrictions.",
    GOOGLE_ROUTE_DISCLAIMER,
  ];

  return {
    status: "available",
    provider: "google_estimate",
    estimate: {
      provider: "google_estimate",
      origin,
      destination,
      estimatedMiles: roundMiles(route.distanceMeters),
      estimatedDurationMinutes,
      trafficAwareDurationMinutes,
      truckSpecific: false,
      confidence: getRouteConfidence(origin, destination),
      warnings,
      disclaimer: GOOGLE_ROUTE_DISCLAIMER,
    },
    message: "Google route estimate available.",
    warnings,
  };
}
