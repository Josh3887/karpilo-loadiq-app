export const LOADIQ_BRAND = {
  name: "Karpilo LoadIQ",
  shortName: "K-LIQ",
  tagline: "Freight profitability intelligence built by the mile.",
  description:
    "A tactical load profitability decision engine for owner-operators and small fleets.",
} as const;

export const LOADIQ_URLS = {
  website: "https://www.karpiloloadiq.com",
  app: "https://app.karpiloloadiq.com",
} as const;

export const LOADIQ_EMAILS = {
  support: "support@karpiloloadiq.com",
  feedback: "Josh.karpilo@karpiloendeavortechnologies.com",
} as const;

export const LOADIQ_LAUNCH = {
  pilot: {
    key: "pilot50",
    label: "Pre-Launch Pilot",
    startsAt: "2026-05-13T08:00:00-05:00",
    durationDays: 30,
    slotLimit: 50,
  },
  launchPromotion: {
    key: "launch500",
    label: "Launch Promotion",
    durationDays: 60,
    slotLimit: 500,
  },
} as const;

export const LOADIQ_APP_STORES = {
  appleAppStoreUrl: null,
  googlePlayUrl: null,
} as const;

export const LOADIQ_BRAND_COLORS = {
  background: "#060B14",
  panel: "#0B1220",
  electricBlue: "#38BDF8",
  telemetryRed: "#EF4444",
  metallicSilver: "#CBD5E1",
  offWhite: "#F8FAFC",
} as const;
