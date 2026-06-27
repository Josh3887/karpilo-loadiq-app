import { z } from "zod";
import { AccessorialInputItem } from "@/types/accessorial";
import { RouteEstimate } from "@/types/route-intelligence";

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
  pickupAddress: z.string().optional().default(""),
  deliveryZip: z.string().min(5),
  deliveryCity: z.string().optional().default(""),
  deliveryState: z.string().optional().default(""),
  deliveryAddress: z.string().optional().default(""),

  loadedMiles: numberField.refine((value) => value >= 1),
  deadheadMiles: numberField.refine((value) => value >= 0),
  routeEstimate: z.custom<RouteEstimate>().nullable().default(null),

  routeLoadedMiles: numberField.refine((value) => value >= 0),
  actualLoadedMiles: numberField.refine((value) => value >= 0),

  routeDeadheadMiles: numberField.refine((value) => value >= 0),
  actualDeadheadMiles: numberField.refine((value) => value >= 0),

  dispatchDays: numberField.refine((value) => value >= 0),
  deadheadDays: numberField.refine((value) => value >= 0),

  ratePerMile: numberField.refine((value) => value >= 0.01),
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
  accessorialItems: z
    .custom<AccessorialInputItem[]>()
    .default([]),
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
});

export type LoadInputFormValues = z.infer<typeof loadInputSchema>;

export const defaultLoadInputValues: LoadInputFormValues = {
  loadNumber: "",
  carrierLoadId: "",
  dispatcherReference: "",

  pickupZip: "",
  pickupCity: "",
  pickupState: "",
  pickupAddress: "",
  deliveryZip: "",
  deliveryCity: "",
  deliveryState: "",
  deliveryAddress: "",

  loadedMiles: 0,
  deadheadMiles: 0,
  routeEstimate: null,

  routeLoadedMiles: 0,
  actualLoadedMiles: 0,

  routeDeadheadMiles: 0,
  actualDeadheadMiles: 0,

  dispatchDays: 1,
  deadheadDays: 0,

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
  accessorialItems: [],
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
