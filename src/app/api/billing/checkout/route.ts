import { NextResponse } from "next/server";

import { getAppUrl, getStripeCheckoutPlan } from "@/config/stripe";
import { userCanCheckoutProgram } from "@/domains/billing/operator-program";
import {
  findStripeCustomerIdForUser,
  rememberStripeCustomer,
} from "@/domains/billing/stripe-subscriptions";
import { createClient } from "@/lib/supabase-server";
import { getStripeServerClient } from "@/lib/stripe-server";

type TrialEligibility = {
  eligible: boolean;
  reason: string;
};

type TrialHistoryRow = {
  trial_start?: string | null;
  trial_end?: string | null;
  trial_status?: string | null;
  status?: string | null;
};

function localTrialUsed(row: TrialHistoryRow) {
  const trialStatus = row.trial_status?.toLowerCase();

  return Boolean(
    row.trial_start ||
      row.trial_end ||
      row.status === "trialing" ||
      trialStatus === "active" ||
      trialStatus === "ended" ||
      trialStatus === "used" ||
      trialStatus === "expired" ||
      trialStatus === "ineligible"
  );
}

async function resolveTrialEligibility({
  supabase,
  stripe,
  userId,
  customerId,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  stripe: ReturnType<typeof getStripeServerClient>;
  userId: string;
  customerId: string;
}): Promise<TrialEligibility> {
  const { data: localRows, error } = await supabase
    .from("subscriptions")
    .select("trial_start,trial_end,trial_status,status")
    .eq("user_id", userId)
    .limit(100);

  if (error) {
    return { eligible: false, reason: "local_trial_history_unavailable" };
  }

  if ((localRows ?? []).some(localTrialUsed)) {
    return { eligible: false, reason: "local_trial_history_found" };
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100,
    });

    const stripeTrialUsed = subscriptions.data.some((subscription) =>
      Boolean(
        subscription.trial_start ||
          subscription.trial_end ||
          subscription.status === "trialing"
      )
    );

    if (stripeTrialUsed) {
      return { eligible: false, reason: "stripe_trial_history_found" };
    }
  } catch {
    return { eligible: false, reason: "stripe_trial_history_unavailable" };
  }

  return { eligible: true, reason: "first_trial_available" };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    planId?: string;
  };
  const plan = getStripeCheckoutPlan(body.planId);

  if (!plan) {
    return NextResponse.json({ error: "Unknown checkout plan." }, { status: 400 });
  }

  if (!plan.priceId || plan.priceId.includes("xxxxx")) {
    return NextResponse.json(
      {
        error: `${plan.priceEnvVar} must be set to a real Stripe sandbox Price ID before checkout can start.`,
      },
      { status: 500 }
    );
  }

  if (
    plan.requiresProgram &&
    !(await userCanCheckoutProgram({
      userId: user.id,
      program: plan.requiresProgram,
    }))
  ) {
    return NextResponse.json(
      { error: "This checkout requires assigned operator program access." },
      { status: 403 }
    );
  }

  const stripe = getStripeServerClient();
  const appUrl = getAppUrl();
  let customerId = await findStripeCustomerIdForUser(user.id);

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        source: "loadiq_checkout",
      },
    });
    customerId = customer.id;
    await rememberStripeCustomer({
      userId: user.id,
      customerId,
      email: user.email,
    });
  }

  const trialEligibility = await resolveTrialEligibility({
    supabase,
    stripe,
    userId: user.id,
    customerId,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      plan_id: plan.id,
      tier: plan.tier,
      program: plan.requiresProgram ?? "standard",
      trial_eligible: String(trialEligibility.eligible),
      trial_eligibility_reason: trialEligibility.reason,
    },
    subscription_data: {
      ...(trialEligibility.eligible && plan.trialDays > 0
        ? { trial_period_days: plan.trialDays }
        : {}),
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        tier: plan.tier,
        program: plan.requiresProgram ?? "standard",
        trial_eligible: String(trialEligibility.eligible),
        trial_eligibility_reason: trialEligibility.reason,
      },
    },
    allow_promotion_codes: true,
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
