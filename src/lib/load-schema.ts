import { z } from "zod";
import { AccessorialInputItem } from "@/types/accessorial";

const numberField = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return 0;
    }

    return Number(value);
  },
  z.number()
);

export const loadInputSchema = z.object({
  loadNumber: z.string().optional().default(""),
  carrierLoadId: z.string().optional().default(""),
  dispatcherReference: z.string().optional().default(""),

  pickupZip: z.string().min(5),
  pickupCity: z.string().optional().default(""),
  pickupState: z.string().optional().default(""),
  deliveryZip: z.string().min(5),
  deliveryCity: z.string().optional().default(""),
  deliveryState: z.string().optional().default(""),

  loadedMiles: numberField.refine((value) => value >= 1),
  deadheadMiles: numberField.refine((value) => value >= 0),

  routeLoadedMiles: numberField.refine((value) => value >= 0),
  actualLoadedMiles: numberField.refine((value) => value >= 0),

  routeDeadheadMiles: numberField.refine((value) => value >= 0),
  actualDeadheadMiles: numberField.refine((value) => value >= 0),

  dispatchDays: numberField.refine((value) => value >= 1, {
    message: "Dispatch days must be at least 1.",
  }),
  deadheadDays: numberField.refine((value) => value >= 0),
  loadRunStatus: z.enum(["ran", "test", "planned"]).default("planned"),

  revenueInputMode: z.enum(["rpm", "gross"]).default("rpm"),
  grossRevenue: numberField.refine((value) => value >= 0),
  fuelSurchargeIncludedInGross: z.boolean().optional().default(false),
  ratePerMile: numberField.refine((value) => value >= 0),
  fuelSurcharge: numberField.refine((value) => value >= 0),
  fuelPrice: numberField.refine((value) => value >= 0.01),
  fuelPriceSource: z
    .enum(["EIA", "USER_OVERRIDE", "MANUAL"])
    .default("MANUAL"),
  fuelPriceSourceLabel: z.string().optional().default(""),
  fuelPriceRegion: z.string().optional().default(""),
  fuelPricePeriod: z.string().optional().default(""),
  fuelPriceFetchedAt: z.string().optional().default(""),
  fuelPriceExpiresAt: z.string().optional().default(""),
  fuelPriceIsEstimate: z.boolean().optional().default(false),
  mpg: numberField.refine((value) => value >= 1),

  overhead: numberField.refine((value) => value >= 0),
  profileDerivedValues: z
    .object({
      dailyFixedOverhead: numberField,
      operatingDaysPerWeek: numberField,
      operatingDaysPerMonth: numberField,
      dispatchPercent: numberField,
      factoringPercent: numberField,
      reserveAllocation: numberField,
      maintenanceReserve: numberField,
      tireReserve: numberField,
      trailerFee: numberField,
      insuranceAllocation: numberField,
      variableCostPerMile: numberField,
      fixedCostAllocation: numberField,
      mpg: numberField,
      targetTrueRpm: numberField,
      incomeTargetDaily: numberField,
      incomeTargetWeekly: numberField,
      minimumHourlyProfitability: numberField,
    })
    .default({
      dailyFixedOverhead: 0,
      operatingDaysPerWeek: 5.5,
      operatingDaysPerMonth: 23.8,
      dispatchPercent: 0,
      factoringPercent: 0,
      reserveAllocation: 0,
      maintenanceReserve: 0,
      tireReserve: 0,
      trailerFee: 0,
      insuranceAllocation: 0,
      variableCostPerMile: 0,
      fixedCostAllocation: 0,
      mpg: 6.5,
      targetTrueRpm: 2,
      incomeTargetDaily: 0,
      incomeTargetWeekly: 0,
      minimumHourlyProfitability: 50,
    }),
  temporaryOverrides: z.record(z.string(), numberField).default({}),
  calculationSource: z
    .enum(["profile", "load_input", "temporary_override", "system"])
    .default("profile"),
  accessorialItems: z
    .custom<AccessorialInputItem[]>()
    .default([]),
  reserveAllocationMode: z.enum(["flat", "cpm", "percent"]).default("flat"),
  reserveAllocationValue: numberField.refine((value) => value >= 0),
  reserveAllocation: numberField.refine((value) => value >= 0),
  maintenanceReserve: numberField.refine((value) => value >= 0),
  tireReserve: numberField.refine((value) => value >= 0),
  tolls: numberField.refine((value) => value >= 0),
  lumpers: numberField.refine((value) => value >= 0),
  trailerFee: numberField.refine((value) => value >= 0),
  insuranceAllocation: numberField.refine((value) => value >= 0),
  variableCostPerMile: numberField.refine((value) => value >= 0),
  fixedCostAllocation: numberField.refine((value) => value >= 0),

  factoringPercent: numberField.refine(
    (value) => value >= 0 && value <= 100
  ),

  dispatchPercent: numberField.refine(
    (value) => value >= 0 && value <= 100
  ),

  targetTrueRpm: numberField.refine((value) => value >= 0.01),
  payStructure: z
    .object({
      type: z.enum(["percentage", "cpm", "flat", "daily"]),
      label: z.string(),
      percentageChain: z.array(numberField).default([100]),
      cpmRate: numberField,
      flatAmount: numberField,
      dailyRate: numberField,
      includeFuelSurcharge: z.boolean(),
      includeAccessorials: z.boolean(),
    })
    .optional(),
}).superRefine((value, context) => {
  if (value.revenueInputMode === "rpm" && value.ratePerMile < 0.01) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "RPM must be at least 0.01.",
      path: ["ratePerMile"],
    });
  }

  if (value.revenueInputMode === "gross" && value.grossRevenue < 0.01) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Gross revenue must be entered for gross mode.",
      path: ["grossRevenue"],
    });
  }
});

export type LoadInputFormValues = z.infer<typeof loadInputSchema>;

export const defaultLoadInputValues: LoadInputFormValues = {
  loadNumber: "",
  carrierLoadId: "",
  dispatcherReference: "",

  pickupZip: "",
  pickupCity: "",
  pickupState: "",
  deliveryZip: "",
  deliveryCity: "",
  deliveryState: "",

  loadedMiles: 0,
  deadheadMiles: 0,

  routeLoadedMiles: 0,
  actualLoadedMiles: 0,

  routeDeadheadMiles: 0,
  actualDeadheadMiles: 0,

  dispatchDays: 1,
  deadheadDays: 0,
  loadRunStatus: "planned",

  revenueInputMode: "rpm",
  grossRevenue: 0,
  fuelSurchargeIncludedInGross: false,
  ratePerMile: 0,
  fuelSurcharge: 0,
  fuelPrice: 4,
  fuelPriceSource: "MANUAL",
  fuelPriceSourceLabel: "",
  fuelPriceRegion: "",
  fuelPricePeriod: "",
  fuelPriceFetchedAt: "",
  fuelPriceExpiresAt: "",
  fuelPriceIsEstimate: false,
  mpg: 6.5,

  overhead: 0,
  profileDerivedValues: {
    dailyFixedOverhead: 0,
    operatingDaysPerWeek: 5.5,
    operatingDaysPerMonth: 23.8,
    dispatchPercent: 0,
    factoringPercent: 0,
    reserveAllocation: 0,
    maintenanceReserve: 0,
    tireReserve: 0,
    trailerFee: 0,
    insuranceAllocation: 0,
    variableCostPerMile: 0,
    fixedCostAllocation: 0,
    mpg: 6.5,
    targetTrueRpm: 2,
    incomeTargetDaily: 0,
    incomeTargetWeekly: 0,
    minimumHourlyProfitability: 50,
  },
  temporaryOverrides: {},
  calculationSource: "profile",
  accessorialItems: [],
  reserveAllocationMode: "flat",
  reserveAllocationValue: 0,
  reserveAllocation: 0,
  maintenanceReserve: 0,
  tireReserve: 0,
  tolls: 0,
  lumpers: 0,
  trailerFee: 0,
  insuranceAllocation: 0,
  variableCostPerMile: 0,
  fixedCostAllocation: 0,

  factoringPercent: 0,
  dispatchPercent: 0,

  targetTrueRpm: 2,
  payStructure: {
    type: "percentage",
    label: "100% gross",
    percentageChain: [100],
    cpmRate: 0,
    flatAmount: 0,
    dailyRate: 0,
    includeFuelSurcharge: true,
    includeAccessorials: true,
  },
};
