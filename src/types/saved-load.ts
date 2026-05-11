import { LoadInput, LoadResult } from "@/types/load";

export type SavedLoadStatus =
  | "calculated"
  | "saved"
  | "accepted"
  | "completed"
  | "archived";

export type SavedLoadActuals = {
  fuelCost: number;
  actualFuelPrice: number;
  tolls: number;
  lumpers: number;
  maintenance: number;
  parking: number;
  other: number;
  notes: string;
};

export type SavedLoadRecord = {
  id: string;
  user_id: string;
  status: SavedLoadStatus;
  loadiq_load_number: string | null;
  driver_load_number: string | null;
  load_outcome: string | null;
  was_run_status: string | null;
  pickup_zip: string;
  delivery_zip: string;
  loaded_miles: number;
  deadhead_miles: number;
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
