export const APP_VERSION = "2026.05.13";
export const REQUIRED_POLICY_VERSION = "2026-05-13";
export const DRIVER_SAFETY_POLICY_VERSION = "2026-05-13";
export const DRIVER_SAFETY_REMINDER_DAYS = 30;

export type RequiredPolicyKey =
  | "terms_conditions"
  | "privacy_policy"
  | "refund_policy"
  | "subscription_terms"
  | "acceptable_use_policy"
  | "driver_safety_disclosure"
  | "billing_policy"
  | "pricing_lock_policy"
  | "data_usage_disclosure"
  | "informational_use_disclaimer"
  | "limitation_of_liability";

export type RequiredPolicy = {
  key: RequiredPolicyKey;
  title: string;
  version: string;
  href?: string;
  summary: string;
};

export const REQUIRED_APP_POLICIES: RequiredPolicy[] = [
  {
    key: "terms_conditions",
    title: "Terms & Conditions",
    version: REQUIRED_POLICY_VERSION,
    href: "/terms",
    summary: "General platform rules, acceptable operation, and account terms.",
  },
  {
    key: "privacy_policy",
    title: "Privacy Policy",
    version: REQUIRED_POLICY_VERSION,
    href: "/privacy",
    summary: "Account, operational, billing, support, and analytics data use.",
  },
  {
    key: "refund_policy",
    title: "Refund Policy",
    version: REQUIRED_POLICY_VERSION,
    href: "/refund-policy",
    summary: "Digital subscription refund handling and platform refund paths.",
  },
  {
    key: "subscription_terms",
    title: "Subscription Terms",
    version: REQUIRED_POLICY_VERSION,
    href: "/subscription-terms",
    summary: "Recurring billing, cancellation, failed payment, and renewal terms.",
  },
  {
    key: "acceptable_use_policy",
    title: "Acceptable Use Policy",
    version: REQUIRED_POLICY_VERSION,
    href: "/terms",
    summary: "No misuse, abuse, unauthorized access, resale, fraud, or harm.",
  },
  {
    key: "driver_safety_disclosure",
    title: "Hands-Free & Driver Safety Disclosure",
    version: REQUIRED_POLICY_VERSION,
    summary:
      "Do not interact with LoadIQ while driving unless safely parked or using lawful hands-free methods.",
  },
  {
    key: "billing_policy",
    title: "Billing Policy",
    version: REQUIRED_POLICY_VERSION,
    href: "/subscription-terms",
    summary: "Stripe, Apple, and Google are billing providers; Supabase controls app entitlement state.",
  },
  {
    key: "pricing_lock_policy",
    title: "Pricing Lock Policy",
    version: REQUIRED_POLICY_VERSION,
    href: "/refund-policy",
    summary:
      "Founder and launch pricing remains locked only while the subscription stays active and in good standing.",
  },
  {
    key: "data_usage_disclosure",
    title: "Data Usage Disclosure",
    version: REQUIRED_POLICY_VERSION,
    href: "/privacy",
    summary: "LoadIQ stores operational inputs, saved loads, support records, billing state, and usage telemetry.",
  },
  {
    key: "informational_use_disclaimer",
    title: "Informational Use Disclaimer",
    version: REQUIRED_POLICY_VERSION,
    summary: "LoadIQ is an informational decision-support tool and does not guarantee outcomes.",
  },
  {
    key: "limitation_of_liability",
    title: "Limitation of Liability",
    version: REQUIRED_POLICY_VERSION,
    href: "/terms",
    summary: "Karpilo LoadIQ is not liable for freight, operational, financial, routing, or market losses.",
  },
] as const;
