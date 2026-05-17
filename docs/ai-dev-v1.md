# Karpilo LoadIQ Atlas Intelligence Dev V1

## Purpose

Atlas Intelligence Dev V1 adds embedded operational intelligence surfaces inside the authenticated Karpilo LoadIQ app:

- **Atlas Core**: runtime orchestration and infrastructure cognition.
- **Atlas Freight Intelligence**: freight economics, margin pressure, deadhead exposure, broker traffic, road signals, and dispatch-quality interpretation.
- **Atlas Route Intelligence**: route vectors, corridor awareness, movement telemetry, and future predictive route flow.
- **Atlas Educational Intelligence**: contextual operational explanations for app workflows, fields, buttons, forms, and settings.

Atlas is embedded operational intelligence infrastructure. The deterministic Karpilo LoadIQ calculator remains authoritative.

## App-Only Scope

Functional Atlas behavior lives only in the APP project. The website may describe the concepts for marketing/disclosure purposes, but it must not call OpenAI, expose API keys, or provide functional AI.

AI Dev V1 does not change public pricing, Stripe billing, account deletion, Supabase schema, or subscription entitlement logic.

## Assets

Expected app assets:

- `public/branding/atlas/core/*`
- `public/branding/atlas/freight/*`
- `public/branding/atlas/route/*`
- `public/branding/atlas/educational/*`
- `public/branding/atlas/backdrops/*`

## Environment Variables

Required server-only variable:

```bash
OPENAI_API_KEY=
```

Feature flag:

```bash
ENABLE_LOADIQ_AI_DEV=false
```

Set `ENABLE_LOADIQ_AI_DEV=true` only where Atlas development surfaces and the API route should be visible/callable. Do not use `NEXT_PUBLIC_OPENAI_API_KEY`.

## Embedded Behavior

Atlas Freight Intelligence renders as an embedded operational readout on calculator results when AI Dev V1 is enabled. The legacy overlay remains opt-in compatibility from settings while Atlas surfaces are moved into native workflows.

No Supabase schema is used for the hide/show preference. It is stored locally and can be restored from settings.

## Atlas Educational Intelligence

Atlas Educational Intelligence currently uses compatibility help hooks in `src/lib/ai/iation-help-registry.ts` to explain supported app surfaces. Educational output includes:

1. Feature Signal
2. What This Does
3. Why It Matters
4. How To Use It
5. Operator Reminder
6. Educational Disclaimer

Educational disclaimer:

> Atlas Educational Intelligence provides contextual guidance for navigating Karpilo LoadIQ features, workflows, and app tools. It is intended to explain functionality and improve operational understanding. It does not make business, financial, legal, tax, compliance, or dispatch decisions.

## Atlas Freight Intelligence

Atlas Freight Intelligence activates from calculated load context. The calculator values are authoritative; Atlas interprets only.

Route:

```text
POST /api/ai/load-analysis
```

The route is server-side only, authenticated, non-streaming, structured JSON, and disabled unless `ENABLE_LOADIQ_AI_DEV=true`.

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
    "signalReadout": "...",
    "marginPressure": "...",
    "brokerTraffic": "...",
    "roadSignals": ["..."],
    "driverQuestions": ["..."],
    "confidence": "medium",
    "intelligenceDisclaimer": "..."
  },
  "model": "gpt-4o-mini"
}
```

Intelligence disclaimer:

> Atlas Freight Intelligence provides operational freight intelligence based on entered load data, calculated app outputs, platform metrics, user operational patterns, and available market or spot-market context. It does not guarantee profitability, freight availability, rate outcomes, compliance status, or financial performance. Final decisions remain the responsibility of the operator.

## Proprietary Statement

> Atlas Core, Atlas Freight Intelligence, Atlas Route Intelligence, and Atlas Educational Intelligence are proprietary intelligence systems developed for Karpilo LoadIQ by Karpilo Endeavor Technologies. These systems support embedded operational guidance, freight interpretation, route context, and runtime orchestration through structured application data, calculated load outputs, platform metrics, user-provided inputs, and evolving operational context.

## Security Rules

- `OPENAI_API_KEY` is read server-side only.
- The browser calls the Karpilo LoadIQ API route, never OpenAI directly.
- User payloads are validated and sanitized before model use.
- User-provided prompt/system instructions are not accepted.
- Provider failures return generic errors without stack traces or secrets.
- AI failure must never block the calculator or Analyze Load flow.
- No schema persistence, saved AI summaries, streaming, agents, autonomous actions, GPS intelligence, or document extraction exist in V1.

## Manual Testing

With `ENABLE_LOADIQ_AI_DEV=true`, `OPENAI_API_KEY` set, and an authenticated app session:

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
2. Confirm the embedded Atlas Freight Intelligence surface appears only when enabled.
3. Generate or refresh the freight signal.
4. Confirm the optional compatibility overlay can be enabled from settings.
5. Hide/show the compatibility overlay from settings.
6. Confirm calculator results remain unchanged if the AI call fails.

## Future Phases

- Rate confirmation extraction after file-handling and validation architecture is ready.
- Receipt parsing after storage, privacy, and retention rules are ready.
- Trip pattern coaching after enough historical data and consent boundaries exist.
- FleetOS intelligence after fleet-specific entitlement and data boundaries exist.
- GPS/context intelligence only after privacy, permission, retention, and mobile safety architecture is ready.
