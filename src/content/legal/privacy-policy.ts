import {
  LEGAL_CONTACT_EMAIL,
  type LegalSection,
} from "@/content/legal/billing-disclosures";

export const PRIVACY_POLICY_LAST_UPDATED = "May 17, 2026";

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Privacy Policy Overview",
    paragraphs: [
      "This Privacy Policy explains how Karpilo Endeavor Technologies LLC collects, uses, stores, shares, protects, and deletes information for Karpilo LoadIQ.",
      "Karpilo LoadIQ is a transportation profitability calculator and operational estimation platform with educational and analytical support features. The app may process account information, subscription status, saved load calculations, operational assumptions, support requests, analytics events, and future cloud synchronization data.",
    ],
  },
  {
    id: "data-collected",
    title: "Information Karpilo LoadIQ May Collect",
    paragraphs: [
      "Karpilo LoadIQ collects information users provide directly, information generated through app use, and limited technical information needed to operate, secure, bill, and improve the service.",
      "Operational data can include pickup and delivery details, mileage, rate assumptions, fuel prices, overhead, reserves, pay templates, facility notes, post-trip actuals, saved calculations, profitability ratings, and user-configured profile settings.",
    ],
    bullets: [
      "Account data: email, name, company name, authentication identifiers, profile settings, and legal acknowledgement records.",
      "Subscription data: plan tier, billing provider, subscription status, renewal timing, payment failure status, and customer portal identifiers.",
      "Operational data: saved loads, calculator inputs, result snapshots, route assumptions, cost assumptions, and comparison history.",
      "Support data: messages, ticket categories, account deletion requests, refund requests, and billing support records.",
      "Analytics data: product events, feature usage, calculation counts, saved-load counts, and reliability telemetry.",
    ],
  },
  {
    id: "use-of-data",
    title: "How Information Is Used",
    paragraphs: [
      "Information is used to provide the Karpilo LoadIQ service, calculate operational estimates, save user-owned history, personalize default assumptions, enforce plan limits, process billing status, respond to support, prevent misuse, improve reliability, and prepare future intelligence features.",
      "Karpilo LoadIQ may use aggregated or de-identified operational patterns to improve product quality. The app should not sell personal information or private operational records.",
    ],
  },
  {
    id: "cookies-analytics",
    title: "Cookies, Local Storage, and Analytics Disclosure",
    paragraphs: [
      "Karpilo LoadIQ may use cookies, browser storage, session tokens, and similar technologies for authentication, session continuity, security, saved preferences, legal acknowledgement state, and product reliability.",
      "Analytics events may be used to understand app usage, measure calculation counts, diagnose errors, detect abuse, and improve onboarding and paid features. Analytics should be limited to what is reasonably needed to operate and improve the service.",
    ],
  },
  {
    id: "third-parties",
    title: "Third-Party Services and Data Providers",
    paragraphs: [
      "Karpilo LoadIQ relies on service providers to operate core app functions. These providers may process limited information on behalf of Karpilo Endeavor Technologies LLC.",
      "Current or planned providers may include Supabase for authentication and database services, Stripe for direct website billing, Apple and Google for app store subscriptions, Vercel or hosting providers for deployment, and public or third-party operational data providers such as EIA fuel reference data.",
    ],
    bullets: [
      "Stripe may process payment, invoice, subscription, customer portal, and billing status data for direct website subscriptions.",
      "Apple and Google may process payment, receipt, subscription, refund, cancellation, and restore-purchase information for app store purchases.",
      "Supabase may process authentication, profile, support, legal acknowledgement, and saved operational data as part of the app backend.",
      "EIA fuel reference lookups do not require sending private account data, saved load history, or support messages to EIA.",
    ],
  },
  {
    id: "retention-deletion",
    title: "Data Retention and Account Deletion",
    paragraphs: [
      "Karpilo LoadIQ retains account, operational, billing, support, and legal records for as long as reasonably needed to provide the service, maintain business records, resolve disputes, enforce terms, comply with law, support security, and protect against fraud or abuse.",
      "Users may request account and data deletion in the app or by contacting support. Subscription cancellation and account deletion are separate actions. Users should cancel active subscriptions through the relevant billing platform before requesting deletion when applicable.",
      "Some records may be retained where required or reasonably necessary for legal, tax, billing, security, fraud prevention, dispute, chargeback, compliance, or backup integrity purposes.",
    ],
  },
  {
    id: "security",
    title: "Security Practices",
    paragraphs: [
      "Karpilo LoadIQ is designed around authenticated access, user-owned records, row-level security, server-only secrets, and separation between client-visible keys and privileged backend credentials.",
      "No system can guarantee perfect security. Users are responsible for protecting account credentials, device access, and exported business records.",
    ],
  },
  {
    id: "future-ai",
    title: "Future Cloud Sync and Karpilo Atlas AI Support",
    paragraphs: [
      "Future Karpilo LoadIQ features may include cloud synchronization, team or fleet dashboards, Karpilo Atlas AI educational support, calculation explanation support, route context, market context, or other informational analysis tools.",
      "Karpilo Atlas AI features, where enabled, are intended to provide educational assistance, calculation interpretation support, user-interface guidance, analytical context, and operational awareness enhancement. They are not dispatch, routing, compliance, broker, tax, legal, financial, safety certification, DOT/FMCSA, or operational-control authority.",
      "If future features materially change what data is collected or how it is used, Karpilo LoadIQ should update disclosures and request any legally required consent before enabling those uses.",
    ],
  },
  {
    id: "contact",
    title: "Privacy Contact",
    paragraphs: [
      `Questions, privacy requests, account deletion requests, and data handling concerns can be sent to ${LEGAL_CONTACT_EMAIL}.`,
    ],
    links: [
      {
        label: "Request account deletion",
        href: "/account-deletion",
      },
    ],
  },
];
