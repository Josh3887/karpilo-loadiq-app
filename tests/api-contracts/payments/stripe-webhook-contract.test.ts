export const stripeWebhookContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/payments/stripe.contract.md",
  fixtureDirectory: "test-fixtures/api/payments/stripe/",
  futureAssertions: [
    "webhook signature verification is required",
    "invalid signatures are rejected without mutating entitlement state",
    "Stripe webhook payloads are not logged with secrets",
  ],
} as const;

