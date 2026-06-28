import type {
  KarpiloAtlasConfidenceBand,
  KarpiloAtlasRiskLevel,
} from "../types";

export type KarpiloAtlasAggregatedNetworkIntelligenceStatus = "disabled";

export type KarpiloAtlasPrivateOperatorLibrary = {
  userId: string;
  companyId?: string;
  scope: "user" | "company";
  privateByDefault: true;
  savedLoadIds: string[];
  notes?: string[];
};

export type KarpiloAtlasUserEnteredLoadMarketContext = {
  loadOfferId?: string;
  lane?: string;
  brokerOrCustomerName?: string;
  userEnteredOfferDetails: Record<string, unknown>;
  source: "user_entered";
  isPublicMarketData: false;
  isSpotMarketData: false;
  isRateBoardData: false;
};

export type KarpiloAtlasPrivateRouteHistory = {
  laneKey: string;
  completedLoadCount: number;
  averagePaidMiles: number | null;
  averageActualMiles: number | null;
  averageDeadheadMiles: number | null;
  averageDwellHours: number | null;
  recurringRouteRisks: string[];
};

export type KarpiloAtlasPrivateFreightHistory = {
  freightKey: string;
  completedLoadCount: number;
  averageFreightFitScore: number | null;
  recurringHandlingRisks: string[];
  recurringAccessorialOpportunities: string[];
  recurringBrokerQuestions: string[];
};

export type KarpiloAtlasPrivateCostHistory = {
  costProfileId?: string;
  averageFuelCostPerMile: number | null;
  averageFixedCostPerDay: number | null;
  averageVariableCostPerMile: number | null;
  averageTrueCostPerMile: number | null;
  confidenceBand: KarpiloAtlasConfidenceBand;
};

export type KarpiloAtlasPostTripActualSnapshot = {
  savedLoadId: string;
  actualRevenue: number | null;
  actualFuelCost: number | null;
  actualMiles: number | null;
  actualDeadheadMiles: number | null;
  actualDwellHours: number | null;
  actualNetProfit: number | null;
  notes?: string[];
};

export type KarpiloAtlasRevenueLeakageIndicators = {
  paidVsActualMileageLeakage: number | null;
  fuelVarianceLeakage: number | null;
  dwellVarianceLeakage: number | null;
  accessorialMissedOpportunity: number | null;
  riskLevel: KarpiloAtlasRiskLevel;
  notes: string[];
};

export type KarpiloAtlasUserOwnedIntelligenceOutput = {
  privateOperatorLibrary: KarpiloAtlasPrivateOperatorLibrary;
  userEnteredLoadMarketContext?: KarpiloAtlasUserEnteredLoadMarketContext;
  privateRouteHistory?: KarpiloAtlasPrivateRouteHistory;
  privateFreightHistory?: KarpiloAtlasPrivateFreightHistory;
  privateCostHistory?: KarpiloAtlasPrivateCostHistory;
  postTripActuals?: KarpiloAtlasPostTripActualSnapshot[];
  revenueLeakageIndicators?: KarpiloAtlasRevenueLeakageIndicators;
  aggregatedNetworkIntelligence: KarpiloAtlasAggregatedNetworkIntelligenceStatus;
  prohibitedUses: Array<
    | "public_market_data"
    | "spot_market_data"
    | "rate_board"
    | "freight_matching"
    | "dispatch"
  >;
  guardrailsApplied: string[];
};
