import {
  EntitlementUsage,
  PaymentAccess,
  resolveEntitlements,
  resolvePaymentAccess,
} from "@/domains/billing/entitlement-service";
import type { InternalBillingTestHarnessSnapshot } from "@/domains/billing/internal-test-harness-types";

export type ClientEntitlementState = {
  entitlements: ReturnType<typeof resolveEntitlements>;
  paymentAccess: PaymentAccess;
  usage: EntitlementUsage;
  billingTestHarness?: InternalBillingTestHarnessSnapshot | null;
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

    return {
      usage,
      paymentAccess: resolvePaymentAccess(null, usage),
      entitlements: resolveEntitlements("no_access", usage),
    };
  }

  return (await response.json()) as ClientEntitlementState;
}
