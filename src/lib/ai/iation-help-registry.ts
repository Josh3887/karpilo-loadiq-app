export type IationHelpEntry = {
  featureSignal: string;
  whatThisDoes: string;
  whyItMatters: string;
  howToUseIt: string;
  operatorReminder: string;
};

export const IATION_EDUCATIONAL_DISCLAIMER =
  "iAtion provides educational guidance for navigating Karpilo LoadIQ features, workflows, and app tools. It is intended to explain functionality and improve user understanding. It does not make business, financial, legal, tax, compliance, or dispatch decisions.";

export const IATION_PROPRIETARY_STATEMENT =
  "iAtion and iAtion Core are proprietary intelligence systems developed for Karpilo LoadIQ by Karpilo Endeavor Technologies. These systems are designed to support educational app guidance and operational freight intelligence through structured application data, calculated load outputs, platform metrics, user-provided inputs, and evolving freight-market context.";

export const IATION_HELP_REGISTRY: Record<string, IationHelpEntry> = {
  "analyze-load": {
    featureSignal: "Analyze Load",
    whatThisDoes:
      "Runs the deterministic Karpilo LoadIQ calculator against the freight values currently entered.",
    whyItMatters:
      "This is the primary signal that turns rate, miles, fuel, overhead, reserves, and days into operating context.",
    howToUseIt:
      "Enter the load values, confirm mileage and cost assumptions, then analyze before saving or comparing the load.",
    operatorReminder:
      "The analysis is only as reliable as the values entered. Check rate confirmation, routing assumptions, fuel price, and accessorials.",
  },
  "calculator-field": {
    featureSignal: "Calculator Field",
    whatThisDoes:
      "Captures one operating assumption used by the Karpilo LoadIQ calculator.",
    whyItMatters:
      "Small field changes can shift true RPM, cost per mile, daily net, and margin pressure.",
    howToUseIt:
      "Use the most realistic value available, then rerun the analysis if a broker, route, or operating assumption changes.",
    operatorReminder:
      "Avoid judging the load from gross revenue alone; the field-level details create the real operating picture.",
  },
  "save-load": {
    featureSignal: "Save Load",
    whatThisDoes:
      "Stores the analyzed load and its calculation snapshot in your Karpilo LoadIQ history.",
    whyItMatters:
      "Saved history helps compare lanes, review trip decisions, and preserve the assumptions behind each estimate.",
    howToUseIt:
      "Choose whether the load was planned, actually run, or used as a test calculation, then save when the analysis is ready.",
    operatorReminder:
      "Saved estimates do not replace settlement statements, receipts, or carrier records.",
  },
  "subscription-tile": {
    featureSignal: "Subscription / Access Tile",
    whatThisDoes:
      "Shows current access, trial, billing, pricing-lock, or program status information.",
    whyItMatters:
      "Karpilo LoadIQ uses entitlement state to decide which operational tools are available.",
    howToUseIt:
      "Review access state here, then use billing management or support links for subscription actions.",
    operatorReminder:
      "Billing provider status and Karpilo LoadIQ entitlement state are related, but not always identical for protected programs.",
  },
  "ifta-estimate": {
    featureSignal: "IFTA Estimation Context",
    whatThisDoes:
      "Explains planned IFTA estimation support and related operational data needs.",
    whyItMatters:
      "Jurisdiction miles, fuel purchases, and MPG can shape future estimate quality.",
    howToUseIt:
      "Treat this as planning context only until the feature is fully released and verified.",
    operatorReminder:
      "Karpilo LoadIQ does not file IFTA returns or provide tax, legal, or accounting advice.",
  },
  "billing-command": {
    featureSignal: "Billing Command",
    whatThisDoes:
      "Routes you to account, subscription, provider, or billing support actions.",
    whyItMatters:
      "Subscription access should be manageable without changing operational calculator data.",
    howToUseIt:
      "Use the provider portal or billing support path that matches the payment rail shown.",
    operatorReminder:
      "Do not share payment credentials or API keys. Payment details remain handled by the payment provider.",
  },
  "stripe-portal": {
    featureSignal: "Stripe Customer Portal",
    whatThisDoes:
      "Opens Stripe-hosted billing management for eligible direct billing accounts.",
    whyItMatters:
      "Payment method, invoice, renewal, and cancellation actions stay inside the payment processor.",
    howToUseIt:
      "Use the portal to manage billing when a Stripe customer record is available.",
    operatorReminder:
      "App Store or Google Play purchases may need to be managed through their own platforms.",
  },
};

export function getIationHelpEntry(key: string | null | undefined) {
  if (!key) return null;
  return IATION_HELP_REGISTRY[key] ?? null;
}
