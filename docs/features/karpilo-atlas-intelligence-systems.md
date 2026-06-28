# Karpilo Atlas Intelligence Systems

## Executive Definition

Karpilo Atlas Intelligence Systems is the trucking intelligence architecture
behind Karpilo LoadIQ.

It is not a single generic chatbot. It is not four unrelated AI products. It is
a structured decision-support system with governed domains:

1. Karpilo Atlas Core
2. Karpilo Atlas Freight
3. Karpilo Atlas Route
4. Karpilo Atlas Education
5. Karpilo Atlas Libraries
6. Karpilo Atlas User-Owned Intelligence

Operating principle:

```text
Karpilo Atlas Core decides what is needed.
Karpilo Atlas Freight evaluates the load.
Karpilo Atlas Route evaluates the movement.
Karpilo Atlas Education explains, teaches, and guides.
Karpilo Atlas Libraries provide source context.
Karpilo Atlas User-Owned Intelligence provides the operator's private truth.
```

Karpilo Atlas Intelligence Systems supports Karpilo LoadIQ decision support. It
does not replace the deterministic calculator, the user's business judgment,
carrier policy, rate confirmations, settlement records, legal/compliance review,
or professional advice.

## Brand Naming Rule

Karpilo must precede every public-facing product, system, module, intelligence
structure, and library.

Correct public names include:

- Karpilo LoadIQ
- Karpilo Atlas Intelligence Systems
- Karpilo Atlas Core
- Karpilo Atlas Freight
- Karpilo Atlas Route
- Karpilo Atlas Education
- Karpilo Atlas Libraries
- Karpilo Atlas User-Owned Intelligence
- Karpilo Atlas Regulatory Library
- Karpilo Atlas Safety & Inspection Library
- Karpilo Atlas Hazmat Library
- Karpilo Atlas Customs & Border Library
- Karpilo Atlas Maritime & Intermodal Library
- Karpilo Atlas Industry Association Library
- Karpilo Atlas Freight Flow & Economic Library
- Karpilo Atlas Fuel, Cost & Tax Reference Library
- Karpilo Atlas Route, Weather & Hazard Library
- Karpilo Atlas Geospatial & Freight Infrastructure Library
- Karpilo Atlas Public News Library

Avoid public standalone names such as:

- LoadIQ
- Atlas
- Atlas Core
- Atlas Freight
- Atlas Route
- Atlas Education
- Atlas Libraries

Internal code may use compact constants, but public product language must
preserve the Karpilo brand.

Suggested internal constants for later implementation:

```ts
export const KARPILO_ATLAS_CORE = "karpilo_atlas_core";
export const KARPILO_ATLAS_FREIGHT = "karpilo_atlas_freight";
export const KARPILO_ATLAS_ROUTE = "karpilo_atlas_route";
export const KARPILO_ATLAS_EDUCATION = "karpilo_atlas_education";
export const KARPILO_ATLAS_LIBRARIES = "karpilo_atlas_libraries";
export const KARPILO_ATLAS_USER_OWNED_INTELLIGENCE =
  "karpilo_atlas_user_owned_intelligence";
```

Current implementation note: existing code still contains older labels such as
`Karpilo Atlas AI`, `Atlas Analysis Assistance`, `Atlas Operational Context`,
and `Atlas Educational Support`. This document defines the future public naming
standard. Renaming implementation surfaces belongs on a separate branch.

## Product Boundary

Karpilo LoadIQ is private trucking decision intelligence.

Karpilo LoadIQ does not find freight. It evaluates freight opportunities the
user already has.

Karpilo LoadIQ does not compete with load boards by showing freight. Karpilo
LoadIQ competes with bad decisions by turning each operator's freight, cost,
route, equipment, and post-trip data into private decision-support
intelligence.

Correct positioning:

```text
Karpilo LoadIQ tells the operator what a freight opportunity means for their
truck, their costs, their route, their time, their risk, and their profit.
```

Karpilo LoadIQ must not become:

- freight broker
- dispatch service
- load board
- freight marketplace
- rate board
- broker agent
- carrier agent
- motor carrier
- ELD
- navigation authority
- route authority
- permit authority
- customs broker
- hazmat authority
- tax advisor
- legal advisor
- insurance advisor
- compliance authority
- guaranteed-profit system

Karpilo LoadIQ may:

- accept user-entered load offer details
- accept user-entered freight details
- accept user-entered costs
- accept user-entered equipment profile data
- accept user-entered route details
- accept user-entered post-trip actuals
- compare planned vs actual performance
- explain risk, burden, assumptions, missing inputs, and decision quality
- provide educational awareness from public/reference sources
- generate private operator-specific intelligence

Karpilo LoadIQ must not:

- source freight
- scrape freight boards
- show available loads
- match trucks to freight
- match carriers to brokers/shippers
- negotiate freight
- book freight
- tender freight
- assign loads
- allocate traffic among carriers
- dispatch drivers
- accept compensation tied to freight arrangement
- act as broker/dispatcher/load-board infrastructure

## AI Model vs Intelligence Module vs Library

Do not implement this as four expensive standalone AI models at launch.

The correct first architecture is four governed intelligence modules under
Karpilo Atlas Intelligence Systems, supported by source libraries and
user-owned intelligence.

Each Karpilo Atlas structure can begin as:

- TypeScript contracts
- rules engines
- tier-entitlement gates
- source-aware output metadata
- confidence scoring
- missing input detection
- audit logs
- static prompt contracts
- optional future AI calls
- optional future RAG against source libraries

| Term | Meaning |
| --- | --- |
| Karpilo Atlas Core | Orchestrator and decision/governance layer |
| Karpilo Atlas Freight | Freight/load-fit intelligence layer |
| Karpilo Atlas Route | Route/movement/time/mileage/risk intelligence layer |
| Karpilo Atlas Education | Explanation, training, and user-improvement layer |
| Karpilo Atlas Libraries | Curated source/reference/data layer |
| Karpilo Atlas User-Owned Intelligence | Private user/company operating intelligence generated from user inputs and post-trip actuals |

## Master System Flow

Intended flow:

```text
User enters or saves a load opportunity
        v
Karpilo LoadIQ calculator collects load, cost, route, freight, and equipment inputs
        v
Karpilo Atlas Core reads user tier, profile, costs, equipment, saved history, and available inputs
        v
Karpilo Atlas Core checks entitlements and determines required intelligence structures
        v
Karpilo Atlas Freight evaluates load/freight burden when entitled
        v
Karpilo Atlas Route evaluates route/movement burden when entitled
        v
Karpilo Atlas Education generates governed explanation, warnings, tutorials, and tips
        v
Karpilo Atlas Core merges outputs into one governed decision-support result
        v
Karpilo LoadIQ shows result, limitations, confidence, missing inputs, and upgrade boundaries
        v
Post-trip actuals update Karpilo Atlas User-Owned Intelligence when available
```

The calculator should not directly scatter calls into every intelligence
module. The calculator should call Karpilo Atlas Core. Karpilo Atlas Core should
coordinate everything else.

## Karpilo Atlas Core

Purpose: Karpilo Atlas Core is the main intelligence orchestrator.

Core answers:

```text
What does this user/load decision need, what intelligence is available under
this tier, and what final decision-support output should Karpilo LoadIQ show?
```

Responsibilities:

- tier entitlement governance
- module routing
- user profile context
- vehicle profile context
- trailer profile context
- expense profile context
- saved load context
- user-owned history context
- confidence scoring
- missing input detection
- assumption tracking
- source authority classification
- final Karpilo LoadIQ decision score
- final decision output
- legal/product guardrails
- audit notes
- historical learning when allowed by tier
- multi-profile/multi-vehicle logic in Pro

Future output contract:

```ts
export type KarpiloAtlasDecisionType =
  | "load_fit"
  | "route_analysis"
  | "freight_analysis"
  | "education"
  | "profile_setup"
  | "post_trip_audit"
  | "tier_gate"
  | "missing_inputs";

export type KarpiloAtlasRecommendedAction =
  | "accept"
  | "review"
  | "reject"
  | "needs_more_data"
  | "not_available_in_tier";

export type KarpiloAtlasCoreOutput = {
  decisionType: KarpiloAtlasDecisionType;
  requiredSystems: Array<
    | "karpilo_atlas_freight"
    | "karpilo_atlas_route"
    | "karpilo_atlas_education"
  >;
  availableSystems: string[];
  blockedSystems: string[];
  missingInputs: string[];
  assumptions: string[];
  confidenceScore: number;
  userRiskLevel: "low" | "moderate" | "high";
  loadIQDecisionScore: number;
  recommendedAction: KarpiloAtlasRecommendedAction;
  explanationSummary: string;
  auditNotes: string[];
  guardrailsApplied: string[];
};
```

Tier position: Karpilo Atlas Core exists in all tiers, but depth is governed by
tier.

| Tier | Karpilo Atlas Core behavior |
| --- | --- |
| Silver | Basic orchestration, basic calculator support, missing-input warnings, basic explanations |
| Gold | Stronger guided orchestration, basic route-aware decisions, better confidence handling |
| Platinum | Advanced orchestration across Core/Freight/Route/Education with stronger risk scoring |
| Pro | Advanced orchestration with deeper memory, multi-profile logic, audit intelligence, and business/scale planning |

## Karpilo Atlas Freight

Purpose: Karpilo Atlas Freight evaluates the load itself.

Freight answers:

```text
Is this freight a good fit for the user's truck, trailer, equipment, cost
profile, and operating expectations?
```

Responsibilities:

- commodity
- load weight
- dimensions
- trailer compatibility
- vehicle/trailer fit
- securement burden
- tarping burden
- weather sensitivity of freight
- commodity-specific handling concerns
- accessorial opportunities
- damage risk
- driver-assist burden
- shipper/receiver handling notes entered by user
- freight-specific broker questions
- hazmat awareness flags when applicable
- intermodal/container/drayage context when applicable

Karpilo Atlas Freight must not own:

- full route profitability
- weather along the route except freight sensitivity context
- traffic
- terrain
- HOS pressure
- route timing feasibility
- full mileage calculation
- post-trip mileage variance

Those belong to Karpilo Atlas Route and Karpilo Atlas Core.

Tier position:

| Tier | Karpilo Atlas Freight behavior |
| --- | --- |
| Silver | Freight input capture only; no premium freight intelligence |
| Gold | Freight input capture and very limited/heavily governed freight context |
| Platinum | Full freight intelligence: commodity, weight, trailer fit, securement, tarping, accessorials, freight red flags |
| Pro | Advanced freight intelligence with historical patterns, multi-vehicle fit logic, freight-fit memory, and audit learning |

Strategic rule: Do not lock lower-tier users out of freight data fields. Lock
them out of premium Karpilo Atlas Freight intelligence outputs.

Future output contract:

```ts
export type KarpiloAtlasFreightOutput = {
  system: "karpilo_atlas_freight";
  enabled: boolean;
  intelligenceDepth: KarpiloAtlasDepth;
  freightFitScore: number | null;
  trailerFit: "fit" | "review" | "poor_fit" | "unknown";
  weightRisk: "low" | "moderate" | "high" | "unknown";
  securementBurden: "none" | "light" | "moderate" | "heavy" | "unknown";
  tarpingBurden: "none" | "possible" | "likely" | "unknown";
  accessorialOpportunities: string[];
  commodityWarnings: string[];
  brokerQuestions: string[];
  missingInputs: string[];
  assumptions: string[];
  guardrailsApplied: string[];
};
```

## Karpilo Atlas Route

Purpose: Karpilo Atlas Route evaluates the movement.

Route answers:

```text
What will this movement actually cost in time, miles, risk, fuel, delay, and
operational burden?
```

Responsibilities:

- origin/pickup location
- destination/delivery location
- intermediate stops
- address validation
- zip-to-zip fallback
- estimated mileage
- paid mileage comparison
- deadhead mileage
- out-of-route exposure
- route variance
- pickup appointment windows
- delivery appointment windows
- FCFS vs strict appointments
- weather risk
- wind/ice/snow/flood/hurricane risk awareness
- traffic/congestion exposure
- terrain/elevation/grade burden
- toll exposure
- fuel route impact
- dwell exposure
- HOS pressure awareness
- post-trip odometer variance
- mileage leakage
- route burden score

Tier position:

| Tier | Karpilo Atlas Route behavior |
| --- | --- |
| Silver | Manual mileage/deadhead fields only; no meaningful route intelligence |
| Gold | Basic/heavily governed route intelligence: mileage comparison, deadhead awareness, stops, basic address/mileage context, limited route explanation |
| Platinum | Advanced route intelligence: weather, traffic, terrain, dwell, timing, tolls, route risk, route burden score |
| Pro | Advanced route plus historical variance, multi-vehicle context, post-trip learning, and operational scaling insight |

Guardrails: Karpilo Atlas Route is not truck navigation, legal routing, ELD/HOS
authority, permit routing, bridge/tunnel compliance authority, hazmat routing
authority, or guaranteed ETA.

Future output contract:

```ts
export type KarpiloAtlasRouteOutput = {
  system: "karpilo_atlas_route";
  enabled: boolean;
  intelligenceDepth: KarpiloAtlasDepth;
  routeBurdenScore: number | null;
  mileageExposure: "low" | "moderate" | "high" | "unknown";
  timePressure: "low" | "moderate" | "high" | "unknown";
  weatherRisk: "none" | "low" | "moderate" | "high" | "not_available";
  dwellRisk: "low" | "moderate" | "high" | "unknown";
  paidVsEstimatedMileageNotes: string[];
  appointmentWindowNotes: string[];
  routeWarnings: string[];
  missingInputs: string[];
  assumptions: string[];
  guardrailsApplied: string[];
};
```

## Karpilo Atlas Education

Purpose: Karpilo Atlas Education explains the decision, teaches the user, and
improves operator decision-making.

Education answers:

```text
What does this user need to understand so they make a better trucking decision
next time?
```

Responsibilities:

- calculator explanations
- gross vs net explanation
- RPM/CPM education
- deadhead education
- fixed vs variable cost education
- fuel cost education
- FSC explanation
- margin explanation
- broker question guidance
- detention/accessorial explanation
- tarping/securement awareness
- commodity caution notes
- regulation awareness
- state/local ordinance awareness where applicable
- feature tutorials
- tier guidance
- operational tips
- mistake correction
- documentation reminders
- user coaching

Tier position:

| Tier | Karpilo Atlas Education behavior |
| --- | --- |
| Silver | Basic explanations, simple tutorials, limited warnings |
| Gold | Guided education, route-aware explanations, still heavily governed |
| Platinum | Advanced contextual education tied to Freight and Route intelligence |
| Pro | Advanced operational coaching, behavior correction, historical learning, business-scaling education |

Guardrails: Karpilo Atlas Education may provide awareness, explanations,
reminders, and suggested questions. It must not present itself as legal, tax,
FMCSA/DOT/compliance, permit, customs, hazmat, insurance, dispatch, or broker
authority.

Future output contract:

```ts
export type KarpiloAtlasEducationOutput = {
  system: "karpilo_atlas_education";
  enabled: boolean;
  educationDepth: KarpiloAtlasDepth;
  explanationSummary: string;
  teachingPoints: string[];
  suggestedQuestions: string[];
  documentationReminders: string[];
  tierGuidance: string[];
  sourceContext: Array<{
    sourceId: string;
    authorityLevel: KarpiloAtlasAuthorityLevel;
    treatment: string;
  }>;
  guardrailsApplied: string[];
};
```

## Karpilo Atlas Libraries

Purpose: Karpilo Atlas Libraries are the curated source, reference, and
data-library layer beneath Karpilo Atlas Intelligence Systems.

They are not separate AI models.

Library purpose:

```text
Separate source knowledge from AI reasoning.
```

Authority hierarchy:

| Authority Level | Source Type | Treatment |
| --- | --- | --- |
| 1 | Law/regulation: CFR, eCFR, Federal Register, FMCSA, PHMSA, CBP, FMC, state statutes/regulations | Highest authority for awareness; cite carefully; still not legal/compliance advice |
| 2 | Official agency guidance: USDOT/FMCSA/PHMSA/CBP/FMC/MARAD/FHWA/NWS/EIA/BTS/IRS public docs | Strong source context; use as guidance/awareness |
| 3 | Enforcement/safety organizations: CVSA and inspection/OOS awareness | Strong safety/inspection awareness; not federal law itself |
| 4 | Public government datasets: BTS, EIA, FHWA, Census, USGS, NOAA/NWS, NHTSA, EPA, MARAD, USACE | Strong factual context; must include limitations and refresh metadata |
| 5 | Industry associations: OOIDA, ATA | Industry perspective; not law; disclose perspective/lens |
| 6 | Public news/commentary: FreightWaves and agency news releases/commentary | Trend/news awareness only; never regulatory authority |
| Excluded by default | DAT/load boards/commercial rate boards unless explicitly licensed and separately approved | Do not scrape, integrate, or represent as Karpilo source layer |

Potential source names across the Karpilo Atlas Libraries include FMCSA, USDOT,
CFR/eCFR, Federal Register, PHMSA, CBP, FMC, MARAD, CVSA, OOIDA, ATA, EIA,
IRS, IFTA references, IRP references, BTS, NOAA/NWS, National Hurricane Center,
FHWA, Census TIGER/Line, USGS, NHTSA, OSHA, EPA SmartWay, USACE, Surface
Transportation Board, state DOT 511 systems, state OS/OW permit offices,
state/local truck-route and restriction sources, FreightWaves/public news, and
public agency news.

### Library Categories

| Library | Purpose | Potential sources | Used by | Guardrails |
| --- | --- | --- | --- | --- |
| Karpilo Atlas Regulatory Library | Regulatory-awareness context for transportation, carrier, safety, freight, and operating topics. | CFR/eCFR, Federal Register, FMCSA, USDOT, PHMSA, CBP, FMC, state statutes/regulations | Core, Route, Freight, Education | Awareness only; not legal/compliance advice. |
| Karpilo Atlas Carrier Identity & Authority Library | Carrier identity, operating authority, registration, and public carrier-status awareness. | FMCSA public records, USDOT references, state public carrier resources | Core, Education, future User-Owned Intelligence | Must not certify authority or replace official lookup/legal review. |
| Karpilo Atlas Safety & Inspection Library | Safety, inspection, out-of-service, and enforcement awareness. | FMCSA, CVSA, NHTSA, OSHA, state enforcement/public safety resources | Freight, Route, Education | CVSA is strong safety/inspection context, not federal law itself. |
| Karpilo Atlas Hazmat Library | Hazmat awareness, handling, routing, and documentation context. | PHMSA, CFR/eCFR, FMCSA, state hazmat resources | Freight, Route, Education | Must not classify hazmat, certify routing, or replace hazmat compliance review. |
| Karpilo Atlas Customs & Border Library | Border, customs, import/export, and cross-border freight awareness. | CBP, FMC, MARAD, official border/public trade resources | Freight, Route, Education | Not a customs broker or customs/legal authority. |
| Karpilo Atlas Maritime & Intermodal Library | Port, maritime, intermodal, chassis, drayage, and container context. | FMC, MARAD, USACE, port public docs, Surface Transportation Board | Freight, Route, Education | No freight matching, port booking, or customs authority. |
| Karpilo Atlas Industry Association Library | Industry perspective, owner-operator lens, and carrier/trucking association context. | OOIDA, ATA, public association docs | Education, Core | Association perspective only; disclose lens and never treat as law. |
| Karpilo Atlas Fuel, Cost & Tax Reference Library | Fuel, cost, excise, tax-reference, IFTA/IRP awareness. | EIA, IRS, IFTA references, IRP references, state fuel/tax public docs | Core, Route, Education | Not tax filing, tax advice, accounting, or IFTA authority. |
| Karpilo Atlas Route, Weather & Hazard Library | Weather, road hazard, public route-risk and incident-awareness context. | NOAA/NWS, National Hurricane Center, state DOT 511 systems, FHWA, USGS | Route, Education | Not routing authority, navigation, road-closure guarantee, or ETA guarantee. |
| Karpilo Atlas Geospatial & Freight Infrastructure Library | Public geography, roadway, freight infrastructure, corridor, and facility context. | FHWA, BTS, Census TIGER/Line, USGS, USACE, MARAD | Route, Freight, Core | Public datasets require refresh metadata and limitation notes. |
| Karpilo Atlas Freight Flow & Economic Library | Freight movement, market context, and public economic trend awareness. | BTS, FHWA, Census, EIA, public agency news, FreightWaves/public news | Core, Education | Trend awareness only; not rate-board, load-board, or freight availability. |
| Karpilo Atlas Environmental & Efficiency Library | Efficiency, emissions, and public fuel/operation awareness. | EPA SmartWay, EIA, NHTSA, FHWA | Education, Route, Core | Not regulatory certification or guaranteed fuel outcome. |
| Karpilo Atlas Public News Library | Public news, agency releases, and transportation commentary. | FreightWaves/public news, agency news releases, public safety bulletins | Education, Core | Lowest authority; never regulatory truth by itself. |
| Karpilo Atlas State & Local Authority Library | State/local route restriction, OS/OW, road condition, and permit-awareness context. | State DOT 511 systems, state OS/OW permit offices, state/local truck-route and restriction sources | Route, Freight, Education | Not permit authority, legal routing, or compliance certification. |

OOIDA and ATA treatment:

```text
OOIDA generally frames this issue from the independent owner-operator/small-business
trucker side, while ATA generally frames industry issues from the broader
motor-carrier/trucking-industry side. Neither replaces FMCSA, CFR, state law,
carrier policy, or professional compliance/legal advice.
```

OOIDA and ATA must be classified as industry association perspectives, not law.
When both matter, Karpilo Atlas Education should identify the lens rather than
pretending one association speaks for all trucking.

## DAT / Load Board Exclusion

DAT and load-board behavior are excluded from the default Karpilo Atlas
Libraries architecture.

Karpilo LoadIQ must not:

- integrate DAT by default
- scrape DAT
- parse DAT screenshots
- use DAT as a source adapter
- represent Karpilo Atlas Libraries as a DAT/rate-board replacement
- show DAT loads
- build load-board/rate-board behavior

Reason: Karpilo LoadIQ must stay out of load-board, dispatch,
freight-matching, broker, and rate-board territory.

Correct replacement strategy:

| Need | Safer Karpilo LoadIQ source |
| --- | --- |
| Broker/load offer comparison | User-entered offer details |
| Fuel trend | EIA diesel data |
| Freight movement context | BTS/FHWA/public freight data |
| Industry context | OOIDA/ATA/FreightWaves/public news with classification |
| Lane history | User's own saved Karpilo LoadIQ history |
| Cost truth | User's actual operating cost profile |
| Profit decision | User's private data + Karpilo Atlas Core |

## Karpilo Atlas User-Owned Intelligence

Karpilo Atlas User-Owned Intelligence is the private intelligence layer
generated from the user's own operating data, saved decisions, cost structure,
route history, freight history, and post-trip actuals.

It is not:

- public market
- spot market
- DAT
- FreightWaves
- dispatch
- brokerage
- freight matching

Correct definition:

```text
Karpilo Atlas User-Owned Intelligence turns the operator's own freight, cost,
route, equipment, and post-trip data into private decision-support intelligence.
```

Layers:

1. Karpilo Atlas Private Operator Library
2. Karpilo Atlas User-Entered Market Context
3. Karpilo Atlas Public Reference Libraries
4. Future Karpilo Atlas Aggregated Network Intelligence

Future Karpilo Atlas Aggregated Network Intelligence is future-only and
disabled by default. It requires:

- explicit consent
- strong privacy policy
- clear data rights language
- aggregation thresholds
- no individual carrier exposure
- no exact proprietary cost leakage
- no broker-specific public accusations
- no freight matching
- no dispatch recommendations
- no load availability
- no rate-board behavior

## Tier Gating Doctrine

Core product rule:

```text
Inputs should stay broadly available. Intelligence depth should be tier-gated.
```

Strategic rule: Do not restrict lower-tier users from entering useful trucking
data. Restrict advanced intelligence output, external data depth, historical
learning, and explanation depth by tier.

Tier philosophy:

| Tier | Product role |
| --- | --- |
| Silver | Starter calculator and basic decision-awareness tier |
| Gold | Guided operator tier with basic route intelligence and better education |
| Platinum | Advanced individual owner-operator decision-support tier |
| Pro | Advanced operator/small-fleet/business intelligence tier |

Pro should not be defined only by truck count. Pro is defined by operational
maturity, profile complexity, historical learning, multi-vehicle/multi-profile
needs, deeper audit, and business intelligence depth.

Master tier matrix:

| Area | Silver | Gold | Platinum | Pro |
| --- | --- | --- | --- | --- |
| Karpilo Atlas Core | Basic orchestration and missing-input warnings | Guided orchestration and confidence handling | Advanced multi-module orchestration | Professional orchestration, audit intelligence, multi-profile logic |
| Karpilo Atlas Freight | Input capture only | Limited governed context | Full freight-fit intelligence | Historical freight learning and multi-vehicle fit |
| Karpilo Atlas Route | Manual mileage/deadhead fields | Basic route intelligence and mileage comparison | Advanced weather/traffic/terrain/dwell/toll burden | Historical route learning and scaling insight |
| Karpilo Atlas Education | Basic explanations | Guided explanations and tutorials | Contextual education tied to Freight/Route | Operational coaching and behavior correction |
| Karpilo Atlas Libraries | Minimal source labels | Basic public-reference context | Advanced regulatory/public-source awareness | Professional source-aware review and audit context |
| Karpilo Atlas User-Owned Intelligence | Limited saved-load awareness | Basic saved history and post-trip context | Private lane/freight/cost history | Advanced private history and business intelligence |
| Post-Trip Audit | Basic planned vs actual notes | Guided variance explanations | Advanced variance and assumption review | Deep audit, patterns, and operational improvement |
| AI Output Depth | None/basic deterministic | Basic/guided and heavily governed | Advanced contextual output | Professional depth with stricter audit and memory controls |
| External Source Depth | Minimal | Limited public references | Advanced official/public reference context | Professional source-aware synthesis |
| Upgrade Value | More guidance and saved context | More route/freight explanation | Advanced risk, freight, route, and source context | Multi-profile, history, audit, and business planning depth |

Governance note: current repository docs identify Silver and Gold as current
commercial tiers and Platinum/Pro as reserved or unresolved. This matrix is a
future product contract and does not activate public Platinum/Pro availability,
checkout behavior, billing code, or entitlement behavior.

## Central Entitlement Contract

Tier gating must not be scattered across random UI components.

Wrong pattern:

```ts
if (tier === "platinum") {
  // random feature logic
}
```

Correct pattern:

```ts
if (entitlements.freight.intelligenceEnabled) {
  // show Karpilo Atlas Freight intelligence
}
```

Initial entitlement scaffold:

```text
src/lib/karpilo-atlas/entitlements.ts
src/lib/karpilo-atlas/types.ts
```

Implemented contract:

```ts
export type KarpiloLoadIQTier = "silver" | "gold" | "platinum" | "pro";

export type KarpiloAtlasDepth =
  | "none"
  | "basic"
  | "guided"
  | "advanced"
  | "professional";

export type KarpiloAtlasHistoricalMemory =
  | "none"
  | "limited"
  | "advanced"
  | "professional";

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
  // Returns the centralized Atlas entitlement object.
}
```

This scaffold defines Atlas-specific product entitlement contracts only. It
does not change billing provider behavior, checkout behavior, Stripe mappings,
existing app feature gates, UI locks, calculator behavior, or public tier
availability.

## Source Registry Scaffold

Initial source registry scaffold:

- source authority levels
- source access types
- source library categories
- source registry entries
- DAT/load-board excluded entry
- OOIDA/ATA industry-perspective entries
- official/public library entries

Implemented scaffold files:

```text
src/lib/karpilo-atlas/constants.ts
src/lib/karpilo-atlas/types.ts
src/lib/karpilo-atlas/sources/index.ts
src/lib/karpilo-atlas/sources/library-catalog.ts
src/lib/karpilo-atlas/sources/library-types.ts
src/lib/karpilo-atlas/sources/source-registry.ts
src/lib/karpilo-atlas/sources/source-types.ts
```

Implemented source registry types:

```ts
export type KarpiloAtlasAuthorityLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type KarpiloAtlasSourceAccess =
  | "public"
  | "licensed"
  | "user_entered"
  | "internal"
  | "excluded";

export type KarpiloAtlasSourceIntegrationStatus =
  | "registry_only"
  | "manual_reference"
  | "dataset_later"
  | "api_later"
  | "licensed_later"
  | "excluded";

export type KarpiloAtlasSourceRegistryEntry = {
  id: string;
  publicName: string;
  internalName: string;
  library: KarpiloAtlasReferenceLibrary | KarpiloAtlasPrivateTruthLayer;
  authorityLevel: KarpiloAtlasAuthorityLevel;
  access: KarpiloAtlasSourceAccess;
  integrationStatus: KarpiloAtlasSourceIntegrationStatus;
  allowedUse: string[];
  prohibitedUse: string[];
  relatedSystems: KarpiloAtlasSystemId[];
  tierAvailability: KarpiloLoadIQTier[];
  requiresCitation: boolean;
  requiresDisclaimer: boolean;
  refreshCadence: KarpiloAtlasRefreshCadence;
  lastReviewedAt?: string;
  notes?: string;
};
```

DAT excluded source example:

```ts
export const DAT_EXCLUDED_SOURCE: KarpiloAtlasSourceRegistryEntry = {
  id: "dat_load_board_excluded",
  publicName: "DAT/load-board data excluded",
  internalName: "DAT and commercial load-board data",
  library: "karpilo_atlas_public_news_library",
  authorityLevel: 6,
  access: "excluded",
  integrationStatus: "excluded",
  allowedUse: [
    "User may manually enter their own load-offer details for private Karpilo LoadIQ decision analysis.",
  ],
  prohibitedUse: [
    "Do not scrape DAT.",
    "Do not integrate DAT without explicit licensed approval.",
    "Do not show DAT loads.",
    "Do not parse DAT screenshots as a product feature.",
    "Do not build rate-board behavior.",
    "Do not build load-board behavior.",
    "Do not perform freight matching.",
    "Do not dispatch freight.",
    "Do not broker freight.",
    "Do not tender freight.",
    "Do not assign loads.",
    "Do not allocate traffic among carriers.",
    "Do not accept compensation tied to arranging freight.",
  ],
  relatedSystems: ["karpilo_atlas_core", "karpilo_atlas_education"],
  tierAvailability: [],
  requiresCitation: false,
  requiresDisclaimer: true,
  refreshCadence: "not_applicable",
  notes:
    "Excluded by default. Karpilo LoadIQ must not scrape, parse, display, or act as a DAT/load-board/rate-board replacement.",
};
```

DAT/load-board sources remain excluded from all tiers. The numeric authority
level on the excluded entry is not an availability grant; exclusion is governed
by `access: "excluded"`, `integrationStatus: "excluded"`, and empty
`tierAvailability`.

## Data Persistence and Audit Concepts

Future Supabase persistence should capture:

- user tier at time of analysis
- entitlement snapshot used
- load input snapshot
- user cost snapshot
- equipment/profile snapshot
- freight input snapshot
- route input snapshot
- source-library references used
- module outputs
- missing inputs
- assumptions
- confidence scores
- final decision output
- user-facing limitations shown
- post-trip actuals
- mileage variance
- fuel variance
- dwell variance
- accessorial variance
- revenue leakage indicators
- audit notes

Saving the entitlement snapshot matters because a user may change tiers later.
The historical analysis should preserve what intelligence level was available
at the time of the decision.

This section does not approve Supabase migrations. Schema work requires a
separate branch and explicit approval.

## Single Karpilo Atlas Intelligence Readout Doctrine

Current issue: Karpilo LoadIQ currently risks overloading the user with multiple
overlapping panels:

- Operational Intelligence
- Trip Viability
- Revenue Basis
- Fuel Intelligence
- Mileage Intelligence
- LoadIQ Intelligence
- Profit Intelligence
- Atlas Analysis
- Karpilo Atlas Freight Intelligence
- Weather Intelligence

Future target: replace repetitive scattered explanation with one primary
readout:

```text
Karpilo Atlas Intelligence Readout
```

The single readout should include:

1. Decision Summary
2. Revenue Basis
3. Mileage & Route Exposure
4. Fuel & Cost Exposure
5. Time & Schedule Pressure
6. Freight Fit
7. Weather / External Risk when available and entitled
8. Profit Confidence
9. Missing Inputs
10. Assumptions
11. Recommended Action
12. Expandable Details

Output should be concise, non-redundant, and driver-useful.

Example structure:

```text
Karpilo Atlas Intelligence Readout
Verdict: Strong / Watch / Weak / Reject
Why:
- Revenue basis
- Mileage exposure
- Fuel exposure
- Time/window pressure
- Freight/equipment burden
- Weather or route risk if available
- Profit confidence
Action:
- Accept
- Negotiate
- Add buffer
- Verify paid miles
- Watch fuel/route variance
- Reject / needs more data
```

Rules:

- Preserve underlying calculations.
- Preserve deterministic fallback.
- Preserve tier gates.
- Preserve Karpilo Atlas/OpenAI gates.
- Preserve weather gates.
- Preserve Route Intelligence.
- Preserve source/guardrail messaging.
- Do not create repetitive panels with the same conclusion.
- Put secondary detail behind expandable sections.
- Do not make premium locked outputs look available to lower tiers.
- Do not introduce new AI calls just to consolidate UI.
- Consolidation is a later UI/refactor task, not this docs-only task.

## Implementation Phases

### Phase 1 - Docs Contract Only

Current task.

Create/update:

```text
docs/features/karpilo-atlas-intelligence-systems.md
```

No app code.

### Phase 2 - Type/Entitlement Scaffold

Initial implemented files:

```text
src/lib/karpilo-atlas/constants.ts
src/lib/karpilo-atlas/index.ts
src/lib/karpilo-atlas/types.ts
src/lib/karpilo-atlas/entitlements.ts
```

### Phase 3 - Source Registry Scaffold

Initial implemented files:

```text
src/lib/karpilo-atlas/constants.ts
src/lib/karpilo-atlas/types.ts
src/lib/karpilo-atlas/sources/index.ts
src/lib/karpilo-atlas/sources/library-catalog.ts
src/lib/karpilo-atlas/sources/library-types.ts
src/lib/karpilo-atlas/sources/source-types.ts
src/lib/karpilo-atlas/sources/source-registry.ts
```

### Phase 4 - User-Owned Intelligence Scaffold

Initial implemented files:

```text
src/lib/karpilo-atlas/user-owned-intelligence/types.ts
```

Potential future files:

```text
src/lib/karpilo-atlas/user-owned-intelligence/audit-types.ts
```

### Phase 5 - UI Gating and Messaging

Implement:

- locked states
- upgrade descriptions
- input capture remains available
- intelligence output gating
- limitation messaging
- source/disclaimer messaging

### Phase 6 - Module Service Scaffolding

Initial implemented contract files:

```text
src/lib/karpilo-atlas/core/types.ts
src/lib/karpilo-atlas/freight/types.ts
src/lib/karpilo-atlas/route/types.ts
src/lib/karpilo-atlas/education/types.ts
```

Potential future service directories:

```text
src/lib/karpilo-atlas/core/
src/lib/karpilo-atlas/freight/
src/lib/karpilo-atlas/route/
src/lib/karpilo-atlas/education/
```

### Phase 7 - Karpilo LoadIQ Calculator Integration

Correct integration:

```text
Karpilo LoadIQ calculator
        v
Karpilo Atlas Core
        v
Karpilo Atlas Freight / Karpilo Atlas Route / Karpilo Atlas Education
        v
Karpilo Atlas Core final output
        v
Karpilo LoadIQ result screen
```

### Phase 8 - Single Readout UI Consolidation

Future branch:

```text
fix/loadiq-atlas-single-read-analysis
```

Goal: compress existing analysis panels into one governed Karpilo Atlas
Intelligence Readout.

### Phase 9 - AI/RAG Expansion Later

Only after contracts, entitlements, sources, and guardrails exist.

### Phase 10 - Future Aggregated Network Intelligence

Future-only and disabled by default.

Requires:

- explicit consent
- privacy policy
- data-processing terms
- aggregation thresholds
- no freight matching
- no dispatch
- no broker behavior
- no user/company exposure
- no individual broker accusations
- no rate-board behavior

## Suggested File Paths

Docs:

```text
docs/features/karpilo-atlas-intelligence-systems.md
docs/features/karpilo-atlas-libraries.md
docs/features/karpilo-atlas-user-owned-intelligence.md
```

Types and scaffolds later:

```text
src/lib/karpilo-atlas/constants.ts
src/lib/karpilo-atlas/types.ts
src/lib/karpilo-atlas/entitlements.ts
src/lib/karpilo-atlas/sources/index.ts
src/lib/karpilo-atlas/sources/library-catalog.ts
src/lib/karpilo-atlas/sources/library-types.ts
src/lib/karpilo-atlas/sources/source-types.ts
src/lib/karpilo-atlas/sources/source-registry.ts
src/lib/karpilo-atlas/user-owned-intelligence/types.ts
src/lib/karpilo-atlas/core/types.ts
src/lib/karpilo-atlas/freight/types.ts
src/lib/karpilo-atlas/route/types.ts
src/lib/karpilo-atlas/education/types.ts
```

Testing later:

```text
src/lib/karpilo-atlas/__tests__/entitlements.test.ts
src/lib/karpilo-atlas/sources/__tests__/source-registry.test.ts
```

## Final Operating Doctrine

Karpilo LoadIQ is not a load board, dispatch service, freight broker, ELD,
navigation authority, tax/legal/compliance advisor, or rate-board replacement.
Karpilo LoadIQ is private trucking decision intelligence. Karpilo Atlas
Intelligence Systems turns user-entered load opportunities, operating costs,
equipment profiles, route details, freight details, public/reference library
context, and post-trip actuals into tier-governed decision support.

Strategic moat:

```text
Public market data tells the industry what freight may be doing. Karpilo LoadIQ
tells the individual operator what that freight means for their truck, their
cost, their route, their risk, their time, and their profit.
```

Implementation rule:

```text
Build the contract first. Then build entitlements. Then source registry. Then
user-owned intelligence. Then UI gating. Then module scaffolds. Then single
readout UI. Then AI.
```
