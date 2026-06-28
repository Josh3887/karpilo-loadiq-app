export type LoadRunStatus =
  | "planned"
  | "booked"
  | "dispatched"
  | "running"
  | "rejected"
  | "pulled"
  | "ran"
  | "test";

export type LoadPulledReason = "breach" | "accident" | "breakdown" | "other" | "";

export type FuelGaugeBand = "green" | "yellow" | "red" | "inactive" | "unavailable";

export type FuelGaugeInput = {
  loadRunStatus: LoadRunStatus;
  totalMiles: number;
  mpg: number;
  fuelPrice: number;
  fuelTankCount: number;
  fuelTankCapacityGallons: number;
  startingFuelPercent: number;
};

export type FuelGaugeResult = {
  band: FuelGaugeBand;
  label: string;
  message: string;
  totalFuelCapacityGallons: number;
  startingFuelGallons: number;
  estimatedTripGallons: number;
  estimatedTripFuelCost: number;
  startingRangeMiles: number;
  remainingRangeMiles: number;
  reserveRangeMiles: number;
  routeCoveragePercent: number;
  shouldAlert: boolean;
};

export const LOAD_RUN_STATUS_OPTIONS: Array<{
  value: LoadRunStatus;
  label: string;
  description: string;
}> = [
  {
    value: "planned",
    label: "Planned",
    description: "Scenario or offer under review. Fuel gauge stays inactive.",
  },
  {
    value: "booked",
    label: "Booked",
    description: "Accepted load. Fuel gauge can evaluate range pressure.",
  },
  {
    value: "dispatched",
    label: "Dispatched",
    description: "Assigned to the truck. Fuel gauge can evaluate range pressure.",
  },
  {
    value: "running",
    label: "Running",
    description: "Load is active. Fuel gauge can alert on range pressure.",
  },
  {
    value: "rejected",
    label: "Rejected",
    description: "Load was declined. Fuel tracking stays off.",
  },
  {
    value: "pulled",
    label: "Pulled",
    description: "Load was pulled after acceptance. Select a reason below.",
  },
  {
    value: "test",
    label: "Test calculation",
    description: "Internal scenario only. Fuel tracking stays off.",
  },
  {
    value: "ran",
    label: "Completed / ran",
    description: "Historical completed load. Use post-trip actuals for receipts.",
  },
];

export const LOAD_PULLED_REASON_OPTIONS: Array<{
  value: LoadPulledReason;
  label: string;
}> = [
  { value: "", label: "Select reason" },
  { value: "breach", label: "Breach" },
  { value: "accident", label: "Accident" },
  { value: "breakdown", label: "Breakdown" },
  { value: "other", label: "Other" },
];

export function isFuelGaugeTrackedStatus(status: LoadRunStatus) {
  return status === "booked" || status === "dispatched" || status === "running";
}

export function isFuelGaugeEntitledTier(tier: string | null | undefined) {
  return (
    tier === "platinum" ||
    tier === "pro" ||
    tier === "pilot" ||
    tier === "launch500" ||
    tier === "founder"
  );
}

export function getLoadRunStatusLabel(status: LoadRunStatus | string | null | undefined) {
  return (
    LOAD_RUN_STATUS_OPTIONS.find((option) => option.value === status)?.label ??
    "Planned"
  );
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function round(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

export function calculateFuelGauge(input: FuelGaugeInput): FuelGaugeResult {
  const totalMiles = Math.max(Number(input.totalMiles), 0);
  const mpg = Math.max(Number(input.mpg), 0);
  const fuelPrice = Math.max(Number(input.fuelPrice), 0);
  const fuelTankCount = Math.max(Math.round(Number(input.fuelTankCount)), 0);
  const fuelTankCapacityGallons = Math.max(
    Number(input.fuelTankCapacityGallons),
    0
  );
  const startingFuelPercent = clamp(Number(input.startingFuelPercent), 0, 100);
  const totalFuelCapacityGallons = fuelTankCount * fuelTankCapacityGallons;
  const startingFuelGallons =
    totalFuelCapacityGallons * (startingFuelPercent / 100);
  const estimatedTripGallons = mpg > 0 ? totalMiles / mpg : 0;
  const startingRangeMiles = startingFuelGallons * mpg;
  const remainingRangeMiles = startingRangeMiles - totalMiles;
  const reserveRangeMiles = Math.max(startingRangeMiles * 0.1, 75);
  const routeCoveragePercent =
    totalMiles > 0 ? (startingRangeMiles / totalMiles) * 100 : 0;
  const estimatedTripFuelCost = estimatedTripGallons * fuelPrice;

  if (!isFuelGaugeTrackedStatus(input.loadRunStatus)) {
    return {
      band: "inactive",
      label: "Fuel gauge inactive",
      message:
        "Fuel monitoring only activates when a load is booked, dispatched, or running.",
      totalFuelCapacityGallons: round(totalFuelCapacityGallons),
      startingFuelGallons: round(startingFuelGallons),
      estimatedTripGallons: round(estimatedTripGallons),
      estimatedTripFuelCost: round(estimatedTripFuelCost),
      startingRangeMiles: round(startingRangeMiles),
      remainingRangeMiles: round(remainingRangeMiles),
      reserveRangeMiles: round(reserveRangeMiles),
      routeCoveragePercent: round(routeCoveragePercent),
      shouldAlert: false,
    };
  }

  if (
    totalMiles <= 0 ||
    mpg <= 0 ||
    totalFuelCapacityGallons <= 0 ||
    startingFuelGallons <= 0
  ) {
    return {
      band: "unavailable",
      label: "Fuel setup needed",
      message:
        "Add tank count, tank size, starting fuel, MPG, and load miles before fuel range can be evaluated.",
      totalFuelCapacityGallons: round(totalFuelCapacityGallons),
      startingFuelGallons: round(startingFuelGallons),
      estimatedTripGallons: round(estimatedTripGallons),
      estimatedTripFuelCost: round(estimatedTripFuelCost),
      startingRangeMiles: round(startingRangeMiles),
      remainingRangeMiles: round(remainingRangeMiles),
      reserveRangeMiles: round(reserveRangeMiles),
      routeCoveragePercent: round(routeCoveragePercent),
      shouldAlert: true,
    };
  }

  if (remainingRangeMiles <= reserveRangeMiles || routeCoveragePercent < 105) {
    return {
      band: "red",
      label: "Time to fuel",
      message:
        "Projected range is inside the reserve buffer for this active load. Plan a fuel stop before range becomes operational pressure.",
      totalFuelCapacityGallons: round(totalFuelCapacityGallons),
      startingFuelGallons: round(startingFuelGallons),
      estimatedTripGallons: round(estimatedTripGallons),
      estimatedTripFuelCost: round(estimatedTripFuelCost),
      startingRangeMiles: round(startingRangeMiles),
      remainingRangeMiles: round(remainingRangeMiles),
      reserveRangeMiles: round(reserveRangeMiles),
      routeCoveragePercent: round(routeCoveragePercent),
      shouldAlert: true,
    };
  }

  if (remainingRangeMiles <= reserveRangeMiles + 150 || routeCoveragePercent < 130) {
    return {
      band: "yellow",
      label: "Fuel moderate",
      message:
        "Projected range can cover the load, but buffer is narrowing. Compare pump timing against route, price, and appointment pressure.",
      totalFuelCapacityGallons: round(totalFuelCapacityGallons),
      startingFuelGallons: round(startingFuelGallons),
      estimatedTripGallons: round(estimatedTripGallons),
      estimatedTripFuelCost: round(estimatedTripFuelCost),
      startingRangeMiles: round(startingRangeMiles),
      remainingRangeMiles: round(remainingRangeMiles),
      reserveRangeMiles: round(reserveRangeMiles),
      routeCoveragePercent: round(routeCoveragePercent),
      shouldAlert: true,
    };
  }

  return {
    band: "green",
    label: "Fuel good",
    message:
      "Projected range has a workable buffer for this active load based on profile tank capacity and entered MPG.",
    totalFuelCapacityGallons: round(totalFuelCapacityGallons),
    startingFuelGallons: round(startingFuelGallons),
    estimatedTripGallons: round(estimatedTripGallons),
    estimatedTripFuelCost: round(estimatedTripFuelCost),
    startingRangeMiles: round(startingRangeMiles),
    remainingRangeMiles: round(remainingRangeMiles),
    reserveRangeMiles: round(reserveRangeMiles),
    routeCoveragePercent: round(routeCoveragePercent),
    shouldAlert: false,
  };
}
