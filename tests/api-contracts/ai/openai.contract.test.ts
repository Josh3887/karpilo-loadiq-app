export const openAiContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/ai/openai.contract.md",
  fixtureDirectory: "test-fixtures/api/ai/openai/",
  futureAssertions: [
    "OpenAI key is server-only",
    "deterministic LoadIQ math is not labeled as generated AI",
    "AI output is labeled only when a generated provider response exists",
  ],
} as const;

