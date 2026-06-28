import {
  LoadPurchaseEntry,
  LoadPurchaseKind,
  OdometerValidation,
} from "@/types/trip-validation";

type OdometerValidationInput = {
  originOdometer?: number;
  endOdometer?: number;
  estimatedTotalMiles?: number | null;
  paidLoadedMiles?: number | null;
  capturedAtStatus?: string | null;
};

type PurchaseLike = {
  id?: string;
  expenseCategory?: string;
  expenseSubcategory?: string;
  city?: string;
  state?: string;
  quantityGallons?: number;
  pricePerGallon?: number;
  calculatedTotal?: number;
  amount?: number;
  date?: string;
  vendorName?: string;
  notes?: string;
};

export function isRunningLoadStatus(status: string | null | undefined) {
  return status === "running";
}

export function isCompletedLoadStatus(status: string | null | undefined) {
  return status === "ran" || status === "completed";
}

export function buildOdometerValidation({
  originOdometer,
  endOdometer,
  estimatedTotalMiles,
  paidLoadedMiles,
  capturedAtStatus,
}: OdometerValidationInput): OdometerValidation {
  const origin = positiveOptional(originOdometer);
  const end = positiveOptional(endOdometer);
  const estimated = positiveOptional(estimatedTotalMiles);
  const paid = positiveOptional(paidLoadedMiles);
  const warnings: string[] = [];
  let actualTotalMiles: number | undefined;

  if (origin !== undefined && end !== undefined) {
    if (end < origin) {
      warnings.push("End odometer must be greater than or equal to origin odometer.");
    } else {
      actualTotalMiles = roundMiles(end - origin);
    }
  } else if (origin !== undefined || end !== undefined) {
    warnings.push("Enter both origin and end odometer readings to validate actual mileage.");
  }

  const odometerVarianceVsEstimated =
    actualTotalMiles !== undefined && estimated !== undefined
      ? roundMiles(actualTotalMiles - estimated)
      : undefined;
  const odometerVarianceVsPaid =
    actualTotalMiles !== undefined && paid !== undefined
      ? roundMiles(actualTotalMiles - paid)
      : undefined;

  if (
    odometerVarianceVsEstimated !== undefined &&
    estimated !== undefined &&
    Math.abs(odometerVarianceVsEstimated) > Math.max(25, estimated * 0.15)
  ) {
    warnings.push(
      "Actual odometer mileage has a large variance from the route estimate. Verify route, stops, and odometer readings."
    );
  }

  return {
    originOdometer: origin,
    endOdometer: end,
    actualTotalMiles,
    odometerVarianceVsEstimated,
    odometerVarianceVsPaid,
    capturedAtStatus: capturedAtStatus ?? undefined,
    warnings,
  };
}

export function buildLoadPurchaseEntries(
  expenses: PurchaseLike[] | undefined,
  kind: LoadPurchaseKind
): LoadPurchaseEntry[] {
  const expectedSubcategory = kind === "fuel" ? "Diesel" : "DEF";

  return (expenses ?? [])
    .filter(
      (expense) =>
        expense.expenseCategory === "fuel_fluids" &&
        expense.expenseSubcategory === expectedSubcategory
    )
    .map((expense) => {
      const gallons = nonNegative(expense.quantityGallons);
      const pricePerGallon = nonNegative(expense.pricePerGallon);
      const calculatedTotal = nonNegative(expense.calculatedTotal);
      const amount = nonNegative(expense.amount);
      const totalAmount =
        calculatedTotal > 0
          ? calculatedTotal
          : amount > 0
            ? amount
            : roundCurrency(gallons * pricePerGallon);

      return {
        id: expense.id || `${kind}-${Date.now()}`,
        kind,
        city: expense.city?.trim() ?? "",
        state: expense.state?.trim().toUpperCase() ?? "",
        gallons,
        pricePerGallon,
        totalAmount,
        purchaseDate: expense.date ?? "",
        vendorName: expense.vendorName?.trim() || undefined,
        note: expense.notes?.trim() || undefined,
      };
    });
}

function positiveOptional(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;

  return numeric;
}

function nonNegative(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  return numeric;
}

function roundMiles(value: number) {
  return Number(value.toFixed(1));
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}
