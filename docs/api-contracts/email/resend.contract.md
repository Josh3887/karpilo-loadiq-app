# Provider Contract: Resend API

## Provider Name
Resend API.

## Karpilo Module Owner
Admin/elevated email delivery.

## Purpose
Server-side email delivery for elevated admin and notification flows.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://resend.com/docs | verified 2026-06-28 |
| Endpoint documentation URL | https://resend.com/docs/api-reference/emails/send-email | verified 2026-06-28 |
| Authentication documentation URL | https://resend.com/docs/api-reference/introduction#api-keys | requires provider-doc confirmation before production review |
| Rate limit/quota documentation URL | UNVERIFIED -- add official Resend rate/quota URL before relying on automated limits | placeholder |

## Required Environment Variables
- `RESEND_API_KEY`
- `NO_REPLY_EMAIL`

## Forbidden Environment Usage
- `NEXT_PUBLIC_RESEND_API_KEY`
- Email provider keys in client bundles, snapshots, Sentry, PostHog, or logs.

## Endpoints Used
- Send email.

## Normalized Internal Output
Resend output must be normalized into admin/email delivery state. It must not
expose provider response bodies to public UI.

## Required Mock Files
- `test-fixtures/api/email/resend/sendEmail.success.json`
- `test-fixtures/api/email/resend/errors/unauthorized-401.json`
- `test-fixtures/api/email/resend/errors/forbidden-403.json`
- `test-fixtures/api/email/resend/errors/not-found-404.json`
- `test-fixtures/api/email/resend/errors/rate-limited-429.json`
- `test-fixtures/api/email/resend/errors/server-error-500.json`
- `test-fixtures/api/email/resend/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 endpoint drift,
408/timeout, 429 rate limited, 500+ provider unavailable, malformed JSON, empty
response, and network failure.

## Drift Rules
- Email provider failures must not expose recipient details, message body, or
  API keys in logs.
- Public contact variables must remain distinct from provider credentials.

## Last Verified Date
2026-06-28.

