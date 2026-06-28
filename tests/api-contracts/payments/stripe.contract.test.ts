export const stripeContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/payments/stripe.contract.md",
  fixtureDirectory: "test-fixtures/api/payments/stripe/",
  futureAssertions: [
    "Stripe secret key and webhook secret are server-only",
    "checkout and portal responses normalize through billing domain state",
  ],
} as const;

