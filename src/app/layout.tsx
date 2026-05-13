import type { Metadata } from "next";

import { BRAND } from "@/config/brand";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.urls.app),
  title: {
    default: BRAND.productName,
    template: `%s | ${BRAND.productName}`,
  },
  description: BRAND.description,
  applicationName: BRAND.productName,
  appleWebApp: {
    capable: true,
    title: BRAND.productName,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: BRAND.assets.appIcon, type: "image/png" }],
    apple: [{ url: BRAND.assets.appIcon, type: "image/png" }],
    shortcut: [BRAND.assets.appIcon],
  },
  openGraph: {
    title: BRAND.productName,
    description: BRAND.description,
    url: BRAND.urls.app,
    siteName: BRAND.productName,
    type: "website",
    images: [
      {
        url: BRAND.assets.cardImage,
        alt: BRAND.alt.cardImage,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
