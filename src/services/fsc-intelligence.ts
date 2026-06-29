export const KARPILO_FSC_BASE_DIESEL_PRICE = 1.2;
export const KARPILO_FSC_DIESEL_STEP = 0.06;
export const KARPILO_FSC_CPM_STEP = 0.01;

export const KARPILO_FSC_DISCLAIMER =
  "Fuel surcharge rules vary by carrier, broker, customer, contract, and individual load. When actual FSC is not provided, Karpilo LoadIQ uses an adopted baseline FSC model for estimation and education only. Actual user-entered FSC remains the source of truth when provided.";

export type FscSourceMode =
  | "actual_fsc_entered"
  | "fsc_built_into_gross"
  | "fsc_separate_missing"
  | "unknown";

export type FscConfidence = "low" | "moderate" | "high";

export type KarpiloFscIntelligence = {
  fscSourceMode: FscSourceMode;
  dieselPriceSource: string;
  dieselPriceUsed: number | null;
  dieselPriceFallbackUsed?: boolean;
  paidLoadedMiles: number | null;
  totalProjectedMiles: number | null;
  mpgUsed: number | null;
  estimatedFscCpm: number | null;
  actualFscCpm?: number | null;
  actualFscRevenue?: number | null;
  fscRevenue: number | null;
  estimatedLinehaulRevenue?: number | null;
  estimatedTotalRevenue?: number | null;
  estimatedGallons: number | null;
  eiaFuelCost: number | null;
  eiaFuelCpm: number | null;
  effectiveFscCpm: number | null;
  fuelBudgetDelta: number | null;
  fuelBudgetDeltaCpm: number | null;
  fscCoverageRatio: number | null;
  isNetPositiveOnFsc: boolean | null;
  fscConfidence: FscConfidence;
  explanatoryMessage: string;
  disclaimerMessage: string;
  warnings: string[];
};

export type CalculateFscIntelligenceInput = {
  fscSourceMode: FscSourceMode;
  grossRevenue: number;
  actualFscRevenue: number;
  paidLoadedMiles: number;
  deadheadMiles: number;
  outOfRouteMiles: number | null;
  mpg: number;
  dieselPrice: number;
  dieselPriceSource: string;
  dieselPriceFallbackUsed?: boolean;
};

function finitePositive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : null;
}

function nonNegative(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function roundCurrency(value: number | null) {
  return value === null ? null : Number(value.toFixed(2));
}

function roundCpm(value: number | null) {
  return value === null ? null : Number(value.toFixed(4));
}

function roundRatio(value: number | null) {
  return value === null ? null : Number(value.toFixed(4));
}

export function calculateKarpiloBaselineFscCpm(dieselPrice: number) {
  if (!Number.isFinite(dieselPrice) || dieselPrice <= 0) {
    return null;
  }

  const fuelDelta = Math.max(0, dieselPrice - KARPILO_FSC_BASE_DIESEL_PRICE);
  const fscSteps = Math.floor(
    (fuelDelta + Number.EPSILON * 100) / KARPILO_FSC_DIESEL_STEP
  );

  return roundCpm(fscSteps * KARPILO_FSC_CPM_STEP);
}

export function calculateFscIntelligence(
  input: CalculateFscIntelligenceInput
): KarpiloFscIntelligence {
  const paidLoadedMiles = finitePositive(input.paidLoadedMiles);
  const deadheadMiles = nonNegative(input.deadheadMiles);
  const outOfRouteMiles =
    input.outOfRouteMiles === null ? null : nonNegative(input.outOfRouteMiles);
  const mpg = finitePositive(input.mpg);
  const dieselPrice = finitePositive(input.dieselPrice);
  const actualFscRevenue = nonNegative(input.actualFscRevenue);
  const estimatedFscCpm =
    dieselPrice === null ? null : calculateKarpiloBaselineFscCpm(dieselPrice);
  const estimatedFscRevenue =
    paidLoadedMiles === null || estimatedFscCpm === null
      ? null
      : paidLoadedMiles * estimatedFscCpm;
  const fscRevenue = resolveFscRevenue(
    input.fscSourceMode,
    actualFscRevenue,
    estimatedFscRevenue
  );
  const totalProjectedMiles =
    paidLoadedMiles === null
      ? null
      : paidLoadedMiles + deadheadMiles + (outOfRouteMiles ?? 0);
  const estimatedGallons =
    totalProjectedMiles === null || totalProjectedMiles <= 0 || mpg === null
      ? null
      : totalProjectedMiles / mpg;
  const eiaFuelCost =
    estimatedGallons === null || dieselPrice === null
      ? null
      : estimatedGallons * dieselPrice;
  const eiaFuelCpm =
    dieselPrice === null || mpg === null ? null : dieselPrice / mpg;
  const effectiveFscCpm =
    fscRevenue === null ||
    totalProjectedMiles === null ||
    totalProjectedMiles <= 0
      ? null
      : fscRevenue / totalProjectedMiles;
  const fuelBudgetDelta =
    fscRevenue === null || eiaFuelCost === null
      ? null
      : fscRevenue - eiaFuelCost;
  const fuelBudgetDeltaCpm =
    effectiveFscCpm === null || eiaFuelCpm === null
      ? null
      : effectiveFscCpm - eiaFuelCpm;
  const fscCoverageRatio =
    fscRevenue === null || eiaFuelCost === null || eiaFuelCost <= 0
      ? null
      : fscRevenue / eiaFuelCost;
  const warnings = buildFscWarnings({
    sourceMode: input.fscSourceMode,
    paidLoadedMiles,
    totalProjectedMiles,
    mpg,
    dieselPrice,
    dieselPriceFallbackUsed: Boolean(input.dieselPriceFallbackUsed),
    outOfRouteMiles,
    fscCoverageRatio,
  });
  const fscConfidence = getFscConfidence(warnings.length);

  return {
    fscSourceMode: input.fscSourceMode,
    dieselPriceSource: input.dieselPriceSource || "Unknown",
    dieselPriceUsed: roundCurrency(dieselPrice),
    dieselPriceFallbackUsed: Boolean(input.dieselPriceFallbackUsed),
    paidLoadedMiles: roundCurrency(paidLoadedMiles),
    totalProjectedMiles: roundCurrency(totalProjectedMiles),
    mpgUsed: roundCpm(mpg),
    estimatedFscCpm,
    actualFscCpm:
      input.fscSourceMode !== "actual_fsc_entered" ||
      paidLoadedMiles === null ||
      paidLoadedMiles <= 0
        ? null
        : roundCpm(actualFscRevenue / paidLoadedMiles),
    actualFscRevenue:
      input.fscSourceMode === "actual_fsc_entered"
        ? roundCurrency(actualFscRevenue)
        : null,
    fscRevenue: roundCurrency(fscRevenue),
    estimatedLinehaulRevenue: resolveEstimatedLinehaulRevenue(
      input.fscSourceMode,
      input.grossRevenue,
      estimatedFscRevenue
    ),
    estimatedTotalRevenue: resolveEstimatedTotalRevenue(
      input.fscSourceMode,
      input.grossRevenue,
      estimatedFscRevenue
    ),
    estimatedGallons: roundCurrency(estimatedGallons),
    eiaFuelCost: roundCurrency(eiaFuelCost),
    eiaFuelCpm: roundCpm(eiaFuelCpm),
    effectiveFscCpm: roundCpm(effectiveFscCpm),
    fuelBudgetDelta: roundCurrency(fuelBudgetDelta),
    fuelBudgetDeltaCpm: roundCpm(fuelBudgetDeltaCpm),
    fscCoverageRatio: roundRatio(fscCoverageRatio),
    isNetPositiveOnFsc:
      fuelBudgetDelta === null ? null : fuelBudgetDelta > 0,
    fscConfidence,
    explanatoryMessage: buildFscMessage({
      sourceMode: input.fscSourceMode,
      fscRevenue,
      eiaFuelCost,
      fuelBudgetDelta,
      fuelBudgetDeltaCpm,
      fscCoverageRatio,
    }),
    disclaimerMessage: KARPILO_FSC_DISCLAIMER,
    warnings,
  };
}

function resolveFscRevenue(
  sourceMode: FscSourceMode,
  actualFscRevenue: number,
  estimatedFscRevenue: number | null
) {
  if (sourceMode === "actual_fsc_entered") {
    return actualFscRevenue;
  }

  if (
    sourceMode === "fsc_built_into_gross" ||
    sourceMode === "fsc_separate_missing"
  ) {
    return estimatedFscRevenue;
  }

  return actualFscRevenue > 0 ? actualFscRevenue : null;
}

function resolveEstimatedLinehaulRevenue(
  sourceMode: FscSourceMode,
  grossRevenue: number,
  estimatedFscRevenue: number | null
) {
  if (sourceMode !== "fsc_built_into_gross" || estimatedFscRevenue === null) {
    return undefined;
  }

  return roundCurrency(Math.max(nonNegative(grossRevenue) - estimatedFscRevenue, 0));
}

function resolveEstimatedTotalRevenue(
  sourceMode: FscSourceMode,
  grossRevenue: number,
  estimatedFscRevenue: number | null
) {
  if (sourceMode !== "fsc_separate_missing" || estimatedFscRevenue === null) {
    return undefined;
  }

  return roundCurrency(nonNegative(grossRevenue) + estimatedFscRevenue);
}

function buildFscWarnings({
  sourceMode,
  paidLoadedMiles,
  totalProjectedMiles,
  mpg,
  dieselPrice,
  dieselPriceFallbackUsed,
  outOfRouteMiles,
  fscCoverageRatio,
}: {
  sourceMode: FscSourceMode;
  paidLoadedMiles: number | null;
  totalProjectedMiles: number | null;
  mpg: number | null;
  dieselPrice: number | null;
  dieselPriceFallbackUsed: boolean;
  outOfRouteMiles: number | null;
  fscCoverageRatio: number | null;
}) {
  const warnings: string[] = [];

  if (sourceMode !== "actual_fsc_entered") {
    warnings.push("Actual FSC was not entered, so the FSC value is estimated.");
  }

  if (sourceMode === "unknown") {
    warnings.push("FSC treatment is unknown, so revenue separation is limited.");
  }

  if (paidLoadedMiles === null) {
    warnings.push("Paid loaded miles are missing, so FSC revenue cannot be estimated.");
  }

  if (totalProjectedMiles === null || totalProjectedMiles <= 0) {
    warnings.push("Projected trip miles are missing, so effective FSC CPM cannot be calculated.");
  }

  if (mpg === null) {
    warnings.push("MPG is missing, so EIA-indexed fuel cost cannot be calculated.");
  }

  if (dieselPrice === null) {
    warnings.push("Diesel price is missing, so the baseline FSC model is unavailable.");
  }

  if (dieselPriceFallbackUsed) {
    warnings.push("EIA diesel baseline was not the active fuel source, so confidence is reduced.");
  }

  if (outOfRouteMiles === null) {
    warnings.push("Route variance was unavailable, so out-of-route exposure is not included.");
  }

  if (fscCoverageRatio !== null && fscCoverageRatio < 0.75) {
    warnings.push("FSC covers less than 75% of modeled fuel exposure.");
  }

  return warnings;
}

function getFscConfidence(warningCount: number): FscConfidence {
  if (warningCount === 0) return "high";
  if (warningCount <= 3) return "moderate";
  return "low";
}

function buildFscMessage({
  sourceMode,
  fscRevenue,
  eiaFuelCost,
  fuelBudgetDelta,
  fuelBudgetDeltaCpm,
  fscCoverageRatio,
}: {
  sourceMode: FscSourceMode;
  fscRevenue: number | null;
  eiaFuelCost: number | null;
  fuelBudgetDelta: number | null;
  fuelBudgetDeltaCpm: number | null;
  fscCoverageRatio: number | null;
}) {
  const sourceText = getSourceModeMessage(sourceMode);

  if (
    fscRevenue === null ||
    eiaFuelCost === null ||
    fuelBudgetDelta === null ||
    fuelBudgetDeltaCpm === null ||
    fscCoverageRatio === null
  ) {
    return `${sourceText} Complete paid miles, MPG, diesel price, and FSC treatment to compare FSC against projected fuel exposure.`;
  }

  const coverageText = `${Math.round(fscCoverageRatio * 100)}%`;
  const deltaText = `$${Math.abs(fuelBudgetDelta).toFixed(2)}`;
  const cpmText = `$${Math.abs(fuelBudgetDeltaCpm).toFixed(2)}/mi`;

  if (fuelBudgetDelta < -1) {
    return `${sourceText} FSC covers ${coverageText} of projected fuel exposure, leaving an estimated fuel budget shortfall of -${deltaText}, or -${cpmText} per projected mile. Part of the remaining linehaul revenue is being consumed by fuel.`;
  }

  if (fuelBudgetDelta > 1) {
    return `${sourceText} FSC covers ${coverageText} of projected fuel exposure, leaving an estimated net-positive fuel budget of ${deltaText}, or ${cpmText} per projected mile.`;
  }

  return `${sourceText} FSC is approximately fuel-neutral against EIA-indexed diesel pricing for the projected trip miles.`;
}

function getSourceModeMessage(sourceMode: FscSourceMode) {
  if (sourceMode === "actual_fsc_entered") {
    return "User-entered FSC is treated as the source of truth.";
  }

  if (sourceMode === "fsc_built_into_gross") {
    return "Karpilo FSC Intelligence estimates the FSC portion built into the entered load gross.";
  }

  if (sourceMode === "fsc_separate_missing") {
    return "Karpilo FSC Intelligence estimates separate FSC because the actual amount was not entered.";
  }

  return "FSC treatment is unknown, so Karpilo FSC Intelligence provides education-only context.";
}
