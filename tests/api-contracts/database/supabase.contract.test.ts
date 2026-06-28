export const supabaseContractTestScaffold = {
  status: "scaffold",
  contractFile: "docs/api-contracts/database/supabase.contract.md",
  fixtureDirectory: "test-fixtures/api/database/supabase/",
  futureAssertions: [
    "SUPABASE_SERVICE_ROLE_KEY is never public",
    "RLS/service-role boundaries are not weakened by UI changes",
    "Supabase commands are never required for normal contract tests",
  ],
} as const;

