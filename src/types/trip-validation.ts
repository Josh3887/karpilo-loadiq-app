export type OdometerValidation = {
  originOdometer?: number;
  endOdometer?: number;
  actualTotalMiles?: number;
  actualDeadheadMiles?: number;
  actualLoadedMiles?: number;
  odometerVarianceVsEstimated?: number;
  odometerVarianceVsPaid?: number;
  capturedAtStatus?: string;
  warnings: string[];
};

export type LoadPurchaseKind = "fuel" | "def";

export type LoadPurchaseEntry = {
  id: string;
  kind: LoadPurchaseKind;
  city: string;
  state: string;
  gallons: number;
  pricePerGallon: number;
  totalAmount: number;
  purchaseDate: string;
  vendorName?: string;
  note?: string;
};
