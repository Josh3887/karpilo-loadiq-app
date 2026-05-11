import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.karpiloloadiq.com"),
  title: {
    default: "Karpilo LoadIQ",
    template: "%s | Karpilo LoadIQ",
  },
  description:
    "Freight profitability intelligence for owner-operators and independent contractors.",
  openGraph: {
    title: "Karpilo LoadIQ",
    description:
      "Freight profitability intelligence for owner-operators and independent contractors.",
    url: "https://www.karpiloloadiq.com",
    siteName: "Karpilo LoadIQ",
    type: "website",
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
