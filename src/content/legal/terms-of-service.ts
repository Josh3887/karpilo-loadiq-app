import {
  LEGAL_CONTACT_EMAIL,
  type LegalSection,
} from "@/content/legal/billing-disclosures";

export const TERMS_LAST_UPDATED = "May 11, 2026";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Terms Overview",
    paragraphs: [
      "These Terms govern use of Karpilo LoadIQ, an operational trucking profitability and decision-support application operated by Karpilo Endeavor Technologies LLC.",
      "By creating an account, using the app, accepting legal acknowledgements, starting a subscription, or saving operational data, users agree to use Karpilo LoadIQ responsibly and according to these Terms.",
    ],
  },
  {
    id: "decision-support",
    title: "Operational Estimation Tool Only",
    paragraphs: [
      "Karpilo LoadIQ provides estimates, calculations, comparisons, warnings, and operational intelligence based on user inputs, configured profile assumptions, available reference data, and app logic.",
      "Karpilo LoadIQ does not guarantee profitability, freight availability, revenue, margin, settlement accuracy, fuel cost, lane performance, route cost, business success, or operational outcome.",
    ],
  },
  {
    id: "no-advice",
    title: "No Financial, Tax, Legal, Dispatch, or Safety Advice",
    paragraphs: [
      "Karpilo LoadIQ is not financial advice, legal advice, accounting advice, tax advice, dispatch advice, regulatory advice, investment advice, insurance advice, safety advice, or a substitute for professional judgment.",
      "Users remain solely responsible for verifying rates, contracts, routes, fuel, tolls, dispatch terms, safety obligations, tax treatment, compliance obligations, settlement statements, and business decisions.",
    ],
  },
  {
    id: "user-responsibility",
    title: "User Responsibility for Inputs and Decisions",
    paragraphs: [
      "Outputs depend on the accuracy and completeness of user-entered information. Incorrect mileage, pay terms, overhead, fuel prices, costs, reimbursement assumptions, or profile settings can produce inaccurate results.",
      "Users should independently verify all freight decisions before accepting, rejecting, dispatching, or completing any load.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    paragraphs: [
      "Users may not misuse Karpilo LoadIQ, interfere with service operations, attempt unauthorized access, scrape or reverse engineer protected systems, resell access without permission, upload unlawful content, submit fraudulent billing information, abuse refund systems, or use the app to harm others.",
      "Karpilo Endeavor Technologies LLC may restrict, suspend, or terminate access for suspected fraud, security risk, abusive behavior, chargeback abuse, policy violations, or conduct that threatens the service or other users.",
    ],
  },
  {
    id: "subscriptions",
    title: "Subscriptions and Paid Access",
    paragraphs: [
      "Paid features may be provided through direct website billing, Stripe, Apple App Store, Google Play, pilot programs, founder access, promotional access, or future billing platforms.",
      "Subscription pricing, renewal timing, cancellation path, refund handling, and platform-specific billing rules are disclosed in the Subscription Terms and Refund Policy.",
    ],
    links: [
      { label: "Subscription Terms", href: "/subscription-terms" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
  {
    id: "data-service",
    title: "External Data and Service Availability",
    paragraphs: [
      "Karpilo LoadIQ may use public or third-party data sources for fuel references, routing, weather, mapping, tolling, compliance context, or future operational intelligence. These sources may be delayed, incomplete, revised, unavailable, or inaccurate.",
      "Karpilo LoadIQ may experience downtime, degraded performance, maintenance windows, third-party outages, network issues, API failures, deployment errors, or platform restrictions. No uninterrupted availability is promised.",
    ],
  },
  {
    id: "ip",
    title: "Intellectual Property and Brand Protection",
    paragraphs: [
      "Karpilo LoadIQ, LoadIQ, product names, interface design, workflows, code, copy, calculations, visual systems, trademarks, trade dress, and related intellectual property are owned by or licensed to Karpilo Endeavor Technologies LLC.",
      "Users may not copy, clone, resell, misrepresent, decompile, or exploit Karpilo LoadIQ intellectual property except as permitted by law or a written agreement.",
    ],
  },
  {
    id: "no-warranty",
    title: "No Warranties",
    paragraphs: [
      "Karpilo LoadIQ is provided on an as-is and availability-dependent basis. To the fullest extent permitted by law, Karpilo Endeavor Technologies LLC disclaims warranties of accuracy, reliability, fitness for a particular purpose, merchantability, uninterrupted availability, and profitability results.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, Karpilo Endeavor Technologies LLC, Karpilo LoadIQ, affiliates, owners, developers, contractors, service providers, and licensors are not liable for lost profit, lost revenue, lost freight opportunities, downtime, business interruption, operational losses, indirect damages, consequential damages, incidental damages, special damages, fuel pricing inaccuracies, route inaccuracies, third-party API failures, market movement, user-entered data errors, or decisions made in reliance on Karpilo LoadIQ outputs.",
    ],
  },
  {
    id: "contact",
    title: "Support and Legal Contact",
    paragraphs: [
      `Questions about these Terms can be sent to ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
];
