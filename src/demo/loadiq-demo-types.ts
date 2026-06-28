import { LoadInput, LoadResult } from "@/types/load";

export type DemoOperatorType =
  | "leased_owner_operator"
  | "independent_owner_operator"
  | "small_fleet";

export type DemoSavedLoadStatus =
  | "potential"
  | "accepted"
  | "rejected"
  | "completed";

export type DemoProfile = {
  operatorName: string;
  companyName: string;
  truckYear: number;
  truckMake: string;
  truckModel: string;
  equipmentType: string;
  operatorType: DemoOperatorType;
  carrierGrossPercent: number;
  operatorPercent: number;
  retainedBeforeSplitPercent: number;
  dispatchFeePercent: number;
  factoringFeePercent: number;
  truckMpg: number;
  averageFuelCost: number;
  fuelReserve: number;
  fixedOverheadDaily: number;
  variableOverheadPerMile: number;
  maintenanceReserve: number;
  insurancePerLoad: number;
  targetAnnualIncome: number;
  workingWeeks: number;
  loadsPerWeek: number;
  minimumTrueRpm: number;
  minimumHourlyProfitability: number;
};

export type DemoSavedLoad = {
  id: string;
  name: string;
  status: DemoSavedLoadStatus;
  ranLoad: boolean;
  date: string;
  input: LoadInput;
  result: LoadResult;
  note: string;
};

export type DemoStepKey =
  | "intro"
  | "login"
  | "safety"
  | "founderWelcome"
  | "checklist"
  | "operatorType"
  | "payStructure"
  | "fuel"
  | "fixedCosts"
  | "variableCosts"
  | "targetIncome"
  | "profileReview"
  | "dashboard"
  | "startLoad"
  | "lane"
  | "miles"
  | "revenue"
  | "tripCosts"
  | "time"
  | "calculationReview"
  | "recommendation"
  | "saveDecision"
  | "ranLoad"
  | "savedLoads"
  | "compare"
  | "postTrip"
  | "insights"
  | "settings"
  | "final";

export type DemoSection =
  | "Start"
  | "Setup"
  | "Profile"
  | "Dashboard"
  | "Load"
  | "History"
  | "Finish";

export type DemoStep = {
  key: DemoStepKey;
  section: DemoSection;
  title: string;
  eyebrow: string;
  narration: string;
};
