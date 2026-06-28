export const BILLING_TEST_HARNESS_STATES = [
  "no_subscription",
  "gold_trial_active",
  "gold_trial_expired",
  "gold_active",
  "gold_past_due",
  "gold_canceled",
  "beta_testing_app_access",
  "beta_testing_cap_full",
  "legacy_launch_silver_active",
  "legacy_launch_gold_active",
  "legacy_launch_platinum_active",
  "legacy_launch_pro_active",
  "legacy_launch_expired",
  "founding_operator_phase_1_silver_active",
  "founding_operator_phase_1_gold_active",
  "founding_operator_phase_1_platinum_active",
  "founding_operator_phase_1_pro_active",
  "founding_operator_phase_1_cap_full",
  "founding_operator_phase_2_silver_active",
  "founding_operator_phase_2_gold_active",
  "founding_operator_phase_2_platinum_active",
  "founding_operator_phase_2_pro_active",
  "founding_operator_phase_2_expired",
  "open_market_silver_active",
  "open_market_gold_active",
  "open_market_platinum_active",
  "open_market_pro_active",
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
  beta_testing_app_access: "Beta testing app access",
  beta_testing_cap_full: "Beta testing cap full",
  legacy_launch_silver_active: "Founding 50 pilot Silver alias",
  legacy_launch_gold_active: "Founding 50 pilot active",
  legacy_launch_platinum_active: "Founding 50 pilot Platinum alias",
  legacy_launch_pro_active: "Founding 50 pilot Pro alias",
  legacy_launch_expired: "Founding 50 pilot expired",
  founding_operator_phase_1_silver_active:
    "Launch 500 Silver alias",
  founding_operator_phase_1_gold_active:
    "Launch 500 active",
  founding_operator_phase_1_platinum_active:
    "Launch 500 Platinum alias",
  founding_operator_phase_1_pro_active:
    "Launch 500 Pro alias",
  founding_operator_phase_1_cap_full: "Launch 500 cap full",
  founding_operator_phase_2_silver_active:
    "Launch 500 second-window Silver alias",
  founding_operator_phase_2_gold_active:
    "Launch 500 second-window active",
  founding_operator_phase_2_platinum_active:
    "Launch 500 second-window Platinum alias",
  founding_operator_phase_2_pro_active:
    "Launch 500 second-window Pro alias",
  founding_operator_phase_2_expired: "Launch 500 expired",
  open_market_silver_active: "Standard Public Silver alias",
  open_market_gold_active: "Standard Public active",
  open_market_platinum_active: "Standard Public Platinum alias",
  open_market_pro_active: "Standard Public Pro alias",
};

export function isBillingTestHarnessState(
  value: unknown
): value is BillingTestHarnessState {
  return BILLING_TEST_HARNESS_STATES.includes(
    value as BillingTestHarnessState
  );
}
