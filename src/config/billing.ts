import { LOADIQ_EMAILS } from "@/config/loadiq";

export const BILLING_EMAIL =
  process.env.NEXT_PUBLIC_BILLING_EMAIL ?? LOADIQ_EMAILS.billing;

export const BILLING_MANAGEMENT_URLS = {
  apple: "https://apps.apple.com/account/subscriptions",
  google: "https://play.google.com/store/account/subscriptions",
} as const;

export type PaymentRailManagementUrl =
  (typeof BILLING_MANAGEMENT_URLS)[keyof typeof BILLING_MANAGEMENT_URLS];
