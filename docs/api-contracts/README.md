# Karpilo LoadIQ API Contracts

API contracts are provider-alignment control documents. They are not feature
docs, product promises, implementation tickets, or runtime code. Their job is
to keep external provider usage aligned with official provider documentation
and mapped back to the LoadIQ source files that call, normalize, or display
provider data.

Feature behavior remains in `docs/features/`. Provider request/response,
authentication, error, quota, privacy, and drift controls belong here.

## Governance Rules

- Official provider documentation is required before a provider behavior is
  treated as contractually valid.
- No request or response fields may be invented from memory, wrapper-package
  examples, old app behavior, Stack Overflow, Reddit, or blog posts.
- If official documentation cannot confirm a field or behavior, mark it
  `UNVERIFIED -- requires provider-doc confirmation or removal`.
- Legacy or deprecated APIs must be marked in the contract before merge.
- App usage must be mapped to concrete source files.
- Every contract needs a drift-risk section.
- Every new external API integration must create or update a provider contract
  before merge.
- Secrets must never be printed or committed.
- Contracts are documentation and governance only; they do not implement runtime
  behavior.

## Implemented Providers Found

- Google Routes API, through LoadIQ server-side Route Intelligence.
- Google Address Validation API, through LoadIQ server-side Route Intelligence.
- Google Weather API, through server-side Karpilo Weather Intelligence.
- OpenWeather Current Weather, 5 day / 3 hour Forecast, and One Call 3.0 APIs,
  through weather profitability and server-side Karpilo Weather Intelligence.
- National Weather Service API, through server-side Karpilo Weather
  Intelligence validation and alert evidence.
- U.S. Energy Information Administration Open Data API, for national diesel
  baseline fuel context.
- Stripe API, for checkout, customer portal, subscriptions, and webhooks.
- OpenAI Chat Completions API, for gated/dev Karpilo Atlas AI load analysis.
- Supabase JavaScript clients and REST-backed table/auth operations.
- Sentry Next.js SDK capture surfaces, with no root Sentry init file found in
  this audit.
- PostHog capture API, through internal analytics routing.
- Resend email API, for elevated-admin email delivery.
- Upstash Redis SDK/REST endpoint, for server-side cache helpers.

## Scaffolded Providers Found

- Trimble Maps / PC*Miler truck routing is scaffolded only and returns
  unavailable. No live Trimble API call is wired.

## Planned/Future Providers Only

These providers are referenced by docs, UI copy, future provider language, or
expected review scope, but no active LoadIQ implementation or scaffolded
provider call was found in this audit:

- Google Places API.
- Google Geocoding API.
- Google Maps JavaScript API.
- AWS Location Service.

## Not Currently Implemented / Future Contract Required

Before wiring any future provider above, create a provider contract with the
same headings used by the implemented/scaffolded contracts in this folder,
verify every request and consumed response field against official provider
documentation, and map the new usage to source files. Do not treat planned
provider names as active capabilities.

## Existing Route Contract

`route-intelligence.md` documents LoadIQ-owned route endpoints and app-level
request/response shapes. Provider-specific controls now live in:

- `google-address-validation.contract.md`
- `google-routes.contract.md`
- `trimble-maps.contract.md`

## Weather Contracts

Karpilo Weather Intelligence provider-specific controls live in:

- `google-weather.contract.md`
- `openweather.contract.md`
- `nws-weather.contract.md`
