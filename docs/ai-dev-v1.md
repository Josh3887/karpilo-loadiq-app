# Karpilo LoadIQ AI Dev V1

## Purpose

AI Dev V1 is an educational intelligence layer for the Karpilo LoadIQ app. It interprets already-calculated load results so owner-operators can better understand profitability pressure, deadhead exposure, fuel pressure, days committed, true RPM, margin erosion, negotiation context, and operational risk signals.

The deterministic Karpilo LoadIQ calculator remains authoritative. AI Dev V1 does not replace, recalculate, or override calculator output.

## App-Only Scope

This module lives only in the APP project. It is not part of the marketing website and does not change public pricing, Stripe billing, account deletion, Supabase schema, or subscription entitlement logic.

## Environment Variables

Required server-only variable:

```bash
OPENAI_API_KEY=
```

Feature flag:

```bash
ENABLE_LOADIQ_AI_DEV=false
```

Set `ENABLE_LOADIQ_AI_DEV=true` only in an environment where AI Dev V1 should be visible and callable. Do not use `NEXT_PUBLIC_OPENAI_API_KEY`; OpenAI keys must never be exposed to the browser.

## API Route

Route:

```text
POST /api/ai/load-analysis
```

The route is disabled unless `ENABLE_LOADIQ_AI_DEV=true`.

Sample request:

```json
{
  "grossRevenue": 2350,
  "loadedMiles": 812,
  "deadheadMiles": 147,
  "fuelCost": 522,
  "trueRpm": 2.14,
  "netProfit": 611,
  "daysCommitted": 3
}
```

Expected response shape:

```json
{
  "analysis": {
    "loadiqReadout": "...",
    "marginLesson": "...",
    "negotiationLens": "...",
    "riskSignals": ["..."],
    "driverQuestions": ["..."],
    "confidence": "medium",
    "educationalDisclaimer": "..."
  },
  "model": "gpt-4o-mini"
}
```

## Allowed Behavior

- Interpret deterministic calculator values.
- Explain operational pressure in trucking-aware language.
- Surface risk signals and driver questions.
- Keep output concise and educational.
- Return structured JSON for reliable rendering.

## Prohibited Behavior

- Recalculate final financial values.
- Override calculator output.
- Make final dispatch, business, compliance, settlement, tax, or legal decisions.
- Claim guaranteed profit or guaranteed savings.
- Operate as an agent or autonomous workflow.
- Use GPS context, rate con extraction, receipt parsing, or background jobs in V1.

## Security Rules

- `OPENAI_API_KEY` is read server-side only.
- The browser calls the Karpilo LoadIQ API route, never OpenAI directly.
- User payloads are validated and sanitized before model use.
- User-provided prompt/system instructions are not accepted.
- Provider failures return generic errors without stack traces or secrets.
- AI failure must never block the calculator or Analyze Load flow.

## Manual Testing

With `ENABLE_LOADIQ_AI_DEV=true` and `OPENAI_API_KEY` set, run:

```bash
curl -X POST http://localhost:3000/api/ai/load-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "grossRevenue": 2350,
    "loadedMiles": 812,
    "deadheadMiles": 147,
    "fuelCost": 522,
    "trueRpm": 2.14,
    "netProfit": 611,
    "daysCommitted": 3
  }'
```

Then test through the dashboard:

1. Analyze a load normally.
2. Confirm the AI Dev V1 card appears only when the feature flag is enabled.
3. Generate the educational readout.
4. Confirm calculator results remain unchanged if the AI call fails.

## Future Phases

- Rate confirmation extraction after file-handling and validation architecture is ready.
- Receipt parsing after storage, privacy, and retention rules are ready.
- Trip pattern coaching after enough historical data and consent boundaries exist.
- Karpilo FleetOS intelligence after fleet-specific entitlement and data boundaries exist.
- GPS/context intelligence only after privacy, permission, retention, and mobile safety architecture is ready.
