import {
  isBillingTestHarnessState,
  type BillingTestHarnessState,
} from "@/domains/billing/internal-test-harness-types";
import { updateInternalBillingTestHarness } from "@/domains/billing/internal-test-harness";
import { createClient } from "@/lib/supabase-server";

type UpdateBody = {
  enabled?: unknown;
  simulatedState?: unknown;
};

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateBody;
  const simulatedState = body.simulatedState;

  if (!isBillingTestHarnessState(simulatedState)) {
    return Response.json({ error: "invalid_simulated_state" }, { status: 400 });
  }

  const result = await updateInternalBillingTestHarness({
    email: user.email,
    enabled: body.enabled === true,
    simulatedState: simulatedState as BillingTestHarnessState,
  });

  if (!result.ok) {
    return Response.json(
      {
        error: result.error,
        harness: result.harness,
      },
      { status: result.status }
    );
  }

  return Response.json({ harness: result.harness });
}
