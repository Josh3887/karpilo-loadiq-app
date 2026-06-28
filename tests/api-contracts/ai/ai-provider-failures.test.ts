export const aiProviderFailuresTestScaffold = {
  status: "scaffold",
  requiredFailureClasses: [
    "401 unauthorized",
    "403 forbidden",
    "404 model or endpoint drift",
    "408 or timeout",
    "429 rate limited",
    "500+ provider unavailable",
    "malformed JSON",
    "empty response",
    "network failure",
  ],
} as const;

