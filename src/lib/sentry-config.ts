import type { ErrorEvent } from "@sentry/nextjs";

export const SENTRY_PROTECTED_DATA_TYPES = [
  "email",
  "cookies",
  "authorization headers",
  "pickup or delivery addresses",
  "gross or net revenue",
  "RPM",
  "fuel cost",
  "customer or load identifiers",
  "billing or payment-sensitive fields",
] as const;

const SENSITIVE_KEY_PATTERN =
  /email|cookie|authorization|auth|token|password|secret|pickup|delivery|address|coordinate|latitude|longitude|gross|net|revenue|rpm|fuel|cost|customer|load[_-]?(id|number|identifier)?|billing|payment|stripe|card|bank|insurance|tax|query/i;

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const AUTH_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/gi;
const COOKIE_PATTERN = /\b(cookie|set-cookie)\s*[:=]\s*[^;\n]+/gi;
const SENSITIVE_VALUE_PATTERN =
  /\b(pickup|delivery|address|gross|net|revenue|rpm|fuel|cost|customer|load|billing|payment|stripe|card|bank|insurance|tax)\b\s*[:=]\s*[^,\n}]+/gi;

export function getSentryRelease() {
  return (
    process.env.SENTRY_RELEASE ??
    process.env.NEXT_PUBLIC_SENTRY_RELEASE ??
    process.env.VERCEL_GIT_COMMIT_SHA
  );
}

export function getSentryEnvironment() {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.NEXT_PUBLIC_APP_ENV ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

export function getSentryTraceSampleRate(value?: string) {
  return sampleRate(value, process.env.NODE_ENV === "production" ? 0.1 : 1);
}

export function getSentryReplaySessionSampleRate(value?: string) {
  return sampleRate(value, 0);
}

export function getSentryReplayOnErrorSampleRate(value?: string) {
  return sampleRate(value, 0.25);
}

export function sentryBeforeSend(event: ErrorEvent) {
  const scrubbed = scrubValue(event, 0) as ErrorEvent;

  if (scrubbed.request?.url) {
    scrubbed.request.url = scrubUrl(scrubbed.request.url);
  }

  if (scrubbed.user) {
    scrubbed.user = {
      id:
        typeof scrubbed.user.id === "string"
          ? scrubString(scrubbed.user.id)
          : scrubbed.user.id,
    };
  }

  return scrubbed;
}

export function getSentryFeatureFromRoute(route: string | null | undefined) {
  if (!route) return "unknown";

  if (route.startsWith("/admin")) return "admin";
  if (route.includes("/billing") || route.includes("/pricing")) return "billing";
  if (route.includes("/auth") || route.includes("/login") || route.includes("/signup")) {
    return "auth";
  }
  if (route.includes("/settings") || route.includes("/account")) return "settings";
  if (route.includes("fitcheck") || route.includes("fit-check")) return "fitcheck";
  if (route.includes("map") || route.includes("mileage")) return "maps";
  if (route.startsWith("/dashboard")) return "calculator";

  return "app";
}

function sampleRate(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : fallback;
}

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 8) return "[Filtered]";
  if (typeof value === "string") return scrubString(value);
  if (typeof value !== "object" || value === null) return value;

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
    (scrubbed, [key, nestedValue]) => {
      scrubbed[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? "[Filtered]"
        : scrubValue(nestedValue, depth + 1);

      return scrubbed;
    },
    {}
  );
}

function scrubString(value: string) {
  return value
    .replace(EMAIL_PATTERN, "[Filtered email]")
    .replace(AUTH_PATTERN, "[Filtered authorization]")
    .replace(COOKIE_PATTERN, "[Filtered cookie]")
    .replace(SENSITIVE_VALUE_PATTERN, "$1=[Filtered]");
}

function scrubUrl(value: string) {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";

    return url.toString();
  } catch {
    return value.split("?")[0] ?? value;
  }
}
