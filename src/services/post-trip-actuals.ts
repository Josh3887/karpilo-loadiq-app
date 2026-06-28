import {
  PostTripActualExpense,
  PostTripExpenseCategory,
  SavedLoadActuals,
} from "@/types/saved-load";

export const POST_TRIP_EXPENSE_GROUPS: Array<{
  category: PostTripExpenseCategory;
  label: string;
  subcategories: string[];
}> = [
  {
    category: "fuel_fluids",
    label: "Fuel & Fluids",
    subcategories: [
      "Diesel",
      "DEF",
      "Oil",
      "Coolant",
      "Washer Fluid",
      "Fuel Additive",
      "Grease",
      "Other Fluid",
    ],
  },
  {
    category: "maintenance_repair",
    label: "Maintenance & Repair",
    subcategories: [
      "Tire Repair",
      "Tire Replacement",
      "Trailer Repair",
      "Tractor Repair",
      "PM Service",
      "Roadside Service",
      "Parts",
      "Tools",
      "Other Maintenance",
    ],
  },
  {
    category: "road_fees",
    label: "Tolls / Parking / Scale",
    subcategories: [
      "Tolls",
      "Paid Parking",
      "CAT Scale",
      "Oversize/Overweight Permit",
      "Other Road Fee",
    ],
  },
  {
    category: "driver_supplies",
    label: "Driver Supplies",
    subcategories: [
      "Gloves",
      "Safety Vest",
      "Flashlight/Batteries",
      "Load Straps",
      "Chains/Binders",
      "Tarps",
      "Bungees",
      "PPE",
      "Cleaning Supplies",
      "Other Driver Supply",
    ],
  },
  {
    category: "office_admin",
    label: "Office / Admin",
    subcategories: [
      "Printing",
      "Scanning",
      "Faxing",
      "Postage",
      "Logbook Supplies",
      "Office Supplies",
      "Phone/Internet",
      "Other Office/Admin",
    ],
  },
  {
    category: "lodging_travel",
    label: "Lodging / Travel",
    subcategories: [
      "Hotel",
      "Shower",
      "Laundry",
      "Taxi/Rideshare",
      "Rental Vehicle",
      "Other Travel",
    ],
  },
  {
    category: "tickets_fines_legal",
    label: "Tickets / Fines / Legal",
    subcategories: [
      "Parking Ticket",
      "Inspection Fine",
      "Citation",
      "Court/Legal Fee",
      "Other Ticket/Fine",
    ],
  },
  {
    category: "food_personal",
    label: "Food / Personal",
    subcategories: ["Meal", "Grocery", "Drink", "Personal Item", "Other Personal"],
  },
  {
    category: "miscellaneous",
    label: "Miscellaneous",
    subcategories: [
      "Lumper",
      "Washout",
      "Trailer Wash",
      "Truck Wash",
      "Broker Fee",
      "Factoring Fee",
      "Dispatch Fee",
      "Other Miscellaneous",
    ],
  },
];

export type PostTripActualContext = {
  grossRevenue: number;
  estimatedTripCost: number;
  totalTripMiles: number;
};

export function createPostTripExpense(
  category: PostTripExpenseCategory = "fuel_fluids",
  subcategory = "Diesel"
): PostTripActualExpense {
  const gallonBased = isGallonBasedExpense(category, subcategory);

  return {
    id: createExpenseId(),
    expenseCategory: category,
    expenseSubcategory: subcategory,
    amount: 0,
    date: "",
    vendorName: "",
    location: "",
    notes: "",
    receiptAttached: false,
    receiptUrl: "",
    receiptFileName: "",
    pricePerGallon: 0,
    quantityGallons: 0,
    calculatedTotal: 0,
    unitType: gallonBased ? "gallon" : "flat",
    featureAccess: "standard",
    bookkeepingCategory: "",
  };
}

export function getSubcategories(category: PostTripExpenseCategory) {
  return (
    POST_TRIP_EXPENSE_GROUPS.find((group) => group.category === category)
      ?.subcategories ?? []
  );
}

export function getExpenseCategoryLabel(category: PostTripExpenseCategory) {
  return (
    POST_TRIP_EXPENSE_GROUPS.find((group) => group.category === category)
      ?.label ?? category.replaceAll("_", " ")
  );
}

export function isGallonBasedExpense(
  category: PostTripExpenseCategory,
  subcategory: string
) {
  return (
    category === "fuel_fluids" &&
    (subcategory === "Diesel" || subcategory === "DEF")
  );
}

export function normalizePostTripExpense(
  expense: PostTripActualExpense
): PostTripActualExpense {
  const subcategories = getSubcategories(expense.expenseCategory);
  const expenseSubcategory =
    expense.expenseSubcategory || subcategories[0] || "Other";
  const gallonBased = isGallonBasedExpense(
    expense.expenseCategory,
    expenseSubcategory
  );
  const pricePerGallon = nonNegative(expense.pricePerGallon);
  const quantityGallons = nonNegative(expense.quantityGallons);
  const calculatedTotal = gallonBased
    ? roundCurrency(pricePerGallon * quantityGallons)
    : nonNegative(expense.calculatedTotal);
  const amount = gallonBased
    ? calculatedTotal
    : roundCurrency(nonNegative(expense.amount));

  return {
    ...expense,
    id: expense.id || createExpenseId(),
    expenseSubcategory,
    amount,
    date: expense.date ?? "",
    vendorName: expense.vendorName ?? "",
    location: expense.location ?? "",
    notes: expense.notes ?? "",
    receiptAttached: expense.receiptAttached ?? false,
    receiptUrl: expense.receiptUrl ?? "",
    receiptFileName: expense.receiptFileName ?? "",
    pricePerGallon,
    quantityGallons,
    calculatedTotal,
    unitType: gallonBased ? "gallon" : "flat",
    featureAccess: expense.featureAccess ?? "standard",
    bookkeepingCategory: expense.bookkeepingCategory ?? "",
  };
}

export function normalizePostTripExpenses(
  expenses: PostTripActualExpense[] | undefined
) {
  return (expenses ?? []).map(normalizePostTripExpense);
}

export function buildActualsForForm(
  actuals?: Partial<SavedLoadActuals> | null,
  context: PostTripActualContext = {
    grossRevenue: nonNegative(actuals?.actualGrossRevenue),
    estimatedTripCost: nonNegative(actuals?.estimatedTripCost),
    totalTripMiles: nonNegative(actuals?.totalTripMiles),
  }
): SavedLoadActuals {
  const baseActuals = normalizeSavedLoadActuals(actuals, context);

  if (
    baseActuals.postTripActualExpenses &&
    baseActuals.postTripActualExpenses.length > 0
  ) {
    return baseActuals;
  }

  return {
    ...baseActuals,
    postTripActualExpenses: legacyActualsToExpenses(baseActuals),
  };
}

export function normalizeSavedLoadActuals(
  actuals: Partial<SavedLoadActuals> | undefined | null,
  context: PostTripActualContext
): SavedLoadActuals {
  const expenses = normalizePostTripExpenses(actuals?.postTripActualExpenses);
  const hasExpenses = expenses.length > 0;
  const legacyFuelCost = nonNegative(actuals?.fuelCost);
  const legacyTolls = nonNegative(actuals?.tolls);
  const legacyLumpers = nonNegative(actuals?.lumpers);
  const legacyMaintenance = nonNegative(actuals?.maintenance);
  const legacyParking = nonNegative(actuals?.parking);
  const legacyOther = nonNegative(actuals?.other);
  const legacyTotal =
    legacyFuelCost +
    legacyTolls +
    legacyLumpers +
    legacyMaintenance +
    legacyParking +
    legacyOther;
  const actualExpenseTotal = hasExpenses
    ? roundCurrency(expenses.reduce((total, expense) => total + expense.amount, 0))
    : roundCurrency(legacyTotal);
  const actualGrossRevenue =
    nonNegative(actuals?.actualGrossRevenue) || nonNegative(context.grossRevenue);
  const estimatedTripCost = nonNegative(context.estimatedTripCost);
  const totalTripMiles = nonNegative(context.totalTripMiles);
  const rollups = hasExpenses
    ? rollupExpenses(expenses)
    : {
        fuelCost: legacyFuelCost,
        actualFuelPrice: nonNegative(actuals?.actualFuelPrice),
        tolls: legacyTolls,
        lumpers: legacyLumpers,
        maintenance: legacyMaintenance,
        parking: legacyParking,
        other: legacyOther,
      };
  const actualNetProfit = roundCurrency(actualGrossRevenue - actualExpenseTotal);

  return {
    fuelCost: rollups.fuelCost,
    actualFuelPrice: rollups.actualFuelPrice,
    tolls: rollups.tolls,
    lumpers: rollups.lumpers,
    maintenance: rollups.maintenance,
    parking: rollups.parking,
    other: rollups.other,
    postTripActualExpenses: expenses,
    actualGrossRevenue,
    estimatedTripCost,
    actualTripCost: actualExpenseTotal,
    actualExpenseTotal,
    estimatedVsActualDelta: roundCurrency(actualExpenseTotal - estimatedTripCost),
    actualNetProfit,
    actualProfitPerMile:
      totalTripMiles > 0 ? roundCurrency(actualNetProfit / totalTripMiles) : 0,
    totalTripMiles,
    notes: actuals?.notes ?? "",
  };
}

function rollupExpenses(expenses: PostTripActualExpense[]) {
  let fuelCost = 0;
  let actualFuelPrice = 0;
  let tolls = 0;
  let lumpers = 0;
  let maintenance = 0;
  let parking = 0;
  let other = 0;

  for (const expense of expenses) {
    if (
      expense.expenseCategory === "fuel_fluids" &&
      (expense.expenseSubcategory === "Diesel" ||
        expense.expenseSubcategory === "DEF")
    ) {
      fuelCost += expense.amount;
      if (expense.expenseSubcategory === "Diesel" && expense.pricePerGallon) {
        actualFuelPrice = expense.pricePerGallon;
      }
      continue;
    }

    if (
      expense.expenseCategory === "road_fees" &&
      expense.expenseSubcategory === "Tolls"
    ) {
      tolls += expense.amount;
      continue;
    }

    if (
      expense.expenseCategory === "miscellaneous" &&
      expense.expenseSubcategory === "Lumper"
    ) {
      lumpers += expense.amount;
      continue;
    }

    if (expense.expenseCategory === "maintenance_repair") {
      maintenance += expense.amount;
      continue;
    }

    if (
      expense.expenseCategory === "road_fees" &&
      expense.expenseSubcategory === "Paid Parking"
    ) {
      parking += expense.amount;
      continue;
    }

    other += expense.amount;
  }

  return {
    fuelCost: roundCurrency(fuelCost),
    actualFuelPrice: roundCurrency(actualFuelPrice),
    tolls: roundCurrency(tolls),
    lumpers: roundCurrency(lumpers),
    maintenance: roundCurrency(maintenance),
    parking: roundCurrency(parking),
    other: roundCurrency(other),
  };
}

function legacyActualsToExpenses(actuals: SavedLoadActuals) {
  const expenses: PostTripActualExpense[] = [];

  if (actuals.fuelCost > 0) {
    const quantityGallons =
      actuals.actualFuelPrice > 0 ? actuals.fuelCost / actuals.actualFuelPrice : 0;
    expenses.push(
      normalizePostTripExpense({
        ...createPostTripExpense("fuel_fluids", "Diesel"),
        amount: actuals.fuelCost,
        pricePerGallon: actuals.actualFuelPrice,
        quantityGallons,
        calculatedTotal: actuals.fuelCost,
      })
    );
  }

  addLegacyExpense(expenses, actuals.tolls, "road_fees", "Tolls");
  addLegacyExpense(expenses, actuals.lumpers, "miscellaneous", "Lumper");
  addLegacyExpense(
    expenses,
    actuals.maintenance,
    "maintenance_repair",
    "Other Maintenance"
  );
  addLegacyExpense(expenses, actuals.parking, "road_fees", "Paid Parking");
  addLegacyExpense(expenses, actuals.other, "miscellaneous", "Other Miscellaneous");

  return expenses;
}

function addLegacyExpense(
  expenses: PostTripActualExpense[],
  amount: number,
  category: PostTripExpenseCategory,
  subcategory: string
) {
  if (amount <= 0) return;

  expenses.push(
    normalizePostTripExpense({
      ...createPostTripExpense(category, subcategory),
      amount,
    })
  );
}

function roundCurrency(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

function nonNegative(value: unknown) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return 0;
  return numericValue;
}

function createExpenseId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
