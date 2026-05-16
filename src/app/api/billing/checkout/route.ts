import { NextResponse } from "next/server";

import { getAppUrl, getStripeCheckoutPlan } from "@/config/stripe";
import { userCanCheckoutProgram } from "@/domains/billing/operator-program";
import {
  findStripeCustomerIdForUser,
  rememberStripeCustomer,
} from "@/domains/billing/stripe-subscriptions";
import { createClient } from "@/lib/supabase-server";
import { getStripeServerClient } from "@/lib/stripe-server";

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
    },
    subscription_data: {
      trial_period_days: plan.trialDays,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        tier: plan.tier,
        program: plan.requiresProgram ?? "standard",
      },
    },
    allow_promotion_codes: true,
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
