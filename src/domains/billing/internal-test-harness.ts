import "server-only";

import {
  FUTURE_PLATFORM_FEATURE_SCOPE,
  type LoadIqCommercialTierId,
} from "@/config/pricing";
import type { SubscriptionAccessRecord } from "@/domains/billing/entitlement-service";
import {
  isBillingTestHarnessState,
  type BillingTestHarnessState,
  type InternalBillingTestHarnessSnapshot,
} from "@/domains/billing/internal-test-harness-types";
import {
  evaluateSubscriptionLaunchPhase,
  type SubscriptionLaunchPhaseId,
} from "@/domains/billing/subscription-launch-phases";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const AUTHORIZED_TEST_EMAIL = "karpilotrucking@outlook.com";
const DISPLAY_TEST_EMAIL = "Karpilotrucking@outlook.com";
const FUTURE_FEATURE_SCOPE_SLUG =
  "lifetime_access_to_future_released_karpilo_loadiq_platform_features";

type InternalBillingTestAccountRow = {
  id: string;
  email: string;
  enabled: boolean;
  simulated_state: BillingTestHarnessState;
  entitlement_status: string | null;
  tier: string | null;
  program: string | null;
  trial_status: string | null;
  trial_duration_days: number | null;
  trial_start: string | null;
  trial_end: string | null;
  billing_starts_at: string | null;
  lifetime_price_lock: boolean | null;
  future_feature_access_scope: string | null;
  cohort_phase: string | null;
  cohort_cap: number | null;
  price_subject_to_change: boolean | null;
  notes: string | null;
};

type HarnessSimulationFields = Pick<
  InternalBillingTestAccountRow,
  | "simulated_state"
  | "entitlement_status"
  | "tier"
  | "program"
  | "trial_status"
  | "trial_duration_days"
  | "trial_start"
  | "trial_end"
  | "billing_starts_at"
  | "lifetime_price_lock"
  | "future_feature_access_scope"
  | "cohort_phase"
  | "cohort_cap"
  | "price_subject_to_change"
  | "notes"
>;

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function isBillingTestHarnessRuntimeAllowed() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_BILLING_TEST_HARNESS === "true"
  );
}

export function canUseBillingTestHarness(email: string | null | undefined) {
  return (
    isBillingTestHarnessRuntimeAllowed() &&
    normalizeEmail(email) === AUTHORIZED_TEST_EMAIL
  );
}

function isoFromNow(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function normalizeFutureFeatureScope(value: string | null) {
  if (!value) return null;
  return value === FUTURE_FEATURE_SCOPE_SLUG
    ? FUTURE_PLATFORM_FEATURE_SCOPE
    : value;
}

function launchPhaseSimulationFields({
  state,
  phaseId,
  userCount,
  daysElapsed,
  selectedPlan,
}: {
  state: BillingTestHarnessState;
  phaseId: SubscriptionLaunchPhaseId;
  userCount: number;
  daysElapsed: number;
  selectedPlan: LoadIqCommercialTierId;
}): HarnessSimulationFields {
  const now = new Date().toISOString();
  const evaluation = evaluateSubscriptionLaunchPhase({
    phaseId,
    userCount,
    daysElapsed,
  });
  const active = evaluation.transitionReason === "phase_active";

  return {
    simulated_state: state,
    entitlement_status: active || evaluation.isOpenMarket ? "active" : "unknown",
    tier: selectedPlan,
    program: evaluation.phase.id,
    trial_status: evaluation.phase.betaOnly ? "testing" : "not_required",
    trial_duration_days: evaluation.phase.durationDays,
    trial_start: null,
    trial_end:
      evaluation.phase.durationDays === null
        ? null
        : isoFromNow(evaluation.phase.durationDays - daysElapsed),
    billing_starts_at: now,
    lifetime_price_lock: evaluation.lifetimePricingEligible,
    future_feature_access_scope: evaluation.lifetimePricingEligible
      ? FUTURE_FEATURE_SCOPE_SLUG
      : null,
    cohort_phase: evaluation.phase.id,
    cohort_cap: evaluation.phase.cap,
    price_subject_to_change: !evaluation.lifetimePricingEligible,
    notes: [
      `Internal launch simulation only: ${evaluation.phase.label}.`,
      `Selected commercial plan: ${selectedPlan}.`,
      `Purpose: ${evaluation.phase.purpose}.`,
      `Users: ${evaluation.userCount}/${evaluation.phase.cap ?? "uncapped"}.`,
      `Days elapsed: ${evaluation.daysElapsed}/${evaluation.phase.durationDays ?? "ongoing"}.`,
      `Transition: ${evaluation.transitionReason}.`,
      `Lifetime pricing eligible: ${evaluation.lifetimePricingEligible ? "yes" : "no"}.`,
      `Eligible plans: ${evaluation.eligiblePlans.join(", ")}.`,
      "Does not write Stripe subscriptions or production entitlement records.",
    ].join(" "),
  };
}

function betaTestingSimulationFields({
  state,
  userCount,
  daysElapsed,
}: {
  state: BillingTestHarnessState;
  userCount: number;
  daysElapsed: number;
}): HarnessSimulationFields {
  const evaluation = evaluateSubscriptionLaunchPhase({
    phaseId: "beta_testing",
    userCount,
    daysElapsed,
  });
  const active = evaluation.transitionReason === "phase_active";

  return {
    simulated_state: state,
    entitlement_status: active ? "active" : "expired",
    tier: "beta_test",
    program: evaluation.phase.id,
    trial_status: active ? "testing" : "ended",
    trial_duration_days: evaluation.phase.durationDays,
    trial_start: null,
    trial_end:
      evaluation.phase.durationDays === null
        ? null
        : isoFromNow(evaluation.phase.durationDays - daysElapsed),
    billing_starts_at: null,
    lifetime_price_lock: false,
    future_feature_access_scope: null,
    cohort_phase: evaluation.phase.id,
    cohort_cap: evaluation.phase.cap,
    price_subject_to_change: true,
    notes: [
      `Internal beta simulation only: ${evaluation.phase.label}.`,
      "Access purpose: allow beta testers to test the app.",
      "Commercial plan selection is not active during beta testing.",
      `Users: ${evaluation.userCount}/${evaluation.phase.cap ?? "uncapped"}.`,
      `Days elapsed: ${evaluation.daysElapsed}/${evaluation.phase.durationDays ?? "ongoing"}.`,
      `Transition: ${evaluation.transitionReason}.`,
      "Lifetime pricing eligible: no.",
      "Does not write Stripe subscriptions or production entitlement records.",
    ].join(" "),
  };
}

function simulationFieldsForState(
  state: BillingTestHarnessState
): HarnessSimulationFields {
  const now = new Date().toISOString();
  const trialStart = isoFromNow(-1);
  const activeTrialEnd = isoFromNow(6);
  const expiredTrialStart = isoFromNow(-8);
  const expiredTrialEnd = isoFromNow(-1);

  switch (state) {
    case "gold_trial_active":
      return {
        simulated_state: state,
        entitlement_status: "trialing",
        tier: "gold",
        program: "gold",
        trial_status: "active",
        trial_duration_days: 7,
        trial_start: trialStart,
        trial_end: activeTrialEnd,
        billing_starts_at: activeTrialEnd,
        lifetime_price_lock: false,
        future_feature_access_scope: null,
        cohort_phase: null,
        cohort_cap: null,
        price_subject_to_change: true,
        notes: "Internal test state: Gold trial active. Not a real Stripe subscriber.",
      };
    case "gold_trial_expired":
      return {
        simulated_state: state,
        entitlement_status: "expired",
        tier: "gold",
        program: "gold",
        trial_status: "expired",
        trial_duration_days: 7,
        trial_start: expiredTrialStart,
        trial_end: expiredTrialEnd,
        billing_starts_at: null,
        lifetime_price_lock: false,
        future_feature_access_scope: null,
        cohort_phase: null,
        cohort_cap: null,
        price_subject_to_change: true,
        notes: "Internal test state: Gold trial expired. Not a real Stripe subscriber.",
      };
    case "gold_active":
      return {
        simulated_state: state,
        entitlement_status: "active",
        tier: "gold",
        program: "gold",
        trial_status: "ended",
        trial_duration_days: 7,
        trial_start: null,
        trial_end: null,
        billing_starts_at: now,
        lifetime_price_lock: false,
        future_feature_access_scope: null,
        cohort_phase: null,
        cohort_cap: null,
        price_subject_to_change: true,
        notes: "Internal test state: Gold active. Not a real Stripe subscriber.",
      };
    case "gold_past_due":
      return {
        simulated_state: state,
        entitlement_status: "past_due",
        tier: "gold",
        program: "gold",
        trial_status: "ended",
        trial_duration_days: 7,
        trial_start: null,
        trial_end: null,
        billing_starts_at: now,
        lifetime_price_lock: false,
        future_feature_access_scope: null,
        cohort_phase: null,
        cohort_cap: null,
        price_subject_to_change: true,
        notes: "Internal test state: Gold past due. Not a real Stripe subscriber.",
      };
    case "gold_canceled":
      return {
        simulated_state: state,
        entitlement_status: "canceled",
        tier: "gold",
        program: "gold",
        trial_status: "ended",
        trial_duration_days: 7,
        trial_start: null,
        trial_end: null,
        billing_starts_at: now,
        lifetime_price_lock: false,
        future_feature_access_scope: null,
        cohort_phase: null,
        cohort_cap: null,
        price_subject_to_change: true,
        notes: "Internal test state: Gold canceled. Not a real Stripe subscriber.",
      };
    case "beta_testing_app_access":
      return betaTestingSimulationFields({
        state,
        userCount: 24,
        daysElapsed: 20,
      });
    case "beta_testing_cap_full":
      return betaTestingSimulationFields({
        state,
        userCount: 50,
        daysElapsed: 35,
      });
    case "legacy_launch_silver_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "legacy_launch",
        userCount: 72,
        daysElapsed: 25,
        selectedPlan: "silver",
      });
    case "legacy_launch_gold_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "legacy_launch",
        userCount: 72,
        daysElapsed: 25,
        selectedPlan: "gold",
      });
    case "legacy_launch_platinum_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "legacy_launch",
        userCount: 72,
        daysElapsed: 25,
        selectedPlan: "platinum",
      });
    case "legacy_launch_pro_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "legacy_launch",
        userCount: 72,
        daysElapsed: 25,
        selectedPlan: "pro",
      });
    case "legacy_launch_expired":
      return launchPhaseSimulationFields({
        state,
        phaseId: "legacy_launch",
        userCount: 88,
        daysElapsed: 60,
        selectedPlan: "gold",
      });
    case "founding_operator_phase_1_silver_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_1",
        userCount: 128,
        daysElapsed: 45,
        selectedPlan: "silver",
      });
    case "founding_operator_phase_1_gold_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_1",
        userCount: 128,
        daysElapsed: 45,
        selectedPlan: "gold",
      });
    case "founding_operator_phase_1_platinum_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_1",
        userCount: 128,
        daysElapsed: 45,
        selectedPlan: "platinum",
      });
    case "founding_operator_phase_1_pro_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_1",
        userCount: 128,
        daysElapsed: 45,
        selectedPlan: "pro",
      });
    case "founding_operator_phase_1_cap_full":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_1",
        userCount: 200,
        daysElapsed: 70,
        selectedPlan: "gold",
      });
    case "founding_operator_phase_2_silver_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_2",
        userCount: 120,
        daysElapsed: 20,
        selectedPlan: "silver",
      });
    case "founding_operator_phase_2_gold_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_2",
        userCount: 120,
        daysElapsed: 20,
        selectedPlan: "gold",
      });
    case "founding_operator_phase_2_platinum_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_2",
        userCount: 120,
        daysElapsed: 20,
        selectedPlan: "platinum",
      });
    case "founding_operator_phase_2_pro_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_2",
        userCount: 120,
        daysElapsed: 20,
        selectedPlan: "pro",
      });
    case "founding_operator_phase_2_expired":
      return launchPhaseSimulationFields({
        state,
        phaseId: "founding_operator_phase_2",
        userCount: 140,
        daysElapsed: 45,
        selectedPlan: "gold",
      });
    case "open_market_silver_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "open_market",
        userCount: 0,
        daysElapsed: 0,
        selectedPlan: "silver",
      });
    case "open_market_gold_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "open_market",
        userCount: 0,
        daysElapsed: 0,
        selectedPlan: "gold",
      });
    case "open_market_platinum_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "open_market",
        userCount: 0,
        daysElapsed: 0,
        selectedPlan: "platinum",
      });
    case "open_market_pro_active":
      return launchPhaseSimulationFields({
        state,
        phaseId: "open_market",
        userCount: 0,
        daysElapsed: 0,
        selectedPlan: "pro",
      });
    case "no_subscription":
    default:
      return {
        simulated_state: "no_subscription",
        entitlement_status: "unknown",
        tier: "no_access",
        program: "none",
        trial_status: "not_started",
        trial_duration_days: null,
        trial_start: null,
        trial_end: null,
        billing_starts_at: null,
        lifetime_price_lock: false,
        future_feature_access_scope: null,
        cohort_phase: null,
        cohort_cap: null,
        price_subject_to_change: null,
        notes: "Internal test state: no active simulated subscription.",
      };
  }
}

function toSnapshot(
  row: InternalBillingTestAccountRow | null,
  error: string | null = null
): InternalBillingTestHarnessSnapshot {
  const fallback = simulationFieldsForState("no_subscription");
  const source = row ?? {
    id: "",
    email: DISPLAY_TEST_EMAIL,
    enabled: false,
    ...fallback,
  };

  return {
    email: source.email,
    enabled: source.enabled,
    simulatedState: isBillingTestHarnessState(source.simulated_state)
      ? source.simulated_state
      : "no_subscription",
    entitlementStatus: source.entitlement_status,
    tier: source.tier,
    program: source.program,
    trialStatus: source.trial_status,
    trialDurationDays: source.trial_duration_days,
    trialStart: source.trial_start,
    trialEnd: source.trial_end,
    billingStartsAt: source.billing_starts_at,
    lifetimePriceLock: source.lifetime_price_lock,
    futureFeatureAccessScope: normalizeFutureFeatureScope(
      source.future_feature_access_scope
    ),
    cohortPhase: source.cohort_phase,
    cohortCap: source.cohort_cap,
    priceSubjectToChange: source.price_subject_to_change,
    notes: source.notes,
    error,
  };
}

async function readHarnessRow(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("internal_billing_test_accounts")
    .select("*")
    .ilike("email", normalizeEmail(email))
    .maybeSingle();

  if (error) throw error;
  return data as InternalBillingTestAccountRow | null;
}

export async function getInternalBillingTestHarnessSnapshot(
  email: string | null | undefined
) {
  if (!canUseBillingTestHarness(email)) return null;

  try {
    return toSnapshot(await readHarnessRow(AUTHORIZED_TEST_EMAIL));
  } catch (error) {
    console.error("Unable to read internal billing test account.", error);
    return toSnapshot(
      null,
      "Internal billing simulation table is unavailable. Apply the reviewed migration before using this harness."
    );
  }
}

export function resolveInternalBillingTestSubscription(
  snapshot: InternalBillingTestHarnessSnapshot | null
): SubscriptionAccessRecord | null {
  if (!snapshot?.enabled || snapshot.error) return null;
  const harnessTier = normalizeHarnessTier(snapshot.tier);
  const featureFields = featureFieldsForHarnessTier(harnessTier);

  return {
    provider: "manual",
    status: snapshot.entitlementStatus,
    entitlement_status: snapshot.entitlementStatus,
    tier: harnessTier ?? snapshot.tier,
    subscription_tier: harnessTier,
    feature_access: featureFields.featureAccess,
    grandfathered_access: Boolean(snapshot.lifetimePriceLock),
    lifetime_access: Boolean(snapshot.lifetimePriceLock),
    full_loadiq_access: featureFields.fullLoadIqAccess,
    fleet_enabled: featureFields.fleetEnabled,
    fleetos_pro_access: featureFields.fleetOsProAccess,
    truck_capacity_limit: featureFields.truckCapacityLimit,
    trial_end: snapshot.trialEnd,
    trial_duration_days: snapshot.trialDurationDays,
    trial_status: snapshot.trialStatus,
    billing_starts_at: snapshot.billingStartsAt,
    lifetime_price_lock: snapshot.lifetimePriceLock,
    future_feature_access_scope: snapshot.futureFeatureAccessScope,
    cohort_phase: snapshot.cohortPhase,
    cohort_cap: snapshot.cohortCap,
    price_subject_to_change: snapshot.priceSubjectToChange,
    cancel_at_period_end: false,
    canceled_at: snapshot.entitlementStatus === "canceled" ? new Date().toISOString() : null,
  };
}

type HarnessTier = LoadIqCommercialTierId | "beta_test";

function normalizeHarnessTier(
  value: string | null | undefined
): HarnessTier | null {
  if (value === "beta_test") return "beta_test";
  return normalizeCommercialTier(value);
}

function normalizeCommercialTier(
  value: string | null | undefined
): LoadIqCommercialTierId | null {
  if (
    value === "silver" ||
    value === "gold" ||
    value === "platinum" ||
    value === "pro"
  ) {
    return value;
  }

  return null;
}

function featureFieldsForHarnessTier(tier: HarnessTier | null) {
  if (tier === "beta_test") {
    return {
      featureAccess: "platinum",
      fullLoadIqAccess: true,
      fleetEnabled: false,
      fleetOsProAccess: false,
      truckCapacityLimit: 1,
    } as const;
  }

  if (tier === "pro") {
    return {
      featureAccess: "fleet",
      fullLoadIqAccess: true,
      fleetEnabled: true,
      fleetOsProAccess: true,
      truckCapacityLimit: null,
    } as const;
  }

  if (tier === "platinum") {
    return {
      featureAccess: "platinum",
      fullLoadIqAccess: true,
      fleetEnabled: false,
      fleetOsProAccess: false,
      truckCapacityLimit: 1,
    } as const;
  }

  if (tier === "gold") {
    return {
      featureAccess: "premium",
      fullLoadIqAccess: true,
      fleetEnabled: false,
      fleetOsProAccess: false,
      truckCapacityLimit: 1,
    } as const;
  }

  if (tier === "silver") {
    return {
      featureAccess: "standard",
      fullLoadIqAccess: false,
      fleetEnabled: false,
      fleetOsProAccess: false,
      truckCapacityLimit: 1,
    } as const;
  }

  return {
    featureAccess: null,
    fullLoadIqAccess: false,
    fleetEnabled: false,
    fleetOsProAccess: false,
    truckCapacityLimit: null,
  } as const;
}

export async function updateInternalBillingTestHarness({
  email,
  enabled,
  simulatedState,
}: {
  email: string | null | undefined;
  enabled: boolean;
  simulatedState: BillingTestHarnessState;
}) {
  if (!canUseBillingTestHarness(email)) {
    return {
      ok: false as const,
      status: 403,
      error: "not_authorized",
      harness: null,
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const existing = await readHarnessRow(AUTHORIZED_TEST_EMAIL);
    const fields = simulationFieldsForState(simulatedState);
    const payload = {
      email: DISPLAY_TEST_EMAIL,
      enabled,
      ...fields,
      updated_at: new Date().toISOString(),
    };

    const query = existing
      ? supabase
          .from("internal_billing_test_accounts")
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .single()
      : supabase
          .from("internal_billing_test_accounts")
          .insert(payload)
          .select("*")
          .single();

    const { data, error } = await query;
    if (error) throw error;

    return {
      ok: true as const,
      status: 200,
      error: null,
      harness: toSnapshot(data as InternalBillingTestAccountRow),
    };
  } catch (error) {
    console.error("Unable to update internal billing test account.", error);
    return {
      ok: false as const,
      status: 500,
      error: "update_failed",
      harness: toSnapshot(
        null,
        "Internal billing simulation update failed. Confirm the reviewed migration is applied."
      ),
    };
  }
}
