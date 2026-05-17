# Karpilo LoadIQ Atlas AI Dev V1

## Purpose

Karpilo Atlas AI Dev V1 adds embedded educational and analytical support surfaces inside the authenticated Karpilo LoadIQ app:

- **Karpilo Atlas AI**: educational, informational, and analytical support for the Karpilo LoadIQ calculator environment.
- **Atlas Analysis Assistance**: profitability estimate interpretation, margin pressure, deadhead exposure, fuel pressure, and RPM context.
- **Atlas Operational Context**: entered route-variable context such as deadhead, stop complexity, timing, and distance assumptions.
- **Atlas Educational Support**: contextual explanations for app workflows, fields, buttons, forms, and settings.

Atlas is supplemental educational and analytical support. The deterministic Karpilo LoadIQ calculator remains authoritative.

## App-Only Scope

Functional Karpilo Atlas AI behavior lives only in the APP project. The website may describe the concepts for marketing/disclosure purposes, but it must not call OpenAI, expose API keys, or provide functional AI.

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

Set `ENABLE_LOADIQ_AI_DEV=true` only where Karpilo Atlas AI development surfaces and the API route should be visible/callable. Do not use `NEXT_PUBLIC_OPENAI_API_KEY`.

## Embedded Behavior

Atlas Analysis Assistance renders as an embedded educational readout on calculator results when AI Dev V1 is enabled. The legacy overlay remains opt-in compatibility from settings while Atlas surfaces are moved into native workflows.

No Supabase schema is used for the hide/show preference. It is stored locally and can be restored from settings.

Atlas Operational Context renders inside route/result and saved-load surfaces. It explains deadhead exposure, pickup-to-delivery flow, stop complexity, timing pressure, and route structure without changing route math or acting as a routing API.

Atlas Educational Support appears as inline operational context near workflows and reusable guidance surfaces. It explains why fields and metrics matter without becoming a tutorial modal or detached assistant layer.

Phase 5 adds a local preference for contextual educational guidance:

```text
loadiq.atlasEducational.enabled
```

When disabled, Atlas Educational Support navigation listeners and the legacy educational overlay path are hidden. The current educational layer is deterministic registry-based and does not call OpenAI.

## Atlas Educational Support

Atlas Educational Support currently uses compatibility help hooks to explain supported app surfaces. Educational output includes:

1. Feature Signal
2. What This Does
3. Why It Matters
4. How To Use It
5. Operator Reminder
6. Educational Disclaimer

Educational disclaimer:

> Karpilo Atlas AI provides contextual educational support for navigating Karpilo LoadIQ features, workflows, and app tools. It explains functionality and calculation context only. It does not make business, financial, legal, tax, compliance, safety, routing, broker, or dispatch decisions.

## Atlas Analysis Assistance

Atlas Analysis Assistance activates from calculated load context. The calculator values are authoritative; Atlas interprets only.

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

Output disclaimer:

> Karpilo Atlas AI provides educational, informational, and analytical context based on entered load data and calculated Karpilo LoadIQ outputs. It does not guarantee profitability, savings, freight availability, rate outcomes, compliance status, safety outcomes, tax treatment, settlement accuracy, or financial performance. Final decisions remain the responsibility of the operator.

## Proprietary Statement

> Karpilo Atlas AI, Atlas Insights, Atlas Guidance, Atlas Educational Support, and Atlas Operational Context are proprietary Karpilo LoadIQ support concepts developed by Karpilo Endeavor Technologies. These systems support educational app guidance, calculation explanation, profitability interpretation, and non-authoritative operational awareness based on structured application data, calculated outputs, and user-provided inputs.

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
2. Confirm the embedded Atlas Analysis Assistance surface appears only when enabled.
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
