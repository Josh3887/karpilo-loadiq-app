import {
  resolvePaymentAccess,
  resolveUnauthenticatedEntitlements,
} from "@/domains/billing/entitlement-service";
import { getServerEntitlementState } from "@/domains/billing/server-entitlements";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const usage = {
      monthlyCalculations: 0,
      savedLoads: 0,
    };
    const entitlements = resolveUnauthenticatedEntitlements(usage);
    const paymentAccess = {
      ...resolvePaymentAccess(null, usage),
      entitlements,
    };

    return Response.json(
      {
        usage,
        paymentAccess,
        entitlements,
        billingTestHarness: null,
        ownerOverride: {
          ownerOverrideConfigured: false,
          ownerOverrideMatched: false,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  return Response.json(
    await getServerEntitlementState(user.id, user.email),
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
