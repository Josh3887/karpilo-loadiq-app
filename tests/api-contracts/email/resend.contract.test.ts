export const resendContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/email/resend.contract.md",
  fixtureDirectory: "test-fixtures/api/email/resend/",
  futureAssertions: [
    "Resend API key is server-only",
    "email provider failures do not expose message bodies or recipient details",
  ],
} as const;

