# Provider Contract: OpenAI Chat Completions API
## Status
- App status: implemented
- Contract status: verified against provider docs
- Last verified against provider docs: 2026-06-28
## Official provider documentation
- Primary docs: https://platform.openai.com/docs
- API reference: https://platform.openai.com/docs/api-reference/chat/create
- SDK docs: https://github.com/openai/openai-node
- Pricing/quota/rate-limit docs, if available: OpenAI account/project limits and model pricing apply.
- Error-handling docs, if available: OpenAI API errors apply.
## Karpilo LoadIQ usage boundary
LoadIQ uses OpenAI Chat Completions only for gated/dev Karpilo Atlas load
analysis explanations when enabled. Deterministic calculator math remains the
Karpilo LoadIQ decision basis. OpenAI is not used as dispatch authority,
guaranteed profitability source, route/legal/compliance authority, tax or legal
advisor, broker/load-board behavior, or provider of raw route/fuel/weather data.
## Authentication
- Auth method required by provider docs: OpenAI API key via SDK authorization.
- Env var names used in app: `OPENAI_API_KEY`, `LOADIQ_AI_MODEL`,
  `ATLAS_AI_DISABLED`, `LOADIQ_AI_DISABLED`, `ENABLE_LOADIQ_AI_DEV`.
- Server-only or client-safe: server-only.
- Secret exposure risk: never expose API key through `NEXT_PUBLIC_`.
- Required headers: SDK-managed authorization and JSON headers.
- Key restrictions recommended: project/environment scoping and server-only use.
## Base URL / SDK entrypoint
- REST base URL or SDK package: `openai` npm package.
- Endpoint path or SDK method: `openai.chat.completions.create`.
- HTTP method: SDK-managed `POST`.
- Required headers: SDK-managed.
- Content type: JSON.
- API version if applicable: Chat Completions API.
## Request contract
| Field | Required | Type | Provider docs meaning | App source | Validation rule | Notes |
|---|---:|---|---|---|---|---|
| `model` | yes | string | Model to use. | `src/app/api/ai/load-analysis/route.ts` | Resolved by governance/model tier. | Defaults handled in app. |
| `temperature` | no | number | Sampling temperature. | load-analysis route | Hardcoded `0.2`. | Keeps output stable. |
| `max_completion_tokens` | no | number | Completion token cap. | load-analysis route | Hardcoded `700`. | Cost control. |
| `response_format.type` | no | string | Response format control. | load-analysis route | `json_schema`. | Structured output path. |
| `response_format.json_schema` | no | object | JSON schema response constraint. | load-analysis route | Strict schema `atlas_freight_load_analysis`. | App-defined output schema. |
| `messages[]` | yes | array | Chat messages. | load-analysis route | System/user messages built from validated payload. | Must not include raw secrets. |
## Response contract
Document only the response fields Karpilo LoadIQ actually consumes.
| Field path | Type | Provider docs meaning | Used by app? | Source file/function | Fallback behavior |
|---|---|---|---:|---|---|
| `choices[0].message.content` | string | Assistant response content. | yes | load-analysis route | 502 when missing. |
| `usage.prompt_tokens` | number | Prompt tokens. | yes | load-analysis route | Usage omitted when absent. |
| `usage.completion_tokens` | number | Completion tokens. | yes | load-analysis route | Usage omitted when absent. |
| `usage.total_tokens` | number | Total tokens. | yes | load-analysis route | Usage omitted when absent. |
## Error contract
Include:
- documented provider error shape: SDK/provider errors are caught as provider
  unavailable unless governance/config errors are thrown earlier.
- HTTP status codes used by provider: SDK-managed; app maps unexpected provider
  failure to safe 500/502 responses.
- auth failures: missing `OPENAI_API_KEY` maps to `ai_not_configured`.
- validation failures: app validates request before provider call.
- quota/rate-limit failures: provider errors map to safe failure; app also has
  budget/throttle governance before provider call.
- timeout/network failure behavior: provider errors are caught and recorded.
- app fallback behavior: deterministic output remains available; generated AI
  explanation unavailable.
- user-safe error message: `getAiSafeFailureMessage`.
- internal logging behavior: AI usage events store governed metadata, not raw
  secrets.
## Rate limits / quotas / cost controls
Include:
- provider quota or billing behavior when known: OpenAI project/model limits and
  pricing apply.
- cache strategy: app request cache via AI governance.
- retry/backoff strategy: none.
- abuse prevention: auth, dev flag, governance status, budget guard, and
  throttle guard.
- client-side vs server-side call protection: provider calls are server-side.
- tier impact if relevant: AI features remain entitlement/governance gated.
## Data privacy / security
Include:
- data sent to provider: validated calculator values and equipment planning
  context.
- PII risk: load context can be sensitive operational data.
- location data risk: route/load context may include operational routes if
  payload validation permits them.
- payment data risk: no payment details should be sent.
- logging restrictions: do not log prompts with sensitive operational details.
- what must never be logged: API key, raw secrets, unnecessary PII/payment data.
- whether requests must be server-side only: yes.
## App integration map
| App file | Function/component | Provider operation | Env vars | Notes |
|---|---|---|---|---|
| `src/lib/ai/openai-client.ts` | `getOpenAIClient` | SDK initialization. | `OPENAI_API_KEY` | Server-only. |
| `src/app/api/ai/load-analysis/route.ts` | `POST` | Chat completion with structured output. | `OPENAI_API_KEY`, AI flags/model vars | Auth, governance, budget, cache, throttle. |
| `src/lib/ai/ai-governance.ts` | governance helpers | Budget/cache/throttle records. | Supabase env vars | Controls provider use. |
## Tests / validation
List existing or needed tests:
- unit tests: needed for sanitization and schema handling.
- mock response tests: needed for valid/missing content.
- schema validation tests: needed for app output schema.
- error fallback tests: needed for provider unavailable and missing key.
- env var missing tests: needed for disabled/not configured states.
- provider contract drift tests: needed for response_format and usage fields.
## Drift risks
List anything likely to break:
- deprecated endpoint: none confirmed in docs read for this task.
- legacy API: Chat Completions may change as OpenAI model/API guidance evolves.
- SDK major version risk: OpenAI SDK major updates.
- pricing/quota changes: model availability, price, and rate limits.
- response field dependency: `choices[0].message.content` and usage fields.
- undocumented assumptions: app-specific output schema is not a provider schema.
## Required follow-up
- [x] Confirm provider docs URL
- [x] Confirm endpoint/method
- [x] Confirm auth
- [x] Confirm request fields
- [x] Confirm consumed response fields
- [x] Confirm error handling
- [ ] Confirm tests/mocks
- [x] Confirm no secrets are exposed
