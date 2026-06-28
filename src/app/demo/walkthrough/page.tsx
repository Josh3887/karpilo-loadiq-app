import type { Metadata } from "next";

import { DemoWalkthrough } from "@/components/demo/DemoWalkthrough";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  title: `Demo Walkthrough | ${BRAND.productName}`,
  description:
    `A safe simulated walkthrough of ${BRAND.productName} for website education and screen recording.`,
  openGraph: {
    images: [
      {
        url: BRAND.assets.cardImage,
        alt: BRAND.alt.cardImage,
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
};

type DemoWalkthroughPageProps = {
  searchParams: Promise<{
    recording?: string;
  }>;
};

export default async function DemoWalkthroughPage({
  searchParams,
}: DemoWalkthroughPageProps) {
  const { recording } = await searchParams;

  return <DemoWalkthrough recording={recording === "true"} />;
}
