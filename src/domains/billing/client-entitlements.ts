import {
  EntitlementUsage,
  PaymentAccess,
  resolveEntitlements,
  resolvePaymentAccess,
  resolveUnauthenticatedEntitlements,
} from "@/domains/billing/entitlement-service";
import type { InternalBillingTestHarnessSnapshot } from "@/domains/billing/internal-test-harness-types";

export type ClientEntitlementState = {
  entitlements: ReturnType<typeof resolveEntitlements>;
  paymentAccess: PaymentAccess;
  usage: EntitlementUsage;
  billingTestHarness?: InternalBillingTestHarnessSnapshot | null;
  ownerOverride?: {
    ownerOverrideConfigured: boolean;
    ownerOverrideMatched: boolean;
  };
};

export async function getClientEntitlementState(): Promise<ClientEntitlementState> {
  const response = await fetch("/api/billing/entitlements", {
    cache: "no-store",
  });

  if (!response.ok) {
    const usage = {
      monthlyCalculations: 0,
      savedLoads: 0,
    };
    const entitlements = resolveUnauthenticatedEntitlements(usage);
    const paymentAccess = {
      ...resolvePaymentAccess(null, usage),
      entitlements,
    };

    return {
      usage,
      paymentAccess,
      entitlements,
      ownerOverride: {
        ownerOverrideConfigured: false,
        ownerOverrideMatched: false,
      },
    };
  }

  return (await response.json()) as ClientEntitlementState;
}
