export const ANALYTICS_EVENTS = {
  APP_LOADED: "app_loaded",
  USER_SIGNED_IN: "user_signed_in",
  USER_SIGNED_OUT: "user_signed_out",
  SETTINGS_VIEWED: "settings_viewed",
  BILLING_VIEWED: "billing_viewed",
  FIT_CHECK_STARTED: "fit_check_started",
  FIT_CHECK_COMPLETED: "fit_check_completed",
  CALCULATOR_STARTED: "calculator_started",
  CALCULATION_COMPLETED: "calculation_completed",
  CALCULATION_SAVED: "calculation_saved",
  FEATURE_GATE_VIEWED: "feature_gate_viewed",
  UPGRADE_CLICKED: "upgrade_clicked",
  CHECKOUT_STARTED: "checkout_started",
  CHECKOUT_COMPLETED: "checkout_completed",
  ADMIN_ACCESSED: "admin_accessed",
  ADMIN_DEVELOPER_TOOLS_VIEWED: "admin_developer_tools_viewed",
  POSTHOG_STATUS_VIEWED: "posthog_status_viewed",
  AI_SCAFFOLD_VIEWED: "ai_scaffold_viewed",
  MAPS_SCAFFOLD_VIEWED: "maps_scaffold_viewed",
  MILEAGE_SCAFFOLD_VIEWED: "mileage_scaffold_viewed",
  SCAFFOLD_CTA_CLICKED: "scaffold_cta_clicked",
} as const;

export const APPROVED_ANALYTICS_EVENTS = Object.values(ANALYTICS_EVENTS);

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsScaffoldKey = "ai" | "maps" | "mileage";

const approvedAnalyticsPropertyKeys = [
  "plan_tier",
  "launch_phase",
  "account_role",
  "device_type",
  "route",
  "feature_key",
  "scaffold_key",
  "scaffold_status",
  "gross_revenue_bucket",
  "deadhead_bucket",
  "mileage_bucket",
  "app_version",
  "environment",
] as const;

export type AnalyticsPropertyKey = (typeof approvedAnalyticsPropertyKeys)[number];

export type AnalyticsProperties = Partial<
  Record<AnalyticsPropertyKey, string | number | boolean | null | undefined>
>;

export const PROTECTED_ANALYTICS_DATA_TYPES = [
  "Raw addresses",
  "Exact coordinates",
  "Exact revenue values",
  "Exact truck or business financials",
  "ELD or compliance records",
  "Tax data",
  "Bank data",
  "Insurance data",
  "Full AI prompts",
  "Private notes",
  "Personally sensitive operational details",
] as const;

const APPROVED_ANALYTICS_PROPERTY_KEY_SET = new Set<string>(
  approvedAnalyticsPropertyKeys
);
const APPROVED_ANALYTICS_EVENT_SET = new Set<string>(APPROVED_ANALYTICS_EVENTS);
const ANALYTICS_ENDPOINT = "/api/analytics/events";
const ANONYMOUS_ID_STORAGE_KEY = "loadiq_analytics_anonymous_id";

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && APPROVED_ANALYTICS_EVENT_SET.has(value);
}

export function sanitizeAnalyticsProperties(
  properties?: Record<string, unknown> | null
): AnalyticsProperties {
  if (!properties) return {};

  return Object.entries(properties).reduce<AnalyticsProperties>(
    (sanitized, [key, value]) => {
      if (!APPROVED_ANALYTICS_PROPERTY_KEY_SET.has(key)) return sanitized;

      const propertyKey = key as AnalyticsPropertyKey;
      const sanitizedValue = sanitizeAnalyticsValue(value);

      if (sanitizedValue !== undefined) {
        sanitized[propertyKey] = sanitizedValue;
      }

      return sanitized;
    },
    {}
  );
}

export function getDeviceType() {
  if (typeof navigator === "undefined") return "unknown";

  const userAgent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet/.test(userAgent)) return "tablet";
  if (/mobile|iphone|android/.test(userAgent)) return "mobile";

  return "desktop";
}

export function bucketGrossRevenue(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "unknown";
  const amount = Number(value);

  if (amount <= 0) return "none";
  if (amount < 10000) return "under_10k";
  if (amount < 25000) return "10k_24k";
  if (amount < 50000) return "25k_49k";
  if (amount < 100000) return "50k_99k";

  return "100k_plus";
}

export function bucketDeadheadMiles(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "unknown";
  const miles = Number(value);

  if (miles <= 0) return "none";
  if (miles <= 50) return "1_50";
  if (miles <= 150) return "51_150";
  if (miles <= 300) return "151_300";

  return "301_plus";
}

export function bucketMileage(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "unknown";
  const miles = Number(value);

  if (miles <= 0) return "none";
  if (miles <= 100) return "1_100";
  if (miles <= 500) return "101_500";
  if (miles <= 1000) return "501_1000";

  return "1001_plus";
}

export async function trackAnalyticsEvent(
  event: AnalyticsEventName,
  properties?: AnalyticsProperties
) {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== "true") return;

  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        event,
        anonymousId: getOrCreateAnonymousId(),
        properties: sanitizeAnalyticsProperties(properties),
      }),
    });
  } catch {
    // Product analytics must never block app usage.
  }
}

function sanitizeAnalyticsValue(value: unknown) {
  if (typeof value === "string") {
    return value.replace(/[^\w./:-]/g, "_").slice(0, 120);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "boolean") return value;
  if (value === null) return null;

  return undefined;
}

function getOrCreateAnonymousId() {
  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY);
    if (existing) return existing;

    const generated =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(ANONYMOUS_ID_STORAGE_KEY, generated);

    return generated;
  } catch {
    return "anonymous";
  }
}
