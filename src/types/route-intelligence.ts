export type RouteProvider = "google_estimate" | "trimble_truck";

export type RouteConfidence = "low" | "medium" | "high";

export type VerifiedAddress = {
  input: string;
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
  confidence: RouteConfidence;
  verdict?: string;
  warnings: string[];
};

export type RouteEstimate = {
  provider: RouteProvider;
  origin: VerifiedAddress;
  destination: VerifiedAddress;
  estimatedMiles: number | null;
  estimatedDurationMinutes: number | null;
  trafficAwareDurationMinutes?: number | null;
  routeMileageVariance?: number | null;
  truckSpecific: boolean;
  confidence: RouteConfidence;
  warnings: string[];
  disclaimer: string;
  trackedMovementMiles?: number;
  actualDrivenLoadedMiles?: number;
  movementMileageVariance?: number;
  trackingConfidence?: RouteConfidence;
  trackingSource?:
    | "manual"
    | "browser_geolocation"
    | "native_mobile"
    | "eld_telematics"
    | "future_integration";
  deadheadOdometerStart?: number;
  deadheadOdometerEnd?: number;
  loadedOdometerStart?: number;
  loadedOdometerEnd?: number;
  actualDeadheadMiles?: number;
  actualLoadedMiles?: number;
  actualTotalTripMiles?: number;
  loadedPaidVsActualVariance?: number;
  loadedEstimatedVsActualVariance?: number;
  deadheadEstimatedVsActualVariance?: number;
};

export type RouteIntelligenceStatus =
  | "available"
  | "invalid"
  | "unavailable"
  | "error";

export type AddressValidationResponse = {
  status: RouteIntelligenceStatus;
  provider: RouteProvider;
  address: VerifiedAddress | null;
  message: string;
  warnings: string[];
};

export type RouteEstimateResponse = {
  status: RouteIntelligenceStatus;
  provider: RouteProvider;
  estimate: RouteEstimate | null;
  message: string;
  warnings: string[];
};

export type FutureTrimbleRouteInputs = {
  tractorTrailerProfile: string;
  vehicleHeightInches: number | null;
  vehicleWidthInches: number | null;
  vehicleLengthFeet: number | null;
  grossWeightPounds: number | null;
  axleCount: number | null;
  hazmatLoad: boolean;
  loadFlags: string[];
  preferredRoutingProfile: string;
  tollPreference: "avoid" | "allow" | "prefer";
};

export const GOOGLE_ROUTE_DISCLAIMER =
  "Mileage estimate only. Not truck-legal routing.";

export const TRIMBLE_ROUTE_PLACEHOLDER =
  "Truck-specific routing planned after launch.";
