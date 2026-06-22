import {
  ATLAS_EDUCATIONAL_DISCLAIMER,
  ATLAS_PROPRIETARY_STATEMENT,
} from "@/lib/atlas/atlas-registry";

export type AtlasHelpEntry = {
  featureSignal: string;
  whatThisDoes: string;
  whyItMatters: string;
  howToUseIt: string;
  operatorReminder: string;
};

export type AtlasEducationalHelpEntry = AtlasHelpEntry;

export const ATLAS_HELP_EDUCATIONAL_DISCLAIMER =
  ATLAS_EDUCATIONAL_DISCLAIMER;

export const ATLAS_HELP_PROPRIETARY_STATEMENT = ATLAS_PROPRIETARY_STATEMENT;

export const ATLAS_HELP_REGISTRY: Record<string, AtlasHelpEntry> = {
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
  "loaded-miles": {
    featureSignal: "Loaded Miles",
    whatThisDoes:
      "Captures the paid freight distance used by the deterministic Karpilo LoadIQ calculator.",
    whyItMatters:
      "Loaded miles shape loaded RPM, linehaul efficiency, fuel demand, time exposure, and the denominator behind several profitability signals.",
    howToUseIt:
      "Use the most realistic loaded distance available from the broker, route plan, or your own mileage source, then rerun analysis when route assumptions change.",
    operatorReminder:
      "Loaded miles do not erase deadhead. Review loaded and unpaid miles together before judging rate strength.",
  },
  "deadhead-miles": {
    featureSignal: "Deadhead Miles",
    whatThisDoes:
      "Captures unpaid repositioning distance attached to the load decision.",
    whyItMatters:
      "Deadhead miles dilute true RPM because they add fuel, time, tire, maintenance, and opportunity cost without direct load revenue.",
    howToUseIt:
      "Enter the distance from your current or planned starting point to pickup. Keep it separate from loaded miles.",
    operatorReminder:
      "A strong loaded RPM can still weaken when deadhead exposure gets high.",
  },
  "route-stop": {
    featureSignal: "Stop-Off Context",
    whatThisDoes:
      "Adds optional stop-off structure so the route model can preserve multi-stop complexity.",
    whyItMatters:
      "Additional stops can increase appointment risk, dwell time, mileage uncertainty, and coordination pressure even when the gross rate looks acceptable.",
    howToUseIt:
      "Use stop entries for operational context only. Manual loaded miles remain the calculator authority.",
    operatorReminder:
      "Stop-off modeling is not routing API truth and does not replace rate-confirmation review.",
  },
  "dispatch-dates": {
    featureSignal: "Dispatch, Pickup, Delivery, and Deadhead Dates",
    whatThisDoes:
      "Preserves timing context around assignment date, pickup, delivery, and repositioning windows.",
    whyItMatters:
      "Time committed affects daily net, opportunity cost, pay-period grouping, and whether a load ties up the truck longer than the rate supports.",
    howToUseIt:
      "Use calendar dates to preset day counts, then manually adjust dispatch or deadhead days when the real schedule needs finer control.",
    operatorReminder:
      "Dispatch date is not pickup date. Deadhead days belong to the repositioning window, not the loaded freight window.",
  },
  "estimated-load-weight": {
    featureSignal: "Estimated Load Weight",
    whatThisDoes:
      "Stores a speculative load-weight context field for operational review and future analytics.",
    whyItMatters:
      "Heavier freight can increase rolling resistance, acceleration demand, braking demand, terrain sensitivity, and fuel-efficiency pressure.",
    howToUseIt:
      "Enter estimated pounds only when useful. Leave it blank when the load weight is unknown.",
    operatorReminder:
      "This is not DOT-certified scale data. Verify official weights through shipper paperwork or scale records when required.",
  },
  "fuel-efficiency": {
    featureSignal: "Fuel Efficiency Behavior Context",
    whatThisDoes:
      "Explains operating patterns that can pressure MPG without changing the deterministic calculator formula.",
    whyItMatters:
      "Speed, gross weight, terrain, wind, stop frequency, acceleration habits, idle time, tire pressure awareness, route consistency, following distance, braking, and cruise discipline can all affect real-world fuel efficiency.",
    howToUseIt:
      "Use the guidance as context near MPG, fuel price, load weight, route timing, and actual-trip review. Adjust calculator inputs only when you have a better operating assumption.",
    operatorReminder:
      "Karpilo Atlas AI does not promise a specific MPG improvement or safety outcome.",
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
      "Choose the load lifecycle status, including planned, booked, dispatched, running, rejected, pulled, completed, or test, then save when the analysis is ready.",
    operatorReminder:
      "Saved estimates do not replace settlement statements, receipts, or carrier records.",
  },
  "result-true-rpm": {
    featureSignal: "True RPM Output",
    whatThisDoes:
      "Shows revenue efficiency across loaded miles plus deadhead miles.",
    whyItMatters:
      "True RPM keeps unpaid repositioning visible so the load is not judged by loaded RPM alone.",
    howToUseIt:
      "Compare true RPM against your profile target and break-even output before relying on gross revenue.",
    operatorReminder:
      "True RPM is an estimate from entered values, not a guarantee of settlement or final net income.",
  },
  "result-cost-per-mile": {
    featureSignal: "Cost Per Mile Output",
    whatThisDoes:
      "Displays estimated operating cost pressure across the modeled trip miles.",
    whyItMatters:
      "Cost per mile helps explain why fuel, overhead, reserves, route length, and deductions can erode margin.",
    howToUseIt:
      "Use it as a pressure reading beside true RPM and break-even RPM.",
    operatorReminder:
      "Actual trip cost can move after fuel stops, repairs, parking, tolls, and settlement details are known.",
  },
  "result-break-even": {
    featureSignal: "Break-Even RPM Output",
    whatThisDoes:
      "Shows the estimated loaded-mile rate needed before the trip begins producing modeled margin.",
    whyItMatters:
      "Break-even RPM turns overhead, fuel, reserves, and route exposure into a practical rate guardrail.",
    howToUseIt:
      "Compare the offered RPM or derived linehaul RPM against this output before reading margin strength.",
    operatorReminder:
      "A break-even estimate depends on accurate profile settings and load assumptions.",
  },
  "result-deadhead": {
    featureSignal: "Deadhead Output",
    whatThisDoes:
      "Shows unpaid miles as a share of total trip movement.",
    whyItMatters:
      "Higher deadhead exposure can reduce true RPM and daily net even when loaded rate looks strong.",
    howToUseIt:
      "Use this signal with route timing and pickup location to understand repositioning pressure.",
    operatorReminder:
      "Deadhead is operational pressure; it does not automatically make a load bad, but it must be paid for somewhere.",
  },
  "result-fuel-share": {
    featureSignal: "Fuel Share Output",
    whatThisDoes:
      "Shows estimated fuel cost as a share of gross revenue.",
    whyItMatters:
      "Fuel pressure can expose thin margins, especially when MPG, pump price, wind, weight, terrain, or idle time move against the plan.",
    howToUseIt:
      "Use this beside FSC recovery and fuel price assumptions to understand fuel-cost exposure.",
    operatorReminder:
      "Fuel share is not a refund, tax, or reimbursement determination.",
  },
  "result-daily-net": {
    featureSignal: "Daily Net Output",
    whatThisDoes:
      "Frames estimated net against the number of days committed to the load.",
    whyItMatters:
      "A load can look acceptable per mile and still be weak when it occupies too many dispatch or deadhead days.",
    howToUseIt:
      "Use daily net with route timing, appointment windows, and expected dwell exposure.",
    operatorReminder:
      "Daily net is an operating estimate and does not guarantee final settlement or availability of better freight.",
  },
  "result-margin": {
    featureSignal: "Trip Margin Output",
    whatThisDoes:
      "Displays directional profitability after modeled costs and deductions.",
    whyItMatters:
      "Margin helps reveal whether revenue is absorbing fuel, overhead, reserves, deadhead, time, and deductions with enough room left over.",
    howToUseIt:
      "Read margin as one signal beside true RPM, cost per mile, daily net, and route pressure.",
    operatorReminder:
      "Karpilo LoadIQ does not guarantee profit, broker payment, reimbursements, or final net income.",
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
      "Explains planned Pro IFTA estimation support and related operational data needs.",
    whyItMatters:
      "Jurisdiction miles, fuel purchases, and MPG can shape future estimate quality.",
    howToUseIt:
      "Treat this as planning context only until the feature is fully released and verified.",
    operatorReminder:
      "Karpilo LoadIQ does not file IFTA returns or provide tax, legal, or accounting advice.",
  },
  "truck-routing": {
    featureSignal: "Truck-Specific Routing",
    whatThisDoes:
      "Explains planned Platinum/Pro truck-specific provider routing estimates using vehicle, equipment, route, and provider context.",
    whyItMatters:
      "Equipment class, dimensions, weight, hazmat context, toll class, restrictions, traffic, construction, and route geometry can materially change operating assumptions.",
    howToUseIt:
      "Use it as planning context once provider routing is wired. Basic manual route context remains separate from truck-specific routing.",
    operatorReminder:
      "Truck-specific routing estimates are not route legality, permit, clearance, bridge, hazmat, safety, or compliance certification.",
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

export function getAtlasHelpEntry(key: string | null | undefined) {
  if (!key) return null;
  return ATLAS_HELP_REGISTRY[key] ?? null;
}

export const ATLAS_EDUCATIONAL_HELP_REGISTRY = ATLAS_HELP_REGISTRY;

export function getAtlasEducationalHelpEntry(
  key: string | null | undefined
) {
  return getAtlasHelpEntry(key);
}
