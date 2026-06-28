export const apiContractDriftTestScaffold = {
  status: "scaffold",
  futureAssertions: [
    "provider code references have matching contract entries",
    "contract endpoints have matching mock fixture coverage",
    "new env vars are reflected in env contract docs before merge",
  ],
} as const;

