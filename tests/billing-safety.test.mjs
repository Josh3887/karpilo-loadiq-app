import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Stripe from "stripe";

// Offline billing safety tests: no Stripe API requests, charges, or database writes.
const webhook = readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
const checkout = readFileSync("src/app/api/billing/checkout/route.ts", "utf8");
const portal = readFileSync("src/app/api/billing/portal/route.ts", "utf8");

test("Stripe rejects tampered webhook payloads", () => {
  const stripe = new Stripe("sk_test_offline_only");
  const secret = "whsec_offline_test_secret";
  const payload = JSON.stringify({ id: "evt_test", type: "invoice.payment_failed" });
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.doesNotThrow(() => stripe.webhooks.constructEvent(payload, signature, secret));
  assert.throws(() => stripe.webhooks.constructEvent(payload + " ", signature, secret));
});

test("webhook route verifies signature before processing billing events", () => {
  assert.match(webhook, /stripe\.webhooks\.constructEvent\(payload, signature, webhookSecret\)/);
  assert.match(webhook, /if \(!signature\)/);
  assert.match(webhook, /if \(!webhookSecret\)/);
  for (const event of ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted", "invoice.payment_failed"]) {
    assert.ok(webhook.includes('case "' + event + '"'), "Missing billing event: " + event);
  }
});

test("checkout requires authentication and approved plan", () => {
  assert.match(checkout, /if \(!user\)/);
  assert.match(checkout, /if \(!plan\)/);
  assert.match(checkout, /userCanCheckoutProgram/);
  assert.match(checkout, /mode: "subscription"/);
});

test("billing portal requires authenticated customer", () => {
  assert.match(portal, /if \(!user\)/);
  assert.match(portal, /if \(!customerId\)/);
  assert.match(portal, /stripe\.billingPortal\.sessions\.create/);
});
