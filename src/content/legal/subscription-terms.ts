import {
  PLATFORM_BILLING_DISCLOSURES,
  STRIPE_BILLING_DISCLOSURES,
  type LegalSection,
} from "@/content/legal/billing-disclosures";

export const SUBSCRIPTION_TERMS_LAST_UPDATED = "May 17, 2026";

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
      "Karpilo LoadIQ subscription pricing follows the public launch architecture: Founding 50 Pilot Access is $14.99 per month or $129.99 per year, Launch 500 Access is $19.99 per month or $149.99 per year, and Standard Public Access is $24.99 per month or $189.99 per year.",
      "Pilot and Legacy Launch are protected rollout or promotional access programs within their purchased entitlement scope. They are not commercial tier names. Checkout availability, billing provider configuration, and entitlement enforcement may roll out separately.",
      "Platinum, Pro, FleetOS, team, API, usage-based, enterprise, or separately licensed offerings are reserved future or separate product structures unless a checkout screen or signed agreement says otherwise.",
      "Any displayed future surcharge, reserved tier, or modeled-truck pricing is commercial pricing communication only until supported by an approved billing provider configuration.",
      "Subscription access is tied to the account and billing platform used at purchase. Promotional access may not be transferable between accounts, platforms, businesses, or app stores.",
      "Feature availability may evolve for future billing periods, future subscribers, future product modules, enterprise licensing, or separately licensed offerings where permitted by law and platform rules.",
    ],
  },
  {
    id: "launch-payment-gating",
    title: "Launch Pricing and Checkout Validation",
    paragraphs: [
      "Founding 50 and Launch 500 checkout depends on server-authoritative launch state, slot availability, assigned eligibility, and payment-provider configuration. Frontend countdowns, displayed slot counts, local browser state, query strings, or copied URLs do not grant discounted pricing or paid access.",
      "If launch-state validation, slot validation, payment synchronization, webhook reconciliation, or active phase verification cannot be proven, Karpilo LoadIQ may place the account or flow into waitlist-only mode. Waitlist-only mode does not create checkout sessions, activate subscriptions, assign grandfathered pricing, or reserve paid pilot slots.",
    ],
  },
  {
    id: "pilot-launch-scope",
    title: "Pilot and Legacy Launch Entitlement Scope",
    paragraphs: [
      "Pilot and Legacy Launch lifetime or grandfathered access applies to the qualifying account, purchased entitlement scope, applicable subscription class, and current Karpilo LoadIQ product family features made generally available for that entitlement class.",
      "Pilot and Legacy Launch access does not grant ownership of Karpilo LoadIQ, unlimited future platform access, automatic access to all future enterprise products, Karpilo FleetOS systems, fleet-management modules, Pro/FleetOS capabilities, API products, team accounts, or separately licensed future offerings.",
      "Karpilo Endeavor Technologies LLC reserves the right to create future pricing, future enterprise licensing, future feature segmentation, future operational modules, and separately licensed products without converting every legacy entitlement into those future offerings.",
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
      "These terms are designed to support future Karpilo products, Karpilo FleetOS subscriptions, team accounts, enterprise licensing, API subscriptions, usage-based plans, annual contracts, and B2B agreements. Enterprise, Pro, FleetOS, API, team, or separately signed agreements may include different billing, refund, cancellation, data, access, and service terms.",
    ],
  },
];
