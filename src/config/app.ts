import { BRAND } from "@/config/brand";

export const APP_CONFIG = {
  name: BRAND.productName,
  shortName: BRAND.shortName,
  tagline: BRAND.tagline,
  description: BRAND.description,
  routes: {
    home: "/",
    dashboard: "/dashboard",
    login: "/auth/login",
    register: "/auth/register",
  },
} as const;

export const BRAND_COLORS = BRAND.colors;

export const APP_FEATURE_FLAGS = {
  showAppCountdown: process.env.NEXT_PUBLIC_SHOW_APP_COUNTDOWN === "true",
} as const;
