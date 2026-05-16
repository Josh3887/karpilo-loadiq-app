// Portable website marketing config. Safe to copy into the separate Karpilo LoadIQ website repo.

export type ProductFeature = {
  title: string;
  description: string;
};

export type ProductFaq = {
  question: string;
  answer: string;
};

export type ProductWebsiteSection = {
  eyebrow: string;
  title: string;
  description: string;
};

export const PRODUCT_HERO = {
  eyebrow: "Karpilo LoadIQ",
  title: "Freight profitability intelligence built by the mile.",
  description:
    "A mobile-first command center for owner operators and independent contractors who want to pressure-test freight before accepting it.",
} satisfies ProductWebsiteSection;

export const PRODUCT_FEATURES = [
  {
    title: "Freight profitability analysis",
    description:
      "Estimate gross revenue, operating cost, net profit, break-even RPM, and margin before accepting freight.",
  },
  {
    title: "True RPM and deadhead exposure",
    description:
      "Model loaded miles and deadhead together so unpaid repositioning miles are visible before dispatch.",
  },
  {
    title: "EIA diesel estimate auto-fill",
    description:
      "Use a server-side EIA ULSD market reference when configured and available, with manual override always available.",
  },
  {
    title: "Settings-driven profitability targets",
    description:
      "Let driver profile, income goals, overhead, MPG, reserves, and pay templates drive the calculator defaults.",
  },
  {
    title: "Saved load history",
    description:
      "Save estimates, duplicate prior loads, create lane templates, and revisit freight decisions on supported plans.",
  },
  {
    title: "Post-trip actual comparison",
    description:
      "Enter actual fuel and trip expenses after completion to compare estimated vs actual profitability.",
  },
  {
    title: "Simple pay templates",
    description:
      "Support percentage pay, nested percentage splits, CPM, and flat-rate workflows without cluttering the calculator.",
  },
  {
    title: "Mobile-first command center",
    description:
      "A dark operational interface designed for fast checks from the cab, desk, or dispatch call.",
  },
] satisfies ProductFeature[];

export const PRODUCT_FAQS = [
  {
    question: "Does Karpilo LoadIQ guarantee profitability?",
    answer:
      "No. Karpilo LoadIQ is an informational forecasting tool. It depends on user inputs, assumptions, market conditions, fuel prices, route variance, and real operating costs.",
  },
  {
    question: "Can I override the EIA fuel estimate?",
    answer:
      "Yes. EIA diesel data, when configured, is treated as a market reference only. Drivers can enter their own expected or actual purchased fuel price.",
  },
  {
    question: "Who is Karpilo LoadIQ built for?",
    answer:
      "Owner operators, lease operators, independent contractors, and small trucking operations that need fast freight profitability checks.",
  },
] satisfies ProductFaq[];

export const PRODUCT_DISCLAIMER_SNIPPET =
  "Karpilo LoadIQ outputs are estimates based on user inputs, assumptions, and available data. They do not guarantee profit, freight availability, fuel pricing, or business outcomes.";
