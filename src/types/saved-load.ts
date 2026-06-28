import { LoadInput, LoadResult } from "@/types/load";

export type SavedLoadStatus =
  | "calculated"
  | "saved"
  | "accepted"
  | "completed"
  | "archived"
  | "estimated";

export type PostTripExpenseCategory =
  | "fuel_fluids"
  | "maintenance_repair"
  | "road_fees"
  | "driver_supplies"
  | "office_admin"
  | "lodging_travel"
  | "tickets_fines_legal"
  | "food_personal"
  | "miscellaneous";

export type PostTripExpenseUnitType = "gallon" | "flat";
export type PostTripExpenseFeatureAccess = "standard" | "platinum";

export type PostTripActualExpense = {
  id: string;
  expenseCategory: PostTripExpenseCategory;
  expenseSubcategory: string;
  amount: number;
  date: string;
  vendorName?: string;
  location?: string;
  notes?: string;
  receiptAttached?: boolean;
  receiptUrl?: string;
  receiptFileName?: string;
  pricePerGallon?: number;
  quantityGallons?: number;
  calculatedTotal?: number;
  unitType?: PostTripExpenseUnitType;
  featureAccess?: PostTripExpenseFeatureAccess;
  bookkeepingCategory?: string;
  expensePeriodMonth?: number;
  expensePeriodQuarter?: number;
  expensePeriodYear?: number;
};

export type SavedLoadActuals = {
  fuelCost: number;
  actualFuelPrice: number;
  tolls: number;
  lumpers: number;
  maintenance: number;
  parking: number;
  other: number;
  postTripActualExpenses?: PostTripActualExpense[];
  actualGrossRevenue?: number;
  estimatedTripCost?: number;
  actualTripCost?: number;
  actualExpenseTotal?: number;
  estimatedVsActualDelta?: number;
  actualNetProfit?: number;
  actualProfitPerMile?: number;
  totalTripMiles?: number;
  notes: string;
};

export type SavedLoadRecord = {
  id: string;
  user_id: string;
  status: SavedLoadStatus;
  loadiq_load_number: string | null;
  driver_load_number: string | null;
  load_outcome: string | null;
  load_status_reason?: string | null;
  was_run_status: string | null;
  pickup_zip: string;
  deadhead_start_city?: string | null;
  deadhead_start_state?: string | null;
  deadhead_start_zip?: string | null;
  delivery_zip: string;
  loaded_miles: number;
  deadhead_miles: number;
  estimated_load_weight_lbs?: number | null;
  route_stop_count?: number | null;
  route_model_version?: string | null;
  reserve_allocation_mode?: string | null;
  reserve_allocation_cpm?: number | null;
  reserve_allocation_percent?: number | null;
  target_true_rpm_snapshot?: number | null;
  rate_per_mile: number;
  gross_revenue: number;
  total_miles: number;
  fuel_cost: number;
  fuel_estimate_source: string | null;
  estimated_fuel_price: number | null;
  actual_fuel_price: number | null;
  fuel_override: boolean | null;
  eia_period: string | null;
  fuel_fetched_at: string | null;
  fuel_gauge_snapshot?: unknown | null;
  equipment_context_snapshot?: unknown | null;
  operational_cost: number;
  dispatch_days: number | null;
  overhead_applied: number | null;
  used_profile_values: unknown | null;
  used_temporary_overrides: unknown | null;
  calculated_at: string | null;
  estimated_net: number;
  actual_net: number | null;
  true_rpm: number;
  profitability_score: number;
  profitability_band: string;
  warnings: unknown[];
  input_snapshot: LoadInput | null;
  result_snapshot: LoadResult | null;
  actuals_snapshot: SavedLoadActuals | Record<string, never>;
  pay_structure_snapshot: unknown;
  calculation_version: string;
  created_at: string;
  updated_at: string;
};
