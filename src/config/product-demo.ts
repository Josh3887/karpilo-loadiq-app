// Portable website marketing config. Safe to copy into the separate Karpilo LoadIQ website repo.

export type DemoLocation = {
  city: string;
  state: string;
  zip: string;
};

export type DemoLoad = {
  loadNumber: string;
  scenario: string;
  pickup: DemoLocation;
  delivery: DemoLocation;
  loadedMiles: number;
  deadheadMiles: number;
  totalMiles: number;
  flatRateRevenue: number;
  fuel: {
    eiaEstimatedDieselPrice: number;
    userOverrideFuelPrice: number;
    sourceLabel: string;
    region: string;
    status: string;
  };
  mpg: number;
  loadSpecificCosts: {
    tolls: number;
    lumpers: number;
    detention: number;
    layover: number;
    washout: number;
    parking: number;
    other: number;
  };
};

export type DemoSettings = {
  operationType: string;
  yearlyTakeHomeTarget: number;
  weeklyTarget: number;
  minimumTrueRpm: number;
  minimumHourlyProfit: number;
  defaultMpg: number;
  payTemplate: string;
  weeklyOperationalOverhead: number;
  maintenanceReserve: number;
  tireReserve: number;
};

export type DemoResults = {
  grossRevenue: number;
  trueRpm: number;
  rpmAfterDeadhead: number;
  estimatedFuelCost: number;
  loadSpecificCostTotal: number;
  modeledOverheadAndReserves: number;
  projectedNet: number;
  projectedProfitMargin: number;
  breakEvenRpm: number;
  hourlyProfitability: number;
  dailyProfitability: number;
  profitabilityBand: string;
  summary: string;
  warnings: string[];
};

export type DemoComparison = {
  estimated: {
    fuelPrice: number;
    fuelCost: number;
    totalTripCost: number;
    net: number;
    margin: number;
  };
  actual: {
    fuelPrice: number;
    fuelCost: number;
    addedCosts: number;
    totalTripCost: number;
    net: number;
    margin: number;
  };
  variance: {
    netDifference: number;
    fuelDifference: number;
    explanation: string;
  };
};

export type DemoStep = {
  title: string;
  description: string;
};

export type DemoCta = {
  eyebrow: string;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
};

export const demoDisclaimer =
  "Demo values are fictional examples for product illustration only. Karpilo LoadIQ calculations are projections and do not guarantee profit, freight availability, or business outcomes.";

export const demoLoad = {
  loadNumber: "DEMO-2471",
  scenario: "Owner operator evaluating a potential dry van load before booking.",
  pickup: {
    city: "Nashville",
    state: "TN",
    zip: "37209",
  },
  delivery: {
    city: "Kansas City",
    state: "MO",
    zip: "64120",
  },
  loadedMiles: 555,
  deadheadMiles: 64,
  totalMiles: 619,
  flatRateRevenue: 1850,
  fuel: {
    eiaEstimatedDieselPrice: 3.92,
    userOverrideFuelPrice: 4.08,
    sourceLabel: "EIA market estimate",
    region: "U.S. National ULSD",
    status: "User override",
  },
  mpg: 6.7,
  loadSpecificCosts: {
    tolls: 48,
    lumpers: 0,
    detention: 0,
    layover: 0,
    washout: 35,
    parking: 18,
    other: 20,
  },
} satisfies DemoLoad;

export const demoSettings = {
  operationType: "OTR owner operator",
  yearlyTakeHomeTarget: 78000,
  weeklyTarget: 1500,
  minimumTrueRpm: 2.15,
  minimumHourlyProfit: 55,
  defaultMpg: 6.7,
  payTemplate: "Flat rate load",
  weeklyOperationalOverhead: 625,
  maintenanceReserve: 95,
  tireReserve: 35,
} satisfies DemoSettings;

export const demoResults = {
  grossRevenue: 1850,
  trueRpm: 2.99,
  rpmAfterDeadhead: 2.99,
  estimatedFuelCost: 376.98,
  loadSpecificCostTotal: 121,
  modeledOverheadAndReserves: 255,
  projectedNet: 1097.02,
  projectedProfitMargin: 59.3,
  breakEvenRpm: 1.36,
  hourlyProfitability: 91.42,
  dailyProfitability: 548.51,
  profitabilityBand: "Strong",
  summary:
    "The demo load clears the target true RPM after deadhead and remains above break-even after fuel, reserves, and load-specific costs.",
  warnings: [
    "Fuel price was manually overridden above the market estimate.",
    "Deadhead is visible in true RPM before the load is accepted.",
  ],
} satisfies DemoResults;

export const demoComparison = {
  estimated: {
    fuelPrice: 4.08,
    fuelCost: 376.98,
    totalTripCost: 752.98,
    net: 1097.02,
    margin: 59.3,
  },
  actual: {
    fuelPrice: 4.19,
    fuelCost: 387.14,
    addedCosts: 42,
    totalTripCost: 805.14,
    net: 1044.86,
    margin: 56.5,
  },
  variance: {
    netDifference: -52.16,
    fuelDifference: -10.16,
    explanation:
      "Actual fuel and parking ran higher than the estimate, but the load still remained above target profitability in this fictional example.",
  },
} satisfies DemoComparison;

export const demoSteps = [
  {
    title: "Start with the freight offer",
    description:
      "Enter pickup, delivery, loaded miles, deadhead, and the flat rate or pay structure being offered.",
  },
  {
    title: "Apply your operating profile",
    description:
      "Karpilo LoadIQ layers in MPG, target income, overhead, reserves, and default pay assumptions from Settings.",
  },
  {
    title: "Check fuel pressure",
    description:
      "Use the EIA diesel reference when available, then override it if your expected pump price is different.",
  },
  {
    title: "Expose true RPM",
    description:
      "Loaded miles and deadhead are combined so the real revenue per mile is visible before booking.",
  },
  {
    title: "Compare estimate vs actual",
    description:
      "After the trip, enter actual fuel and trip costs to see where profit held or leaked.",
  },
] satisfies DemoStep[];

export const demoCta = {
  eyebrow: "Try the workflow",
  title: "See the money before the wheels turn.",
  description:
    "Use Karpilo LoadIQ to model freight, pressure-test assumptions, and understand operating margin before accepting a load.",
  buttonLabel: "Launch Karpilo LoadIQ",
  href: "/dashboard",
} satisfies DemoCta;
