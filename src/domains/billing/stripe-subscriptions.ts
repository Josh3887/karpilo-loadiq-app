import "server-only";

import Stripe from "stripe";

import {
  STRIPE_CHECKOUT_PLANS,
  StripeCheckoutPlan,
  StripePlanTier,
} from "@/config/stripe";
import {
  FOUNDER_ACCESS,
  FUTURE_PLATFORM_FEATURE_SCOPE,
  PILOT_ACCESS,
} from "@/config/pricing";
import { resolveFeatureAccessArchitecture } from "@/domains/billing/feature-access";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

function fromUnixTime(timestamp?: number | null) {
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

function asId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id;
}

function planFromPriceId(priceId: string | null | undefined) {
  return Object.values(STRIPE_CHECKOUT_PLANS).find(
    (plan) => plan.priceId && plan.priceId === priceId
  );
}

function entitlementStatusFromStripe(
  status: Stripe.Subscription.Status
): "trialing" | "active" | "past_due" | "canceled" | "expired" | "blocked" | "unknown" {
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "canceled") return "canceled";
  if (status === "incomplete_expired") return "expired";
  if (status === "unpaid") return "blocked";
  return "unknown";
}

function trialStatusFromStripe(subscription: Stripe.Subscription) {
  if (!subscription.trial_start && !subscription.trial_end) return null;
  const trialEnd = fromUnixTime(subscription.trial_end);

  if (
    subscription.status === "trialing" &&
    (!trialEnd || Date.parse(trialEnd) > Date.now())
  ) {
    return "active";
  }

  if (
    subscription.status === "trialing" &&
    trialEnd &&
    Date.parse(trialEnd) <= Date.now()
  ) {
    return "expired";
  }

  if (subscription.status === "canceled") return "ended";
  return "ended";
}

function trialDurationDays(subscription: Stripe.Subscription) {
  if (!subscription.trial_start || !subscription.trial_end) return null;
  const seconds = subscription.trial_end - subscription.trial_start;
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.round(seconds / 86_400);
}

function cohortCapForPlan(plan: StripeCheckoutPlan | null) {
  if (plan?.requiresProgram === "pilot50") return PILOT_ACCESS.maxSeats;
  if (plan?.requiresProgram === "launch500") return FOUNDER_ACCESS.maxSeats;
  return null;
}

function lifetimeLockForPlan(plan: StripeCheckoutPlan | null) {
  return plan?.tier === "pilot" || plan?.tier === "launch500";
}

const ENTITLEMENT_ARCHITECTURE_COLUMNS = [
  "subscription_tier",
  "feature_access",
  "grandfathered_access",
  "lifetime_access",
  "full_loadiq_access",
  "fleet_enabled",
  "fleetos_pro_access",
  "truck_capacity_limit",
] as const;

function subscriptionTierForPlan(plan: StripeCheckoutPlan | null) {
  if (plan?.tier === "pilot") return "pilot";
  if (plan?.tier === "launch500") return "launch";
  return "gold";
}

function entitlementArchitectureFieldsForPlan(
  plan: StripeCheckoutPlan | null
) {
  const hasLifetimeLock = lifetimeLockForPlan(plan);
  const subscriptionTier = subscriptionTierForPlan(plan);
  const access = resolveFeatureAccessArchitecture({
    tier: plan?.tier ?? "gold",
    subscription_tier: subscriptionTier,
    lifetime_price_lock: hasLifetimeLock,
    grandfathered_access: hasLifetimeLock,
    lifetime_access: hasLifetimeLock,
    full_loadiq_access: true,
    fleet_enabled: false,
    fleetos_pro_access: false,
  });

  return {
    subscription_tier: subscriptionTier,
    feature_access: access.featureAccess === "none" ? null : access.featureAccess,
    grandfathered_access: access.grandfatheredAccess,
    lifetime_access: access.lifetimeAccess,
    full_loadiq_access: access.fullLoadIqAccess,
    fleet_enabled: access.fleetEnabled,
    fleetos_pro_access: access.fleetOsProAccess,
    truck_capacity_limit: access.truckCapacityLimit,
  };
}

function withoutEntitlementArchitectureColumns<
  T extends Record<string, unknown>,
>(record: T) {
  const legacyRecord = { ...record };
  for (const column of ENTITLEMENT_ARCHITECTURE_COLUMNS) {
    delete legacyRecord[column];
  }
  return legacyRecord;
}

function isMissingEntitlementArchitectureColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  const message = maybeError.message?.toLowerCase() ?? "";

  return (
    maybeError.code === "PGRST204" ||
    ENTITLEMENT_ARCHITECTURE_COLUMNS.some((column) =>
      message.includes(column)
    )
  );
}

async function insertSubscriptionRecord(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  record: Record<string, unknown>
) {
  const { error } = await supabase.from("subscriptions").insert(record);
  if (!error) return;

  if (isMissingEntitlementArchitectureColumn(error)) {
    const { error: fallbackError } = await supabase
      .from("subscriptions")
      .insert(withoutEntitlementArchitectureColumns(record));
    if (!fallbackError) return;
    throw fallbackError;
  }

  throw error;
}

async function updateSubscriptionRecord(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
  record: Record<string, unknown>
) {
  const { error } = await supabase
    .from("subscriptions")
    .update(record)
    .eq("id", id);
  if (!error) return;

  if (isMissingEntitlementArchitectureColumn(error)) {
    const { error: fallbackError } = await supabase
      .from("subscriptions")
      .update(withoutEntitlementArchitectureColumns(record))
      .eq("id", id);
    if (!fallbackError) return;
    throw fallbackError;
  }

  throw error;
}

export function planFromStripeSubscription(
  subscription: Stripe.Subscription
): StripeCheckoutPlan | null {
  const metadataPlan = subscription.metadata?.plan_id;
  if (
    metadataPlan === "pro-monthly" ||
    metadataPlan === "pro-annual" ||
    metadataPlan === "pilot-monthly" ||
    metadataPlan === "pilot-annual" ||
    metadataPlan === "launch500-monthly" ||
    metadataPlan === "launch500-annual"
  ) {
    return STRIPE_CHECKOUT_PLANS[metadataPlan];
  }

  const priceId = subscription.items.data[0]?.price.id;
  return planFromPriceId(priceId) ?? null;
}

export async function userHasPilotApproval(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("pilot_access")
    .select("id, seat_number, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function insertPricingLock(params: {
  userId: string;
  plan: StripeCheckoutPlan | null;
  subscription: Stripe.Subscription;
}) {
  if (!params.plan?.requiresProgram || params.plan.requiresProgram === "standard") {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const isPilot = params.plan.requiresProgram === "pilot50";
  const hasLifetimeLock = lifetimeLockForPlan(params.plan);
  const { error } = await supabase.from("operator_pricing_locks").insert({
    user_id: params.userId,
    program: params.plan.requiresProgram,
    tier: params.plan.tier,
    monthly_price: isPilot
      ? PILOT_ACCESS.monthlyPrice
      : FOUNDER_ACCESS.monthlyPrice,
    annual_price: isPilot ? PILOT_ACCESS.annualPrice : FOUNDER_ACCESS.annualPrice,
    billing_provider: "stripe",
    provider_price_id: params.subscription.items.data[0]?.price.id ?? null,
    provider_subscription_id: params.subscription.id,
    lifetime_lock: hasLifetimeLock,
    future_feature_access_scope: hasLifetimeLock
      ? FUTURE_PLATFORM_FEATURE_SCOPE
      : null,
    price_subject_to_change: !hasLifetimeLock,
    cohort_phase: params.plan.requiresProgram,
    cohort_cap: cohortCapForPlan(params.plan),
    metadata: {
      plan_id: params.plan.id,
      stripe_status: params.subscription.status,
    },
  });

  if (error && error.code !== "23505") {
    throw error;
  }
}

async function upsertPricingLockStatus(params: {
  userId: string;
  plan: StripeCheckoutPlan | null;
  subscription: Stripe.Subscription;
}) {
  if (!params.plan?.requiresProgram || params.plan.requiresProgram === "standard") {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const isPilot = params.plan.requiresProgram === "pilot50";
  const hasLifetimeLock = lifetimeLockForPlan(params.plan);
  const subscriptionStatus = params.subscription.status;
  const lockStatus =
    subscriptionStatus === "active" || subscriptionStatus === "trialing"
      ? "active"
      : subscriptionStatus === "past_due" || subscriptionStatus === "unpaid"
        ? "past_due"
        : "lapsed";
  const now = new Date().toISOString();

  const { error } = await supabase.from("pricing_lock_status").upsert(
    {
      user_id: params.userId,
      cohort: params.plan.requiresProgram,
      lock_status: lockStatus,
      billing_provider: "stripe",
      provider_subscription_id: params.subscription.id,
      monthly_price: isPilot
        ? PILOT_ACCESS.monthlyPrice
        : FOUNDER_ACCESS.monthlyPrice,
      annual_price: isPilot
        ? PILOT_ACCESS.annualPrice
        : FOUNDER_ACCESS.annualPrice,
      future_feature_access_scope: hasLifetimeLock
        ? FUTURE_PLATFORM_FEATURE_SCOPE
        : null,
      price_subject_to_change: !hasLifetimeLock,
      cohort_phase: params.plan.requiresProgram,
      cohort_cap: cohortCapForPlan(params.plan),
      active_since: now,
      lapsed_at: lockStatus === "lapsed" ? now : null,
      reason:
        lockStatus === "active"
          ? null
          : `stripe_subscription_${subscriptionStatus}`,
      metadata: {
        plan_id: params.plan.id,
        stripe_status: subscriptionStatus,
        stripe_price_id: params.subscription.items.data[0]?.price.id ?? null,
      },
      updated_at: now,
    },
    {
      onConflict: "user_id,cohort",
    }
  );

  if (error) throw error;
}

export async function findStripeCustomerIdForUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .not("provider_customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.provider_customer_id ?? null;
}

export async function rememberStripeCustomer(params: {
  userId: string;
  customerId: string;
  email?: string | null;
}) {
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", params.userId)
    .eq("provider", "stripe")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  const baseRecord = {
    user_id: params.userId,
    provider: "stripe",
    provider_customer_id: params.customerId,
    plan_code: "pending",
    tier: "unknown",
    status: "inactive",
    entitlement_status: "unknown",
    trial_status: null,
    trial_duration_days: null,
    billing_starts_at: null,
    lifetime_price_lock: false,
    future_feature_access_scope: null,
    cohort_phase: null,
    cohort_cap: null,
    price_subject_to_change: null,
    subscription_tier: null,
    feature_access: null,
    grandfathered_access: false,
    lifetime_access: false,
    full_loadiq_access: false,
    fleet_enabled: false,
    fleetos_pro_access: false,
    truck_capacity_limit: null,
    metadata: {
      email: params.email ?? null,
      customer_created_by: "checkout_session_route",
    },
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await updateSubscriptionRecord(supabase, existing.id, baseRecord);
    return;
  }

  await insertSubscriptionRecord(supabase, baseRecord);
}

async function findUserIdForStripeSubscription(subscription: Stripe.Subscription) {
  const metadataUserId = subscription.metadata?.user_id;
  if (metadataUserId) return metadataUserId;

  const subscriptionId = subscription.id;
  const customerId = asId(subscription.customer);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id")
    .or(
      `provider_subscription_id.eq.${subscriptionId},provider_customer_id.eq.${customerId}`
    )
    .eq("provider", "stripe")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.user_id ?? null;
}

export async function upsertStripeSubscription(params: {
  subscription: Stripe.Subscription;
  userId?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const subscription = params.subscription;
  const plan = planFromStripeSubscription(subscription);
  const tier: StripePlanTier = plan?.tier ?? "gold";
  const userId =
    params.userId ?? (await findUserIdForStripeSubscription(subscription));

  if (!userId) {
    throw new Error(
      `Unable to resolve Supabase user for Stripe subscription ${subscription.id}.`
    );
  }

  const subscriptionAny = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const hasLifetimeLock = lifetimeLockForPlan(plan);
  const trialEnd = fromUnixTime(subscription.trial_end);
  const currentPeriodStart = fromUnixTime(subscriptionAny.current_period_start);
  const currentPeriodEnd = fromUnixTime(subscriptionAny.current_period_end);
  const entitlementArchitecture = entitlementArchitectureFieldsForPlan(plan);

  const record = {
    user_id: userId,
    provider: "stripe",
    provider_customer_id: asId(subscription.customer),
    provider_subscription_id: subscription.id,
    plan_code: plan?.id ?? subscription.items.data[0]?.price.id ?? tier,
    tier,
    status: subscription.status,
    entitlement_status: entitlementStatusFromStripe(subscription.status),
    billing_interval: plan?.interval ?? subscription.items.data[0]?.price.recurring?.interval ?? null,
    trial_start: fromUnixTime(subscription.trial_start),
    trial_end: trialEnd,
    trial_duration_days: trialDurationDays(subscription),
    trial_status: trialStatusFromStripe(subscription),
    billing_starts_at: trialEnd ?? currentPeriodStart,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: fromUnixTime(subscription.canceled_at),
    pilot_pricing_locked: hasLifetimeLock,
    lifetime_price_lock: hasLifetimeLock,
    future_feature_access_scope: hasLifetimeLock
      ? FUTURE_PLATFORM_FEATURE_SCOPE
      : null,
    cohort_phase: plan?.requiresProgram ?? null,
    cohort_cap: cohortCapForPlan(plan),
    price_subject_to_change: !hasLifetimeLock,
    ...entitlementArchitecture,
    metadata: {
      stripe_price_id: subscription.items.data[0]?.price.id ?? null,
      stripe_product_id: asId(subscription.items.data[0]?.price.product),
      stripe_status: subscription.status,
      stripe_metadata: subscription.metadata,
      trial_duration_days: trialDurationDays(subscription),
      trial_status: trialStatusFromStripe(subscription),
      entitlement_architecture: entitlementArchitecture,
    },
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("provider", "stripe")
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    await updateSubscriptionRecord(supabase, existing.id, record);
    await insertPricingLock({ userId, plan, subscription });
    await upsertPricingLockStatus({ userId, plan, subscription });
    return;
  }

  await insertSubscriptionRecord(supabase, record);
  await insertPricingLock({ userId, plan, subscription });
  await upsertPricingLockStatus({ userId, plan, subscription });
}

export async function markStripeSubscriptionPaymentFailed(params: {
  subscriptionId?: string | null;
  customerId?: string | null;
}) {
  if (!params.subscriptionId && !params.customerId) return;

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      entitlement_status: "past_due",
      metadata: {
        last_invoice_payment_failed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("provider", "stripe");

  query = params.subscriptionId
    ? query.eq("provider_subscription_id", params.subscriptionId)
    : query.eq("provider_customer_id", params.customerId);

  const { error } = await query;
  if (error) throw error;

  let lockQuery = supabase
    .from("pricing_lock_status")
    .update({
      lock_status: "past_due",
      reason: "stripe_invoice_payment_failed",
      updated_at: new Date().toISOString(),
    })
    .eq("billing_provider", "stripe");

  if (params.subscriptionId) {
    lockQuery = lockQuery.eq("provider_subscription_id", params.subscriptionId);
  }

  const { error: lockError } = await lockQuery;
  if (lockError) throw lockError;
}
