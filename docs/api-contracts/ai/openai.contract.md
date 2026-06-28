# Provider Contract: OpenAI API

## Provider Name
OpenAI API.

## Karpilo Module Owner
Karpilo Atlas AI.

## Purpose
Gated/dev AI-assisted load analysis and structured explanation generation where
enabled by server-side controls.

## Official Provider Documentation
| Documentation type | URL | Status |
|---|---|---|
| Official provider documentation URL | https://platform.openai.com/docs | verified 2026-06-28 |
| Endpoint documentation URL | https://platform.openai.com/docs/api-reference/chat/create, https://platform.openai.com/docs/guides/structured-outputs | verified 2026-06-28 |
| Authentication documentation URL | https://platform.openai.com/docs/api-reference/authentication | verified 2026-06-28 |
| Rate limit/quota documentation URL | https://platform.openai.com/docs/guides/rate-limits | requires project/account review before production enablement |

## Required Environment Variables
- `OPENAI_API_KEY`
- `LOADIQ_AI_MODEL`
- `ENABLE_LOADIQ_AI_DEV`
- `LOADIQ_AI_DISABLED`
- `ATLAS_AI_DISABLED`

## Forbidden Environment Usage
- `NEXT_PUBLIC_OPENAI_API_KEY`
- OpenAI keys, prompts containing sensitive operational data, or raw responses
  in client bundles, snapshots, Sentry, or PostHog.

## Endpoints Used
- Chat Completions endpoint for gated/dev Atlas load analysis.

## Normalized Internal Output
OpenAI output must be normalized into Karpilo Atlas-owned response shapes and
must be labeled as AI-assisted only when actual generated output exists.

## Required Mock Files
- `test-fixtures/api/ai/openai/loadAnalysis.success.json`
- `test-fixtures/api/ai/openai/errors/unauthorized-401.json`
- `test-fixtures/api/ai/openai/errors/forbidden-403.json`
- `test-fixtures/api/ai/openai/errors/not-found-404.json`
- `test-fixtures/api/ai/openai/errors/rate-limited-429.json`
- `test-fixtures/api/ai/openai/errors/server-error-500.json`
- `test-fixtures/api/ai/openai/errors/timeout.json`

## Failure Classifications
Future tests must verify 401 unauthorized, 403 forbidden, 404 model/endpoint
drift, 408/timeout, 429 rate limited, 500+ provider unavailable, malformed
JSON, empty response, and network failure.

## Drift Rules
- Deterministic LoadIQ math must not be labeled as generated AI.
- Model overrides must stay allowlist-constrained by code.
- AI provider failures must degrade without weakening entitlements or exposing
  prompts/secrets.

## Last Verified Date
2026-06-28.

