import type {
  KarpiloAtlasDepth,
  KarpiloAtlasHistoricalMemory,
  KarpiloLoadIQTier,
} from "./types";

export type KarpiloAtlasEntitlements = {
  tier: KarpiloLoadIQTier;
  core: {
    enabled: boolean;
    decisionDepth: KarpiloAtlasDepth;
    confidenceScoring: boolean;
    missingInputDetection: boolean;
    assumptionTracking: boolean;
    historicalMemory: KarpiloAtlasHistoricalMemory;
    multiProfileSupport: boolean;
    auditDepth: KarpiloAtlasDepth;
  };
  freight: {
    inputCapture: boolean;
    intelligenceEnabled: boolean;
    intelligenceDepth: KarpiloAtlasDepth;
    commodityAnalysis: boolean;
    trailerFitAnalysis: boolean;
    securementAnalysis: boolean;
    tarpingAnalysis: boolean;
    accessorialAnalysis: boolean;
    hazmatAwareness: boolean;
    historicalFreightLearning: boolean;
    multiVehicleFit: boolean;
  };
  route: {
    manualMileageFields: boolean;
    intelligenceEnabled: boolean;
    intelligenceDepth: KarpiloAtlasDepth;
    addressValidation: boolean;
    mileageComparison: boolean;
    stopAnalysis: boolean;
    weatherRisk: boolean;
    trafficRisk: boolean;
    terrainRisk: boolean;
    dwellRisk: boolean;
    tollExposure: boolean;
    hosPressure: boolean;
    postTripVariance: boolean;
    historicalRouteLearning: boolean;
  };
  education: {
    enabled: boolean;
    depth: KarpiloAtlasDepth;
    regulationAwareness: boolean;
    operationalCoaching: boolean;
    featureTutorials: boolean;
    tierGuidance: boolean;
    sourceAwareExplanations: boolean;
    historicalBehaviorCorrection: boolean;
  };
  libraries: {
    enabled: boolean;
    sourceRegistry: boolean;
    publicReferenceContext: KarpiloAtlasDepth;
    regulatoryAwareness: KarpiloAtlasDepth;
    industryAssociationContext: boolean;
    publicNewsContext: boolean;
    stateLocalContext: KarpiloAtlasDepth;
    sourceMetadataRequired: boolean;
  };
  userOwnedIntelligence: {
    enabled: boolean;
    savedLoadHistory: KarpiloAtlasHistoricalMemory;
    postTripActuals: boolean;
    privateLaneHistory: boolean;
    privateFreightHistory: boolean;
    privateCostHistory: boolean;
    privateBrokerCustomerNotes: boolean;
    aggregatedNetworkIntelligence: false;
  };
};

export function getKarpiloAtlasEntitlements(
  tier: KarpiloLoadIQTier
): KarpiloAtlasEntitlements {
  switch (tier) {
    case "silver":
      return {
        tier,
        core: {
          enabled: true,
          decisionDepth: "basic",
          confidenceScoring: false,
          missingInputDetection: true,
          assumptionTracking: true,
          historicalMemory: "none",
          multiProfileSupport: false,
          auditDepth: "basic",
        },
        freight: {
          inputCapture: true,
          intelligenceEnabled: false,
          intelligenceDepth: "none",
          commodityAnalysis: false,
          trailerFitAnalysis: false,
          securementAnalysis: false,
          tarpingAnalysis: false,
          accessorialAnalysis: false,
          hazmatAwareness: false,
          historicalFreightLearning: false,
          multiVehicleFit: false,
        },
        route: {
          manualMileageFields: true,
          intelligenceEnabled: false,
          intelligenceDepth: "basic",
          addressValidation: false,
          mileageComparison: false,
          stopAnalysis: false,
          weatherRisk: false,
          trafficRisk: false,
          terrainRisk: false,
          dwellRisk: false,
          tollExposure: false,
          hosPressure: false,
          postTripVariance: false,
          historicalRouteLearning: false,
        },
        education: {
          enabled: true,
          depth: "basic",
          regulationAwareness: false,
          operationalCoaching: false,
          featureTutorials: true,
          tierGuidance: true,
          sourceAwareExplanations: false,
          historicalBehaviorCorrection: false,
        },
        libraries: {
          enabled: true,
          sourceRegistry: true,
          publicReferenceContext: "basic",
          regulatoryAwareness: "none",
          industryAssociationContext: false,
          publicNewsContext: false,
          stateLocalContext: "none",
          sourceMetadataRequired: true,
        },
        userOwnedIntelligence: {
          enabled: true,
          savedLoadHistory: "limited",
          postTripActuals: false,
          privateLaneHistory: false,
          privateFreightHistory: false,
          privateCostHistory: false,
          privateBrokerCustomerNotes: false,
          aggregatedNetworkIntelligence: false,
        },
      };
    case "gold":
      return {
        tier,
        core: {
          enabled: true,
          decisionDepth: "guided",
          confidenceScoring: true,
          missingInputDetection: true,
          assumptionTracking: true,
          historicalMemory: "limited",
          multiProfileSupport: false,
          auditDepth: "guided",
        },
        freight: {
          inputCapture: true,
          intelligenceEnabled: true,
          intelligenceDepth: "basic",
          commodityAnalysis: false,
          trailerFitAnalysis: true,
          securementAnalysis: false,
          tarpingAnalysis: false,
          accessorialAnalysis: false,
          hazmatAwareness: false,
          historicalFreightLearning: false,
          multiVehicleFit: false,
        },
        route: {
          manualMileageFields: true,
          intelligenceEnabled: true,
          intelligenceDepth: "guided",
          addressValidation: true,
          mileageComparison: true,
          stopAnalysis: true,
          weatherRisk: false,
          trafficRisk: false,
          terrainRisk: false,
          dwellRisk: false,
          tollExposure: false,
          hosPressure: false,
          postTripVariance: false,
          historicalRouteLearning: false,
        },
        education: {
          enabled: true,
          depth: "guided",
          regulationAwareness: false,
          operationalCoaching: false,
          featureTutorials: true,
          tierGuidance: true,
          sourceAwareExplanations: true,
          historicalBehaviorCorrection: false,
        },
        libraries: {
          enabled: true,
          sourceRegistry: true,
          publicReferenceContext: "guided",
          regulatoryAwareness: "basic",
          industryAssociationContext: true,
          publicNewsContext: false,
          stateLocalContext: "basic",
          sourceMetadataRequired: true,
        },
        userOwnedIntelligence: {
          enabled: true,
          savedLoadHistory: "limited",
          postTripActuals: true,
          privateLaneHistory: false,
          privateFreightHistory: false,
          privateCostHistory: true,
          privateBrokerCustomerNotes: false,
          aggregatedNetworkIntelligence: false,
        },
      };
    case "platinum":
      return {
        tier,
        core: {
          enabled: true,
          decisionDepth: "advanced",
          confidenceScoring: true,
          missingInputDetection: true,
          assumptionTracking: true,
          historicalMemory: "advanced",
          multiProfileSupport: false,
          auditDepth: "advanced",
        },
        freight: {
          inputCapture: true,
          intelligenceEnabled: true,
          intelligenceDepth: "advanced",
          commodityAnalysis: true,
          trailerFitAnalysis: true,
          securementAnalysis: true,
          tarpingAnalysis: true,
          accessorialAnalysis: true,
          hazmatAwareness: true,
          historicalFreightLearning: true,
          multiVehicleFit: false,
        },
        route: {
          manualMileageFields: true,
          intelligenceEnabled: true,
          intelligenceDepth: "advanced",
          addressValidation: true,
          mileageComparison: true,
          stopAnalysis: true,
          weatherRisk: true,
          trafficRisk: true,
          terrainRisk: true,
          dwellRisk: true,
          tollExposure: true,
          hosPressure: true,
          postTripVariance: true,
          historicalRouteLearning: true,
        },
        education: {
          enabled: true,
          depth: "advanced",
          regulationAwareness: true,
          operationalCoaching: true,
          featureTutorials: true,
          tierGuidance: true,
          sourceAwareExplanations: true,
          historicalBehaviorCorrection: true,
        },
        libraries: {
          enabled: true,
          sourceRegistry: true,
          publicReferenceContext: "advanced",
          regulatoryAwareness: "advanced",
          industryAssociationContext: true,
          publicNewsContext: true,
          stateLocalContext: "advanced",
          sourceMetadataRequired: true,
        },
        userOwnedIntelligence: {
          enabled: true,
          savedLoadHistory: "advanced",
          postTripActuals: true,
          privateLaneHistory: true,
          privateFreightHistory: true,
          privateCostHistory: true,
          privateBrokerCustomerNotes: true,
          aggregatedNetworkIntelligence: false,
        },
      };
    case "pro":
      return {
        tier,
        core: {
          enabled: true,
          decisionDepth: "professional",
          confidenceScoring: true,
          missingInputDetection: true,
          assumptionTracking: true,
          historicalMemory: "professional",
          multiProfileSupport: true,
          auditDepth: "professional",
        },
        freight: {
          inputCapture: true,
          intelligenceEnabled: true,
          intelligenceDepth: "professional",
          commodityAnalysis: true,
          trailerFitAnalysis: true,
          securementAnalysis: true,
          tarpingAnalysis: true,
          accessorialAnalysis: true,
          hazmatAwareness: true,
          historicalFreightLearning: true,
          multiVehicleFit: true,
        },
        route: {
          manualMileageFields: true,
          intelligenceEnabled: true,
          intelligenceDepth: "professional",
          addressValidation: true,
          mileageComparison: true,
          stopAnalysis: true,
          weatherRisk: true,
          trafficRisk: true,
          terrainRisk: true,
          dwellRisk: true,
          tollExposure: true,
          hosPressure: true,
          postTripVariance: true,
          historicalRouteLearning: true,
        },
        education: {
          enabled: true,
          depth: "professional",
          regulationAwareness: true,
          operationalCoaching: true,
          featureTutorials: true,
          tierGuidance: true,
          sourceAwareExplanations: true,
          historicalBehaviorCorrection: true,
        },
        libraries: {
          enabled: true,
          sourceRegistry: true,
          publicReferenceContext: "professional",
          regulatoryAwareness: "professional",
          industryAssociationContext: true,
          publicNewsContext: true,
          stateLocalContext: "professional",
          sourceMetadataRequired: true,
        },
        userOwnedIntelligence: {
          enabled: true,
          savedLoadHistory: "professional",
          postTripActuals: true,
          privateLaneHistory: true,
          privateFreightHistory: true,
          privateCostHistory: true,
          privateBrokerCustomerNotes: true,
          aggregatedNetworkIntelligence: false,
        },
      };
  }
}

export function isKarpiloAtlasFreightIntelligenceEnabled(
  entitlements: KarpiloAtlasEntitlements
): boolean {
  return (
    entitlements.freight.inputCapture &&
    entitlements.freight.intelligenceEnabled &&
    entitlements.freight.intelligenceDepth !== "none"
  );
}

export function isKarpiloAtlasRouteIntelligenceEnabled(
  entitlements: KarpiloAtlasEntitlements
): boolean {
  return (
    entitlements.route.manualMileageFields &&
    entitlements.route.intelligenceEnabled &&
    entitlements.route.intelligenceDepth !== "none"
  );
}

export function isKarpiloAtlasSourceAwareEducationEnabled(
  entitlements: KarpiloAtlasEntitlements
): boolean {
  return (
    entitlements.education.enabled &&
    entitlements.education.sourceAwareExplanations &&
    entitlements.libraries.enabled &&
    entitlements.libraries.sourceRegistry
  );
}
