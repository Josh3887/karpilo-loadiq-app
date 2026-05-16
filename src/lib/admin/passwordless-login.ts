import "server-only";

import type { User } from "@supabase/supabase-js";

import {
  ELEVATED_ADMIN_EMAIL,
  ELEVATED_ADMIN_ROLES,
  hashSecret,
} from "@/lib/admin/elevated-auth";
import {
  getAdminAccessForUser,
  roleAllows,
  type AdminAccess,
} from "@/lib/admin/roles";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

export const ADMIN_PASSWORDLESS_SUCCESS_MESSAGE =
  "If this email is authorized, check your inbox.";

export type AdminPasswordlessEligibility =
  | {
      eligible: true;
      access: AdminAccess;
      authUser: User;
    }
  | {
      eligible: false;
      reason:
        | "non_canonical_email"
        | "public_user_missing"
        | "public_user_lookup_failed"
        | "auth_user_missing"
        | "auth_user_lookup_failed"
        | "auth_email_mismatch"
        | "role_missing"
        | "role_lookup_failed";
    };

export function normalizeAdminLoginEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isCanonicalAdminEmail(email: string) {
  return email === ELEVATED_ADMIN_EMAIL;
}

const TRUSTED_APP_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://app.karpiloloadiq.com",
]);

export function getTrustedAdminRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedOrigin =
    forwardedProto && forwardedHost
      ? `${forwardedProto.split(",")[0]?.trim()}://${forwardedHost
          .split(",")[0]
          ?.trim()}`
      : null;
  const candidateOrigins = [
    new URL(request.url).origin,
    forwardedOrigin,
  ].filter((origin): origin is string => Boolean(origin));

  const trustedOrigin = candidateOrigins.find((origin) =>
    TRUSTED_APP_ORIGINS.has(origin),
  );

  return trustedOrigin ?? "https://app.karpiloloadiq.com";
}

export function buildAdminPasswordlessRedirectUrl(origin: string) {
  const safeOrigin = TRUSTED_APP_ORIGINS.has(origin)
    ? origin
    : "https://app.karpiloloadiq.com";
  const callbackUrl = new URL("/auth/callback", safeOrigin);
  callbackUrl.searchParams.set("next", "/admin/elevated");
  return callbackUrl.toString();
}

export function getAdminPasswordlessAuditMetadata(email: string) {
  let submittedEmailHash: string | null = null;

  try {
    submittedEmailHash = email
      ? hashSecret(`admin-passwordless:${email}`)
      : null;
  } catch {
    console.error("ADMIN_PASSWORDLESS_EMAIL_HASH_FAILED");
  }

  return {
    submitted_email_hash: submittedEmailHash,
    canonical_identity: isCanonicalAdminEmail(email),
  };
}

export async function getAdminPasswordlessEligibility(
  email: string,
): Promise<AdminPasswordlessEligibility> {
  if (!isCanonicalAdminEmail(email)) {
    return { eligible: false, reason: "non_canonical_email" };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("id,email")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) {
    return { eligible: false, reason: "public_user_lookup_failed" };
  }

  if (!profile?.id) {
    return { eligible: false, reason: "public_user_missing" };
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(profile.id);

  if (authError) {
    return { eligible: false, reason: "auth_user_lookup_failed" };
  }

  if (!authData.user) {
    return { eligible: false, reason: "auth_user_missing" };
  }

  if (normalizeAdminLoginEmail(authData.user.email) !== email) {
    return { eligible: false, reason: "auth_email_mismatch" };
  }

  try {
    const access = await getAdminAccessForUser(authData.user);

    if (!access || !roleAllows(access.highestRole, ELEVATED_ADMIN_ROLES)) {
      return { eligible: false, reason: "role_missing" };
    }

    return {
      eligible: true,
      access,
      authUser: authData.user,
    };
  } catch {
    return { eligible: false, reason: "role_lookup_failed" };
  }
}
