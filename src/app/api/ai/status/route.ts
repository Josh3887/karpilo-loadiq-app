import {
  AI_FEATURE_LOAD_ANALYSIS,
  createAiAdminClient,
  getAiSafeFailureMessage,
  getAiStatusForUser,
} from "@/lib/ai/ai-governance";
import { isLoadIqAiDevEnabled } from "@/lib/ai/openai-client";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isLoadIqAiDevEnabled()) {
    return Response.json(
      {
        status: "disabled",
        error: "ai_dev_disabled",
        message: "Atlas analysis support is not enabled in this environment.",
      },
      { status: 404 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const requestedFeature = url.searchParams.get("featureKey")?.trim();
  const featureKey =
    requestedFeature && requestedFeature === AI_FEATURE_LOAD_ANALYSIS
      ? requestedFeature
      : AI_FEATURE_LOAD_ANALYSIS;

  try {
    const admin = createAiAdminClient();
    const status = await getAiStatusForUser({
      admin,
      userId: user.id,
      userEmail: user.email,
      featureKey,
    });

    return Response.json(
      {
        ...status,
        message: status.reason
          ? getAiSafeFailureMessage(status.reason)
          : "Atlas analysis support is available.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return Response.json(
      {
        status: "disabled",
        error: "ai_governance_unavailable",
        message: getAiSafeFailureMessage("ai_governance_unavailable"),
        featureKey,
      },
      { status: 500 }
    );
  }
}
