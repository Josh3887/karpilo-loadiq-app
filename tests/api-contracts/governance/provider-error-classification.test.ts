export const providerErrorClassificationTestScaffold = {
  status: "scaffold",
  requiredFailureClasses: [
    "401 unauthorized",
    "403 forbidden",
    "404 not found or endpoint drift",
    "408 or timeout",
    "429 rate limited",
    "500+ provider unavailable",
    "malformed JSON",
    "empty response",
    "network failure",
  ],
  futureAssertions: [
    "generic provider errors are not the final standard",
    "safe error metadata excludes secrets, full URLs with query strings, raw headers, and sensitive provider bodies",
  ],
} as const;

