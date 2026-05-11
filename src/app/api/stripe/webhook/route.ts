import Stripe from "stripe";

import {
  markStripeSubscriptionPaymentFailed,
  rememberStripeCustomer,
  upsertStripeSubscription,
} from "@/domains/billing/stripe-subscriptions";
import {
  getStripeServerClient,
  getStripeWebhookSecret,
} from "@/lib/stripe-server";

export const runtime = "nodejs";

function asId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id;
}

export async function POST(request: Request) {
  const stripe = getStripeServerClient();
  const webhookSecret = getStripeWebhookSecret();
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!webhookSecret) {
    return new Response("Missing STRIPE_WEBHOOK_SECRET.", { status: 500 });
  }

  if (!signature) {
    return new Response("Missing Stripe signature.", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature.";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.user_id ?? session.client_reference_id ?? null;
        const customerId = asId(session.customer);

        if (userId && customerId) {
          await rememberStripeCustomer({
            userId,
            customerId,
            email: session.customer_details?.email,
          });
        }

        if (session.subscription && userId) {
          const subscription = await stripe.subscriptions.retrieve(
            asId(session.subscription) as string
          );
          await upsertStripeSubscription({ subscription, userId });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertStripeSubscription({ subscription });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        await markStripeSubscriptionPaymentFailed({
          subscriptionId: asId(invoice.subscription ?? null),
          customerId: asId(invoice.customer),
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process webhook.";
    return new Response(message, { status: 500 });
  }

  return Response.json({ received: true });
}
