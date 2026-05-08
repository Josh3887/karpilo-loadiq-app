export const APP_CONFIG = {
  name: "Karpilo LoadIQ",
  shortName: "K-LIQ",
  tagline: "Freight profitability intelligence built by the mile.",
  description:
    "A tactical load profitability decision engine for owner-operators and small fleets.",
  routes: {
    home: "/",
    dashboard: "/dashboard",
    login: "/auth/login",
    register: "/auth/register",
  },
} as const;

export const BRAND_COLORS = {
  background: "#060B14",
  panel: "#0B1220",
  electricBlue: "#38BDF8",
  telemetryRed: "#EF4444",
  metallicSilver: "#CBD5E1",
  offWhite: "#F8FAFC",
} as const;
