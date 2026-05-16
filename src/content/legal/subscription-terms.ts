import {
  PLATFORM_BILLING_DISCLOSURES,
  STRIPE_BILLING_DISCLOSURES,
  type LegalSection,
} from "@/content/legal/billing-disclosures";

export const SUBSCRIPTION_TERMS_LAST_UPDATED = "May 11, 2026";

export const SUBSCRIPTION_TERMS_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Subscription Terms Overview",
    paragraphs: [
      "These Subscription Terms describe recurring billing, plan access, cancellation, promotional pricing, payment failure, and platform-specific purchase handling for Karpilo LoadIQ.",
      "Different billing platforms may control different parts of the purchase relationship. Apple, Google, Stripe, card networks, and other providers may apply their own rules, receipts, refund paths, tax handling, payment retries, and cancellation tools.",
    ],
  },
  ...STRIPE_BILLING_DISCLOSURES,
  ...PLATFORM_BILLING_DISCLOSURES,
  {
    id: "plan-access",
    title: "Plan Access and Feature Gates",
    paragraphs: [
      "Gold, Platinum, Pilot, Legacy Launch, promotional, and future plan tiers may include different feature limits, saved-load access, exports, templates, comparisons, support paths, or usage limits. Features may be adjusted for future billing periods as the product evolves.",
      "Subscription access is tied to the account and billing platform used at purchase. Promotional access may not be transferable between accounts, platforms, businesses, or app stores.",
    ],
  },
  {
    id: "restore-purchases",
    title: "Restore Purchases and Cross-Platform Access",
    paragraphs: [
      "For future native Apple App Store and Google Play builds, users should be able to restore eligible purchases using the same Apple ID or Google account used for purchase, subject to platform rules and app implementation.",
      "For the web MVP and Stripe billing, users restore access by signing in with the same Karpilo LoadIQ account. If a paid entitlement is missing after purchase, contact support with the account email and receipt or invoice details.",
    ],
  },
  {
    id: "cancellation-instructions",
    title: "How to Cancel or Manage Subscriptions",
    paragraphs: [
      "Stripe-billed website subscriptions can be managed through the Stripe customer portal when available in the Billing or Legal Hub screens.",
      "Apple App Store subscriptions must be managed through Apple account subscriptions. Google Play subscriptions must be managed through Google Play subscriptions. Uninstalling the app does not automatically cancel an Apple or Google Play subscription.",
    ],
  },
  {
    id: "failed-payments",
    title: "Failed Payments and Suspension",
    paragraphs: [
      "If a recurring payment fails, the payment provider may retry collection and send notices. Karpilo LoadIQ may temporarily restrict paid features, downgrade access, suspend service, or cancel the subscription after unresolved payment failure.",
      "Users are responsible for keeping payment methods, account email, and platform billing details current.",
    ],
  },
  {
    id: "account-cancellation",
    title: "Account Cancellation Guidance",
    paragraphs: [
      "Canceling a subscription stops future billing through the applicable billing platform. It does not necessarily delete the account, saved load records, support history, or profile data. Account deletion and subscription cancellation may be separate actions.",
      "Users should preserve any business records they need before deleting an account. Data retention and deletion are handled according to the Privacy Policy, Terms of Service, and operational requirements.",
    ],
  },
  {
    id: "future-products",
    title: "Future Products and Enterprise Plans",
    paragraphs: [
      "These terms are designed to support future Karpilo products, Karpilo FleetOS subscriptions, team accounts, enterprise licensing, API subscriptions, usage-based plans, annual contracts, and B2B agreements. Enterprise or separately signed agreements may include different billing, refund, cancellation, data, or service terms.",
    ],
  },
];
