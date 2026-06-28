import "server-only";

import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

import type { AdminAccess } from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const ELEVATED_ADMIN_EMAIL = "j.karpilo@karpiloloadiq.com";
export const ELEVATED_ADMIN_COOKIE = "loadiq_elevated_admin";
export const ELEVATED_ADMIN_ROLES = ["admin", "developer", "owner"] as const;

export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export const TOKEN_TTL_MS = 120 * 1000;
export const ELEVATED_SESSION_TTL_MS = 15 * 60 * 1000;

export const SECRET_HASH_ALGORITHM = "hmac-sha256";

const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const NUMBERS = "23456789";
const SYMBOLS = "!@#$%^&*?-_+=";

export type RequestFingerprint = {
  requestIpHash: string;
  userAgentHash: string;
};

export type ElevatedSessionStatus = {
  elevated: boolean;
  expiresAt: string | null;
  reason?: "missing" | "not_found" | "expired" | "invalid" | "inactive";
};

function getHashKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for elevated auth.");
  }

  return key;
}

function pickRandomCharacter(characters: string) {
  return characters[randomInt(0, characters.length)];
}

function shuffleSecure(values: string[]) {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.join("");
}

function generateRequiredCredential(length: number, groups: string[]) {
  const characters = groups.join("");
  const required = groups.map((group) => pickRandomCharacter(group));

  while (required.length < length) {
    required.push(pickRandomCharacter(characters));
  }

  return shuffleSecure(required);
}

export function generateElevatedChallenge() {
  return generateRequiredCredential(16, [UPPERCASE, LOWERCASE, NUMBERS, SYMBOLS]);
}

export function generateElevatedToken() {
  return generateRequiredCredential(16, [UPPERCASE, LOWERCASE, NUMBERS]);
}

export function generateElevatedSessionSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashSecret(value: string) {
  return createHmac("sha256", getHashKey()).update(value).digest("hex");
}

export function timingSafeCompareSecret(value: string, expectedHash: string | null) {
  if (!expectedHash) return false;

  const actual = Buffer.from(hashSecret(value), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}

export function minutesFromNow(milliseconds: number) {
  return new Date(Date.now() + milliseconds).toISOString();
}

export function isPast(value: string | null | undefined) {
  if (!value) return true;
  return Date.parse(value) <= Date.now();
}

export function getRequestFingerprint(headers: Headers): RequestFingerprint {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || headers.get("x-real-ip") || "unknown";
  const userAgent = headers.get("user-agent") || "unknown";

  return {
    requestIpHash: hashSecret(`ip:${ip}`),
    userAgentHash: hashSecret(`ua:${userAgent}`),
  };
}

function parseCookieValue(value: string | undefined) {
  if (!value) return null;

  const separator = value.indexOf(".");
  if (separator <= 0 || separator === value.length - 1) return null;

  return {
    challengeId: value.slice(0, separator),
    sessionSecret: value.slice(separator + 1),
  };
}

export async function readElevatedSessionCookie() {
  const cookieStore = await cookies();
  return parseCookieValue(cookieStore.get(ELEVATED_ADMIN_COOKIE)?.value);
}

export async function setElevatedSessionCookie(params: {
  challengeId: string;
  sessionSecret: string;
  expiresAt: string;
}) {
  const cookieStore = await cookies();

  cookieStore.set(
    ELEVATED_ADMIN_COOKIE,
    `${params.challengeId}.${params.sessionSecret}`,
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(params.expiresAt),
    },
  );
}

export async function clearElevatedSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(ELEVATED_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function getElevatedSessionStatus(
  access: AdminAccess,
): Promise<ElevatedSessionStatus> {
  const cookieValue = await readElevatedSessionCookie();

  if (!cookieValue) {
    return { elevated: false, expiresAt: null, reason: "missing" };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("admin_auth_challenges")
    .select("id,user_id,status,elevated_session_expires_at,metadata")
    .eq("id", cookieValue.challengeId)
    .eq("user_id", access.user.id)
    .maybeSingle();

  if (error) {
    console.error("ELEVATED_SESSION_STATUS_READ_FAILED");
    return { elevated: false, expiresAt: null, reason: "invalid" };
  }

  if (!data) {
    return { elevated: false, expiresAt: null, reason: "not_found" };
  }

  if (data.status !== "token_verified") {
    return {
      elevated: false,
      expiresAt: data.elevated_session_expires_at ?? null,
      reason: "inactive",
    };
  }

  if (isPast(data.elevated_session_expires_at)) {
    return {
      elevated: false,
      expiresAt: data.elevated_session_expires_at ?? null,
      reason: "expired",
    };
  }

  const metadata = asRecord(data.metadata);
  const sessionHash =
    typeof metadata.elevated_session_hash === "string"
      ? metadata.elevated_session_hash
      : null;

  if (!timingSafeCompareSecret(cookieValue.sessionSecret, sessionHash)) {
    return {
      elevated: false,
      expiresAt: data.elevated_session_expires_at ?? null,
      reason: "invalid",
    };
  }

  return {
    elevated: true,
    expiresAt: data.elevated_session_expires_at ?? null,
  };
}
