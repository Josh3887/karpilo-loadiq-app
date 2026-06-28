import { LOADIQ_BRAND, LOADIQ_BRAND_COLORS, LOADIQ_URLS } from "@/config/loadiq";

export const BRAND = {
  companyName: "Karpilo Endeavor Technologies",
  legalCompanyName: "Karpilo Endeavor Technologies LLC",
  productName: LOADIQ_BRAND.name,
  shortName: LOADIQ_BRAND.shortName,
  tagline: LOADIQ_BRAND.tagline,
  description: LOADIQ_BRAND.description,
  urls: LOADIQ_URLS,
  colors: LOADIQ_BRAND_COLORS,
  appIcon: "/brand/loadiq-app-icon.png",
  cardImage: "/brand/loadiq-card.jpeg",
  logo: "/brand/loadiq-logo.png",
  assets: {
    appIcon: "/brand/loadiq-app-icon.png",
    logo: "/brand/loadiq-logo.png",
    icon: "/brand/loadiq-icon.png",
    wordmark: "/brand/loadiq-wordmark.png",
    cardImage: "/brand/loadiq-card.jpeg",
    dashboardBackground: "/brand/loadiq-dashboard-bg.png",
  },
  alt: {
    appIcon: `${LOADIQ_BRAND.name} app icon`,
    logo: `${LOADIQ_BRAND.name} logo`,
    icon: `${LOADIQ_BRAND.name} icon`,
    wordmark: `${LOADIQ_BRAND.name} wordmark`,
    cardImage: `${LOADIQ_BRAND.name} brand card`,
    dashboardBackground: `${LOADIQ_BRAND.name} dashboard background`,
  },
} as const;

export type BrandAssetKey = keyof typeof BRAND.assets;
