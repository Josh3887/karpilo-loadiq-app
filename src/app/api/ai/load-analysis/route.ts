import {
  LOADIQ_AI_MODEL,
  LoadIqAiConfigurationError,
  getOpenAIClient,
  isLoadIqAiDevEnabled,
} from "@/lib/ai/openai-client";
import { validateLoadAnalysisPayload } from "@/lib/ai/validate-load-analysis-payload";
import { ATLAS_INTELLIGENCE_LAYERS } from "@/lib/atlas/atlas-registry";
import { createClient } from "@/lib/supabase-server";
import type { LoadIqAiLoadAnalysisOutput } from "@/types/ai-load-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INTELLIGENCE_DISCLAIMER =
  "Karpilo Atlas AI provides educational, informational, and analytical context based on entered load data and calculated Karpilo LoadIQ outputs. It does not guarantee profitability, savings, freight availability, rate outcomes, compliance status, safety outcomes, tax treatment, settlement accuracy, or financial performance. Final decisions remain the responsibility of the operator.";

const ATLAS_FREIGHT_LAYER = ATLAS_INTELLIGENCE_LAYERS.freight;

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "signalReadout",
    "marginPressure",
    "brokerTraffic",
    "roadSignals",
    "driverQuestions",
    "confidence",
    "intelligenceDisclaimer",
  ],
  properties: {
    signalReadout: {
      type: "string",
      description: "Concise operational interpretation of the load signal.",
    },
    marginPressure: {
      type: "string",
      description: "Explain what the margin pressure means operationally.",
    },
    brokerTraffic: {
      type: "string",
      description: "Explain broker, rate, traffic, or negotiation context without giving a decision.",
    },
    roadSignals: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "string",
      },
    },
    driverQuestions: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "string",
      },
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    intelligenceDisclaimer: {
      type: "string",
      description: "Short Karpilo Atlas AI educational support disclaimer.",
    },
  },
} as const;

function truncate(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeModelText(value: unknown, maxLength = 520) {
  return truncate(value, maxLength)
    .replace(/\bas an AI\b/gi, "as an operational intelligence layer")
    .replace(/\bI guarantee\b/gi, "This does not guarantee")
    .replace(/\byou should definitely take\b/gi, "one way to evaluate")
    .replace(/\byou should definitely reject\b/gi, "one way to evaluate")
    .replace(/\bfinancial advice\b/gi, "professional guidance")
    .replace(/\blegal advice\b/gi, "professional guidance")
    .replace(/\btax advice\b/gi, "professional guidance");
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => sanitizeModelText(item, 180))
    .filter(Boolean)
    .slice(0, 5);
}

function sanitizeAiOutput(value: unknown): LoadIqAiLoadAnalysisOutput {
  const record =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const confidence = record.confidence;

  return {
    signalReadout: sanitizeModelText(record.signalReadout),
    marginPressure: sanitizeModelText(record.marginPressure),
    brokerTraffic: sanitizeModelText(record.brokerTraffic),
    roadSignals: sanitizeStringArray(record.roadSignals),
    driverQuestions: sanitizeStringArray(record.driverQuestions),
    confidence:
      confidence === "low" || confidence === "high" ? confidence : "medium",
    intelligenceDisclaimer: sanitizeModelText(
      record.intelligenceDisclaimer || INTELLIGENCE_DISCLAIMER,
      520
    ),
  };
}

export async function POST(request: Request) {
  if (!isLoadIqAiDevEnabled()) {
    return Response.json({ error: "ai_dev_disabled" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const validation = validateLoadAnalysisPayload(body);

  if (!validation.ok) {
    return Response.json(
      {
        error: "invalid_payload",
        detail: validation.error,
      },
      { status: 400 }
    );
  }

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: LOADIQ_AI_MODEL,
      temperature: 0.2,
      max_completion_tokens: 700,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "atlas_freight_load_analysis",
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
      messages: [
        {
          role: "system",
          content: [
            `You are ${ATLAS_FREIGHT_LAYER.publicName}, the Karpilo LoadIQ freight intelligence interpreter.`,
            `Runtime namespace: ${ATLAS_FREIGHT_LAYER.runtimeId}.`,
            "Karpilo Atlas AI provides educational assistance, calculation explanation support, profitability interpretation support, user-interface guidance, and non-authoritative analytical context.",
            "You are trucking-aware, owner-operator focused, direct, calm, operationally realistic, concise, and educational.",
            "The calculator values are authoritative. Do not recalculate, replace, or contradict them. Interpret only.",
            "Do not calculate final financial values. Do not make final business decisions for the user.",
            "Do not claim guaranteed profit, savings, compliance, tax treatment, dispatch outcome, settlement outcome, route legality, safety outcome, or broker authority.",
            "Do not position Karpilo Atlas AI as dispatch authority, routing authority, compliance authority, broker authority, financial advisor, tax advisor, legal advisor, safety certifier, DOT/FMCSA compliance officer, operational control software, or carrier management authority.",
            "Do not use the phrases: as an AI, I guarantee, you should definitely take, you should definitely reject, financial advice, legal advice, tax advice.",
            "Keep each field compact and practical. Return JSON only.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            calculatorValues: validation.value,
            outputSections: [
              "Signal Readout",
              "Margin Pressure",
              "Broker Traffic",
              "Road Signals",
              "Driver Questions",
              "Intelligence Disclaimer",
            ],
          }),
        },
      ],
    });
    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return Response.json({ error: "ai_unavailable" }, { status: 502 });
    }

    return Response.json({
      analysis: sanitizeAiOutput(JSON.parse(content)),
      model: LOADIQ_AI_MODEL,
    });
  } catch (error) {
    if (error instanceof LoadIqAiConfigurationError) {
      return Response.json({ error: "ai_not_configured" }, { status: 500 });
    }

    return Response.json({ error: "ai_provider_unavailable" }, { status: 500 });
  }
}
