import "server-only";

import { createHash } from "crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getServerPaymentAccess } from "@/domains/billing/server-entitlements";
import { LOADIQ_AI_MODEL } from "@/lib/ai/openai-client";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import type { LoadIqAiLoadAnalysisInput } from "@/types/ai-load-analysis";

export const AI_FEATURE_LOAD_ANALYSIS = "load_analysis";

export type AiUsageStatus =
  | "requested"
  | "blocked"
  | "cache_hit"
  | "completed"
  | "failed";

export type AiPlanTier =
  | "free"
  | "no_access"
  | "gold"
  | "platinum"
  | "pilot"
  | "launch500"
  | "admin"
  | "pro";

export type AiModelTier = "nano" | "mini" | "premium";

export type AiBudgetSnapshot = {
  planTier: AiPlanTier;
  dailyLimit: number;
  monthlyLimit: number;
  cooldownSeconds: number;
  monthlyTokenCap: number;
  usedTokensMonth: number;
  addonTokensAvailable: number;
  usedToday: number;
  usedMonth: number;
  remainingToday: number;
  remainingMonth: number;
  remainingTokensMonth: number;
  premiumAddOnEligible: boolean;
  modelTier: AiModelTier;
  enabled: boolean;
};

export type AiGovernanceStatus = {
  status: "available" | "limited" | "disabled";
  reason?: string;
  retryAfterSeconds?: number;
  budget?: AiBudgetSnapshot;
  featureKey: string;
};

export type AiUsageEventInput = {
  userId: string;
  featureKey: string;
  status: AiUsageStatus;
  requestHash?: string;
  cacheKey?: string;
  model?: string;
  modelTier?: AiModelTier;
  planTier?: AiPlanTier;
  blockReason?: string;
  errorCode?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cacheHit?: boolean;
  metadata?: Record<string, unknown>;
};

export type AiRequestCacheRecord<T> = {
  id: string;
  response: T;
};

export type AiCacheIdentity = {
  cacheKey: string;
  requestHash: string;
};

type AiBudgetLimitRow = {
  daily_call_limit: number | null;
  monthly_call_limit: number | null;
  cooldown_seconds: number | null;
  monthly_token_cap: number | null;
  premium_addon_allowed: boolean | null;
  addon_token_price_cents: number | null;
  addon_token_block_size: number | null;
  overage_surcharge_multiplier: number | null;
  model_tier: string | null;
  enabled: boolean | null;
};

type AiUsageCountRow = {
  status: string;
};

type AiUsageTokenRow = {
  total_tokens: number | null;
};

type AiTokenAddonRow = {
  tokens_granted: number | null;
  tokens_used: number | null;
  expires_at: string | null;
};

type AiLatestUsageRow = {
  created_at: string;
};

type AiRequestCacheRow = {
  id: string;
  response_json: unknown;
  hit_count: number | null;
};

type PaymentAccessTier = Awaited<
  ReturnType<typeof getServerPaymentAccess>
>["entitlements"]["tier"];

const DEFAULT_CACHE_TTL_SECONDS = 60 * 60 * 24;

const SAFE_FAILURE_MESSAGES: Record<string, string> = {
  ai_governance_disabled:
    "Atlas analysis support is currently paused. Deterministic calculator output remains available.",
  ai_budget_exceeded:
    "Atlas analysis support is limited for this plan right now. Deterministic calculator output remains available.",
  ai_cooldown_active:
    "Atlas analysis support is cooling down briefly. Deterministic calculator output remains available.",
  ai_not_configured:
    "Atlas analysis support is not configured on this server.",
  ai_provider_unavailable:
    "Atlas analysis support is temporarily unavailable. Deterministic calculator output remains available.",
  ai_governance_unavailable:
    "Atlas analysis support is temporarily unavailable. Deterministic calculator output remains available.",
};

const MODEL_ALLOWLIST: Record<AiModelTier, string[]> = {
  nano: ["gpt-4o-mini"],
  mini: ["gpt-4o-mini"],
  premium: ["gpt-4o", "gpt-4o-mini"],
};

export class AiGovernanceError extends Error {
  code: string;
  statusCode: number;
  retryAfterSeconds?: number;
  budget?: AiBudgetSnapshot;

  constructor({
    code,
    statusCode,
    retryAfterSeconds,
    budget,
  }: {
    code: string;
    statusCode: number;
    retryAfterSeconds?: number;
    budget?: AiBudgetSnapshot;
  }) {
    super(code);
    this.name = "AiGovernanceError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryAfterSeconds = retryAfterSeconds;
    this.budget = budget;
  }
}

export function getAiSafeFailureMessage(code: string) {
  return SAFE_FAILURE_MESSAGES[code] ?? SAFE_FAILURE_MESSAGES.ai_provider_unavailable;
}

export function createAiAdminClient() {
  return createSupabaseAdminClient();
}

export function resolveAiModel(modelTier: AiModelTier) {
  const envModel = process.env.LOADIQ_AI_MODEL?.trim();
  const allowed = MODEL_ALLOWLIST[modelTier];

  if (envModel && allowed.includes(envModel)) {
    return envModel;
  }

  if (allowed.includes(LOADIQ_AI_MODEL)) {
    return LOADIQ_AI_MODEL;
  }

  return allowed[0] ?? LOADIQ_AI_MODEL;
}

export async function getAiSystemStatus({
  admin,
  featureKey,
}: {
  admin: SupabaseClient;
  featureKey: string;
}) {
  if (
    process.env.ATLAS_AI_DISABLED === "true" ||
    process.env.LOADIQ_AI_DISABLED === "true"
  ) {
    return {
      enabled: false,
      reason: "ai_governance_disabled",
    };
  }

  const keys = ["atlas_ai_enabled", `${featureKey}_enabled`];
  const { data, error } = await admin
    .from("ai_system_flags")
    .select("key, enabled, reason")
    .in("key", keys);

  if (error) {
    return {
      enabled: false,
      reason: "ai_governance_unavailable",
    };
  }

  const disabledFlag = (data ?? []).find((flag) => flag.enabled === false);

  if (disabledFlag) {
    return {
      enabled: false,
      reason: String(disabledFlag.reason || "ai_governance_disabled"),
    };
  }

  return {
    enabled: true,
  };
}

export async function evaluateTokenBudgetGuard({
  admin,
  userId,
  userEmail,
  featureKey,
}: {
  admin: SupabaseClient;
  userId: string;
  userEmail?: string | null;
  featureKey: string;
}) {
  const paymentAccess = await getServerPaymentAccess(userId, userEmail);
  if (paymentAccess.ownerBuildAccess) {
    return {
      allowed: true,
      budget: buildOwnerAiBudgetSnapshot(),
    };
  }

  const planTier = mapPaymentTierToAiPlan(
    paymentAccess.entitlements.tier
  );
  const budgetLimit = await getBudgetLimit(admin, planTier, featureKey);
  const now = new Date();
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
  const [
    usedToday,
    usedMonth,
    usedTokensMonth,
    addonTokensAvailable,
  ] = await Promise.all([
    countCompletedAiCalls(admin, userId, featureKey, dayStart),
    countCompletedAiCalls(admin, userId, featureKey, monthStart),
    sumCompletedAiTokens(admin, userId, featureKey, monthStart),
    sumActiveAiAddonTokens(admin, userId, featureKey, now.toISOString()),
  ]);
  const monthlyTokenCap = budgetLimit.monthly_token_cap ?? 0;
  const totalTokenAllowance = monthlyTokenCap + addonTokensAvailable;
  const budget: AiBudgetSnapshot = {
    planTier,
    dailyLimit: budgetLimit.daily_call_limit ?? 0,
    monthlyLimit: budgetLimit.monthly_call_limit ?? 0,
    cooldownSeconds: budgetLimit.cooldown_seconds ?? 60,
    monthlyTokenCap,
    usedTokensMonth,
    addonTokensAvailable,
    usedToday,
    usedMonth,
    remainingToday: Math.max((budgetLimit.daily_call_limit ?? 0) - usedToday, 0),
    remainingMonth: Math.max(
      (budgetLimit.monthly_call_limit ?? 0) - usedMonth,
      0
    ),
    remainingTokensMonth:
      monthlyTokenCap > 0
        ? Math.max(totalTokenAllowance - usedTokensMonth, 0)
        : 0,
    premiumAddOnEligible: budgetLimit.premium_addon_allowed === true,
    modelTier: normalizeModelTier(budgetLimit.model_tier),
    enabled: budgetLimit.enabled === true,
  };

  if (
    !budget.enabled ||
    budget.dailyLimit <= 0 ||
    budget.monthlyLimit <= 0 ||
    monthlyTokenCap <= 0
  ) {
    return {
      allowed: false,
      code: "ai_budget_exceeded",
      budget,
    };
  }

  if (
    usedToday >= budget.dailyLimit ||
    usedMonth >= budget.monthlyLimit ||
    usedTokensMonth >= totalTokenAllowance
  ) {
    return {
      allowed: false,
      code: "ai_budget_exceeded",
      budget,
    };
  }

  return {
    allowed: true,
    budget,
  };
}

export async function evaluateAiThrottleGate({
  admin,
  userId,
  featureKey,
  cooldownSeconds,
}: {
  admin: SupabaseClient;
  userId: string;
  featureKey: string;
  cooldownSeconds: number;
}) {
  if (cooldownSeconds <= 0) {
    return {
      allowed: true,
    };
  }

  const { data, error } = await admin
    .from("ai_usage_events")
    .select("created_at")
    .eq("user_id", userId)
    .eq("feature_key", featureKey)
    .in("status", ["requested", "cache_hit", "completed"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return {
      allowed: false,
      code: "ai_governance_unavailable",
    };
  }

  const latest = (data?.[0] ?? null) as AiLatestUsageRow | null;

  if (!latest?.created_at) {
    return {
      allowed: true,
    };
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - new Date(latest.created_at).getTime()) / 1000
  );
  const retryAfterSeconds = cooldownSeconds - elapsedSeconds;

  if (retryAfterSeconds > 0) {
    return {
      allowed: false,
      code: "ai_cooldown_active",
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
  };
}

export async function recordAiUsageEvent({
  admin,
  event,
}: {
  admin: SupabaseClient;
  event: AiUsageEventInput;
}) {
  const { data, error } = await admin
    .from("ai_usage_events")
    .insert({
      user_id: event.userId,
      feature_key: event.featureKey,
      request_hash: event.requestHash ?? null,
      cache_key: event.cacheKey ?? null,
      model: event.model ?? null,
      model_tier: event.modelTier ?? null,
      plan_tier: event.planTier ?? null,
      status: event.status,
      block_reason: event.blockReason ?? null,
      error_code: event.errorCode ?? null,
      input_tokens: event.inputTokens ?? null,
      output_tokens: event.outputTokens ?? null,
      total_tokens: event.totalTokens ?? null,
      cache_hit: event.cacheHit ?? event.status === "cache_hit",
      metadata: event.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) {
    return null;
  }

  return typeof data?.id === "string" ? data.id : null;
}

export function buildAiRequestCacheIdentity({
  featureKey,
  model,
  payload,
}: {
  featureKey: string;
  model: string;
  payload: LoadIqAiLoadAnalysisInput;
}): AiCacheIdentity {
  const sanitizedPayload = sanitizeLoadAnalysisPayloadForCache(payload);
  const source = JSON.stringify({
    featureKey,
    model,
    payload: sanitizedPayload,
    cacheVersion: "load-analysis-v2-equipment-context",
  });
  const requestHash = createHash("sha256").update(source).digest("hex");

  return {
    requestHash,
    cacheKey: `${featureKey}:${requestHash}`,
  };
}

export async function readAiRequestCache<T>({
  admin,
  featureKey,
  cacheKey,
}: {
  admin: SupabaseClient;
  featureKey: string;
  cacheKey: string;
}): Promise<AiRequestCacheRecord<T> | null> {
  const { data, error } = await admin
    .from("ai_request_cache")
    .select("id, response_json, hit_count")
    .eq("feature_key", featureKey)
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const record = data as AiRequestCacheRow;
  await admin
    .from("ai_request_cache")
    .update({
      last_hit_at: new Date().toISOString(),
      hit_count: (record.hit_count ?? 0) + 1,
    })
    .eq("id", record.id);

  return {
    id: record.id,
    response: record.response_json as T,
  };
}

export async function writeAiRequestCache({
  admin,
  featureKey,
  cacheKey,
  requestHash,
  model,
  modelTier,
  responseJson,
  userId,
  ttlSeconds = DEFAULT_CACHE_TTL_SECONDS,
}: {
  admin: SupabaseClient;
  featureKey: string;
  cacheKey: string;
  requestHash: string;
  model: string;
  modelTier: AiModelTier;
  responseJson: unknown;
  userId: string;
  ttlSeconds?: number;
}) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  await admin.from("ai_request_cache").upsert(
    {
      feature_key: featureKey,
      cache_key: cacheKey,
      request_hash: requestHash,
      model,
      model_tier: modelTier,
      response_json: responseJson,
      expires_at: expiresAt,
      created_by: userId,
      metadata: {
        storesRawUserNotes: false,
      },
    },
    { onConflict: "cache_key" }
  );
}

export async function getAiStatusForUser({
  admin,
  userId,
  userEmail,
  featureKey,
}: {
  admin: SupabaseClient;
  userId: string;
  userEmail?: string | null;
  featureKey: string;
}): Promise<AiGovernanceStatus> {
  const systemStatus = await getAiSystemStatus({ admin, featureKey });

  if (!systemStatus.enabled) {
    return {
      status: "disabled",
      reason: systemStatus.reason,
      featureKey,
    };
  }

  const budgetResult = await evaluateTokenBudgetGuard({
    admin,
    userId,
    userEmail,
    featureKey,
  });

  if (!budgetResult.allowed) {
    return {
      status: "limited",
      reason: budgetResult.code,
      budget: budgetResult.budget,
      featureKey,
    };
  }

  const throttleResult = await evaluateAiThrottleGate({
    admin,
    userId,
    featureKey,
    cooldownSeconds: budgetResult.budget.cooldownSeconds,
  });

  if (!throttleResult.allowed) {
    return {
      status: "limited",
      reason: throttleResult.code,
      retryAfterSeconds: throttleResult.retryAfterSeconds,
      budget: budgetResult.budget,
      featureKey,
    };
  }

  return {
    status: "available",
    budget: budgetResult.budget,
    featureKey,
  };
}

export function buildAiErrorResponse(
  error: AiGovernanceError | { code: string; statusCode?: number; retryAfterSeconds?: number }
) {
  const headers =
    typeof error.retryAfterSeconds === "number"
      ? { "Retry-After": String(error.retryAfterSeconds) }
      : undefined;

  return Response.json(
    {
      error: error.code,
      message: getAiSafeFailureMessage(error.code),
      retryAfterSeconds: error.retryAfterSeconds,
    },
    {
      status: error.statusCode ?? 500,
      headers,
    }
  );
}

async function getBudgetLimit(
  admin: SupabaseClient,
  planTier: AiPlanTier,
  featureKey: string
) {
  const { data, error } = await admin
    .from("ai_budget_limits")
    .select(
      [
        "daily_call_limit",
        "monthly_call_limit",
        "cooldown_seconds",
        "monthly_token_cap",
        "premium_addon_allowed",
        "addon_token_price_cents",
        "addon_token_block_size",
        "overage_surcharge_multiplier",
        "model_tier",
        "enabled",
      ].join(", ")
    )
    .eq("plan_tier", planTier)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (error || !data) {
    return {
      daily_call_limit: 0,
      monthly_call_limit: 0,
      cooldown_seconds: 300,
      monthly_token_cap: 0,
      premium_addon_allowed: false,
      addon_token_price_cents: null,
      addon_token_block_size: null,
      overage_surcharge_multiplier: null,
      model_tier: "mini",
      enabled: false,
    } satisfies AiBudgetLimitRow;
  }

  return data as unknown as AiBudgetLimitRow;
}

async function countCompletedAiCalls(
  admin: SupabaseClient,
  userId: string,
  featureKey: string,
  sinceIso: string
) {
  const { data, error } = await admin
    .from("ai_usage_events")
    .select("status")
    .eq("user_id", userId)
    .eq("feature_key", featureKey)
    .in("status", ["cache_hit", "completed"])
    .gte("created_at", sinceIso);

  if (error) {
    return 0;
  }

  return ((data ?? []) as AiUsageCountRow[]).length;
}

async function sumCompletedAiTokens(
  admin: SupabaseClient,
  userId: string,
  featureKey: string,
  sinceIso: string
) {
  const { data, error } = await admin
    .from("ai_usage_events")
    .select("total_tokens")
    .eq("user_id", userId)
    .eq("feature_key", featureKey)
    .eq("status", "completed")
    .gte("created_at", sinceIso);

  if (error) {
    return 0;
  }

  return ((data ?? []) as AiUsageTokenRow[]).reduce(
    (total, row) => total + Math.max(Number(row.total_tokens ?? 0), 0),
    0
  );
}

async function sumActiveAiAddonTokens(
  admin: SupabaseClient,
  userId: string,
  featureKey: string,
  nowIso: string
) {
  const { data, error } = await admin
    .from("ai_token_addons")
    .select("tokens_granted, tokens_used, expires_at")
    .eq("user_id", userId)
    .eq("feature_key", featureKey)
    .eq("status", "active");

  if (error) {
    return 0;
  }

  return ((data ?? []) as AiTokenAddonRow[]).reduce((total, row) => {
    if (row.expires_at && row.expires_at <= nowIso) {
      return total;
    }

    return (
      total +
      Math.max(Number(row.tokens_granted ?? 0) - Number(row.tokens_used ?? 0), 0)
    );
  }, 0);
}

function mapPaymentTierToAiPlan(tier: PaymentAccessTier): AiPlanTier {
  if (tier === "gold") return "gold";
  if (tier === "platinum") return "platinum";
  if (tier === "pilot") return "pilot";
  if (tier === "launch500") return "launch500";
  if (tier === "pro") return "pro";
  return "no_access";
}

function buildOwnerAiBudgetSnapshot(): AiBudgetSnapshot {
  return {
    planTier: "admin",
    dailyLimit: 1000,
    monthlyLimit: 10000,
    cooldownSeconds: 0,
    monthlyTokenCap: 10_000_000,
    usedTokensMonth: 0,
    addonTokensAvailable: 0,
    usedToday: 0,
    usedMonth: 0,
    remainingToday: 1000,
    remainingMonth: 10000,
    remainingTokensMonth: 10_000_000,
    premiumAddOnEligible: false,
    modelTier: "premium",
    enabled: true,
  };
}

function normalizeModelTier(value: string | null): AiModelTier {
  if (value === "nano" || value === "premium") {
    return value;
  }

  return "mini";
}

function sanitizeLoadAnalysisPayloadForCache(payload: LoadIqAiLoadAnalysisInput) {
  return {
    grossRevenue: normalizeNumber(payload.grossRevenue),
    loadedMiles: normalizeNumber(payload.loadedMiles),
    deadheadMiles: normalizeNumber(payload.deadheadMiles),
    fuelCost: normalizeNumber(payload.fuelCost),
    trueRpm: normalizeNumber(payload.trueRpm),
    netProfit: normalizeNumber(payload.netProfit),
    daysCommitted: normalizeNumber(payload.daysCommitted),
    dispatchFee: normalizeOptionalNumber(payload.dispatchFee),
    factoringFee: normalizeOptionalNumber(payload.factoringFee),
    tolls: normalizeOptionalNumber(payload.tolls),
    accessorials: normalizeOptionalNumber(payload.accessorials),
    estimatedMaintenanceReserve: normalizeOptionalNumber(
      payload.estimatedMaintenanceReserve
    ),
    pickupRegion: normalizeOptionalString(payload.pickupRegion),
    deliveryRegion: normalizeOptionalString(payload.deliveryRegion),
    equipmentType: normalizeOptionalString(payload.equipmentType),
    atlasEquipmentPack: normalizeOptionalString(payload.atlasEquipmentPack),
    equipmentPackLabel: normalizeOptionalString(payload.equipmentPackLabel),
    combinationType: normalizeOptionalString(payload.combinationType),
    equipmentDimensions: normalizeOptionalString(payload.equipmentDimensions),
    maxPayloadLbs: normalizeOptionalNumber(payload.maxPayloadLbs),
    grossVehicleWeightRatingLbs: normalizeOptionalNumber(
      payload.grossVehicleWeightRatingLbs
    ),
    axleCount: normalizeOptionalNumber(payload.axleCount),
    hazmatCapable: payload.hazmatCapable === true,
    tankerCapable: payload.tankerCapable === true,
    refrigeratedCapable: payload.refrigeratedCapable === true,
    specializedCapabilities: normalizeOptionalString(
      payload.specializedCapabilities
    ),
    securementEquipment: normalizeOptionalString(payload.securementEquipment),
    routeRestrictionNotes: normalizeOptionalString(
      payload.routeRestrictionNotes
    ),
    notesIncludedInHash: false,
  };
}

function normalizeNumber(value: number) {
  return Number(value.toFixed(4));
}

function normalizeOptionalNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(4))
    : null;
}

function normalizeOptionalString(value: string | undefined) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}
