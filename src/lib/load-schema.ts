import { z } from "zod";

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
  pickupZip: z.string().min(5),
  deliveryZip: z.string().min(5),

  loadedMiles: numberField.refine((value) => value >= 1),
  deadheadMiles: numberField.refine((value) => value >= 0),

  ratePerMile: numberField.refine((value) => value >= 0.01),

  fuelPrice: numberField.refine((value) => value >= 0.01),

  mpg: numberField.refine((value) => value >= 1),

  overhead: numberField.refine((value) => value >= 0),
  accessorials: numberField.refine((value) => value >= 0),
  tolls: numberField.refine((value) => value >= 0),
  lumpers: numberField.refine((value) => value >= 0),
  reserveAllocation: numberField.refine((value) => value >= 0),

  factoringPercent: numberField.refine(
    (value) => value >= 0 && value <= 100
  ),

  dispatchPercent: numberField.refine(
    (value) => value >= 0 && value <= 100
  ),

  targetTrueRpm: numberField.refine((value) => value >= 0.01),
});

export type LoadInputFormValues = z.infer<typeof loadInputSchema>;

export const defaultLoadInputValues: LoadInputFormValues = {
  pickupZip: "",
  deliveryZip: "",
  loadedMiles: 0,
  deadheadMiles: 0,
  ratePerMile: 0,
  fuelPrice: 4,
  mpg: 6.5,
  overhead: 0,
  accessorials: 0,
  tolls: 0,
  lumpers: 0,
  reserveAllocation: 0,
  factoringPercent: 0,
  dispatchPercent: 0,
  targetTrueRpm: 2,
};