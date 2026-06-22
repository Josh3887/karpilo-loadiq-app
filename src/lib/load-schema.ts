import { z } from "zod";
import { AccessorialInputItem } from "@/types/accessorial";
import { RouteStopInput } from "@/types/load";
import {
  LOAD_PULLED_REASON_OPTIONS,
  LOAD_RUN_STATUS_OPTIONS,
  type LoadPulledReason,
  type LoadRunStatus,
} from "@/lib/fuel-gauge";
import { DEFAULT_EQUIPMENT_PROFILE_INPUT } from "@/lib/equipment-profile";
import {
  isEndDateBeforeStartDate,
  snapToQuarterDay,
} from "@/services/trip-dates";

const numberField = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return 0;
    }

    return Number(value);
  },
  z.number()
);

const quarterDayField = numberField.transform((value) =>
  snapToQuarterDay(value)
);

const loadRunStatusValues = LOAD_RUN_STATUS_OPTIONS.map(
  (option) => option.value
) as [LoadRunStatus, ...LoadRunStatus[]];

const loadPulledReasonValues = LOAD_PULLED_REASON_OPTIONS.map(
  (option) => option.value
) as [LoadPulledReason, ...LoadPulledReason[]];

const routeStopSchema = z.object({
  id: z.string().optional(),
  stopType: z.enum(["pickup", "delivery"]).default("pickup"),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  milesFromPrevious: numberField.refine((value) => value >= 0),
  stopRevenue: numberField.refine((value) => value >= 0),
  stopExpense: numberField.refine((value) => value >= 0),
  notes: z.string().optional().default(""),
}) satisfies z.ZodType<RouteStopInput>;

const optionalStringArrayField = z
  .array(z.string())
  .optional()
  .default([]);

export const loadInputSchema = z.object({
  loadNumber: z.string().optional().default(""),
  carrierLoadId: z.string().optional().default(""),
  dispatcherReference: z.string().optional().default(""),

  pickupZip: z.string().min(5),
  pickupAddress: z.string().optional().default(""),
  pickupCity: z.string().optional().default(""),
  pickupState: z.string().optional().default(""),
  deliveryZip: z.string().min(5),
  deliveryAddress: z.string().optional().default(""),
  deliveryCity: z.string().optional().default(""),
  deliveryState: z.string().optional().default(""),

  deadheadStartAddress: z.string().optional().default(""),
  deadheadStartCity: z.string().optional().default(""),
  deadheadStartState: z.string().optional().default(""),
  deadheadStartZip: z.string().optional().default(""),
  routeStops: z.array(routeStopSchema).default([]),
  estimatedLoadWeightLbs: numberField.refine((value) => value >= 0),

  equipmentType: z
    .string()
    .optional()
    .default(DEFAULT_EQUIPMENT_PROFILE_INPUT.equipmentType),
  atlasEquipmentPack: z.string().optional().default("dry_van"),
  combinationType: z
    .string()
    .optional()
    .default(DEFAULT_EQUIPMENT_PROFILE_INPUT.combinationType),
  trailerLengthFeet: numberField
    .refine((value) => value >= 0)
    .default(DEFAULT_EQUIPMENT_PROFILE_INPUT.trailerLengthFeet),
  trailerWidthInches: numberField
    .refine((value) => value >= 0)
    .default(DEFAULT_EQUIPMENT_PROFILE_INPUT.trailerWidthInches),
  trailerHeightInches: numberField
    .refine((value) => value >= 0)
    .default(DEFAULT_EQUIPMENT_PROFILE_INPUT.trailerHeightInches),
  vehicleTareWeightLbs: numberField.refine((value) => value >= 0).default(0),
  estimatedMaxGrossLbs: numberField.refine((value) => value >= 0).default(0),
  maxPayloadLbs: numberField
    .refine((value) => value >= 0)
    .default(DEFAULT_EQUIPMENT_PROFILE_INPUT.maxPayloadLbs),
  grossVehicleWeightRatingLbs: numberField
    .refine((value) => value >= 0)
    .default(DEFAULT_EQUIPMENT_PROFILE_INPUT.grossVehicleWeightRatingLbs),
  axleCount: numberField
    .refine((value) => value >= 0)
    .default(DEFAULT_EQUIPMENT_PROFILE_INPUT.axleCount),
  hazmatCapable: z.boolean().optional().default(false),
  tankerCapable: z.boolean().optional().default(false),
  refrigeratedCapable: z.boolean().optional().default(false),
  specializedCapabilities: optionalStringArrayField,
  securementEquipment: optionalStringArrayField,
  routeRestrictionNotes: z.string().optional().default(""),

  loadedMiles: numberField.refine((value) => value >= 1),
  deadheadMiles: numberField.refine((value) => value >= 0),

  routeLoadedMiles: numberField.refine((value) => value >= 0),
  actualLoadedMiles: numberField.refine((value) => value >= 0),

  routeDeadheadMiles: numberField.refine((value) => value >= 0),
  actualDeadheadMiles: numberField.refine((value) => value >= 0),

  dispatchDays: quarterDayField.refine((value) => value >= 1, {
    message: "Dispatch days must be at least 1.",
  }),
  deadheadDays: quarterDayField.refine((value) => value >= 0),
  dispatchDate: z.string().optional().default(""),
  pickupDate: z.string().optional().default(""),
  deliveryDate: z.string().optional().default(""),
  deadheadStartDate: z.string().optional().default(""),
  deadheadEndDate: z.string().optional().default(""),
  payPeriodStartDate: z.string().optional().default(""),
  payPeriodEndDate: z.string().optional().default(""),
  loadRunStatus: z.enum(loadRunStatusValues).default("planned"),
  loadPulledReason: z.enum(loadPulledReasonValues).default(""),

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
  fuelTankCount: numberField.refine((value) => value >= 0).default(0),
  fuelTankCapacityGallons: numberField
    .refine((value) => value >= 0)
    .default(0),
  startingFuelPercent: numberField.refine(
    (value) => value >= 0 && value <= 100,
    {
      message: "Starting fuel must be between 0 and 100%.",
    }
  ).default(100),

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
      payCalculationBasis: z
        .enum(["gross", "gross_minus_fsc"])
        .default("gross"),
      payPeriodMode: z.enum(["by_load", "weekly"]).default("by_load"),
    })
    .optional(),
}).superRefine((value, context) => {
  if (isEndDateBeforeStartDate(value.pickupDate, value.deliveryDate)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Delivery date cannot be before pickup date.",
      path: ["deliveryDate"],
    });
  }

  if (
    isEndDateBeforeStartDate(
      value.deadheadStartDate,
      value.deadheadEndDate
    )
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Deadhead stop date cannot be before deadhead start date.",
      path: ["deadheadEndDate"],
    });
  }

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

  if (value.loadRunStatus === "pulled" && !value.loadPulledReason) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Select why the load was pulled.",
      path: ["loadPulledReason"],
    });
  }

  if (value.loadRunStatus !== "pulled" && value.loadPulledReason) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pulled reason is only used when the load status is pulled.",
      path: ["loadPulledReason"],
    });
  }
});

export type LoadInputFormValues = z.infer<typeof loadInputSchema>;

export const defaultLoadInputValues: LoadInputFormValues = {
  loadNumber: "",
  carrierLoadId: "",
  dispatcherReference: "",

  pickupZip: "",
  pickupAddress: "",
  pickupCity: "",
  pickupState: "",
  deliveryZip: "",
  deliveryAddress: "",
  deliveryCity: "",
  deliveryState: "",

  deadheadStartAddress: "",
  deadheadStartCity: "",
  deadheadStartState: "",
  deadheadStartZip: "",
  routeStops: [],
  estimatedLoadWeightLbs: 0,
  equipmentType: DEFAULT_EQUIPMENT_PROFILE_INPUT.equipmentType,
  atlasEquipmentPack: "dry_van",
  combinationType: DEFAULT_EQUIPMENT_PROFILE_INPUT.combinationType,
  trailerLengthFeet: DEFAULT_EQUIPMENT_PROFILE_INPUT.trailerLengthFeet,
  trailerWidthInches: DEFAULT_EQUIPMENT_PROFILE_INPUT.trailerWidthInches,
  trailerHeightInches: DEFAULT_EQUIPMENT_PROFILE_INPUT.trailerHeightInches,
  vehicleTareWeightLbs: DEFAULT_EQUIPMENT_PROFILE_INPUT.vehicleTareWeightLbs,
  estimatedMaxGrossLbs: DEFAULT_EQUIPMENT_PROFILE_INPUT.estimatedMaxGrossLbs,
  maxPayloadLbs: DEFAULT_EQUIPMENT_PROFILE_INPUT.maxPayloadLbs,
  grossVehicleWeightRatingLbs:
    DEFAULT_EQUIPMENT_PROFILE_INPUT.grossVehicleWeightRatingLbs,
  axleCount: DEFAULT_EQUIPMENT_PROFILE_INPUT.axleCount,
  hazmatCapable: DEFAULT_EQUIPMENT_PROFILE_INPUT.hazmatCapable,
  tankerCapable: DEFAULT_EQUIPMENT_PROFILE_INPUT.tankerCapable,
  refrigeratedCapable: DEFAULT_EQUIPMENT_PROFILE_INPUT.refrigeratedCapable,
  specializedCapabilities:
    DEFAULT_EQUIPMENT_PROFILE_INPUT.specializedCapabilities,
  securementEquipment: DEFAULT_EQUIPMENT_PROFILE_INPUT.securementEquipment,
  routeRestrictionNotes: DEFAULT_EQUIPMENT_PROFILE_INPUT.routeRestrictionNotes,

  loadedMiles: 0,
  deadheadMiles: 0,

  routeLoadedMiles: 0,
  actualLoadedMiles: 0,

  routeDeadheadMiles: 0,
  actualDeadheadMiles: 0,

  dispatchDays: 1,
  deadheadDays: 0,
  dispatchDate: "",
  pickupDate: "",
  deliveryDate: "",
  deadheadStartDate: "",
  deadheadEndDate: "",
  payPeriodStartDate: "",
  payPeriodEndDate: "",
  loadRunStatus: "planned",
  loadPulledReason: "",

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
  fuelTankCount: 0,
  fuelTankCapacityGallons: 0,
  startingFuelPercent: 100,

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
    payCalculationBasis: "gross",
    payPeriodMode: "by_load",
  },
};
