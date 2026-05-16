export type EducationTopic = {
  title: string;
  summary: string;
  detail: string;
};

export const EDUCATION_TOPICS = {
  trueRpm: {
    title: "True RPM",
    summary: "Revenue divided by loaded plus deadhead miles.",
    detail:
      "True RPM shows what the load really pays across every mile tied to the decision, including unpaid repositioning.",
  },
  deadhead: {
    title: "Deadhead",
    summary: "Miles you drive without paid freight.",
    detail:
      "Deadhead can make a good-looking rate weak. Karpilo LoadIQ keeps it visible before you accept the load.",
  },
  breakEvenRpm: {
    title: "Break-even RPM",
    summary: "The linehaul RPM needed before profit starts.",
    detail:
      "Break-even RPM estimates the rate needed to cover modeled fuel, overhead, reserves, and load-specific costs.",
  },
  profitPerHour: {
    title: "Profit per hour",
    summary: "A guardrail for time, not just miles.",
    detail:
      "A load can look acceptable per mile and still be weak when appointment windows, detention risk, dwell time, and dispatch days stretch the clock.",
  },
  targetMargins: {
    title: "Karpilo LoadIQ operating guardrails",
    summary: "A practical way to read margin pressure.",
    detail:
      "Below 10% is caution. 15-25% is a practical operating target. 25-35% is strong. 35-45% is aggressive. Above 45% should be reviewed for assumptions.",
  },
  fuelEstimate: {
    title: "Fuel estimates",
    summary: "EIA fuel data is only a market reference.",
    detail:
      "When configured, Karpilo LoadIQ can use a weekly U.S. national ULSD reference. Always override it when your expected or actual pump price differs.",
  },
  overhead: {
    title: "Operational overhead",
    summary: "Recurring business costs that follow the truck.",
    detail:
      "Use overhead for truck payments, insurance, compliance, ELD, subscriptions, permits, accounting, and other recurring business costs.",
  },
  payStructures: {
    title: "Pay structures",
    summary: "How the load turns into payable revenue.",
    detail:
      "Keep this simple: percentage of gross, nested percentages like 75% of 98%, CPM, or flat-rate freight.",
  },
} satisfies Record<string, EducationTopic>;

export const OVERHEAD_CATEGORY_HELP = {
  fuel: "Fuel belongs in the calculator for each load or in actuals after the trip, not as recurring overhead.",
  maintenance:
    "Maintenance reserves protect cash for oil, repairs, inspections, and unexpected shop time.",
  tires:
    "Tire reserves help smooth out casing, replacement, alignment, and roadside tire exposure.",
  insurance:
    "Insurance can be modeled as a recurring weekly/monthly burden or a trip allocation.",
  compliance:
    "Permits, ELD, drug consortium, filings, and safety/compliance services fit here. Advanced jurisdictional fuel-tax estimation belongs only under Platinum intelligence.",
  dispatchFactoring:
    "Dispatch and factoring are usually percentage deductions. Add them as percent overhead or profile defaults.",
  truckPayment:
    "Truck payment or lease cost should be modeled as a recurring fixed operating burden.",
  general:
    "General overhead includes software, phone, accounting, banking, parking, and business services.",
} as const;
