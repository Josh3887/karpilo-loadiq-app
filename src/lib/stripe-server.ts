import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required for Stripe billing routes.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getStripeWebhookSecret() {
  // TODO(stripe): Set STRIPE_WEBHOOK_SECRET to the endpoint secret from the
  // Stripe Dashboard or `stripe listen --forward-to ...` while testing locally.
  return process.env.STRIPE_WEBHOOK_SECRET;
}
