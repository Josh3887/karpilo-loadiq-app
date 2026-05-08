import {
  LoadInput,
  LoadResult,
  LoadWarning,
  ProfitabilityBand,
} from "@/types/load";

function round(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getProfitabilityBand(
  score: number
): ProfitabilityBand {
  if (score >= 90) return "excellent";
  if (score >= 75) return "strong";
  if (score >= 60) return "moderate";
  if (score >= 40) return "weak";

  return "dangerous";
}

export function calculateLoadMetrics(
  input: LoadInput
): LoadResult {
  const grossRevenue =
    input.loadedMiles * input.ratePerMile;

  const totalMiles =
    input.loadedMiles + input.deadheadMiles;

  const fuelCost =
    (totalMiles / input.mpg) * input.fuelPrice;

  const trueRpm =
    totalMiles > 0
      ? grossRevenue / totalMiles
      : 0;

  const dispatchCost =
    grossRevenue * (input.dispatchPercent / 100);

  const factoringCost =
    grossRevenue * (input.factoringPercent / 100);

  const operationalCost =
    fuelCost +
    input.overhead +
    input.accessorials +
    input.tolls +
    input.lumpers +
    dispatchCost +
    factoringCost +
    input.reserveAllocation;

  const estimatedNet =
    grossRevenue - operationalCost;

  const deadheadPercent =
    input.loadedMiles > 0
      ? (input.deadheadMiles / input.loadedMiles) *
        100
      : 0;

  const fuelPercentOfGross =
    grossRevenue > 0
      ? (fuelCost / grossRevenue) * 100
      : 0;

  const profitMarginPercent =
    grossRevenue > 0
      ? (estimatedNet / grossRevenue) * 100
      : 0;

  let profitabilityScore = 100;

  if (profitMarginPercent < 20)
    profitabilityScore -= 10;

  if (profitMarginPercent < 10)
    profitabilityScore -= 20;

  if (deadheadPercent > 25)
    profitabilityScore -= 20;

  if (trueRpm < input.targetTrueRpm)
    profitabilityScore -= 20;

  profitabilityScore = clamp(
    profitabilityScore,
    0,
    100
  );

  const warnings: LoadWarning[] = [];

  if (deadheadPercent > 25) {
    warnings.push({
      type: "deadhead",
      severity: "danger",
      message:
        "Deadhead is severely compressing profitability.",
    });
  }

  if (fuelPercentOfGross > 35) {
    warnings.push({
      type: "fuel",
      severity: "warning",
      message:
        "Fuel consumption risk detected.",
    });
  }

  if (trueRpm < input.targetTrueRpm) {
    warnings.push({
      type: "bad_load",
      severity: "danger",
      message:
        "This load may operate below sustainable profitability.",
    });
  }

  if (estimatedNet <= 0) {
    warnings.push({
      type: "margin",
      severity: "danger",
      message:
        "Margin compression detected. This trip may not support sustainable operation.",
    });
  }

  return {
    grossRevenue: round(grossRevenue),
    totalMiles: round(totalMiles),
    fuelCost: round(fuelCost),
    trueRpm: round(trueRpm),
    dispatchCost: round(dispatchCost),
    factoringCost: round(factoringCost),
    operationalCost: round(operationalCost),
    estimatedNet: round(estimatedNet),
    deadheadPercent: round(deadheadPercent),
    fuelPercentOfGross: round(fuelPercentOfGross),
    profitMarginPercent: round(
      profitMarginPercent
    ),
    profitabilityScore,
    profitabilityBand:
      getProfitabilityBand(
        profitabilityScore
      ),
    warnings,
  };
}