import {
  LoadIqAiConfigurationError,
  getOpenAIClient,
  isLoadIqAiDevEnabled,
} from "@/lib/ai/openai-client";
import {
  AI_FEATURE_LOAD_ANALYSIS,
  AiGovernanceError,
  buildAiErrorResponse,
  buildAiRequestCacheIdentity,
  createAiAdminClient,
  evaluateAiThrottleGate,
  evaluateTokenBudgetGuard,
  getAiSafeFailureMessage,
  getAiSystemStatus,
  readAiRequestCache,
  recordAiUsageEvent,
  resolveAiModel,
  writeAiRequestCache,
} from "@/lib/ai/ai-governance";
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

  const featureKey = AI_FEATURE_LOAD_ANALYSIS;
  let admin;

  try {
    admin = createAiAdminClient();
  } catch {
    return buildAiErrorResponse({
      code: "ai_governance_unavailable",
      statusCode: 500,
    });
  }

  const userId = user.id;
  const userEmail = user.email;
  const blockedMetadata = {
    route: "/api/ai/load-analysis",
    deterministicOutputPreserved: true,
  };
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    await recordAiUsageEvent({
      admin,
      event: {
        userId,
        featureKey,
        status: "blocked",
        blockReason: "invalid_json",
        errorCode: "invalid_json",
        metadata: blockedMetadata,
      },
    });

    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const validation = validateLoadAnalysisPayload(body);

  if (!validation.ok) {
    await recordAiUsageEvent({
      admin,
      event: {
        userId,
        featureKey,
        status: "blocked",
        blockReason: "invalid_payload",
        errorCode: "invalid_payload",
        metadata: {
          ...blockedMetadata,
          validationError: validation.error,
        },
      },
    });

    return Response.json(
      {
        error: "invalid_payload",
        detail: validation.error,
      },
      { status: 400 }
    );
  }

  try {
    const systemStatus = await getAiSystemStatus({
      admin,
      featureKey,
    });

    if (!systemStatus.enabled) {
      await recordAiUsageEvent({
        admin,
        event: {
          userId,
          featureKey,
          status: "blocked",
          blockReason: systemStatus.reason,
          errorCode: "ai_governance_disabled",
          metadata: blockedMetadata,
        },
      });

      throw new AiGovernanceError({
        code: systemStatus.reason ?? "ai_governance_disabled",
        statusCode: 503,
      });
    }

    const budgetResult = await evaluateTokenBudgetGuard({
      admin,
      userId,
      userEmail,
      featureKey,
    });

    if (!budgetResult.allowed) {
      const budgetBlockCode = budgetResult.code ?? "ai_budget_exceeded";
      await recordAiUsageEvent({
        admin,
        event: {
          userId,
          featureKey,
          status: "blocked",
          blockReason: budgetBlockCode,
          errorCode: budgetBlockCode,
          planTier: budgetResult.budget.planTier,
          modelTier: budgetResult.budget.modelTier,
          metadata: blockedMetadata,
        },
      });

      throw new AiGovernanceError({
        code: budgetBlockCode,
        statusCode: 429,
        budget: budgetResult.budget,
      });
    }

    const throttleResult = await evaluateAiThrottleGate({
      admin,
      userId,
      featureKey,
      cooldownSeconds: budgetResult.budget.cooldownSeconds,
    });

    if (!throttleResult.allowed) {
      await recordAiUsageEvent({
        admin,
        event: {
          userId,
          featureKey,
          status: "blocked",
          blockReason: throttleResult.code,
          errorCode: throttleResult.code,
          planTier: budgetResult.budget.planTier,
          modelTier: budgetResult.budget.modelTier,
          metadata: {
            ...blockedMetadata,
            retryAfterSeconds: throttleResult.retryAfterSeconds,
          },
        },
      });

      throw new AiGovernanceError({
        code: throttleResult.code ?? "ai_cooldown_active",
        statusCode: throttleResult.code === "ai_governance_unavailable" ? 500 : 429,
        retryAfterSeconds: throttleResult.retryAfterSeconds,
        budget: budgetResult.budget,
      });
    }

    const model = resolveAiModel(budgetResult.budget.modelTier);
    const cacheIdentity = buildAiRequestCacheIdentity({
      featureKey,
      model,
      payload: validation.value,
    });
    const requestedEventId = await recordAiUsageEvent({
      admin,
      event: {
        userId,
        featureKey,
        status: "requested",
        requestHash: cacheIdentity.requestHash,
        cacheKey: cacheIdentity.cacheKey,
        model,
        modelTier: budgetResult.budget.modelTier,
        planTier: budgetResult.budget.planTier,
        metadata: {
          route: "/api/ai/load-analysis",
          storesRawUserNotes: false,
        },
      },
    });

    if (!requestedEventId) {
      throw new AiGovernanceError({
        code: "ai_governance_unavailable",
        statusCode: 500,
        budget: budgetResult.budget,
      });
    }

    const cached = await readAiRequestCache<LoadIqAiLoadAnalysisOutput>({
      admin,
      featureKey,
      cacheKey: cacheIdentity.cacheKey,
    });

    if (cached) {
      const cacheHitEventId = await recordAiUsageEvent({
        admin,
        event: {
          userId,
          featureKey,
          status: "cache_hit",
          requestHash: cacheIdentity.requestHash,
          cacheKey: cacheIdentity.cacheKey,
          model,
          modelTier: budgetResult.budget.modelTier,
          planTier: budgetResult.budget.planTier,
          cacheHit: true,
          metadata: {
            requestedEventId,
            deterministicOutputPreserved: true,
          },
        },
      });

      return Response.json({
        analysis: sanitizeAiOutput(cached.response),
        model,
        governance: {
          status: "cache_hit",
          usageEventId: cacheHitEventId,
          requestedEventId,
          cacheKey: cacheIdentity.cacheKey,
          budget: budgetResult.budget,
        },
      });
    }

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model,
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
            "Use equipment, combination, dimension, weight, hazmat, and securement fields only as user-entered planning context.",
            "Do not calculate final financial values. Do not make final business decisions for the user.",
            "Do not claim guaranteed profit, savings, compliance, tax treatment, dispatch outcome, settlement outcome, route legality, safety outcome, permit approval, bridge clearance, hazmat route approval, securement sufficiency, load fit certification, or broker authority.",
            "Do not position Karpilo Atlas AI as dispatch authority, routing authority, compliance authority, broker authority, financial advisor, tax advisor, legal advisor, safety certifier, DOT/FMCSA compliance officer, operational control software, or carrier management authority.",
            "Do not use the phrases: as an AI, I guarantee, you should definitely take, you should definitely reject, financial advice, legal advice, tax advice.",
            "Keep each field compact and practical. Return JSON only.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            calculatorValues: validation.value,
            equipmentContext: {
              equipmentType: validation.value.equipmentType,
              equipmentPackLabel: validation.value.equipmentPackLabel,
              combinationType: validation.value.combinationType,
              equipmentDimensions: validation.value.equipmentDimensions,
              maxPayloadLbs: validation.value.maxPayloadLbs,
              grossVehicleWeightRatingLbs:
                validation.value.grossVehicleWeightRatingLbs,
              axleCount: validation.value.axleCount,
              hazmatCapable: validation.value.hazmatCapable,
              tankerCapable: validation.value.tankerCapable,
              refrigeratedCapable: validation.value.refrigeratedCapable,
              specializedCapabilities:
                validation.value.specializedCapabilities,
              securementEquipment: validation.value.securementEquipment,
              routeRestrictionNotes: validation.value.routeRestrictionNotes,
              authorityBoundary:
                "User-entered equipment planning context only; not certification, route permission, permit approval, or compliance advice.",
            },
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
      await recordAiUsageEvent({
        admin,
        event: {
          userId,
          featureKey,
          status: "failed",
          requestHash: cacheIdentity.requestHash,
          cacheKey: cacheIdentity.cacheKey,
          model,
          modelTier: budgetResult.budget.modelTier,
          planTier: budgetResult.budget.planTier,
          errorCode: "ai_provider_unavailable",
          metadata: {
            requestedEventId,
            providerReturnedContent: false,
          },
        },
      });

      return buildAiErrorResponse({
        code: "ai_provider_unavailable",
        statusCode: 502,
      });
    }
    const analysis = sanitizeAiOutput(JSON.parse(content));

    await writeAiRequestCache({
      admin,
      featureKey,
      cacheKey: cacheIdentity.cacheKey,
      requestHash: cacheIdentity.requestHash,
      model,
      modelTier: budgetResult.budget.modelTier,
      responseJson: analysis,
      userId,
    });

    const completedEventId = await recordAiUsageEvent({
      admin,
      event: {
        userId,
        featureKey,
        status: "completed",
        requestHash: cacheIdentity.requestHash,
        cacheKey: cacheIdentity.cacheKey,
        model,
        modelTier: budgetResult.budget.modelTier,
        planTier: budgetResult.budget.planTier,
        inputTokens: completion.usage?.prompt_tokens,
        outputTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
        metadata: {
          requestedEventId,
          deterministicOutputPreserved: true,
        },
      },
    });

    return Response.json({
      analysis,
      model,
      governance: {
        status: "completed",
        usageEventId: completedEventId,
        requestedEventId,
        cacheKey: cacheIdentity.cacheKey,
        budget: budgetResult.budget,
      },
    });
  } catch (error) {
    if (error instanceof AiGovernanceError) {
      return buildAiErrorResponse(error);
    }

    if (error instanceof LoadIqAiConfigurationError) {
      await recordAiUsageEvent({
        admin,
        event: {
          userId,
          featureKey,
          status: "failed",
          errorCode: "ai_not_configured",
          metadata: blockedMetadata,
        },
      });

      return buildAiErrorResponse({
        code: "ai_not_configured",
        statusCode: 500,
      });
    }

    await recordAiUsageEvent({
      admin,
      event: {
        userId,
        featureKey,
        status: "failed",
        errorCode: "ai_provider_unavailable",
        metadata: blockedMetadata,
      },
    });

    return Response.json(
      {
        error: "ai_provider_unavailable",
        message: getAiSafeFailureMessage("ai_provider_unavailable"),
      },
      { status: 500 }
    );
  }
}
