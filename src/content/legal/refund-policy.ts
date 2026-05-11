import {
  LEGAL_CONTACT_EMAIL,
  PLATFORM_BILLING_DISCLOSURES,
  STRIPE_BILLING_DISCLOSURES,
  type LegalSection,
} from "@/content/legal/billing-disclosures";

export const REFUND_POLICY_LAST_UPDATED = "May 11, 2026";

export const REFUND_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Refund Policy Overview",
    paragraphs: [
      "Karpilo LoadIQ is a digital subscription service that provides software access, profitability estimates, saved-load tools, profile-driven calculations, and operational intelligence features. This Refund Policy explains how refunds are handled for direct website billing, Stripe-powered subscriptions, Apple App Store purchases, Google Play purchases, pilot access, promotional pricing, and trial offers.",
      "This policy is intended to be fair, transparent, and operationally practical. It does not limit rights that may be required by applicable law or by Apple, Google, Stripe, card networks, or other payment providers.",
    ],
  },
  ...PLATFORM_BILLING_DISCLOSURES,
  ...STRIPE_BILLING_DISCLOSURES,
  {
    id: "eligibility",
    title: "Limited Refund Eligibility",
    paragraphs: [
      "For direct website or Stripe-billed purchases, Karpilo Endeavor Technologies LLC may review refund requests on a case-by-case basis. Approval is discretionary where permitted by law and depends on payment status, account activity, usage, technical history, platform rules, and abuse indicators.",
      "Users should contact support as soon as possible after a billing issue occurs. Refund requests should include the account email, invoice or receipt information, billing platform, purchase date, and a clear description of the issue.",
    ],
    bullets: [
      "Duplicate billing may qualify for correction or refund review.",
      "Verified technical failures that materially prevent access may qualify for review.",
      "Accidental purchases may qualify for review when reported promptly and with limited usage.",
      "Unauthorized transactions should be reported promptly and may require verification through the payment provider or card issuer.",
      "Platform processing errors may need to be resolved through Apple, Google, Stripe, or the relevant payment provider.",
    ],
  },
  {
    id: "no-refund-conditions",
    title: "Circumstances Where Refunds Are Generally Not Available",
    paragraphs: [
      "Because LoadIQ provides immediate digital software access, refunds are generally not available after meaningful use of paid features, unless required by law or approved as an exception. This approach helps protect the service from refund abuse while preserving reasonable support discretion.",
      "The following conditions may make a refund request ineligible or less likely to be approved.",
    ],
    bullets: [
      "Partial subscription usage during an active billing period.",
      "Failure to cancel before a renewal charge.",
      "User dissatisfaction after extensive use of paid features.",
      "Promotional, founder, or pilot pricing after activation and access delivery.",
      "Repeated refund requests, trial cycling, or refund-pattern abuse.",
      "Policy violations, misuse, fraudulent activity, chargeback abuse, or account termination for Terms of Service violations.",
      "Loss of access caused by user-side device, browser, network, credential, or payment method issues after reasonable support guidance is provided.",
      "Purchases controlled by Apple or Google where those platforms require users to request refunds through their own systems.",
    ],
  },
  {
    id: "pilot-promotional-pricing",
    title: "Pilot, Founder, and Promotional Pricing",
    paragraphs: [
      "Pilot Operator Access, Founding Operator Access, invite codes, coupons, trial offers, and other promotional plans may have special eligibility conditions. Promotional pricing is not guaranteed to remain available if a subscription is canceled, deleted, transferred, disputed, or allowed to lapse.",
      "Pilot pricing may remain locked only while the qualifying subscription remains active and in good standing. If the account is canceled, deleted, transferred, or terminated, the promotional rate may be forfeited and may not be restorable.",
    ],
  },
  {
    id: "free-trials",
    title: "Free Trials and Trial Conversions",
    paragraphs: [
      "If LoadIQ offers a free trial, the checkout or platform screen should disclose the trial duration, conversion date, recurring price, billing interval, and cancellation method before the user is charged.",
      "Unless the checkout or platform terms state otherwise, a trial converts to a paid subscription at the end of the trial period if not canceled through the applicable billing platform before conversion.",
    ],
  },
  {
    id: "chargebacks",
    title: "Billing Disputes and Chargebacks",
    paragraphs: [
      "Users are encouraged to contact support before initiating a payment dispute so the issue can be reviewed quickly and accurately. Karpilo Endeavor Technologies LLC may cooperate with payment processors, card networks, Apple, Google, Stripe, and financial institutions during dispute investigations.",
      "Accounts associated with suspected fraud, abusive refund behavior, repeated payment disputes, unauthorized resale, or payment misuse may be restricted, suspended, or terminated where permitted by law and the Terms of Service.",
    ],
  },
  {
    id: "support",
    title: "How to Request Help",
    paragraphs: [
      `For direct website billing questions, refund review, duplicate billing, or technical access issues, contact ${LEGAL_CONTACT_EMAIL}. Apple App Store and Google Play billing issues may need to be handled through Apple or Google directly when those platforms process the payment.`,
    ],
  },
];
