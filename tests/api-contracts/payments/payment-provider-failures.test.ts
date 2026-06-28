export const paymentProviderFailuresTestScaffold = {
  status: "scaffold",
  requiredFailureClasses: [
    "401 unauthorized",
    "403 forbidden",
    "404 object or endpoint not found",
    "408 or timeout",
    "429 rate limited",
    "500+ provider unavailable",
    "malformed JSON",
    "empty response",
    "network failure",
    "invalid webhook signature",
  ],
} as const;

