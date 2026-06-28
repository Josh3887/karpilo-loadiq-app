import { DemoStep } from "@/demo/loadiq-demo-types";

export const demoSteps: DemoStep[] = [
  {
    key: "intro",
    section: "Start",
    eyebrow: "Step 1",
    title: "Demo introduction",
    narration:
      "Welcome to the Karpilo LoadIQ demo. This walkthrough shows how an owner-operator can set up a profile, calculate loads, save results, and review estimated profitability before making independent freight decisions.",
  },
  {
    key: "login",
    section: "Start",
    eyebrow: "Step 2",
    title: "Simulated login",
    narration:
      "In the real app, users log in securely. In demo mode, authentication is simulated so users can safely preview the workflow.",
  },
  {
    key: "safety",
    section: "Start",
    eyebrow: "Step 3",
    title: "Safety and hands-free gate",
    narration:
      "Karpilo LoadIQ is designed to support better decisions, not distract drivers. Users must acknowledge safety expectations before continuing.",
  },
  {
    key: "founderWelcome",
    section: "Setup",
    eyebrow: "Step 4",
    title: "Founder welcome and account setup",
    narration:
      "New users are welcomed into the system with clear expectations: build the profile, understand the numbers, test the workflow, and use the app as a decision-support tool.",
  },
  {
    key: "checklist",
    section: "Setup",
    eyebrow: "Step 5",
    title: "Onboarding checklist",
    narration:
      "The onboarding checklist shows users what must be completed before the app can produce meaningful profitability intelligence.",
  },
  {
    key: "operatorType",
    section: "Profile",
    eyebrow: "Step 6",
    title: "Operator type selection",
    narration:
      "The first major decision is operator type. A leased owner-operator and independent owner-operator do not calculate profitability the same way.",
  },
  {
    key: "payStructure",
    section: "Profile",
    eyebrow: "Step 7",
    title: "Pay structure builder",
    narration:
      "This step lets users model how they are actually paid. For example, some leased operators receive a percentage of adjusted gross instead of full gross.",
  },
  {
    key: "fuel",
    section: "Profile",
    eyebrow: "Step 8",
    title: "Fuel assumptions",
    narration:
      "Fuel assumptions are critical because fuel is often the largest variable cost. Bad MPG or underestimated diesel price can destroy a load's real profit.",
  },
  {
    key: "fixedCosts",
    section: "Profile",
    eyebrow: "Step 9",
    title: "Fixed cost setup",
    narration:
      "Fixed costs exist whether the truck moves or not. LoadIQ spreads these costs across the operation so each load carries its fair share.",
  },
  {
    key: "variableCosts",
    section: "Profile",
    eyebrow: "Step 10",
    title: "Variable cost setup",
    narration:
      "Variable costs change with the load. This is where users define the expenses that follow the truck, the freight, or the revenue.",
  },
  {
    key: "targetIncome",
    section: "Profile",
    eyebrow: "Step 11",
    title: "Target income setup",
    narration:
      "Instead of guessing, users can tell the app what they need to earn. LoadIQ can then help show whether a load supports that target.",
  },
  {
    key: "profileReview",
    section: "Profile",
    eyebrow: "Step 12",
    title: "Profile review",
    narration:
      "Before calculating loads, users review the operating profile. Bad inputs create bad decisions, so this review step matters.",
  },
  {
    key: "dashboard",
    section: "Dashboard",
    eyebrow: "Step 13",
    title: "Dashboard home",
    narration:
      "The dashboard becomes the operator's estimation workspace. It summarizes profitability estimates, targets, warnings, and recent load activity.",
  },
  {
    key: "startLoad",
    section: "Load",
    eyebrow: "Step 14",
    title: "Start new load",
    narration:
      "To evaluate freight, the user starts a load calculation. The app walks through the load in sections instead of forcing everything into one confusing screen.",
  },
  {
    key: "lane",
    section: "Load",
    eyebrow: "Step 15",
    title: "Lane details",
    narration:
      "Lane details give context to the load. Eventually, this can support lane history, facility behavior, region analysis, and better comparison.",
  },
  {
    key: "miles",
    section: "Load",
    eyebrow: "Step 16",
    title: "Miles and deadhead",
    narration:
      "Deadhead matters because unpaid miles still burn fuel, time, maintenance, and driver capacity. Gross revenue can look good until deadhead is included.",
  },
  {
    key: "revenue",
    section: "Load",
    eyebrow: "Step 17",
    title: "Revenue inputs",
    narration:
      "This step captures all revenue, not just linehaul. Accessorials can change whether a load is worth running.",
  },
  {
    key: "tripCosts",
    section: "Load",
    eyebrow: "Step 18",
    title: "Trip costs",
    narration:
      "Trip costs are the expenses attached to this specific load. Users can estimate before accepting and update after the load is completed.",
  },
  {
    key: "time",
    section: "Load",
    eyebrow: "Step 19",
    title: "Time assumptions",
    narration:
      "Profit per hour matters because a load can look profitable per mile but still consume too much clock time.",
  },
  {
    key: "calculationReview",
    section: "Load",
    eyebrow: "Step 20",
    title: "Calculation review",
    narration:
      "This is where LoadIQ converts the load into a decision. The goal is not just revenue. The goal is profitable revenue after realistic costs.",
  },
  {
    key: "recommendation",
    section: "Load",
    eyebrow: "Step 21",
    title: "Recommendation card",
    narration:
      "The recommendation card helps the user understand why the load works or fails. It should educate, not just display numbers.",
  },
  {
    key: "saveDecision",
    section: "History",
    eyebrow: "Step 22",
    title: "Save load decision",
    narration:
      "Users can save loads for comparison, later review, or historical tracking. In demo mode, this is stored locally only.",
  },
  {
    key: "ranLoad",
    section: "History",
    eyebrow: "Step 23",
    title: "Ran load verification",
    narration:
      "This protects data quality. A quoted load and a completed load are not the same thing.",
  },
  {
    key: "savedLoads",
    section: "History",
    eyebrow: "Step 24",
    title: "Saved loads list",
    narration:
      "Saved loads let users compare decisions over time instead of relying on memory or emotion.",
  },
  {
    key: "compare",
    section: "History",
    eyebrow: "Step 25",
    title: "Compare loads",
    narration:
      "Comparison reveals the hidden winner. A higher-paying load is not always the more profitable load.",
  },
  {
    key: "postTrip",
    section: "History",
    eyebrow: "Step 26",
    title: "Post-trip cost update",
    narration:
      "After the load, users can correct estimates with real costs. This turns the app from a calculator into an operating intelligence tool.",
  },
  {
    key: "insights",
    section: "Finish",
    eyebrow: "Step 27",
    title: "Insights page",
    narration:
      "LoadIQ should teach the operator while they use it. The app becomes more valuable when users understand why the numbers matter.",
  },
  {
    key: "settings",
    section: "Finish",
    eyebrow: "Step 28",
    title: "Settings and profile update",
    narration:
      "As costs change, users should update their profile. Profitability estimates only work when the operating profile stays current.",
  },
  {
    key: "final",
    section: "Finish",
    eyebrow: "Step 29",
    title: "Final demo CTA",
    narration:
      "Karpilo LoadIQ is built to help operators understand freight estimates, review margin pressure, and make independent decisions with clearer operating numbers.",
  },
];
