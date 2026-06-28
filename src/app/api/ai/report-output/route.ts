import {
  AI_FEATURE_LOAD_ANALYSIS,
  createAiAdminClient,
} from "@/lib/ai/ai-governance";
import { isLoadIqAiDevEnabled } from "@/lib/ai/openai-client";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AiOutputReportPayload = {
  featureKey?: unknown;
  usageEventId?: unknown;
  cacheKey?: unknown;
  reason?: unknown;
  details?: unknown;
};

const REPORT_REASONS = new Set([
  "incorrect",
  "unsafe",
  "offensive",
  "privacy",
  "other",
]);

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

  const body = (await request.json().catch(() => ({}))) as AiOutputReportPayload;
  const featureKey =
    typeof body.featureKey === "string" &&
    body.featureKey.trim() === AI_FEATURE_LOAD_ANALYSIS
      ? body.featureKey.trim()
      : AI_FEATURE_LOAD_ANALYSIS;
  const reason =
    typeof body.reason === "string" && REPORT_REASONS.has(body.reason)
      ? body.reason
      : "";
  const details =
    typeof body.details === "string" ? body.details.trim().slice(0, 1200) : "";
  const usageEventId =
    typeof body.usageEventId === "string" && body.usageEventId.trim()
      ? body.usageEventId.trim()
      : null;
  const cacheKey =
    typeof body.cacheKey === "string" && body.cacheKey.trim()
      ? body.cacheKey.trim().slice(0, 180)
      : null;

  if (!reason) {
    return Response.json(
      {
        error: "invalid_report_reason",
        message: "Choose a valid report reason before submitting.",
      },
      { status: 400 }
    );
  }

  try {
    const admin = createAiAdminClient();
    const { error } = await admin.from("ai_output_reports").insert({
      user_id: user.id,
      feature_key: featureKey,
      usage_event_id: usageEventId,
      cache_key: cacheKey,
      reason,
      details: details || null,
      metadata: {
        source: "atlas_freight_intelligence_surface",
        userEmail: user.email ?? null,
      },
    });

    if (error) {
      return Response.json(
        {
          error: "report_unavailable",
          message:
            "Atlas output reporting is temporarily unavailable. Calculator output remains unaffected.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      ok: true,
      message: "Atlas output report received.",
    });
  } catch {
    return Response.json(
      {
        error: "report_unavailable",
        message:
          "Atlas output reporting is temporarily unavailable. Calculator output remains unaffected.",
      },
      { status: 500 }
    );
  }
}
