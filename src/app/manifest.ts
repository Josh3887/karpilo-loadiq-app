import type { MetadataRoute } from "next";

import { BRAND } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.productName,
    short_name: BRAND.shortName,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.colors.background,
    theme_color: BRAND.colors.background,
    icons: [
      {
        src: BRAND.assets.appIcon,
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: BRAND.assets.appIcon,
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
