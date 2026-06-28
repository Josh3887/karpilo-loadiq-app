import { EMAIL_ADDRESSES } from "@/config/email";

export const LOADIQ_BRAND = {
  name: "Karpilo LoadIQ",
  shortName: "K-LIQ",
  tagline: "Freight profitability estimates built by the mile.",
  description:
    "A transportation profitability calculator and operational estimation platform for owner-operators and small fleets.",
} as const;

export const LOADIQ_URLS = {
  website: "https://karpilo-liq.com",
  app: "https://app.karpilo-liq.com",
} as const;

export const LOADIQ_EMAILS = {
  noReply: EMAIL_ADDRESSES.noReply,
  support: EMAIL_ADDRESSES.support,
  newsletter: EMAIL_ADDRESSES.newsletter,
  updates: EMAIL_ADDRESSES.newsletter,
  billing: EMAIL_ADDRESSES.billing,
  founderFeedback: EMAIL_ADDRESSES.executive,
  executive: EMAIL_ADDRESSES.executive,
  corporate: EMAIL_ADDRESSES.executive,
  feedback: EMAIL_ADDRESSES.support,
  legal: EMAIL_ADDRESSES.support,
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
