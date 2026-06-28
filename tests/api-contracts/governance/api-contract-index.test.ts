export const apiContractIndexTestScaffold = {
  status: "scaffold",
  futureAssertions: [
    "every provider index row has a contract file, test file, fixture directory, owner, env vars, and last verified date",
    "legacy flat contracts are either reconciled or intentionally tracked during migration",
  ],
} as const;

