export const envSafetyTestScaffold = {
  status: "scaffold",
  forbiddenPublicSecretPatterns: [
    "NEXT_PUBLIC_OPENAI_API_KEY",
    "NEXT_PUBLIC_GOOGLE_WEATHER_API_KEY",
    "NEXT_PUBLIC_STRIPE_SECRET_KEY",
    "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_RESEND_API_KEY",
    "NEXT_PUBLIC_SENTRY_AUTH_TOKEN",
  ],
  acceptablePublicVariablesWhenDocumented: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_POSTHOG_KEY",
    "NEXT_PUBLIC_SENTRY_DSN",
    "NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY",
  ],
  futureAssertions: [
    ".env.local is gitignored",
    ".env.example includes all documented required provider env vars",
    "server-only secrets are not prefixed with NEXT_PUBLIC_",
    "browser-safe vars are explicitly documented",
  ],
} as const;

