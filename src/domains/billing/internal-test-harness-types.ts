export const BILLING_TEST_HARNESS_STATES = [
  "no_subscription",
  "gold_trial_active",
  "gold_trial_expired",
  "gold_active",
  "gold_past_due",
  "gold_canceled",
  "pilot_lifetime_full_access",
  "launch_lifetime_full_access",
  "platinum_coming_soon",
] as const;

export type BillingTestHarnessState =
  (typeof BILLING_TEST_HARNESS_STATES)[number];

export type InternalBillingTestHarnessSnapshot = {
  email: string;
  enabled: boolean;
  simulatedState: BillingTestHarnessState;
  entitlementStatus: string | null;
  tier: string | null;
  program: string | null;
  trialStatus: string | null;
  trialDurationDays: number | null;
  trialStart: string | null;
  trialEnd: string | null;
  billingStartsAt: string | null;
  lifetimePriceLock: boolean | null;
  futureFeatureAccessScope: string | null;
  cohortPhase: string | null;
  cohortCap: number | null;
  priceSubjectToChange: boolean | null;
  notes: string | null;
  error: string | null;
};

export const BILLING_TEST_HARNESS_STATE_LABELS: Record<
  BillingTestHarnessState,
  string
> = {
  no_subscription: "No subscription",
  gold_trial_active: "Gold trial active",
  gold_trial_expired: "Gold trial expired",
  gold_active: "Gold active",
  gold_past_due: "Gold past due",
  gold_canceled: "Gold canceled",
  pilot_lifetime_full_access: "Pilot lifetime full access",
  launch_lifetime_full_access: "Launch lifetime full access",
  platinum_coming_soon: "Platinum coming soon",
};

export function isBillingTestHarnessState(
  value: unknown
): value is BillingTestHarnessState {
  return BILLING_TEST_HARNESS_STATES.includes(
    value as BillingTestHarnessState
  );
}
