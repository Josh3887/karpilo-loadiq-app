# Provider Docs Registry

This registry is the control center for LoadIQ external API contracts. It lists
providers found in source, scaffolded providers, and planned-only providers
that require a future contract before implementation.

| Provider | App status | Contract file | Official docs | Last verified | Notes |
|---|---|---|---|---|---|
| Google Routes API | implemented | `maps/google-maps.contract.md` | https://developers.google.com/maps/documentation/routes/compute_route_directions | 2026-06-28 | Server-side Route Intelligence route estimates; legacy detailed contract remains at `google-routes.contract.md`. |
| Google Address Validation API | implemented | `maps/google-maps.contract.md` | https://developers.google.com/maps/documentation/address-validation/requests-validate-address | 2026-06-28 | Server-side address validation before routing; legacy detailed contract remains at `google-address-validation.contract.md`. |
| Google Weather API | implemented | `weather/google-weather.contract.md` | https://developers.google.com/maps/documentation/weather, https://developers.google.com/maps/documentation/weather/current-conditions, https://developers.google.com/maps/documentation/weather/hourly-forecast, https://developers.google.com/maps/documentation/weather/daily-forecast | 2026-06-28 | Primary app-facing Karpilo Weather Intelligence provider. |
| OpenWeather Current / Forecast / One Call | implemented | `weather/openweather.contract.md` | https://openweathermap.org/current, https://openweathermap.org/api/forecast5, https://openweathermap.org/api/one-call-3 | 2026-06-28 | Existing entitlement-gated weather profitability context plus secondary/fallback Karpilo Weather Intelligence provider. |
| National Weather Service API | implemented | `weather/nws.contract.md` | https://www.weather.gov/documentation/services-web-api, https://weather-gov.github.io/api/general-faqs | 2026-06-28 | Official U.S. weather validation and alert evidence layer. |
| EIA Open Data API | implemented | `eia.contract.md` | https://www.eia.gov/opendata/documentation.php | 2026-06-28 | Diesel baseline fuel context with cache fallback. |
| Trimble Maps / PC*Miler | scaffolded | `maps/trimble-maps.contract.md` | https://developer.trimblemaps.com/ | 2026-06-28 | Scaffolded only; exact route endpoint fields need provider-doc confirmation. |
| Stripe API | implemented | `payments/stripe.contract.md` | https://docs.stripe.com/api/checkout/sessions/create, https://docs.stripe.com/api/customer_portal/sessions/create, https://docs.stripe.com/webhooks/signature | 2026-06-28 | Checkout, portal, subscriptions, webhooks. |
| OpenAI Chat Completions API | implemented | `ai/openai.contract.md` | https://platform.openai.com/docs/api-reference/chat/create, https://platform.openai.com/docs/guides/structured-outputs | 2026-06-28 | Gated/dev Karpilo Atlas load analysis. |
| Supabase JavaScript clients | implemented | `database/supabase.contract.md` | https://supabase.com/docs/reference/javascript/initializing, https://supabase.com/docs/guides/auth/server-side/nextjs, https://supabase.com/docs/guides/api/securing-your-api | 2026-06-28 | Auth/session clients, admin/service-role writes, table access. |
| Sentry Next.js SDK | implemented | `analytics/sentry.contract.md` | https://docs.sentry.io/platforms/javascript/guides/nextjs/ | 2026-06-28 | Capture calls found; root Sentry init files were not found. |
| PostHog Capture API | implemented | `analytics/posthog.contract.md` | https://posthog.com/docs/api/capture, https://posthog.com/docs/libraries/next-js | 2026-06-28 | Internal analytics event capture. |
| Resend Email API | implemented | `email/resend.contract.md` | https://resend.com/docs/api-reference/emails/send-email | 2026-06-28 | Elevated admin email delivery. |
| Upstash Redis | implemented | `database/redis.contract.md` | https://upstash.com/docs/redis/howto/connect-with-upstash-redis, https://upstash.com/docs/redis/features/restapi | 2026-06-28 | Server-side Redis helpers. |
| Google Places API | planned | `maps/google-maps.contract.md` | https://developers.google.com/maps/documentation/places/web-service/overview | 2026-06-28 | Not implemented. Future contract section required before use. |
| Google Geocoding API | planned | `maps/google-maps.contract.md` | https://developers.google.com/maps/documentation/geocoding/overview | 2026-06-28 | Not implemented. Future contract section required before use. |
| Google Maps JavaScript API | planned | `maps/google-maps.contract.md` | https://developers.google.com/maps/documentation/javascript/overview | 2026-06-28 | Not implemented. Future contract section required before use. |
| AWS Location Service | planned | `maps/aws-location.contract.md` | https://docs.aws.amazon.com/location/ | 2026-06-28 | Not implemented. Future contract required before use. |
