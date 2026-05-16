import "server-only";

import { FUTURE_PLATFORM_FEATURE_SCOPE } from "@/config/pricing";
import type { SubscriptionAccessRecord } from "@/domains/billing/entitlement-service";
import {
  type BillingTestHarnessState,
  type InternalBillingTestHarnessSnapshot,
} from "@/domains/billing/internal-test-harness-types";
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
    case "pilot_lifetime_full_access":
      return {
        simulated_state: state,
        entitlement_status: "active",
        tier: "pilot",
        program: "pilot",
        trial_status: "not_required",
        trial_duration_days: null,
        trial_start: null,
        trial_end: null,
        billing_starts_at: now,
        lifetime_price_lock: true,
        future_feature_access_scope: FUTURE_FEATURE_SCOPE_SLUG,
        cohort_phase: "pilot",
        cohort_cap: 50,
        price_subject_to_change: false,
        notes:
          "Internal dummy billing/entitlement test account only. Not a real Stripe subscriber.",
      };
    case "launch_lifetime_full_access":
      return {
        simulated_state: state,
        entitlement_status: "active",
        tier: "launch500",
        program: "launch500",
        trial_status: "not_required",
        trial_duration_days: null,
        trial_start: null,
        trial_end: null,
        billing_starts_at: now,
        lifetime_price_lock: true,
        future_feature_access_scope: FUTURE_FEATURE_SCOPE_SLUG,
        cohort_phase: "launch",
        cohort_cap: 500,
        price_subject_to_change: false,
        notes: "Internal test state: Legacy Launch lifetime access. Not a real Stripe subscriber.",
      };
    case "platinum_coming_soon":
      return {
        simulated_state: state,
        entitlement_status: "unknown",
        tier: "platinum",
        program: "platinum",
        trial_status: "not_available",
        trial_duration_days: 7,
        trial_start: null,
        trial_end: null,
        billing_starts_at: null,
        lifetime_price_lock: false,
        future_feature_access_scope: null,
        cohort_phase: "planned",
        cohort_cap: null,
        price_subject_to_change: true,
        notes:
          "Internal test state: Platinum planned/coming soon. Checkout remains disabled.",
      };
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
    simulatedState: source.simulated_state,
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

  return {
    provider: "manual",
    status: snapshot.entitlementStatus,
    entitlement_status: snapshot.entitlementStatus,
    tier: snapshot.tier,
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
