import { getLaunchPhaseSnapshot } from "@/config/launch-phases";
import {
  type PaymentAccess,
  resolveEntitlements,
  resolvePaymentAccess,
} from "@/domains/billing/entitlement-service";
import type { ClientEntitlementState } from "@/domains/billing/client-entitlements";
import type { OperatorProgramStatus } from "@/types/operator-program";

export const PREVIEW_USER_ID = "00000000-0000-4000-8000-000000000000";
export const PREVIEW_USER_EMAIL = "preview@karpiloloadiq.example";

export const PREVIEW_OPERATOR_STATUS: OperatorProgramStatus = {
  phase: "GENERAL_AVAILABILITY",
  program: "standard",
  pilotUser: false,
  foundingOperator: false,
  launch500User: false,
  legacyPriceLocked: false,
  subscriptionGrandfathered: false,
  statusTitle: "Preview mode",
  statusMessage:
    "Preview mode shows real app routes with protected execution blocked.",
  slotLabel: "Preview",
  slotsRemaining: null,
  slotsTotal: null,
  statusCardDismissed: true,
  shouldShowFounderWelcome: false,
  badges: [{ label: "Preview", tone: "sky" }],
  rolloutPhase: "GENERAL_AVAILABILITY",
  rolloutLabel: "General Availability",
  rolloutMessage:
    "Preview mode is read-only and does not represent a live entitlement.",
  rolloutExpectation:
    "Tap fields and controls to learn what each station does before signing in.",
  pricingSummary: "No live subscription is active in preview.",
};

export const PREVIEW_LAUNCH_SNAPSHOT = getLaunchPhaseSnapshot(new Date(), 551);

export function getPreviewPaymentAccess(): PaymentAccess {
  return resolvePaymentAccess(null, {
    monthlyCalculations: 0,
    savedLoads: 0,
  });
}

export function getPreviewEntitlementState(): ClientEntitlementState {
  const usage = {
    monthlyCalculations: 0,
    savedLoads: 0,
  };
  const entitlements = resolveEntitlements("no_access", usage);

  return {
    usage,
    entitlements,
    paymentAccess: getPreviewPaymentAccess(),
  };
}
