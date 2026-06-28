export const verifyEnvSafetyScaffold = {
  status: "scaffold",
  purpose:
    "Future check that documented provider env vars are represented safely and server-only secrets do not use NEXT_PUBLIC_ prefixes.",
  forbiddenPublicSecretPatterns: [
    "NEXT_PUBLIC_OPENAI_API_KEY",
    "NEXT_PUBLIC_GOOGLE_WEATHER_API_KEY",
    "NEXT_PUBLIC_STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_RESEND_API_KEY",
    "NEXT_PUBLIC_SENTRY_AUTH_TOKEN",
  ],
  liveProviderAccess: false,
} as const;

