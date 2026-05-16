"use client";

import {
  APP_VERSION,
  DRIVER_SAFETY_POLICY_VERSION,
  REQUIRED_APP_POLICIES,
} from "@/config/app-policies";
import {
  LOADIQ_DISCLAIMER_LAST_UPDATED,
  LOADIQ_DISCLAIMER_VERSION,
} from "@/config/legal";
import { createClient } from "@/lib/supabase-client";
import { ensureAppUserProfile } from "@/services/app-user-profile";
import {
  recordDisclaimerAcceptanceEvent,
  recordOnboardingEvent,
} from "@/services/onboarding-telemetry";

function platformName() {
  if (typeof navigator === "undefined") return "web";
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return nav.userAgentData?.platform ?? navigator.platform ?? "web";
}

export async function acceptRequiredAppPolicies() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to accept Karpilo LoadIQ policies.");
  }

  const acceptedAt = new Date().toISOString();
  const platform = platformName();

  await ensureAppUserProfile(supabase, user, {
    disclaimer_accepted_at: acceptedAt,
    disclaimer_version: LOADIQ_DISCLAIMER_VERSION,
    disclaimer_last_updated: LOADIQ_DISCLAIMER_LAST_UPDATED,
    updated_at: acceptedAt,
  });

  const rows = REQUIRED_APP_POLICIES.map((policy) => ({
    user_id: user.id,
    policy_key: policy.key,
    policy_version: policy.version,
    email: user.email,
    app_version: APP_VERSION,
    platform,
    acceptance_source: "app_gate",
    accepted_at: acceptedAt,
    metadata: {
      title: policy.title,
    },
  }));

  const { error } = await supabase
    .from("app_policy_acceptances")
    .upsert(rows, { onConflict: "user_id,policy_key,policy_version" });

  if (error) throw new Error(error.message);

  await acknowledgeDriverSafety("initial_policy_acceptance");
  await recordDisclaimerAcceptanceEvent({
    policyVersion: LOADIQ_DISCLAIMER_VERSION,
    source: "app_gate",
    payload: {
      acceptedPolicyCount: REQUIRED_APP_POLICIES.length,
      platform,
    },
  }).catch((telemetryError) => console.error(telemetryError));
  await recordOnboardingEvent({
    eventName: "required_app_policies_accepted",
    payload: {
      acceptedPolicyCount: REQUIRED_APP_POLICIES.length,
    },
  }).catch((telemetryError) => console.error(telemetryError));
}

export async function acknowledgeDriverSafety(
  source = "monthly_safety_reminder"
) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to acknowledge driver safety.");
  }

  await ensureAppUserProfile(supabase, user);

  const { error } = await supabase.from("driver_safety_acknowledgments").insert({
    user_id: user.id,
    policy_version: DRIVER_SAFETY_POLICY_VERSION,
    acknowledged_at: new Date().toISOString(),
    source,
    metadata: {
      app_version: APP_VERSION,
      platform: platformName(),
    },
  });

  if (error) throw new Error(error.message);

  await recordOnboardingEvent({
    eventName:
      source === "initial_policy_acceptance"
        ? "driver_safety_initial_acknowledged"
        : "driver_safety_monthly_acknowledged",
    payload: {
      policyVersion: DRIVER_SAFETY_POLICY_VERSION,
      source,
    },
  }).catch((telemetryError) => console.error(telemetryError));
}
