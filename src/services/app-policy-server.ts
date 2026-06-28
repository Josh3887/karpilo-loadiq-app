import "server-only";

import {
  DRIVER_SAFETY_POLICY_VERSION,
  DRIVER_SAFETY_REMINDER_DAYS,
  REQUIRED_APP_POLICIES,
} from "@/config/app-policies";
import { createClient } from "@/lib/supabase-server";

export type AppPolicyGateState = {
  missingPolicies: string[];
  requiresPolicyAcceptance: boolean;
  requiresSafetyReminder: boolean;
};

const DAY_MS = 1000 * 60 * 60 * 24;

export async function getAppPolicyGateState(
  userId: string
): Promise<AppPolicyGateState> {
  const supabase = await createClient();
  const requiredKeys = REQUIRED_APP_POLICIES.map((policy) => policy.key);

  const [{ data: acceptances }, { data: latestSafetyAck }] = await Promise.all([
    supabase
      .from("app_policy_acceptances")
      .select("policy_key, policy_version")
      .eq("user_id", userId)
      .in("policy_key", requiredKeys),
    supabase
      .from("driver_safety_acknowledgments")
      .select("acknowledged_at, policy_version")
      .eq("user_id", userId)
      .eq("policy_version", DRIVER_SAFETY_POLICY_VERSION)
      .order("acknowledged_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const accepted = new Set(
    (acceptances ?? []).map(
      (acceptance) => `${acceptance.policy_key}:${acceptance.policy_version}`
    )
  );
  const missingPolicies = REQUIRED_APP_POLICIES.filter(
    (policy) => !accepted.has(`${policy.key}:${policy.version}`)
  ).map((policy) => policy.key);

  const acknowledgedAt = latestSafetyAck?.acknowledged_at
    ? new Date(latestSafetyAck.acknowledged_at).getTime()
    : 0;
  const requiresSafetyReminder =
    missingPolicies.length === 0 &&
    (!acknowledgedAt ||
      Date.now() - acknowledgedAt >= DRIVER_SAFETY_REMINDER_DAYS * DAY_MS);

  return {
    missingPolicies,
    requiresPolicyAcceptance: missingPolicies.length > 0,
    requiresSafetyReminder,
  };
}
