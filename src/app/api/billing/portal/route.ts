import { NextResponse } from "next/server";

import { getAppUrl } from "@/config/stripe";
import { findStripeCustomerIdForUser } from "@/domains/billing/stripe-subscriptions";
import { createClient } from "@/lib/supabase-server";
import { getStripeServerClient } from "@/lib/stripe-server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const customerId = await findStripeCustomerIdForUser(user.id);

  if (!customerId) {
    return NextResponse.json(
      { error: "No Stripe customer found for this account." },
      { status: 404 }
    );
  }

  const stripe = getStripeServerClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
