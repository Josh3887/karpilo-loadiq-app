import "server-only";

import Stripe from "stripe";

import {
  STRIPE_CHECKOUT_PLANS,
  StripeCheckoutPlan,
  StripePlanTier,
} from "@/config/stripe";
import { FOUNDER_ACCESS, PILOT_ACCESS } from "@/config/pricing";
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
    lifetime_lock: true,
    metadata: {
      plan_id: params.plan.id,
      stripe_status: params.subscription.status,
    },
  });

  if (error && error.code !== "23505") {
    throw error;
  }
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
    plan_code: "free",
    tier: "free",
    status: "inactive",
    metadata: {
      email: params.email ?? null,
      customer_created_by: "checkout_session_route",
    },
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("subscriptions")
      .update(baseRecord)
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("subscriptions").insert(baseRecord);
  if (error) throw error;
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
  const tier: StripePlanTier = plan?.tier ?? "pro";
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

  const record = {
    user_id: userId,
    provider: "stripe",
    provider_customer_id: asId(subscription.customer),
    provider_subscription_id: subscription.id,
    plan_code: plan?.id ?? subscription.items.data[0]?.price.id ?? tier,
    tier,
    status: subscription.status,
    billing_interval: plan?.interval ?? subscription.items.data[0]?.price.recurring?.interval ?? null,
    trial_start: fromUnixTime(subscription.trial_start),
    trial_end: fromUnixTime(subscription.trial_end),
    current_period_start: fromUnixTime(subscriptionAny.current_period_start),
    current_period_end: fromUnixTime(subscriptionAny.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: fromUnixTime(subscription.canceled_at),
    pilot_pricing_locked: tier === "pilot" || tier === "launch500",
    metadata: {
      stripe_price_id: subscription.items.data[0]?.price.id ?? null,
      stripe_product_id: asId(subscription.items.data[0]?.price.product),
      stripe_status: subscription.status,
      stripe_metadata: subscription.metadata,
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
    const { error } = await supabase
      .from("subscriptions")
      .update(record)
      .eq("id", existing.id);
    if (error) throw error;
    await insertPricingLock({ userId, plan, subscription });
    return;
  }

  const { error } = await supabase.from("subscriptions").insert(record);
  if (error) throw error;
  await insertPricingLock({ userId, plan, subscription });
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
}
