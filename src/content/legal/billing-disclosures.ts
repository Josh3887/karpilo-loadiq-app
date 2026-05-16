import { BILLING_EMAIL } from "@/config/billing";
import { LOADIQ_EMAILS } from "@/config/loadiq";

export type LegalLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  links?: LegalLink[];
};

export const LEGAL_CONTACT_EMAIL = LOADIQ_EMAILS.corporate;
export const BILLING_CONTACT_EMAIL = BILLING_EMAIL;

export const APPLE_BILLING_LINKS: LegalLink[] = [
  {
    label: "Manage Apple subscriptions",
    href: "https://apps.apple.com/account/subscriptions",
    external: true,
  },
  {
    label: "Apple billing support",
    href: "https://support.apple.com/billing",
    external: true,
  },
  {
    label: "Request an Apple refund",
    href: "https://reportaproblem.apple.com/",
    external: true,
  },
];

export const GOOGLE_PLAY_BILLING_LINKS: LegalLink[] = [
  {
    label: "Manage Google Play subscriptions",
    href: "https://play.google.com/store/account/subscriptions",
    external: true,
  },
  {
    label: "Google Play refund support",
    href: "https://support.google.com/googleplay/answer/2479637",
    external: true,
  },
];

export const STRIPE_BILLING_DISCLOSURES: LegalSection[] = [
  {
    id: "direct-billing",
    title: "Direct Website and Stripe Billing",
    paragraphs: [
      "Direct website subscriptions for Karpilo LoadIQ may be processed through Stripe or another authorized payment provider. When a user starts a paid plan, the user authorizes recurring billing for the selected billing interval until the subscription is canceled or otherwise ends.",
      "Subscription cancellation stops future renewal charges. Unless otherwise stated at checkout or required by law, cancellation does not automatically create a refund for the current billing period.",
    ],
    bullets: [
      "Monthly plans renew monthly until canceled.",
      "Annual plans renew annually until canceled.",
      "Where supported by the payment provider and checkout flow, paid subscription tiers may include a 7-day free trial before the first recurring charge.",
      "Plan access generally continues through the paid billing period after cancellation.",
      "Failed payments may result in retry attempts, account notices, plan downgrade, feature restriction, or suspension.",
      "Any Stripe customer portal, invoice, or checkout experience should display the applicable plan price, interval, renewal behavior, and cancellation path before purchase.",
    ],
  },
  {
    id: "auto-renewal",
    title: "Recurring Billing and Auto-Renewal",
    paragraphs: [
      "Paid subscriptions automatically renew unless canceled before the renewal date through the applicable billing platform. Users are responsible for reviewing renewal dates, receipts, payment method notices, and cancellation confirmations.",
      "Karpilo Endeavor Technologies LLC may update prices, plan names, feature packaging, or billing terms for future periods where permitted, with notice where required by law or platform rules.",
    ],
  },
  {
    id: "cancellation",
    title: "Cancellation Effects",
    paragraphs: [
      "After cancellation, access to paid features may continue until the end of the current paid period unless the account is terminated for policy violations, fraud, security risk, or chargeback abuse.",
      "Saved operational data may remain available according to the Privacy Policy, Terms of Service, and technical retention settings. Users should export or preserve records they need before deleting an account.",
    ],
  },
];

export const PLATFORM_BILLING_DISCLOSURES: LegalSection[] = [
  {
    id: "apple",
    title: "Apple App Store Purchases",
    paragraphs: [
      "Subscriptions purchased through the Apple App Store are governed by Apple's billing, subscription management, and refund systems. Where Apple processes the payment, users may need to manage cancellation, refunds, purchase history, and billing disputes directly through Apple.",
      "Karpilo Endeavor Technologies LLC cannot directly issue refunds for Apple-controlled in-app purchases where Apple is the merchant of record or payment processor. Apple determines eligibility and processing for Apple-managed refunds.",
    ],
    links: APPLE_BILLING_LINKS,
  },
  {
    id: "google-play",
    title: "Google Play Purchases",
    paragraphs: [
      "Subscriptions purchased through Google Play are governed by Google's billing, subscription management, and refund systems. Where Google processes the payment, users may need to manage cancellation, refunds, purchase history, and billing disputes directly through Google Play.",
      "Karpilo Endeavor Technologies LLC cannot directly issue refunds for Google-controlled purchases where Google is the merchant of record or payment processor. Google determines eligibility and processing for Google-managed refunds.",
    ],
    links: GOOGLE_PLAY_BILLING_LINKS,
  },
];

export const CHECKOUT_ACKNOWLEDGEMENT_TEXT =
  "I agree to the Terms, Privacy Policy, Refund Policy, and Subscription Terms, understand eligible paid tiers include a 7-day free trial where supported by the payment provider, and understand paid subscriptions renew unless canceled through the applicable billing platform before the trial or billing period ends.";
