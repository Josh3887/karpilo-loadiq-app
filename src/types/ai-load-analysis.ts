export type LoadIqAiConfidence = "low" | "medium" | "high";

export type LoadIqAiLoadAnalysisInput = {
  grossRevenue: number;
  loadedMiles: number;
  deadheadMiles: number;
  fuelCost: number;
  trueRpm: number;
  netProfit: number;
  daysCommitted: number;
  dispatchFee?: number;
  factoringFee?: number;
  tolls?: number;
  accessorials?: number;
  estimatedMaintenanceReserve?: number;
  pickupRegion?: string;
  deliveryRegion?: string;
  notes?: string;
};

export type LoadIqAiLoadAnalysisOutput = {
  signalReadout: string;
  marginPressure: string;
  brokerTraffic: string;
  roadSignals: string[];
  driverQuestions: string[];
  confidence: LoadIqAiConfidence;
  intelligenceDisclaimer: string;
};
