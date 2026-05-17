import {
  LOADIQ_AI_MODEL,
  LoadIqAiConfigurationError,
  getOpenAIClient,
  isLoadIqAiDevEnabled,
} from "@/lib/ai/openai-client";
import { validateLoadAnalysisPayload } from "@/lib/ai/validate-load-analysis-payload";
import type { LoadIqAiLoadAnalysisOutput } from "@/types/ai-load-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EDUCATIONAL_DISCLAIMER =
  "Educational interpretation only. The calculator values remain authoritative; verify assumptions with your own records and qualified professionals.";

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "loadiqReadout",
    "marginLesson",
    "negotiationLens",
    "riskSignals",
    "driverQuestions",
    "confidence",
    "educationalDisclaimer",
  ],
  properties: {
    loadiqReadout: {
      type: "string",
      description: "Concise educational interpretation of the load strength.",
    },
    marginLesson: {
      type: "string",
      description: "One short lesson about margin, deadhead, fuel, days, or true RPM.",
    },
    negotiationLens: {
      type: "string",
      description: "Educational negotiating perspective without telling the driver what to do.",
    },
    riskSignals: {
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
    educationalDisclaimer: {
      type: "string",
      description: "Short educational disclaimer.",
    },
  },
} as const;

function truncate(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeModelText(value: unknown, maxLength = 520) {
  return truncate(value, maxLength)
    .replace(/\bas an AI\b/gi, "as an educational assistant")
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
    loadiqReadout: sanitizeModelText(record.loadiqReadout),
    marginLesson: sanitizeModelText(record.marginLesson),
    negotiationLens: sanitizeModelText(record.negotiationLens),
    riskSignals: sanitizeStringArray(record.riskSignals),
    driverQuestions: sanitizeStringArray(record.driverQuestions),
    confidence:
      confidence === "low" || confidence === "high" ? confidence : "medium",
    educationalDisclaimer: sanitizeModelText(
      record.educationalDisclaimer || EDUCATIONAL_DISCLAIMER,
      260
    ),
  };
}

export async function POST(request: Request) {
  if (!isLoadIqAiDevEnabled()) {
    return Response.json({ error: "ai_dev_disabled" }, { status: 404 });
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
          name: "loadiq_educational_load_analysis",
          strict: true,
          schema: OUTPUT_SCHEMA,
        },
      },
      messages: [
        {
          role: "system",
          content: [
            "You are the Karpilo LoadIQ Educational Assistant.",
            "You are trucking-aware, owner-operator focused, direct, calm, operationally realistic, concise, and educational.",
            "The calculator values are authoritative. Do not recalculate, replace, or contradict them. Interpret only.",
            "Do not calculate final financial values. Do not make final business decisions for the user.",
            "Do not claim guaranteed profit, savings, compliance, tax treatment, dispatch outcome, or settlement outcome.",
            "Do not use the phrases: as an AI, I guarantee, you should definitely take, you should definitely reject, financial advice, legal advice, tax advice.",
            "Keep each field compact and practical. Return JSON only.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            calculatorValues: validation.value,
            outputSections: [
              "LoadIQ Readout",
              "Margin Lesson",
              "Negotiation Lens",
              "Risk Signals",
              "Driver Questions",
              "Educational Disclaimer",
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
