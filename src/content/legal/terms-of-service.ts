import {
  LEGAL_CONTACT_EMAIL,
  type LegalSection,
} from "@/content/legal/billing-disclosures";

export const TERMS_LAST_UPDATED = "May 17, 2026";

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Terms Overview",
    paragraphs: [
      "These Terms govern use of Karpilo LoadIQ, a transportation profitability calculator, operational estimation platform, analytics and insight tool, and educational operational awareness platform operated by Karpilo Endeavor Technologies LLC.",
      "By creating an account, using the app, accepting legal acknowledgements, starting a subscription, or saving operational data, users agree to use Karpilo LoadIQ responsibly and according to these Terms.",
    ],
  },
  {
    id: "decision-support",
    title: "Operational Estimation Platform Only",
    paragraphs: [
      "Karpilo LoadIQ provides informational estimates, calculations, comparisons, warnings, educational guidance, and analytical operational insights based on user inputs, configured profile assumptions, available reference data, and app logic.",
      "The platform is intended for informational, educational, analytical, and estimation purposes only and does not replace independent business judgment, professional accounting, legal advice, regulatory guidance, safety review, or operational decision-making.",
      "Karpilo LoadIQ does not guarantee profitability, freight availability, revenue, margin, settlement accuracy, fuel cost, lane performance, route cost, business success, or operational outcome.",
    ],
  },
  {
    id: "platform-classification",
    title: "No Transportation Authority or Control",
    paragraphs: [
      "Karpilo LoadIQ is not dispatch software, freight brokerage software, routing authority software, compliance management software, fleet command software, motor carrier supervision software, or a regulated transportation authority system.",
      "Karpilo LoadIQ does not dispatch freight, direct drivers, supervise carriers, control equipment, certify route legality, enforce compliance, approve brokerage terms, or assume responsibility for transportation operations.",
    ],
  },
  {
    id: "no-advice",
    title: "No Financial, Tax, Legal, Dispatch, or Safety Advice",
    paragraphs: [
      "Karpilo LoadIQ is not financial advice, legal advice, accounting advice, tax advice, dispatch advice, regulatory advice, investment advice, insurance advice, safety advice, or a substitute for professional judgment.",
      "Users remain solely responsible for dispatch decisions, route selection, hours-of-service compliance, FMCSA compliance, weight compliance, tax filings, IFTA filings, maintenance decisions, safety decisions, operational decisions, cargo securement, weather decisions, toll decisions, bridge restrictions, vehicle legality, settlement review, and business profitability.",
    ],
  },
  {
    id: "user-responsibility",
    title: "User Responsibility for Inputs and Decisions",
    paragraphs: [
      "Outputs depend on the accuracy and completeness of user-entered information. Incorrect mileage, pay terms, overhead, fuel prices, costs, reimbursement assumptions, or profile settings can produce inaccurate results.",
      "Users acknowledge that all calculations are dependent on user-supplied inputs, assumptions, market conditions, and operational variables that may materially alter real-world outcomes.",
      "Actual operational conditions including rates, weather, fuel pricing, traffic, detention, maintenance events, compliance events, driver behavior, market volatility, and third-party conditions materially affect real-world outcomes.",
      "Users should independently verify all freight, route, compliance, safety, tax, accounting, and business decisions before accepting, rejecting, dispatching, routing, or completing any load.",
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
      "Karpilo LoadIQ may use public or third-party data sources for fuel references, mapping, weather, tolling, route context, compliance-related reference context, or future informational analysis. These sources may be delayed, incomplete, revised, unavailable, or inaccurate.",
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
    id: "force-majeure",
    title: "Force Majeure",
    paragraphs: [
      "Karpilo Endeavor Technologies LLC is not responsible for delay, interruption, or failure caused by events outside reasonable control, including internet outages, hosting failures, payment processor outages, app-store disruptions, cyber incidents, labor disruptions, natural disasters, severe weather, government action, transportation market disruption, third-party API failure, or other force majeure events.",
    ],
  },
  {
    id: "dispute-resolution",
    title: "Dispute Resolution, Arbitration, and Class Action Waiver",
    paragraphs: [
      "To the fullest extent permitted by applicable law, disputes or claims arising from or relating to Karpilo LoadIQ, these Terms, subscriptions, billing, access, or user accounts will be resolved by individual binding arbitration under the Federal Arbitration Act and applicable Colorado law, unless an exception below applies.",
      "Either party may bring an individual claim in small claims court where available. Either party may seek injunctive or equitable relief in a court of competent jurisdiction for unauthorized access, misuse, intellectual property infringement, or trade secret misuse.",
      "Users and Karpilo Endeavor Technologies LLC waive the right to participate in class actions, class arbitrations, collective actions, representative actions, or consolidated proceedings to the fullest extent permitted by law.",
      "Users and Karpilo Endeavor Technologies LLC waive the right to a jury trial for disputes covered by these Terms to the fullest extent permitted by law.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing Law, Venue, and Electronic Consent",
    paragraphs: [
      "These Terms are governed by Colorado law, without regard to conflict-of-law rules, and by applicable federal law including the Federal Arbitration Act where applicable.",
      "For claims that are not subject to arbitration, the parties consent to the state or federal courts located in Colorado, unless a different venue is required by applicable law.",
      "By creating an account, clicking acceptance controls, continuing to use Karpilo LoadIQ, or purchasing a subscription, users consent to electronic records, electronic signatures, electronic policy acknowledgements, and electronic delivery of notices where permitted by law.",
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
