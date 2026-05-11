import {
  LoadInput,
  LoadResult,
  LoadWarning,
  PayStructure,
  ProfitabilityBand,
} from "@/types/load";

export const CALCULATION_VERSION = "loadiq-v2";

function round(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getProfitabilityBand(score: number): ProfitabilityBand {
  if (score >= 90) return "excellent";
  if (score >= 75) return "strong";
  if (score >= 60) return "moderate";
  if (score >= 40) return "weak";

  return "dangerous";
}

function money(value: number) {
  return `$${round(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function defaultPayStructure(): PayStructure {
  return {
    type: "percentage",
    label: "100% gross",
    percentageChain: [100],
    cpmRate: 0,
    flatAmount: 0,
    dailyRate: 0,
    includeFuelSurcharge: true,
    includeAccessorials: true,
  };
}

function calculatePercentageMultiplier(percentageChain: number[]) {
  if (percentageChain.length === 0) return 1;

  return percentageChain.reduce((multiplier, percent) => {
    return multiplier * (clamp(percent, 0, 100) / 100);
  }, 1);
}

function calculatePayableRevenue(input: LoadInput, baseRevenue: number) {
  const payStructure = input.payStructure ?? defaultPayStructure();
  const accessorialRevenue = input.accessorialItems
    .filter((item) => item.direction === "revenue")
    .reduce((total, item) => total + Number(item.amount), 0);
  const reimbursedRevenue = input.accessorialItems
    .filter((item) => item.direction === "expense" && item.isReimbursed)
    .reduce((total, item) => total + Number(item.amount), 0);

  const eligibleRevenue =
    baseRevenue +
    (payStructure.includeFuelSurcharge ? input.fuelSurcharge : 0) +
    (payStructure.includeAccessorials
      ? accessorialRevenue + reimbursedRevenue
      : 0);

  if (payStructure.type === "cpm") {
    return input.loadedMiles * payStructure.cpmRate;
  }

  if (payStructure.type === "flat") {
    return payStructure.flatAmount;
  }

  if (payStructure.type === "daily") {
    return payStructure.dailyRate * Math.max(input.dispatchDays, 1);
  }

  return eligibleRevenue * calculatePercentageMultiplier(payStructure.percentageChain);
}

export function calculateLoadMetrics(input: LoadInput): LoadResult {
  const accessorialRevenue = input.accessorialItems
    .filter((item) => item.direction === "revenue")
    .reduce((total, item) => total + Number(item.amount), 0);

  const reimbursedRevenue = input.accessorialItems
    .filter((item) => item.direction === "expense" && item.isReimbursed)
    .reduce((total, item) => total + Number(item.amount), 0);

  const accessorialExpense = input.accessorialItems
    .filter((item) => item.direction === "expense")
    .reduce((total, item) => total + Number(item.amount), 0);

  const reimbursedAccessorialExpense = input.accessorialItems
    .filter((item) => item.direction === "expense" && item.isReimbursed)
    .reduce((total, item) => total + Number(item.amount), 0);

  const linehaulRevenue = input.loadedMiles * input.ratePerMile;
  const fuelSurchargeRevenue = input.fuelSurcharge;
  const grossRevenue =
    linehaulRevenue +
    fuelSurchargeRevenue +
    accessorialRevenue +
    reimbursedRevenue;
  const payableRevenue = calculatePayableRevenue(input, linehaulRevenue);
  const netRevenue = payableRevenue;
  const totalMiles = input.loadedMiles + input.deadheadMiles;
  const fuelCost = totalMiles > 0 ? (totalMiles / input.mpg) * input.fuelPrice : 0;
  const variableCosts = totalMiles * input.variableCostPerMile;
  const trueRpm = totalMiles > 0 ? grossRevenue / totalMiles : 0;
  const rpmAfterDeadhead = trueRpm;
  const dispatchCost = grossRevenue * (input.dispatchPercent / 100);
  const factoringCost = grossRevenue * (input.factoringPercent / 100);
  const reserves =
    input.reserveAllocation + input.maintenanceReserve + input.tireReserve;

  const operationalCost =
    fuelCost +
    input.overhead +
    accessorialExpense +
    input.tolls +
    input.lumpers +
    dispatchCost +
    factoringCost +
    reserves +
    input.trailerFee +
    input.insuranceAllocation +
    variableCosts +
    input.fixedCostAllocation;

  const totalTripCost = operationalCost;
  const estimatedNet = netRevenue - totalTripCost;
  const retainedEarnings = estimatedNet + reserves;
  const deadheadPercent =
    input.loadedMiles > 0 ? (input.deadheadMiles / input.loadedMiles) * 100 : 0;
  const fuelPercentOfGross =
    grossRevenue > 0 ? (fuelCost / grossRevenue) * 100 : 0;
  const profitMarginPercent =
    grossRevenue > 0 ? (estimatedNet / grossRevenue) * 100 : 0;
  const costPerMile = totalMiles > 0 ? totalTripCost / totalMiles : 0;
  const breakEvenRpm =
    input.loadedMiles > 0
      ? (totalTripCost - fuelSurchargeRevenue - accessorialRevenue) /
        input.loadedMiles
      : 0;
  const operatingDays = Math.max(input.dispatchDays + input.deadheadDays, 0.25);
  const dailyProfitability = estimatedNet / operatingDays;
  const hourlyProfitability = estimatedNet / (operatingDays * 11);

  let profitabilityScore = 100;

  if (profitMarginPercent < 20) profitabilityScore -= 10;
  if (profitMarginPercent < 10) profitabilityScore -= 20;
  if (profitMarginPercent <= 0) profitabilityScore -= 25;
  if (deadheadPercent > 15) profitabilityScore -= 10;
  if (deadheadPercent > 25) profitabilityScore -= 15;
  if (trueRpm < input.targetTrueRpm) profitabilityScore -= 20;
  if (input.ratePerMile < breakEvenRpm) profitabilityScore -= 20;
  if (fuelPercentOfGross > 35) profitabilityScore -= 10;

  profitabilityScore = clamp(Math.round(profitabilityScore), 0, 100);

  const warnings: LoadWarning[] = [];

  if (deadheadPercent > 25) {
    warnings.push({
      type: "deadhead",
      severity: "danger",
      message: "Deadhead is severely compressing profitability.",
    });
  } else if (deadheadPercent > 15) {
    warnings.push({
      type: "deadhead",
      severity: "warning",
      message: "Deadhead exposure is pressuring true RPM.",
    });
  }

  if (fuelPercentOfGross > 35) {
    warnings.push({
      type: "fuel",
      severity: "warning",
      message: "Fuel is consuming an elevated share of gross revenue.",
    });
  }

  if (trueRpm < input.targetTrueRpm) {
    warnings.push({
      type: "bad_load",
      severity: "danger",
      message: "This load may operate below your target true RPM.",
    });
  }

  if (input.ratePerMile < breakEvenRpm) {
    warnings.push({
      type: "break_even",
      severity: "danger",
      message: "Booked RPM is below estimated break-even RPM.",
    });
  }

  if (estimatedNet <= 0) {
    warnings.push({
      type: "margin",
      severity: "danger",
      message:
        "Margin compression detected. This trip may not support sustainable operation.",
    });
  } else if (dailyProfitability < 250) {
    warnings.push({
      type: "cash_flow",
      severity: "warning",
      message: "Daily net may be too thin for volatile operating weeks.",
    });
  }

  const explanations = [
    estimatedNet > 0
      ? `Estimated net is ${money(estimatedNet)} after modeled trip costs.`
      : `Estimated net is negative at ${money(estimatedNet)}, so the load needs repricing or cost relief.`,
    `True RPM is ${money(trueRpm)}/mi across ${round(totalMiles)} total miles.`,
    `Break-even linehaul RPM is approximately ${money(breakEvenRpm)}/mi before profit.`,
  ];

  if (fuelCost > 0) {
    explanations.push(
      `Fuel is modeled at ${money(fuelCost)} using ${round(input.mpg)} MPG and ${money(input.fuelPrice)}/gal.`
    );
  }

  if (reserves > 0) {
    explanations.push(
      `${money(reserves)} is being protected for reserve allocations before retained earnings.`
    );
  }

  return {
    calculationVersion: CALCULATION_VERSION,
    linehaulRevenue: round(linehaulRevenue),
    fuelSurchargeRevenue: round(fuelSurchargeRevenue),
    accessorialRevenue: round(accessorialRevenue),
    reimbursedRevenue: round(reimbursedRevenue),
    grossRevenue: round(grossRevenue),
    payableRevenue: round(payableRevenue),
    netRevenue: round(netRevenue),
    totalMiles: round(totalMiles),
    fuelCost: round(fuelCost),
    trueRpm: round(trueRpm),
    rpmAfterDeadhead: round(rpmAfterDeadhead),
    dispatchCost: round(dispatchCost),
    factoringCost: round(factoringCost),
    operationalCost: round(operationalCost),
    totalTripCost: round(totalTripCost),
    estimatedNet: round(estimatedNet),
    retainedEarnings: round(retainedEarnings),
    deadheadPercent: round(deadheadPercent),
    fuelPercentOfGross: round(fuelPercentOfGross),
    profitMarginPercent: round(profitMarginPercent),
    costPerMile: round(costPerMile),
    breakEvenRpm: round(breakEvenRpm),
    dailyProfitability: round(dailyProfitability),
    hourlyProfitability: round(hourlyProfitability),
    profitabilityScore,
    profitabilityBand: getProfitabilityBand(profitabilityScore),
    costBreakdown: {
      fuel: round(fuelCost),
      accessorialExpense: round(accessorialExpense),
      reimbursedAccessorialExpense: round(reimbursedAccessorialExpense),
      tolls: round(input.tolls),
      lumpers: round(input.lumpers),
      dispatch: round(dispatchCost),
      factoring: round(factoringCost),
      reserves: round(input.reserveAllocation),
      maintenanceReserve: round(input.maintenanceReserve),
      tireReserve: round(input.tireReserve),
      overhead: round(input.overhead),
      trailerFee: round(input.trailerFee),
      insuranceAllocation: round(input.insuranceAllocation),
      variableCosts: round(variableCosts),
      fixedCostAllocation: round(input.fixedCostAllocation),
    },
    warnings,
    explanations,
  };
}
