# Karpilo LoadIQ AI Dev V1

## Purpose

AI Dev V1 adds two branded intelligence surfaces inside the authenticated Karpilo LoadIQ app:

- **iAtion**: educational guidance for navigating app pages, features, buttons, forms, tiles, dialogs, workflows, and settings.
- **iAtion Core**: freight intelligence that interprets calculated load outputs, margin pressure, deadhead impact, fuel exposure, broker traffic, road signals, and operational significance.

iAtion teaches the app. iAtion Core interprets the freight. The deterministic Karpilo LoadIQ calculator remains authoritative.

## App-Only Scope

Functional iAtion and iAtion Core behavior lives only in the APP project. The website may describe the concepts for marketing/disclosure purposes, but it must not call OpenAI, expose API keys, or provide functional AI.

AI Dev V1 does not change public pricing, Stripe billing, account deletion, Supabase schema, or subscription entitlement logic.

## Assets

Expected app assets:

- `public/brand/iation-signal-active-icon.webp`
- `public/brand/iation-core-freight-intelligence-icon.webp`
- `public/brand/iation-core-hero.jpg`
- `public/brand/iation-core-mark.png`
- `public/brand/iation-philosophy-hero.jpg`

## Environment Variables

Required server-only variable:

```bash
OPENAI_API_KEY=
```

Feature flag:

```bash
ENABLE_LOADIQ_AI_DEV=false
```

Set `ENABLE_LOADIQ_AI_DEV=true` only where the overlay and API route should be visible/callable. Do not use `NEXT_PUBLIC_OPENAI_API_KEY`.

## Overlay Behavior

The authenticated app shell mounts the iAtion overlay when AI Dev V1 is enabled. The launcher uses a restrained industrial signal style and can be hidden locally with the **Show iAtion** settings control.

No Supabase schema is used for the hide/show preference. It is stored locally and can be restored from settings.

## Educational Mode

iAtion uses `src/lib/ai/iation-help-registry.ts` to explain supported app surfaces. Educational output includes:

1. Feature Signal
2. What This Does
3. Why It Matters
4. How To Use It
5. Operator Reminder
6. Educational Disclaimer

Educational disclaimer:

> iAtion provides educational guidance for navigating Karpilo LoadIQ features, workflows, and app tools. It is intended to explain functionality and improve user understanding. It does not make business, financial, legal, tax, compliance, or dispatch decisions.

## Freight Intelligence Mode

iAtion Core activates from calculated load context. The calculator values are authoritative; iAtion Core interprets only.

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

> iAtion Core provides operational freight intelligence based on entered load data, calculated app outputs, platform metrics, user operational patterns, and available market or spot-market context. It does not guarantee profitability, freight availability, rate outcomes, compliance status, or financial performance. Final decisions remain the responsibility of the operator.

## Proprietary Statement

> iAtion and iAtion Core are proprietary intelligence systems developed for Karpilo LoadIQ by Karpilo Endeavor Technologies. These systems are designed to support educational app guidance and operational freight intelligence through structured application data, calculated load outputs, platform metrics, user-provided inputs, and evolving freight-market context.

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
2. Confirm the floating iAtion launcher appears only when enabled.
3. Confirm **Open iAtion Core** appears after a result exists.
4. Generate the iAtion Core readout.
5. Hide/show the overlay from settings.
6. Confirm calculator results remain unchanged if the AI call fails.

## Future Phases

- Rate confirmation extraction after file-handling and validation architecture is ready.
- Receipt parsing after storage, privacy, and retention rules are ready.
- Trip pattern coaching after enough historical data and consent boundaries exist.
- FleetOS intelligence after fleet-specific entitlement and data boundaries exist.
- GPS/context intelligence only after privacy, permission, retention, and mobile safety architecture is ready.
